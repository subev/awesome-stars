import { promises as fs } from "fs";
import path from "path";
import { stableRecordJson } from "./stableJson.ts";

export const CRAWL_DIR = path.resolve("data/crawl");
export const STATE_PATH = path.join(CRAWL_DIR, "state.json");
export const RUNS_PATH = path.join(CRAWL_DIR, "runs.jsonl");

export const STATE_VERSION = 1;

export type NodeStatus = "pending" | "done" | "skipped" | "gone" | "error";

export type CrawlNode = {
  depth: number;
  status: NodeStatus;
  via: string | null;
  stars: number | null;
  members: number | null;
  readmeSha: string | null;
  crawledAt: string | null;
  attempts: number;
  reason: string | null;
};

export type CrawlState = {
  version: number;
  nodes: Record<string, CrawlNode>;
};

export type RunLog = {
  startedAt: string;
  endedAt: string;
  pointsSpent: number;
  pointsRemaining: number | null;
  batches: number;
  rawFetches: number;
  restFallbacks: number;
  throttled: number;
  listsCrawled: number;
  reposUpserted: number;
  newListsQueued: number;
  stoppedBy: string;
};

export const emptyState = (): CrawlState => ({
  version: STATE_VERSION,
  nodes: {},
});

export const loadCrawlState = async (): Promise<CrawlState> => {
  try {
    const raw = await fs.readFile(STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as CrawlState;
    if (parsed.version !== STATE_VERSION) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
};

export const saveCrawlState = async (state: CrawlState) => {
  await fs.mkdir(CRAWL_DIR, { recursive: true });
  const body = `{\n"version": ${state.version},\n"nodes": ${stableRecordJson(state.nodes)}\n}\n`;
  const tmp = `${STATE_PATH}.tmp`;
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, STATE_PATH);
};

export const appendRunLog = async (entry: RunLog) => {
  await fs.mkdir(CRAWL_DIR, { recursive: true });
  await fs.appendFile(RUNS_PATH, `${JSON.stringify(entry)}\n`);
};

export const readRunLogs = async (): Promise<RunLog[]> => {
  try {
    const raw = await fs.readFile(RUNS_PATH, "utf-8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RunLog);
  } catch {
    return [];
  }
};

export const LOCK_PATH = path.join(CRAWL_DIR, "crawl.lock");

// Two crawlers flushing the same shards would silently drop each other's
// upserts, so a run takes an exclusive lock over data/.
export const acquireLock = async (): Promise<() => Promise<void>> => {
  await fs.mkdir(CRAWL_DIR, { recursive: true });
  try {
    await fs.writeFile(LOCK_PATH, JSON.stringify({ pid: process.pid }), {
      flag: "wx",
    });
  } catch {
    const holder = await fs
      .readFile(LOCK_PATH, "utf-8")
      .then((raw) => JSON.parse(raw).pid as number)
      .catch(() => null);
    if (holder !== null && isAlive(holder)) {
      throw new Error(
        `Another crawl is running (pid ${holder}). Wait for it, or delete ${LOCK_PATH} if it is stale.`,
      );
    }
    await fs.writeFile(LOCK_PATH, JSON.stringify({ pid: process.pid }));
  }
  return async () => {
    await fs.rm(LOCK_PATH, { force: true });
  };
};

const isAlive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM means the process exists but belongs to someone else; only ESRCH
    // proves it is gone.
    return (err as { code?: string }).code === "EPERM";
  }
};

export const newNode = (depth: number, via: string | null): CrawlNode => ({
  depth,
  status: "pending",
  via,
  stars: null,
  members: null,
  readmeSha: null,
  crawledAt: null,
  attempts: 0,
  reason: null,
});
