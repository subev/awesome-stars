import { parseArgs } from "node:util";
import PQueue from "p-queue";
import { getRepoNames } from "../app/lib/starsMarkdown.ts";
import {
  createBudgetTracker,
  fetchRawReadme,
  fetchRepos,
  type BudgetTracker,
  type GraphQLRepo,
  type StopReason,
} from "../app/lib/graphql.server.ts";
import {
  acquireLock,
  appendRunLog,
  loadCrawlState,
  newNode,
  saveCrawlState,
  type CrawlState,
} from "../app/lib/crawlState.server.ts";
import {
  createRepoIndex,
  listIndexedLists,
  readListIndex,
  sha1,
  writeListIndex,
} from "../app/lib/repoIndex.server.ts";
import {
  historyDueDate,
  mergeHistoryDate,
  type StarsByRepo,
} from "../app/lib/history.server.ts";

const { values } = parseArgs({
  options: {
    seed: { type: "string", default: "sindresorhus/awesome" },
    "max-points": { type: "string", default: "4000" },
    "max-minutes": { type: "string", default: "45" },
    "max-lists": { type: "string", default: "0" },
    depth: { type: "string", default: "3" },
    "min-stars": { type: "string", default: "50" },
    "stale-days": { type: "string", default: "14" },
    "history-every": { type: "string", default: "7" },
    chunk: { type: "string", default: "20" },
    concurrency: { type: "string", default: "4" },
    batch: { type: "string", default: "40" },
    recrawl: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

const seeds = values.seed!.split(",").filter(Boolean);
const maxPoints = Number(values["max-points"]);
const maxMinutes = Number(values["max-minutes"]);
const maxLists = Number(values["max-lists"]) || Infinity;
const maxDepth = Number(values.depth);
const minStars = Number(values["min-stars"]);
const staleDays = Number(values["stale-days"]);
const historyEvery = Number(values["history-every"]);
const chunkSize = Number(values.chunk);
const concurrency = Number(values.concurrency);
const batchSize = Number(values.batch);
const dryRun = values["dry-run"]!;
const recrawl = (values.recrawl ?? "").split(",").filter(Boolean);

const AWESOME_NAME = /(^|[-_.])awesome([-_.]|$)/i;

type Gate = { ok: boolean; reason: string | null };

// The seed is hand-curated, so everything it links to is a list by definition.
// Guessing from repo names there would drop entries like
// EbookFoundation/free-programming-books; only the README check is kept, since
// without a default branch there is nothing to fetch.
const gateList = (repo: GraphQLRepo, depth: number): Gate => {
  if (!repo.defaultBranchRef) return { ok: false, reason: "no-default-branch" };
  if (depth <= 1) return { ok: true, reason: null };

  const topics = repo.repositoryTopics.nodes.map((n) =>
    n.topic.name.toLowerCase(),
  );
  const looksLikeList =
    topics.includes("awesome") ||
    topics.includes("awesome-list") ||
    AWESOME_NAME.test(repo.nameWithOwner.split("/")[1]);
  if (!looksLikeList) return { ok: false, reason: "not-a-list" };
  if (repo.isArchived) return { ok: false, reason: "archived" };
  if (repo.isFork) return { ok: false, reason: "fork" };
  if (repo.stargazerCount < minStars)
    return { ok: false, reason: "below-star-floor" };
  return { ok: true, reason: null };
};

const buildQueue = (state: CrawlState) => {
  const staleBefore = Date.now() - staleDays * 86_400_000;
  const pending: string[] = [];
  const stale: string[] = [];

  for (const [fullName, node] of Object.entries(state.nodes)) {
    if (node.depth > maxDepth) continue;
    if (node.status === "pending" || (node.status === "error" && node.attempts < 3)) {
      pending.push(fullName);
    } else if (
      node.status === "done" &&
      node.crawledAt &&
      Date.parse(node.crawledAt) < staleBefore
    ) {
      stale.push(fullName);
    }
  }

  pending.sort((a, b) => {
    const nodeA = state.nodes[a];
    const nodeB = state.nodes[b];
    return nodeA.depth - nodeB.depth || (nodeB.stars ?? 0) - (nodeA.stars ?? 0);
  });
  stale.sort((a, b) =>
    (state.nodes[a].crawledAt ?? "").localeCompare(state.nodes[b].crawledAt ?? ""),
  );

  return [...pending, ...stale];
};

const reportPlan = (state: CrawlState, queue: string[]) => {
  const byStatus = new Map<string, number>();
  const byDepth = new Map<number, number>();
  for (const node of Object.values(state.nodes)) {
    byStatus.set(node.status, (byStatus.get(node.status) ?? 0) + 1);
    byDepth.set(node.depth, (byDepth.get(node.depth) ?? 0) + 1);
  }
  console.log(`frontier: ${Object.keys(state.nodes).length} nodes`);
  for (const [status, count] of [...byStatus].sort()) {
    console.log(`  ${status.padEnd(8)} ${count}`);
  }
  for (const [depth, count] of [...byDepth].sort((a, b) => a[0] - b[0])) {
    console.log(`  depth ${depth}: ${count}`);
  }
  const projectedRepos = queue.length * 136;
  console.log(
    `queued this run: ${queue.length} lists (~${projectedRepos.toLocaleString()} repo rows, ~${Math.ceil(projectedRepos / 50 + queue.length / 50)} points)`,
  );
};

const run = async () => {
  const state = await loadCrawlState();
  for (const target of seeds) {
    if (!state.nodes[target]) state.nodes[target] = newNode(0, null);
  }

  // Lists already indexed are not all reachable from the seed (adopted from the
  // retired snapshot pipeline, or fetched on demand); keep them refreshing.
  for (const { owner, repo } of await listIndexedLists()) {
    const key = `${owner}/${repo}`;
    if (!state.nodes[key]) {
      state.nodes[key] = newNode(0, null);
      console.log(`adopted pre-existing list ${key}`);
    }
  }

  for (const target of recrawl) {
    const node = state.nodes[target];
    if (!node) {
      console.error(`❌ ${target} is not in the frontier`);
      process.exit(1);
    }
    node.status = "pending";
    node.attempts = 0;
    console.log(`re-queued ${target} (depth ${node.depth})`);
  }

  let queue = buildQueue(state);
  reportPlan(state, queue);

  if (dryRun) {
    console.log("\ndry run — no API calls, no writes");
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("❌ GITHUB_TOKEN is required");
    process.exit(1);
  }

  const historyDate = await historyDueDate(historyEvery);
  console.log(
    historyDate
      ? `recording a history datapoint for ${historyDate}`
      : `history skipped (newest datapoint is younger than ${historyEvery} days)`,
  );

  const releaseLock = await acquireLock();
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      void releaseLock().then(() => process.exit(130));
    });
  }

  const startedAt = new Date().toISOString();
  const budget = createBudgetTracker({ maxPoints, maxMinutes });
  const index = createRepoIndex();
  let listsCrawled = 0;
  let newListsQueued = 0;
  const observed: StarsByRepo = {};
  const today = new Date().toISOString().slice(0, 10);
  let stoppedBy: StopReason = "frontier-empty";

  const processed = new Set<string>();

  for (;;) {
    const reason = budget.stopReason();
    if (reason) {
      stoppedBy = reason;
      break;
    }
    if (listsCrawled >= maxLists) {
      stoppedBy = "max-lists";
      break;
    }
    // Lists discovered mid-run are crawlable in the same run, so refill from
    // state rather than working off the queue built at startup.
    if (queue.length === 0) {
      queue = buildQueue(state).filter((name) => !processed.has(name));
      if (queue.length === 0) {
        stoppedBy = "frontier-empty";
        break;
      }
      console.log(`  refilled queue: ${queue.length} lists`);
    }

    const chunk = queue.splice(
      0,
      Math.min(chunkSize, maxLists - listsCrawled),
    );
    for (const name of chunk) processed.add(name);
    listsCrawled += await processChunk(chunk, state, index, budget, token);

    await index.flush();
    await saveCrawlState(state);
    if (historyDate) await mergeHistoryDate(historyDate, observed);

    const stats = budget.stats();
    console.log(
      `— ${listsCrawled} lists | ${stats.spent} pts | ${index.upsertedCount} repos | ${queue.length} queued | ${stats.throttled} throttled | ${Math.round(stats.elapsedMs / 1000)}s`,
    );
  }

  await index.flush();
  await saveCrawlState(state);
  if (historyDate) {
    const total = await mergeHistoryDate(historyDate, observed);
    console.log(`history/${historyDate}.json.gz now holds ${total.toLocaleString()} repos`);
  }

  const stats = budget.stats();
  await appendRunLog({
    startedAt,
    endedAt: new Date().toISOString(),
    pointsSpent: stats.spent,
    pointsRemaining: stats.remaining,
    batches: stats.batches,
    rawFetches: stats.rawFetches,
    restFallbacks: stats.restFallbacks,
    throttled: stats.throttled,
    listsCrawled,
    reposUpserted: index.upsertedCount,
    newListsQueued,
    stoppedBy,
  });

  await releaseLock();

  console.log(
    `\n✅ ${listsCrawled} lists, ${index.upsertedCount} repos upserted, ${stats.spent} points spent (${stats.remaining} left). Stopped by: ${stoppedBy}.`,
  );

  async function processChunk(
    fullNames: string[],
    state: CrawlState,
    index: ReturnType<typeof createRepoIndex>,
    budget: BudgetTracker,
    token: string,
  ) {
    let lastProgressLog = Date.now();
    const depths = fullNames.map((name) => state.nodes[name].depth);
    const span = Math.min(...depths);
    const spanEnd = Math.max(...depths);
    console.log(
      `\n▸ ${fullNames.length} lists at depth ${span === spanEnd ? span : `${span}-${spanEnd}`}: ${fullNames.slice(0, 3).join(", ")}${fullNames.length > 3 ? ` +${fullNames.length - 3} more` : ""}`,
    );

    const { repos: listRepos, missing } = await fetchRepos(
      fullNames,
      token,
      budget,
      { batchSize, concurrency },
    );
    console.log(`  hydrated ${listRepos.size} list repos, fetching readmes…`);

    type Crawlable = { fullName: string; repo: GraphQLRepo };
    const crawlable: Crawlable[] = [];

    for (const fullName of fullNames) {
      const node = state.nodes[fullName];
      if (missing.has(fullName.toLowerCase())) {
        node.status = "gone";
        node.reason = "not-found";
        continue;
      }
      const repo = listRepos.get(fullName.toLowerCase());
      if (!repo) {
        node.status = "error";
        node.attempts++;
        node.reason = "fetch-failed";
        continue;
      }
      node.stars = repo.stargazerCount;
      const gate = gateList(repo, node.depth);
      if (!gate.ok) {
        node.status = "skipped";
        node.reason = gate.reason;
        continue;
      }
      crawlable.push({ fullName, repo });
    }

    const readmeQueue = new PQueue({ concurrency: 10 });
    const readmes = new Map<string, { sha: string; members: string[] }>();

    await Promise.all(
      crawlable.map(({ fullName, repo }) =>
        readmeQueue.add(async () => {
          const readme = await fetchRawReadme(
            repo.nameWithOwner,
            repo.defaultBranchRef!.name,
            token,
            budget,
          );
          if (!readme) {
            const node = state.nodes[fullName];
            node.status = "error";
            node.attempts++;
            node.reason = "no-readme";
            return;
          }
          const members = getRepoNames(readme.text)
            .map(({ owner, repo: name }) => `${owner}/${name}`)
            .filter(
              (member) =>
                member.toLowerCase() !== repo.nameWithOwner.toLowerCase(),
            );
          readmes.set(fullName, { sha: sha1(readme.text), members });
        }),
      ),
    );

    // Member hydration is the only unbounded cost, and it is only knowable once
    // READMEs are parsed. Drop lists that would blow the point ceiling; they
    // stay pending and lead the next run.
    const affordable = Math.max(1, maxPoints - budget.stats().spent) * 50;
    let planned = 0;
    let deferred = 0;
    for (const { fullName } of crawlable) {
      const parsed = readmes.get(fullName);
      if (!parsed) continue;
      if (planned > 0 && planned + parsed.members.length > affordable) {
        readmes.delete(fullName);
        deferred++;
        continue;
      }
      planned += parsed.members.length;
    }

    const union = new Map<string, string>();
    const memberOrigin = new Map<string, { depth: number; via: string }>();
    for (const [listName, { members }] of readmes) {
      const depth = state.nodes[listName].depth + 1;
      for (const member of members) {
        const key = member.toLowerCase();
        union.set(key, member);
        const known = memberOrigin.get(key);
        if (!known || depth < known.depth) {
          memberOrigin.set(key, { depth, via: listName });
        }
      }
    }

    const noReadme = crawlable.length - readmes.size - deferred;
    console.log(
      `  ${readmes.size} readmes parsed, ${union.size} unique members to hydrate (~${Math.ceil(union.size / batchSize)} pts)` +
        (deferred > 0 ? `, ${deferred} deferred (budget)` : "") +
        (noReadme > 0 ? `, ${noReadme} without a readme` : ""),
    );

    const memberRepos = new Map<string, GraphQLRepo>();
    if (union.size > 0) {
      const { repos } = await fetchRepos([...union.values()], token, budget, {
        batchSize,
        concurrency,
        onProgress: (done, total) => {
          const now = Date.now();
          if (done !== total && now - lastProgressLog < 5_000) return;
          lastProgressLog = now;
          const pct = Math.round((done / total) * 100);
          console.log(`  members ${done}/${total} (${pct}%)`);
        },
      });
      for (const [key, repo] of repos) memberRepos.set(key, repo);
    }

    for (const [requested, repo] of memberRepos) {
      await index.upsert(repo.nameWithOwner, [
        repo.stargazerCount,
        repo.owner.databaseId ?? 0,
        repo.description ?? "",
      ]);
      observed[repo.nameWithOwner] = repo.stargazerCount;
      const key = repo.nameWithOwner;
      if (state.nodes[key]) continue;
      // Catalogue one level past the crawl limit: buildQueue never picks these
      // up, but recording them gives a free census of the next frontier.
      const origin = memberOrigin.get(requested);
      if (!origin || origin.depth > maxDepth + 1) continue;
      if (!gateList(repo, origin.depth).ok) continue;
      const node = newNode(origin.depth, origin.via);
      node.stars = repo.stargazerCount;
      state.nodes[key] = node;
      newListsQueued++;
    }

    let crawled = 0;
    for (const { fullName, repo } of crawlable) {
      const parsed = readmes.get(fullName);
      if (!parsed) continue;
      const node = state.nodes[fullName];
      const [owner, name] = repo.nameWithOwner.split("/");

      const canonical = parsed.members
        .map((member) => memberRepos.get(member.toLowerCase())?.nameWithOwner)
        .filter((member): member is string => Boolean(member));

      const existing = await readListIndex(owner, name);
      if (!existing || existing.meta.readmeSha !== parsed.sha) {
        const present = new Set(canonical);
        const gone = (existing?.members ?? []).filter((m) => !present.has(m));
        const dropped = [
          ...(existing?.dropped ?? []).filter(([, m]) => !present.has(m)),
          ...gone.map((m): [string, string] => [today, m]),
        ];
        await writeListIndex(owner, name, {
          meta: {
            description: repo.description ?? "",
            defaultBranch: repo.defaultBranchRef!.name,
            topics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
            readmeSha: parsed.sha,
          },
          members: canonical,
          ...(dropped.length > 0 && { dropped }),
        });
      }

      await index.upsert(repo.nameWithOwner, [
        repo.stargazerCount,
        repo.owner.databaseId ?? 0,
        repo.description ?? "",
      ]);
      observed[repo.nameWithOwner] = repo.stargazerCount;

      node.status = "done";
      node.members = canonical.length;
      node.readmeSha = parsed.sha;
      node.crawledAt = new Date().toISOString();
      node.reason = null;
      node.attempts = 0;
      crawled++;
    }

    return crawled;
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
