import { promises as fs } from "fs";
import path from "path";
import { createHash } from "node:crypto";
import { stableRecordJson } from "./stableJson.ts";

export const INDEX_DIR = path.resolve("data/index");
export const REPOS_DIR = path.join(INDEX_DIR, "repos");
export const LISTS_DIR = path.join(INDEX_DIR, "lists");

export type IndexedRepo = [stars: number, ownerId: number, description: string];

// Deliberately free of stars/timestamps: those live in the repo shards and in
// data/crawl/state.json, so a refresh run does not rewrite every list file.
export type ListMeta = {
  description: string;
  defaultBranch: string;
  topics: string[];
  readmeSha: string;
};

// computeTrends reports repos that vanished from a list; membership is
// current-state only, so departures are logged here as they happen.
export type ListIndex = {
  meta: ListMeta;
  members: string[];
  dropped?: [date: string, fullName: string][];
};

export const sha1 = (input: string) =>
  createHash("sha1").update(input).digest("hex");

export const shardFor = (fullName: string) =>
  sha1(fullName.toLowerCase()).slice(0, 2);

export const avatarUrlFor = (ownerId: number) =>
  `https://avatars.githubusercontent.com/u/${ownerId}?v=4`;

export const htmlUrlFor = (fullName: string) =>
  `https://github.com/${fullName}`;

const shardPath = (shard: string) => path.join(REPOS_DIR, `${shard}.json`);

const readShard = async (
  shard: string,
): Promise<Record<string, IndexedRepo>> => {
  try {
    return JSON.parse(await fs.readFile(shardPath(shard), "utf-8"));
  } catch {
    return {};
  }
};

export type RepoIndex = ReturnType<typeof createRepoIndex>;

export const createRepoIndex = () => {
  const loaded = new Map<string, Record<string, IndexedRepo>>();
  const dirty = new Set<string>();
  let upserted = 0;

  const load = async (shard: string) => {
    let entries = loaded.get(shard);
    if (!entries) {
      entries = await readShard(shard);
      loaded.set(shard, entries);
    }
    return entries;
  };

  return {
    async upsert(fullName: string, repo: IndexedRepo) {
      const shard = shardFor(fullName);
      const entries = await load(shard);
      const previous = entries[fullName];
      if (
        previous &&
        previous[0] === repo[0] &&
        previous[1] === repo[1] &&
        previous[2] === repo[2]
      ) {
        return;
      }
      entries[fullName] = repo;
      dirty.add(shard);
      upserted++;
    },
    async remove(fullName: string) {
      const shard = shardFor(fullName);
      const entries = await load(shard);
      if (!(fullName in entries)) return;
      delete entries[fullName];
      dirty.add(shard);
    },
    get upsertedCount() {
      return upserted;
    },
    async flush() {
      if (dirty.size === 0) return;
      await fs.mkdir(REPOS_DIR, { recursive: true });
      for (const shard of dirty) {
        const body = `${stableRecordJson(loaded.get(shard) ?? {})}\n`;
        const target = shardPath(shard);
        await fs.writeFile(`${target}.tmp`, body);
        await fs.rename(`${target}.tmp`, target);
      }
      dirty.clear();
      // Shards are re-read on demand; dropping them keeps memory flat on long runs.
      loaded.clear();
    },
  };
};

export const readAllRepos = async (): Promise<Map<string, IndexedRepo>> => {
  const repos = new Map<string, IndexedRepo>();
  let files: string[];
  try {
    files = await fs.readdir(REPOS_DIR);
  } catch {
    return repos;
  }
  for (const file of files) {
    if (!/^[0-9a-f]{2}\.json$/.test(file)) continue;
    const entries: Record<string, IndexedRepo> = JSON.parse(
      await fs.readFile(path.join(REPOS_DIR, file), "utf-8"),
    );
    for (const [fullName, repo] of Object.entries(entries)) {
      repos.set(fullName, repo);
    }
  }
  return repos;
};

const listPath = (owner: string, repo: string) =>
  path.join(LISTS_DIR, owner, `${repo}.json`);

export const writeListIndex = async (
  owner: string,
  repo: string,
  index: ListIndex,
) => {
  const target = listPath(owner, repo);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const dropped = index.dropped?.length
    ? `,\n"dropped": [\n${index.dropped.map((d) => JSON.stringify(d)).join(",\n")}\n]`
    : "";
  const body = `{\n"meta": ${JSON.stringify(index.meta)},\n"members": [\n${index.members
    .map((member) => JSON.stringify(member))
    .join(",\n")}\n]${dropped}\n}\n`;
  await fs.writeFile(`${target}.tmp`, body);
  await fs.rename(`${target}.tmp`, target);
};

export const readListIndex = async (
  owner: string,
  repo: string,
): Promise<ListIndex | null> => {
  try {
    return JSON.parse(await fs.readFile(listPath(owner, repo), "utf-8"));
  } catch {
    return null;
  }
};

export const listIndexedLists = async (): Promise<
  { owner: string; repo: string }[]
> => {
  let owners: string[];
  try {
    owners = await fs.readdir(LISTS_DIR);
  } catch {
    return [];
  }
  const lists: { owner: string; repo: string }[] = [];
  for (const owner of owners) {
    let files: string[];
    try {
      files = await fs.readdir(path.join(LISTS_DIR, owner));
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      lists.push({ owner, repo: file.slice(0, -".json".length) });
    }
  }
  return lists;
};
