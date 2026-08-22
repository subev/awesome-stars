import { promises as fs } from "fs";
import path from "path";
import { buildIndexStarsAsset } from "../app/lib/starsAsset.server.ts";
import {
  listIndexedLists,
  readAllRepos,
  readListIndex,
} from "../app/lib/repoIndex.server.ts";
import { loadHistory } from "../app/lib/history.server.ts";
import type { ListDirectoryEntry } from "../app/lib/starsAsset.ts";
import {
  isReadableList,
  LIST_MEMBER_THRESHOLD,
  LIST_TOPICS,
} from "../app/lib/listLookup.ts";

const OUT_DIR = path.resolve("public/stars");

const write = async (relative: string, data: unknown) => {
  const target = path.join(OUT_DIR, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(data));
};

const run = async () => {
  await fs.rm(OUT_DIR, { recursive: true, force: true });

  const repos = await readAllRepos();
  const history = await loadHistory(repos);
  console.log(
    `${repos.size.toLocaleString()} repos, ${history.dates.length} history dates`,
  );

  const directory: ListDirectoryEntry[] = [];
  // Canonical names the reader may open internally. Built from the crawl index
  // alone so an unrelated stars-asset gap can never drop a real list from it.
  const lookup: string[] = [];
  let withBadges = 0;
  let withTrends = 0;

  for (const { owner, repo } of await listIndexedLists()) {
    const list = await readListIndex(owner, repo);
    if (list && isReadableList(list)) {
      lookup.push(`${owner}/${repo}`);
    }

    const built = await buildIndexStarsAsset(owner, repo, repos, history);
    if (!built) continue;

    await write(path.join(owner, `${repo}.json`), built.asset);
    if (Object.keys(built.asset.badges).length > 0) withBadges++;
    if (built.trends) {
      await write(path.join(owner, `${repo}.trends.json`), built.trends);
      withTrends++;
    }

    if (!list) continue;
    directory.push({
      owner,
      repo,
      stars: repos.get(`${owner}/${repo}`)?.[0] ?? 0,
      members: list.members.length,
      description: list.meta.description,
      tracked: built.trends !== null,
    });
  }

  directory.sort((a, b) => b.stars - a.stars);
  await write("lists.json", directory);

  lookup.sort();
  await write("list-lookup.json", lookup);

  console.log(
    `✅ ${directory.length} lists — ${withBadges} with growth badges, ${withTrends} with trends`,
  );
  console.log(
    `   ${lookup.length} open in the reader (>=${LIST_MEMBER_THRESHOLD} members,` +
      ` or an ${LIST_TOPICS.join("/")} topic and at least one)`,
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
