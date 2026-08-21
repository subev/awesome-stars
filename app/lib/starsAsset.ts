import type { RepoBadges } from "~/components/MarkdownRenderer";
import { buildListLookup, type ListLookup } from "./listLookup";

export type StarsAsset = {
  date: string;
  stars: Record<string, number>;
  badges: RepoBadges;
};

export type ListDirectoryEntry = {
  owner: string;
  repo: string;
  stars: number;
  members: number;
  description: string;
  tracked: boolean;
};

export const starsAssetUrl = (owner: string, repo: string) =>
  `${import.meta.env.BASE_URL}stars/${owner}/${repo}.json`;

export const trendsAssetUrl = (owner: string, repo: string) =>
  `${import.meta.env.BASE_URL}stars/${owner}/${repo}.trends.json`;

export const listDirectoryUrl = () =>
  `${import.meta.env.BASE_URL}stars/lists.json`;

export const listLookupUrl = () =>
  `${import.meta.env.BASE_URL}stars/list-lookup.json`;

// Every list page needs the same lookup, so fetch it once per document. On
// failure the map is empty and links fall back to GitHub, which is the same
// behaviour as an unindexed repo rather than a broken page.
let lookupPromise: Promise<ListLookup> | null = null;

export const loadListLookup = (): Promise<ListLookup> => {
  lookupPromise ??= fetch(listLookupUrl())
    .then((res) => (res.ok ? (res.json() as Promise<string[]>) : []))
    .then(buildListLookup)
    .catch(() => buildListLookup([]));
  return lookupPromise;
};
