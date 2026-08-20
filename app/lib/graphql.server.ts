import PQueue from "p-queue";
import got from "got";
import { fetchReadme } from "./stars.server.ts";

export type RateLimit = {
  limit: number;
  cost: number;
  remaining: number;
  resetAt: string;
};

export type GraphQLRepo = {
  nameWithOwner: string;
  stargazerCount: number;
  description: string | null;
  isArchived: boolean;
  isFork: boolean;
  defaultBranchRef: { name: string } | null;
  owner: { login: string; databaseId: number | null };
  repositoryTopics: { nodes: { topic: { name: string } }[] };
};

export type StopReason =
  | "budget"
  | "rate-limit"
  | "wallclock"
  | "max-lists"
  | "frontier-empty";

export type BudgetTracker = ReturnType<typeof createBudgetTracker>;

export const createBudgetTracker = ({
  maxPoints,
  maxMinutes,
  floor = 500,
}: {
  maxPoints: number;
  maxMinutes: number;
  floor?: number;
}) => {
  const startedAt = Date.now();
  let spent = 0;
  let batches = 0;
  let rawFetches = 0;
  let restFallbacks = 0;
  let throttled = 0;
  let remaining: number | null = null;
  let resetAt: string | null = null;

  return {
    record(rateLimit: RateLimit) {
      spent += rateLimit.cost;
      batches++;
      remaining = rateLimit.remaining;
      resetAt = rateLimit.resetAt;
    },
    countRawFetch() {
      rawFetches++;
    },
    countThrottle() {
      throttled++;
    },
    countRestFallback() {
      restFallbacks++;
    },
    stopReason(): StopReason | null {
      if (spent >= maxPoints) return "budget";
      if (remaining !== null && remaining <= floor) return "rate-limit";
      if (Date.now() - startedAt >= maxMinutes * 60_000) return "wallclock";
      return null;
    },
    stats() {
      return {
        spent,
        batches,
        rawFetches,
        restFallbacks,
        throttled,
        remaining,
        resetAt,
        elapsedMs: Date.now() - startedAt,
      };
    },
  };
};

const REPO_FIELDS = `nameWithOwner
    stargazerCount
    description
    isArchived
    isFork
    defaultBranchRef { name }
    owner { login ... on User { databaseId } ... on Organization { databaseId } }
    repositoryTopics(first: 10) { nodes { topic { name } } }`;

const buildRepoQuery = (fullNames: string[]) => {
  const aliases = fullNames.map((fullName, index) => {
    const [owner, repo] = fullName.split("/");
    return `r${index}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(repo)}) { ${REPO_FIELDS} }`;
  });
  return `query {\n  rateLimit { limit cost remaining resetAt }\n  ${aliases.join("\n  ")}\n}`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Keyed by the REQUESTED name: GitHub follows renames, so nameWithOwner can
// differ from what we asked for, and callers need to map back to their input.
type BatchResult = {
  repos: [requested: string, repo: GraphQLRepo][];
  missing: string[];
};

const postGraphql = async (query: string, token: string) =>
  got.post("https://api.github.com/graphql", {
    headers: { Authorization: `Bearer ${token}` },
    json: { query },
    throwHttpErrors: false,
    retry: { limit: 0 },
    timeout: { request: 90_000 },
  });

// GitHub answers oversized alias batches with a 502, so halve and retry rather
// than dropping the whole chunk.
const fetchRepoBatch = async (
  fullNames: string[],
  token: string,
  budget: BudgetTracker,
  attempt = 0,
): Promise<BatchResult> => {
  if (fullNames.length === 0) return { repos: [], missing: [] };

  let response;
  try {
    response = await postGraphql(buildRepoQuery(fullNames), token);
  } catch {
    response = null;
  }

  const oversized =
    !response || response.statusCode === 502 || response.statusCode === 504;
  if (oversized && fullNames.length > 1) {
    const half = Math.ceil(fullNames.length / 2);
    const [left, right] = await Promise.all([
      fetchRepoBatch(fullNames.slice(0, half), token, budget),
      fetchRepoBatch(fullNames.slice(half), token, budget),
    ]);
    return {
      repos: [...left.repos, ...right.repos],
      missing: [...left.missing, ...right.missing],
    };
  }
  if (!response) return { repos: [], missing: [] };

  if (response.statusCode === 403 || response.statusCode === 429) {
    if (attempt >= 4) return { repos: [], missing: [] };
    const retryAfter = Number(response.headers["retry-after"]);
    const waitMs = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : 2 ** attempt * 5_000;
    budget.countThrottle();
    console.warn(`  secondary rate limit, waiting ${Math.round(waitMs / 1000)}s`);
    await sleep(waitMs);
    return fetchRepoBatch(fullNames, token, budget, attempt + 1);
  }

  let body: {
    data?: Record<string, unknown>;
    errors?: { type?: string; path?: string[] }[];
  };
  try {
    body = JSON.parse(response.body);
  } catch {
    return { repos: [], missing: [] };
  }

  const data = body.data;
  if (!data) {
    if (attempt < 2) {
      await sleep(2 ** attempt * 3_000);
      return fetchRepoBatch(fullNames, token, budget, attempt + 1);
    }
    return { repos: [], missing: [] };
  }

  if (data.rateLimit) budget.record(data.rateLimit as RateLimit);

  const missing: string[] = [];
  for (const error of body.errors ?? []) {
    const alias = error.path?.[0];
    if (error.type === "NOT_FOUND" && alias?.startsWith("r")) {
      const index = Number(alias.slice(1));
      if (fullNames[index]) missing.push(fullNames[index]);
    }
  }

  const repos: [string, GraphQLRepo][] = [];
  for (const [alias, value] of Object.entries(data)) {
    if (alias === "rateLimit" || !value) continue;
    const requested = fullNames[Number(alias.slice(1))];
    if (requested) repos.push([requested, value as GraphQLRepo]);
  }

  return { repos, missing };
};

export const fetchRepos = async (
  fullNames: string[],
  token: string,
  budget: BudgetTracker,
  {
    batchSize = 40,
    concurrency = 4,
    onProgress,
  }: {
    batchSize?: number;
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
  } = {},
): Promise<{ repos: Map<string, GraphQLRepo>; missing: Set<string> }> => {
  const chunks: string[][] = [];
  for (let i = 0; i < fullNames.length; i += batchSize) {
    chunks.push(fullNames.slice(i, i + batchSize));
  }

  const repos = new Map<string, GraphQLRepo>();
  const missing = new Set<string>();
  const queue = new PQueue({ concurrency });
  let done = 0;

  await Promise.all(
    chunks.map((chunk) =>
      queue.add(async () => {
        const result = await fetchRepoBatch(chunk, token, budget);
        for (const [requested, repo] of result.repos) {
          repos.set(requested.toLowerCase(), repo);
        }
        for (const name of result.missing) missing.add(name.toLowerCase());
        done += chunk.length;
        onProgress?.(done, fullNames.length);
      }),
    ),
  );

  return { repos, missing };
};

const README_CANDIDATES = [
  "README.md",
  "readme.md",
  "Readme.md",
  "README.markdown",
  "README.rst",
  "README",
  "docs/README.md",
];

// raw.githubusercontent.com is unmetered, so discovery costs no API budget.
export const fetchRawReadme = async (
  fullName: string,
  branch: string,
  token: string,
  budget?: BudgetTracker,
): Promise<{ path: string; text: string } | null> => {
  for (const candidate of README_CANDIDATES) {
    try {
      const response = await got(
        `https://raw.githubusercontent.com/${fullName}/${branch}/${candidate}`,
        { throwHttpErrors: false, retry: { limit: 1 }, timeout: { request: 30_000 } },
      );
      budget?.countRawFetch();
      if (response.statusCode === 200) {
        return { path: candidate, text: response.body };
      }
    } catch {
      budget?.countRawFetch();
    }
  }

  // Real lists use README.org, README.textile, README.MD, .github/README.md …
  // — unguessable. The API reports the actual name, and REST draws on a quota
  // separate from the GraphQL points we budget.
  try {
    const [owner, repo] = fullName.split("/");
    const text = await fetchReadme(owner, repo, token);
    budget?.countRestFallback();
    return { path: "(rest)", text };
  } catch {
    return null;
  }
};
