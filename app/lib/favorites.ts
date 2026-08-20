import { AWESOME_LISTS } from "~/lists";

export type FavoriteList = {
  name: string;
  owner: string;
  repo: string;
};

const STORAGE_KEY = "favoriteLists";

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
