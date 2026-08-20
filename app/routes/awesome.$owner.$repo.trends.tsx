import { useMemo, useState } from "react";
import { Link, data, useLoaderData } from "react-router";
import { computeTrends, type RepoTrend, type Trends } from "~/lib/trends";
import { trendsAssetUrl } from "~/lib/starsAsset";
import type { Route } from "./+types/awesome.$owner.$repo.trends";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Trends · ${params.owner}/${params.repo}` }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { owner, repo } = params;
  const { readAllRepos, readListIndex } = await import(
    "~/lib/repoIndex.server"
  );
  const { loadHistory } = await import("~/lib/history.server");

  const list = await readListIndex(owner, repo);
  if (!list) throw data(`${owner}/${repo} has not been indexed yet.`, { status: 404 });

  const history = await loadHistory(await readAllRepos());
  const snapshots = history.snapshotsFor(list.members);
  // Not an error: a freshly crawled list simply has one datapoint so far.
  const trends = snapshots.length >= 2 ? computeTrends(snapshots) : null;
  return { trends, owner, repo };
}

const STATIC_BUILD = import.meta.env.VITE_STATIC_BUILD === "1";

export async function clientLoader({
  params,
  serverLoader,
}: Route.ClientLoaderArgs) {
  if (!STATIC_BUILD) return serverLoader();
  const { owner, repo } = params;
  const res = await fetch(trendsAssetUrl(owner, repo));
  const trends = res.ok ? ((await res.json()) as Trends) : null;
  return { trends, owner, repo };
}

const ACCENT = "var(--accent)";

function Sparkline({
  dates,
  series,
}: {
  dates: string[];
  series: (number | null)[];
}) {
  const w = 96;
  const h = 28;
  const pad = 3;

  const pts = dates
    .map((date, i) => ({ t: new Date(date).getTime(), v: series[i], date }))
    .filter((p): p is { t: number; v: number; date: string } => p.v !== null);

  if (pts.length < 2) {
    return <span className="text-ink-dim/60 text-xs">–</span>;
  }

  const t0 = pts[0].t;
  const t1 = pts[pts.length - 1].t;
  const values = pts.map((p) => p.v);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);

  const x = (t: number) =>
    t1 === t0 ? w / 2 : pad + ((t - t0) / (t1 - t0)) * (w - 2 * pad);
  const y = (v: number) =>
    vMax === vMin ? h / 2 : h - pad - ((v - vMin) / (vMax - vMin)) * (h - 2 * pad);

  const points = pts
    .map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];

  return (
    <svg
      width={w}
      height={h}
      className="overflow-visible"
      role="img"
      aria-label={`Stars over time: ${pts.map((p) => `${p.date}: ${p.v}`).join(", ")}`}
    >
      <title>
        {pts.map((p) => `${p.date}: ${p.v.toLocaleString("en-US")} ⭐`).join("\n")}
      </title>
      <polyline
        points={points}
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={x(last.t)} cy={y(last.v)} r="2.5" fill={ACCENT} />
    </svg>
  );
}

const formatStars = (n: number) => n.toLocaleString("en-US");

const formatDelta = (n: number) =>
  `${n > 0 ? "+" : ""}${n.toLocaleString("en-US")}`;

const formatPct = (p: number | null) =>
  p === null ? "–" : `${p >= 0 ? "+" : ""}${p.toFixed(1)}%/mo`;

const deltaColor = (n: number) =>
  n > 0 ? "text-up" : n < 0 ? "text-down" : "text-ink-dim/60";

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-edge bg-surface rounded-lg border p-4">
      <div className="font-display text-2xl font-semibold">{value}</div>
      <div className="text-ink-dim text-sm">{label}</div>
    </div>
  );
}

function RepoCell({ repo }: { repo: RepoTrend }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <img
        src={repo.avatarUrl}
        alt=""
        className="h-6 w-6 shrink-0 rounded-full"
        loading="lazy"
      />
      <div className="min-w-0">
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent font-medium hover:underline"
        >
          {repo.fullName}
        </a>
        {repo.description && (
          <p className="text-ink-dim truncate text-xs">{repo.description}</p>
        )}
      </div>
    </div>
  );
}

type SortKey = "fullName" | "pctPerMonth" | "delta" | "lastStars";
type SortState = { key: SortKey; dir: "asc" | "desc" };

const sortRepos = (repos: RepoTrend[], { key, dir }: SortState) =>
  [...repos].sort((a, b) => {
    if (key === "fullName") {
      const cmp = a.fullName.localeCompare(b.fullName);
      return dir === "asc" ? cmp : -cmp;
    }
    if (key === "pctPerMonth") {
      if (a.pctPerMonth === null) return 1;
      if (b.pctPerMonth === null) return -1;
      const cmp = a.pctPerMonth - b.pctPerMonth;
      return dir === "asc" ? cmp : -cmp;
    }
    const cmp = a[key] - b[key];
    return dir === "asc" ? cmp : -cmp;
  });

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  return (
    <th
      className={`px-4 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
      }
    >
      <button
        onClick={() => onSort(sortKey)}
        className={`hover:text-ink inline-flex items-center gap-1 uppercase ${active ? "text-ink" : ""}`}
      >
        {label}
        <span className={active ? "" : "invisible"}>
          {active && sort.dir === "asc" ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}

const VISIBLE_LIMIT = 100;

function NotEnoughData({ owner, repo }: { owner: string; repo: string }) {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-4">
        <Link to={`/awesome/${owner}/${repo}`} className="text-ink-dim hover:text-ink text-sm">
          &larr; {owner}/{repo}
        </Link>
      </div>
      <div className="border-edge bg-surface rounded-lg border p-6">
        <h2 className="font-display mb-2 text-lg font-semibold">
          Not enough history yet
        </h2>
        <p className="text-ink-dim">
          Trends need at least two datapoints on different days. This list has
          been seen once so far — check back after the next weekly crawl.
        </p>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const { trends, owner, repo } = useLoaderData<typeof loader>();
  if (!trends) return <NotEnoughData owner={owner} repo={repo} />;
  return <TrendsView trends={trends} owner={owner} repo={repo} />;
}

function TrendsView({
  trends,
  owner,
  repo,
}: {
  trends: Trends;
  owner: string;
  repo: string;
}) {
  const { dates, repos, removed, summary } = trends;

  const [sort, setSort] = useState<SortState>({
    key: "pctPerMonth",
    dir: "desc",
  });
  const [minStars, setMinStars] = useState(100);

  const handleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "desc" ? "asc" : "desc" }
        : { key, dir: key === "fullName" ? "asc" : "desc" },
    );
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [showAllNew, setShowAllNew] = useState(false);

  const previousDate = dates.length > 1 ? dates[dates.length - 2] : null;

  const newArrivals = useMemo(
    () =>
      repos
        .filter((r) => r.isNew)
        .sort((a, b) => b.lastStars - a.lastStars),
    [repos],
  );

  const trending = useMemo(
    () =>
      sortRepos(
        repos.filter((r) => !r.isNew && r.lastStars >= minStars),
        sort,
      ),
    [repos, sort, minStars],
  );

  const visibleTrending = showAllTrending
    ? trending
    : trending.slice(0, VISIBLE_LIMIT);
  const visibleNew = showAllNew ? newArrivals : newArrivals.slice(0, 30);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-4 flex items-center gap-4 text-sm">
        <Link to="/" className="text-ink-dim hover:text-ink">
          &larr; All lists
        </Link>
        <Link
          to={`/awesome/${owner}/${repo}`}
          className="text-ink-dim hover:text-ink"
        >
          View list
        </Link>
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight">
        Trends · {owner}/{repo}
      </h1>
      <p className="text-ink-dim font-data mt-1 mb-6 text-xs">
        {dates.length} snapshot{dates.length === 1 ? "" : "s"}: {dates.join(" · ")}
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryTile
          label="Repos tracked"
          value={formatStars(summary.repoCount)}
        />
        <SummaryTile
          label={previousDate ? `New since ${previousDate}` : "New"}
          value={formatStars(summary.newCount)}
        />
        <SummaryTile
          label="Stars gained"
          value={formatDelta(summary.totalStarsGained)}
        />
        <SummaryTile
          label="Dropped from list"
          value={formatStars(summary.removedCount)}
        />
      </div>

      {dates.length < 2 && (
        <div className="border-edge bg-surface-2 text-ink-dim mb-8 rounded-lg border p-4 text-sm">
          Only one snapshot so far — trends appear after the next fetch adds a
          second data point.
        </div>
      )}

      {newArrivals.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display mb-3 text-xl font-semibold">
            New arrivals{previousDate ? ` since ${previousDate}` : ""} (
            {newArrivals.length})
          </h2>
          <div className="border-edge bg-surface overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-edge bg-surface-2 text-ink-dim border-b text-left text-xs uppercase">
                  <th className="px-4 py-2 font-medium">Repository</th>
                  <th className="px-4 py-2 text-right font-medium">Stars</th>
                </tr>
              </thead>
              <tbody>
                {visibleNew.map((r) => (
                  <tr key={r.fullName} className="border-edge/60 border-b last:border-0">
                    <td className="max-w-md px-4 py-2">
                      <RepoCell repo={r} />
                    </td>
                    <td className="font-data px-4 py-2 text-right text-xs">
                      {formatStars(r.lastStars)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {newArrivals.length > visibleNew.length && (
            <button
              onClick={() => setShowAllNew(true)}
              className="text-accent mt-2 text-sm hover:underline"
            >
              Show all {newArrivals.length} new arrivals
            </button>
          )}
        </section>
      )}

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Trending repositories</h2>
          <label className="text-ink-dim flex items-center gap-2 text-sm">
            Min stars
            <input
              type="number"
              min={0}
              value={minStars}
              onChange={(e) => setMinStars(Number(e.target.value) || 0)}
              className="border-edge bg-surface font-data w-20 rounded border px-2 py-1"
            />
          </label>
        </div>

        <div className="border-edge bg-surface overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-edge bg-surface-2 text-ink-dim border-b text-left text-xs uppercase">
                <th className="px-4 py-2 font-medium">#</th>
                <SortableHeader
                  label="Repository"
                  sortKey="fullName"
                  sort={sort}
                  onSort={handleSort}
                  align="left"
                />
                <th className="px-4 py-2 font-medium">Stars over time</th>
                <SortableHeader
                  label="Then → Now"
                  sortKey="lastStars"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Gained"
                  sortKey="delta"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Growth"
                  sortKey="pctPerMonth"
                  sort={sort}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {visibleTrending.map((r, i) => (
                <tr key={r.fullName} className="border-edge/60 border-b last:border-0">
                  <td className="text-ink-dim/60 font-data px-4 py-2 text-xs">{i + 1}</td>
                  <td className="max-w-md px-4 py-2">
                    <RepoCell repo={r} />
                  </td>
                  <td className="px-4 py-2">
                    <Sparkline dates={dates} series={r.series} />
                  </td>
                  <td className="font-data px-4 py-2 text-right text-xs whitespace-nowrap">
                    <span className="text-ink-dim/60">
                      {formatStars(r.firstStars)} &rarr;{" "}
                    </span>
                    {formatStars(r.lastStars)}
                  </td>
                  <td
                    className={`font-data px-4 py-2 text-right text-xs ${deltaColor(r.delta)}`}
                  >
                    {formatDelta(r.delta)}
                  </td>
                  <td
                    className={`font-data px-4 py-2 text-right text-xs whitespace-nowrap ${deltaColor(r.pctPerMonth ?? 0)}`}
                  >
                    {formatPct(r.pctPerMonth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {trending.length > visibleTrending.length && (
          <button
            onClick={() => setShowAllTrending(true)}
            className="text-accent mt-2 text-sm hover:underline"
          >
            Show all {trending.length} repositories
          </button>
        )}
      </section>

      {removed.length > 0 && (
        <details className="mb-10">
          <summary className="text-ink-dim hover:text-ink cursor-pointer text-sm font-medium">
            Dropped from the list ({removed.length})
          </summary>
          <ul className="text-ink-dim mt-3 space-y-1 text-sm">
            {removed.map((r) => (
              <li key={r.fullName}>
                <a
                  href={`https://github.com/${r.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {r.fullName}
                </a>{" "}
                <span className="text-ink-dim/60">
                  — ⭐ {formatStars(r.stars)}, last seen {r.lastSeen}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
