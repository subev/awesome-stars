import type { RepoBadges } from "~/components/MarkdownRenderer";
import type { StarsAsset } from "./starsAsset";
import { readSnapshots } from "./snapshots.server.ts";
import { computeTrends } from "./trends.ts";

export const buildStarsAsset = async (
  owner: string,
  repo: string,
): Promise<StarsAsset | null> => {
  const snapshots = await readSnapshots(owner, repo);
  if (snapshots.length === 0) return null;

  const latest = snapshots[snapshots.length - 1];
  const stars: Record<string, number> = {};
  for (const r of latest.repos) {
    stars[r.fullName.toLowerCase()] = r.stars;
  }

  const badges: RepoBadges = {};
  if (snapshots.length >= 2) {
    const { repos } = computeTrends(snapshots);
    for (const r of repos) {
      if (
        r.isNew ||
        (r.pctPerMonth !== null && Math.abs(r.pctPerMonth) >= 0.05)
      ) {
        badges[r.fullName.toLowerCase()] = {
          pct: r.pctPerMonth,
          delta: r.delta,
          since: r.addedAt,
          isNew: r.isNew,
        };
      }
    }
  }

  return { date: latest.date, stars, badges };
};
