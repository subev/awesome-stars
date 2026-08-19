import { promises as fs } from "fs";
import path from "path";
import type { RepoDetailsGithub } from "./stars.server";
import type { Snapshot, SnapshotRepo } from "./trends";

export const SNAPSHOTS_DIR = path.resolve("data/snapshots");

export const getSnapshotDir = (owner: string, repo: string) =>
  path.join(SNAPSHOTS_DIR, owner, repo);

export const getSnapshotPath = (owner: string, repo: string, date: string) =>
  path.join(getSnapshotDir(owner, repo), `${date}.json`);

export const todayDate = () => new Date().toISOString().slice(0, 10);

export const toSnapshotRepos = (
  details: RepoDetailsGithub[],
): SnapshotRepo[] => {
  const byName = new Map<string, SnapshotRepo>();
  for (const d of details) {
    byName.set(`${d.owner.login}/${d.name}`, {
      fullName: `${d.owner.login}/${d.name}`,
      stars: d.stargazers_count,
      description: d.description,
      htmlUrl: d.html_url,
      avatarUrl: d.owner.avatar_url,
    });
  }
  return [...byName.values()];
};

export const writeSnapshot = async (
  owner: string,
  repo: string,
  date: string,
  repos: SnapshotRepo[],
) => {
  const snapshotPath = getSnapshotPath(owner, repo, date);
  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  await fs.writeFile(snapshotPath, JSON.stringify(repos));
  return snapshotPath;
};

export type TrackedList = {
  owner: string;
  repo: string;
  snapshotDates: string[];
};

export const listTrackedLists = async (): Promise<TrackedList[]> => {
  let owners: string[];
  try {
    owners = await fs.readdir(SNAPSHOTS_DIR);
  } catch {
    return [];
  }

  const lists: TrackedList[] = [];
  for (const owner of owners) {
    const ownerDir = path.join(SNAPSHOTS_DIR, owner);
    if (!(await fs.stat(ownerDir)).isDirectory()) continue;
    for (const repo of await fs.readdir(ownerDir)) {
      const files = await fs.readdir(path.join(ownerDir, repo));
      const snapshotDates = files
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .map((f) => f.replace(".json", ""))
        .sort();
      if (snapshotDates.length > 0) {
        lists.push({ owner, repo, snapshotDates });
      }
    }
  }
  return lists;
};

export const readSnapshots = async (
  owner: string,
  repo: string,
): Promise<Snapshot[]> => {
  const dir = getSnapshotDir(owner, repo);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }

  const snapshotFiles = files.filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  return Promise.all(
    snapshotFiles.map(async (file) => ({
      date: file.replace(".json", ""),
      repos: JSON.parse(await fs.readFile(path.join(dir, file), "utf-8")),
    })),
  );
};
