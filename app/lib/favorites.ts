import { useEffect, useState } from "react";
import { AWESOME_LISTS } from "~/lists";

export type FavoriteList = {
  name: string;
  owner: string;
  repo: string;
};

const STORAGE_KEY = "favoriteLists";

/** Always shown at the top of the home page and never removable. */
export const PINNED_LIST = AWESOME_LISTS.awesome;

export const isPinnedList = (owner: string, repo: string) =>
  owner === PINNED_LIST.owner && repo === PINNED_LIST.repo;

export const DEFAULT_FAVORITES: FavoriteList[] = Object.values(AWESOME_LISTS)
  .filter((list) => list.slug !== "awesome")
  .map(({ name, owner, repo }) => ({ name, owner, repo }));

export function loadFavorites(): FavoriteList[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is FavoriteList =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as FavoriteList).name === "string" &&
        typeof (item as FavoriteList).owner === "string" &&
        typeof (item as FavoriteList).repo === "string",
    );
  } catch {
    return null;
  }
}

export function saveFavorites(favorites: FavoriteList[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // storage unavailable (private mode, quota) — favorites stay in-memory
  }
}

export function repoDisplayName(repo: string) {
  return repo
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function githubUrl(owner: string, repo: string) {
  return `https://github.com/${owner}/${repo}`;
}

// Favourites are shared by every hearted control on the page (home cards,
// explore rows, the list header), so keep one in-memory copy and let each
// mounted hook re-read it instead of touching localStorage on every render.
let cache: FavoriteList[] | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

function readFavorites(): FavoriteList[] {
  if (!cache) cache = loadFavorites() ?? DEFAULT_FAVORITES;
  return cache;
}

function writeFavorites(next: FavoriteList[]) {
  cache = next;
  saveFavorites(next);
  notify();
}

export function useFavorites() {
  // Starts from the defaults so the first client render matches the server one;
  // the effect swaps in whatever localStorage holds right after hydration.
  const [favorites, setFavorites] = useState<FavoriteList[]>(DEFAULT_FAVORITES);

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    sync();
    listeners.add(sync);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      cache = null;
      notify();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isFavorite = (owner: string, repo: string) =>
    isPinnedList(owner, repo) ||
    favorites.some((f) => f.owner === owner && f.repo === repo);

  const remove = (owner: string, repo: string) => {
    if (isPinnedList(owner, repo)) return;
    writeFavorites(
      favorites.filter((f) => !(f.owner === owner && f.repo === repo)),
    );
  };

  const add = (owner: string, repo: string, name?: string) => {
    if (isFavorite(owner, repo)) return;
    writeFavorites([
      ...favorites,
      { name: name ?? repoDisplayName(repo), owner, repo },
    ]);
  };

  const toggle = (owner: string, repo: string, name?: string) => {
    if (isPinnedList(owner, repo)) return;
    if (isFavorite(owner, repo)) remove(owner, repo);
    else add(owner, repo, name);
  };

  return { favorites, isFavorite, add, remove, toggle };
}
