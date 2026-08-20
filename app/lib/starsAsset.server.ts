import type { RepoBadges } from "~/components/MarkdownRenderer";
import type { StarsAsset } from "./starsAsset";
import { computeTrends, type Trends } from "./trends.ts";
import { readListIndex, type IndexedRepo } from "./repoIndex.server.ts";
import { todayDate, type HistoryReader } from "./history.server.ts";

export const badgesFromTrends = (trends: Trends): RepoBadges => {
  const badges: RepoBadges = {};
  for (const r of trends.repos) {
    if (r.isNew || (r.pctPerMonth !== null && Math.abs(r.pctPerMonth) >= 0.05)) {
      badges[r.fullName.toLowerCase()] = {
        pct: r.pctPerMonth,
        delta: r.delta,
        since: r.addedAt,
        isNew: r.isNew,
      };
    }
  }
  return badges;
};

export const buildIndexStarsAsset = async (
  owner: string,
  repo: string,
  repos: Map<string, IndexedRepo>,
  history: HistoryReader,
): Promise<{ asset: StarsAsset; trends: Trends | null } | null> => {
  const list = await readListIndex(owner, repo);
  if (!list) return null;

  const stars: Record<string, number> = {};
  for (const member of list.members) {
    const entry = repos.get(member);
    if (entry) stars[member.toLowerCase()] = entry[0];
  }
  if (Object.keys(stars).length === 0) return null;

  const snapshots = history.snapshotsFor(list.members);
  if (snapshots.length < 2) {
    return { asset: { date: todayDate(), stars, badges: {} }, trends: null };
  }

  const trends = computeTrends(snapshots);
  return {
    asset: {
      date: snapshots[snapshots.length - 1].date,
      stars,
      badges: badgesFromTrends(trends),
    },
    trends,
  };
};
