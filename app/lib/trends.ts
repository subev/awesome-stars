export type SnapshotRepo = {
  fullName: string;
  stars: number;
  description: string | null;
  htmlUrl: string;
  avatarUrl: string;
};

export type Snapshot = {
  date: string;
  repos: SnapshotRepo[];
};

export type RepoTrend = {
  fullName: string;
  description: string | null;
  htmlUrl: string;
  avatarUrl: string;
  series: (number | null)[];
  firstStars: number;
  lastStars: number;
  delta: number;
  pctPerMonth: number | null;
  addedAt: string;
  isNew: boolean;
};

export type RemovedRepo = {
  fullName: string;
  lastSeen: string;
  stars: number;
};

export type Trends = {
  dates: string[];
  repos: RepoTrend[];
  removed: RemovedRepo[];
  summary: {
    repoCount: number;
    newCount: number;
    removedCount: number;
    totalStarsNow: number;
    totalStarsGained: number;
  };
};

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

// Below this, dividing by the elapsed window extrapolates noise: a repo seen
// once a day ago that gained 0.7% would be reported as +21%/month and outrank
// one that genuinely doubled over six. Such repos are still flagged isNew.
export const MIN_WINDOW_DAYS = 14;

export const monthsBetween = (from: string, to: string) =>
  (new Date(to).getTime() - new Date(from).getTime()) / MS_PER_MONTH;

export function computeTrends(snapshots: Snapshot[]): Trends {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((s) => s.date);
  const byDate = sorted.map(
    (s) => new Map(s.repos.map((r) => [r.fullName, r])),
  );

  const latest = byDate[byDate.length - 1] ?? new Map<string, SnapshotRepo>();
  const latestDate = dates[dates.length - 1];

  const repos: RepoTrend[] = [];
  for (const repo of latest.values()) {
    const series = byDate.map((m) => m.get(repo.fullName)?.stars ?? null);
    const firstIndex = series.findIndex((v) => v !== null);
    const firstStars = series[firstIndex]!;
    const addedAt = dates[firstIndex];
    const delta = repo.stars - firstStars;
    const months = monthsBetween(addedAt, latestDate);
    const pctPerMonth =
      firstStars > 0 && months >= MIN_WINDOW_DAYS / 30.44
        ? (delta / firstStars / months) * 100
        : null;

    repos.push({
      fullName: repo.fullName,
      description: repo.description,
      htmlUrl: repo.htmlUrl,
      avatarUrl: repo.avatarUrl,
      series,
      firstStars,
      lastStars: repo.stars,
      delta,
      pctPerMonth,
      addedAt,
      isNew: dates.length > 1 && firstIndex === dates.length - 1,
    });
  }

  const removed: RemovedRepo[] = [];
  const seen = new Set<string>();
  for (let i = byDate.length - 2; i >= 0; i--) {
    for (const repo of byDate[i].values()) {
      if (!latest.has(repo.fullName) && !seen.has(repo.fullName)) {
        seen.add(repo.fullName);
        removed.push({
          fullName: repo.fullName,
          lastSeen: dates[i],
          stars: repo.stars,
        });
      }
    }
  }
  removed.sort((a, b) => b.stars - a.stars);

  const newCount = repos.filter((r) => r.isNew).length;
  const totalStarsNow = repos.reduce((sum, r) => sum + r.lastStars, 0);
  const totalStarsGained = repos.reduce((sum, r) => sum + r.delta, 0);

  return {
    dates,
    repos,
    removed,
    summary: {
      repoCount: repos.length,
      newCount,
      removedCount: removed.length,
      totalStarsNow,
      totalStarsGained,
    },
  };
}
