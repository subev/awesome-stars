import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router";
import { AWESOME_LISTS } from "~/lists";
import {
  DEFAULT_FAVORITES,
  loadFavorites,
  repoDisplayName,
  saveFavorites,
  type FavoriteList,
} from "~/lib/favorites";
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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

const compactStars = (stars: number) =>
  stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars);

function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteList[]>(DEFAULT_FAVORITES);

  useEffect(() => {
    const stored = loadFavorites();
    if (stored) setFavorites(stored);
  }, []);

  const update = (next: FavoriteList[]) => {
    setFavorites(next);
    saveFavorites(next);
  };

  const isFavorite = (owner: string, repo: string) =>
    favorites.some((f) => f.owner === owner && f.repo === repo);

  const remove = (owner: string, repo: string) =>
    update(favorites.filter((f) => !(f.owner === owner && f.repo === repo)));

  const toggle = (owner: string, repo: string) => {
    if (isFavorite(owner, repo)) {
      remove(owner, repo);
    } else {
      update([...favorites, { name: repoDisplayName(repo), owner, repo }]);
    }
  };

  return { favorites, isFavorite, remove, toggle };
}

function ListCard({
  name,
  owner,
  repo,
  onRemove,
}: {
  name: string;
  owner: string;
  repo: string;
  onRemove?: () => void;
}) {
  return (
    <li className="relative">
      <NavLink
        to={`/awesome/${owner}/${repo}`}
        className={({ isPending }) =>
          `border-edge bg-surface hover:border-accent/50 hover:bg-surface-2 flex items-baseline gap-2 rounded-lg border p-4 transition-colors ${
            onRemove ? "pr-12" : ""
          } ${isPending ? "border-accent/50 bg-surface-2" : ""}`
        }
      >
        {({ isPending }) => (
          <>
            <span className="text-accent font-display text-lg font-medium">
              {name}
            </span>
            <span className="text-ink-dim font-data text-xs">
              {owner}/{repo}
            </span>
            {isPending && <PendingSpinner className="ml-auto self-center" />}
          </>
        )}
      </NavLink>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${name} from favourites`}
          onClick={onRemove}
          className="text-ink-dim hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 rounded p-1.5 text-lg leading-none transition-colors"
        >
          ×
        </button>
      )}
    </li>
  );
}

// The directory is a few hundred KB, so it loads on first interaction only.
function ExploreLists({
  isFavorite,
  onToggleFavorite,
}: {
  isFavorite: (owner: string, repo: string) => boolean;
  onToggleFavorite: (owner: string, repo: string) => void;
}) {
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
          {matches.map((entry) => {
            const favorited = isFavorite(entry.owner, entry.repo);
            return (
              <li key={`${entry.owner}/${entry.repo}`} className="p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <NavLink
                    to={`/awesome/${entry.owner}/${entry.repo}`}
                    className="text-accent min-w-0 truncate font-medium hover:underline"
                  >
                    {entry.owner}/{entry.repo}
                  </NavLink>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-ink-dim font-data text-xs">
                      ⭐️ {compactStars(entry.stars)} · {entry.members} repos
                    </span>
                    <button
                      type="button"
                      aria-label={
                        favorited
                          ? `Remove ${entry.owner}/${entry.repo} from favourites`
                          : `Add ${entry.owner}/${entry.repo} to favourites`
                      }
                      onClick={() => onToggleFavorite(entry.owner, entry.repo)}
                      className={`rounded p-1 transition-colors ${
                        favorited
                          ? "text-accent"
                          : "text-ink-dim hover:text-accent"
                      }`}
                    >
                      <HeartIcon filled={favorited} />
                    </button>
                  </span>
                </div>
                {entry.description && (
                  <p className="text-ink-dim mt-0.5 line-clamp-2 text-xs">
                    {entry.description}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Index() {
  const home = AWESOME_LISTS.awesome;
  const { favorites, isFavorite, remove, toggle } = useFavorites();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="font-display mb-2 text-3xl font-bold tracking-tight">
        Awesome Lists with Stars
      </h1>
      <p className="text-ink-dim mb-8">
        Curated awesome lists enriched with GitHub star counts.
      </p>
      <ul className="space-y-4">
        <ListCard name={home.name} owner={home.owner} repo={home.repo} />
        {favorites.map((list) => (
          <ListCard
            key={`${list.owner}/${list.repo}`}
            name={list.name}
            owner={list.owner}
            repo={list.repo}
            onRemove={() => remove(list.owner, list.repo)}
          />
        ))}
      </ul>

      <ExploreLists
        isFavorite={(owner, repo) =>
          (owner === home.owner && repo === home.repo) || isFavorite(owner, repo)
        }
        onToggleFavorite={(owner, repo) => {
          if (owner === home.owner && repo === home.repo) return;
          toggle(owner, repo);
        }}
      />
    </div>
  );
}
