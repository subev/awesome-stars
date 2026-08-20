import type { Config } from "@react-router/dev/config";
import { AWESOME_LISTS } from "./app/lists.ts";

const STATIC_BUILD = process.env.STATIC_BUILD === "1";

// Only the featured shelf is prerendered; every other list renders client-side
// through the SPA fallback, so build time stays flat as the crawl grows.
const featuredPaths = () => [
  "/",
  ...Object.values(AWESOME_LISTS).flatMap(({ owner, repo }) => [
    `/awesome/${owner}/${repo}`,
    `/awesome/${owner}/${repo}/trends`,
  ]),
];

export default {
  ssr: !STATIC_BUILD,
  ...(STATIC_BUILD && {
    basename: "/awesome-stars/",
    prerender: featuredPaths,
  }),
} satisfies Config;
