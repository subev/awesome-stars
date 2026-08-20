import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";
import { AWESOME_LISTS } from "~/lists";
import { listDirectoryUrl, type ListDirectoryEntry } from "~/lib/starsAsset";


function PendingSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`border-accent/30 border-t-accent inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 ${className}`}
    />
  );
}

const compactStars = (stars: number) =>
  stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars);

// The directory is a few hundred KB, so it loads on first interaction only.
function ExploreLists() {
  const [entries, setEntries] = useState<ListDirectoryEntry[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "empty">("idle");
  const [query, setQuery] = useState("");
  const requested = useRef(false);

  const load = () => {
    if (requested.current) return;
    requested.current = true;
    setStatus("loading");
    fetch(listDirectoryUrl())
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("no directory"))))
      .then((data: ListDirectoryEntry[]) => {
        setEntries(data);
        setStatus(data.length === 0 ? "empty" : "idle");
      })
      .catch(() => setStatus("empty"));
  };

  useEffect(() => {
    if (query && !requested.current) load();
  }, [query]);

  const matches = useMemo(() => {
    if (!entries) return [];
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? entries.filter(
          (entry) =>
            `${entry.owner}/${entry.repo}`.toLowerCase().includes(needle) ||
            entry.description.toLowerCase().includes(needle),
        )
      : entries;
    return filtered.slice(0, 50);
  }, [entries, query]);

  return (
    <section className="mt-10">
      <h2 className="font-display mb-1 text-xl font-semibold">Explore</h2>
      <p className="text-ink-dim mb-4 text-sm">
        Lists discovered by crawling outward from sindresorhus/awesome.
        {entries ? ` ${entries.length.toLocaleString()} indexed.` : ""}
      </p>

      <input
        type="search"
        value={query}
        onFocus={load}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search crawled lists…"
        aria-label="Search crawled lists"
        className="border-edge bg-surface focus:border-accent/50 w-full rounded-lg border px-3 py-2 text-sm outline-none"
      />

      {status === "loading" && (
        <p className="text-ink-dim mt-3 text-sm">Loading directory…</p>
      )}
      {status === "empty" && (
        <p className="text-ink-dim mt-3 text-sm">
          No crawl index yet — run <code className="font-data">npm run crawl</code>.
        </p>
      )}

      {matches.length > 0 && (
        <ul className="divide-edge border-edge bg-surface mt-3 divide-y rounded-lg border">
          {matches.map((entry) => (
            <li key={`${entry.owner}/${entry.repo}`} className="p-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <NavLink
                  to={`/awesome/${entry.owner}/${entry.repo}`}
                  className="text-accent min-w-0 truncate font-medium hover:underline"
                >
                  {entry.owner}/{entry.repo}
                </NavLink>
                <span className="text-ink-dim font-data shrink-0 text-xs">
                  ⭐️ {compactStars(entry.stars)} · {entry.members} repos
                </span>
              </div>
              {entry.description && (
                <p className="text-ink-dim mt-0.5 line-clamp-2 text-xs">
                  {entry.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Index() {
  const lists = Object.values(AWESOME_LISTS);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="font-display mb-2 text-3xl font-bold tracking-tight">
        Awesome Lists with Stars
      </h1>
      <p className="text-ink-dim mb-8">
        Curated awesome lists enriched with GitHub star counts.
      </p>
      <ul className="space-y-4">
        {lists.map((list) => (
          <li key={list.slug}>
            <NavLink
              to={`/awesome/${list.owner}/${list.repo}`}
              className={({ isPending }) =>
                `border-edge bg-surface hover:border-accent/50 hover:bg-surface-2 flex items-baseline gap-2 rounded-lg border p-4 transition-colors ${
                  isPending ? "border-accent/50 bg-surface-2" : ""
                }`
              }
            >
              {({ isPending }) => (
                <>
                  <span className="text-accent font-display text-lg font-medium">
                    {list.name}
                  </span>
                  <span className="text-ink-dim font-data text-xs">
                    {list.owner}/{list.repo}
                  </span>
                  {isPending && (
                    <PendingSpinner className="ml-auto self-center" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <ExploreLists />
    </div>
  );
}
