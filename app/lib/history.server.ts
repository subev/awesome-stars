import { promises as fs } from "fs";
import path from "path";
import { gzipSync, gunzipSync } from "node:zlib";
import { INDEX_DIR, readAllRepos, type IndexedRepo } from "./repoIndex.server.ts";
import { stableRecordJson } from "./stableJson.ts";
import type { Snapshot, SnapshotRepo } from "./trends.ts";
import { avatarUrlFor, htmlUrlFor } from "./repoIndex.server.ts";

export const HISTORY_DIR = path.join(INDEX_DIR, "history");

export type StarsByRepo = Record<string, number>;

const filePath = (date: string) => path.join(HISTORY_DIR, `${date}.json.gz`);

export const todayDate = () => new Date().toISOString().slice(0, 10);

export const listHistoryDates = async (): Promise<string[]> => {
  try {
    return (await fs.readdir(HISTORY_DIR))
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json\.gz$/.test(f))
      .map((f) => f.replace(".json.gz", ""))
      .sort();
  } catch {
    return [];
  }
};

export const readHistoryDate = async (date: string): Promise<StarsByRepo> => {
  try {
    return JSON.parse(gunzipSync(await fs.readFile(filePath(date))).toString());
  } catch {
    return {};
  }
};

// Same-day runs enrich one datapoint rather than creating duplicates.
export const mergeHistoryDate = async (date: string, stars: StarsByRepo) => {
  await fs.mkdir(HISTORY_DIR, { recursive: true });
  const merged = { ...(await readHistoryDate(date)), ...stars };
  const target = filePath(date);
  await fs.writeFile(
    `${target}.tmp`,
    gzipSync(Buffer.from(stableRecordJson(merged)), { level: 9 }),
  );
  await fs.rename(`${target}.tmp`, target);
  return Object.keys(merged).length;
};

const daysBetween = (from: string, to: string) =>
  (Date.parse(to) - Date.parse(from)) / 86_400_000;

// A run records history only when the newest datapoint is old enough, or when
// it is today's — so the 6-hourly crawl cron does not mint 4 datapoints a day.
export const historyDueDate = async (
  everyDays: number,
  today = todayDate(),
): Promise<string | null> => {
  const dates = await listHistoryDates();
  const newest = dates[dates.length - 1];
  if (!newest) return today;
  if (newest === today) return today;
  return daysBetween(newest, today) >= everyDays ? today : null;
};

const toSnapshotRepo = (
  fullName: string,
  stars: number,
  details: IndexedRepo | undefined,
): SnapshotRepo => ({
  fullName,
  stars,
  description: details?.[2] || null,
  htmlUrl: htmlUrlFor(fullName),
  avatarUrl: details ? avatarUrlFor(details[1]) : "",
});

export type HistoryReader = {
  dates: string[];
  snapshotsFor: (members: string[]) => Snapshot[];
};

// A date file holds every repo seen that day across all lists, so a list the
// crawl did not reach that day appears with near-zero members. Without this
// floor computeTrends would report the whole list as "dropped".
const MIN_COVERAGE = 0.5;

// One pass over the date files; callers then slice per list. Reading these
// once and reusing the reader is what keeps the asset build to a single pass.
export const loadHistory = async (
  repos?: Map<string, IndexedRepo>,
): Promise<HistoryReader> => {
  const dates = await listHistoryDates();
  const details = repos ?? (await readAllRepos());
  const byDate = new Map<string, StarsByRepo>();
  for (const date of dates) byDate.set(date, await readHistoryDate(date));

  return {
    dates,
    snapshotsFor(members: string[]): Snapshot[] {
      const snapshots: Snapshot[] = [];
      for (const date of dates) {
        const stars = byDate.get(date)!;
        const repoRows: SnapshotRepo[] = [];
        for (const member of members) {
          const value = stars[member];
          if (value === undefined) continue;
          repoRows.push(toSnapshotRepo(member, value, details.get(member)));
        }
        if (repoRows.length >= members.length * MIN_COVERAGE) {
          snapshots.push({ date, repos: repoRows });
        }
      }
      return snapshots;
    },
  };
};
