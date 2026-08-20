import { readdirSync } from "node:fs";
import type { Config } from "@react-router/dev/config";

const STATIC_BUILD = process.env.STATIC_BUILD === "1";

const trackedPaths = () => {
  const paths = ["/"];
  for (const owner of readdirSync("data/snapshots", { withFileTypes: true })) {
    if (!owner.isDirectory()) continue;
    for (const repo of readdirSync(`data/snapshots/${owner.name}`, {
      withFileTypes: true,
    })) {
      if (!repo.isDirectory()) continue;
      const hasSnapshot = readdirSync(
        `data/snapshots/${owner.name}/${repo.name}`,
      ).some((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
      if (!hasSnapshot) continue;
      paths.push(`/awesome/${owner.name}/${repo.name}`);
      paths.push(`/awesome/${owner.name}/${repo.name}/trends`);
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
