import type { RepoBadges } from "~/components/MarkdownRenderer";

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
