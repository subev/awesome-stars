import { existsSync, readdirSync } from "node:fs";
import type { Config } from "@react-router/dev/config";

const STATIC_BUILD = process.env.STATIC_BUILD === "1";

const trackedPaths = () => {
  const paths = ["/"];
  for (const owner of readdirSync("public/stars-cache", {
    withFileTypes: true,
  })) {
    if (!owner.isDirectory()) continue;
    for (const file of readdirSync(`public/stars-cache/${owner.name}`)) {
      if (!file.endsWith(".md")) continue;
      const repo = file.slice(0, -3);
      paths.push(`/awesome/${owner.name}/${repo}`);
      if (existsSync(`data/snapshots/${owner.name}/${repo}`)) {
        paths.push(`/awesome/${owner.name}/${repo}/trends`);
      }
    }
  }
  return paths;
};

export default {
  ssr: !STATIC_BUILD,
  ...(STATIC_BUILD && {
    basename: "/awesome-stars/",
    prerender: trackedPaths,
  }),
} satisfies Config;
