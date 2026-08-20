import type { RepoBadges } from "~/components/MarkdownRenderer";

export type StarsAsset = {
  date: string;
  stars: Record<string, number>;
  badges: RepoBadges;
};

export const starsAssetUrl = (owner: string, repo: string) =>
  `${import.meta.env.BASE_URL}stars/${owner}/${repo}.json`;
