import { promises as fs } from "fs";
import path from "path";
import { STARS_CACHE_DIR } from "../app/lib/stars.server.ts";
import {
  getSnapshotDir,
  writeSnapshot,
} from "../app/lib/snapshots.server.ts";
import type { SnapshotRepo } from "../app/lib/trends.ts";

const STARRED_LINK_REGEX =
  /⭐️ ([\d,]+) \[([^\]]+)\]\(https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)\/?(?:[/#][^)]*)?\)(?:\s*[-–—]\s*(.*))?/g;

const parseStarredMarkdown = (markdown: string): SnapshotRepo[] => {
  const byName = new Map<string, SnapshotRepo>();
  let match: RegExpExecArray | null;
  while ((match = STARRED_LINK_REGEX.exec(markdown)) !== null) {
    const [, stars, , owner, repo, description] = match;
    byName.set(`${owner}/${repo}`, {
      fullName: `${owner}/${repo}`,
      stars: Number(stars.replace(/,/g, "")),
      description: description?.trim() || null,
      htmlUrl: `https://github.com/${owner}/${repo}`,
      avatarUrl: `https://github.com/${owner}.png?size=48`,
    });
  }
  return [...byName.values()];
};

const run = async () => {
  const owners = await fs.readdir(STARS_CACHE_DIR);
  for (const owner of owners) {
    const ownerDir = path.join(STARS_CACHE_DIR, owner);
    if (!(await fs.stat(ownerDir)).isDirectory()) continue;

    for (const file of await fs.readdir(ownerDir)) {
      if (!file.endsWith(".md")) continue;
      const repo = file.replace(/\.md$/, "");

      let existing: string[] = [];
      try {
        existing = await fs.readdir(getSnapshotDir(owner, repo));
      } catch {
        // no snapshots yet
      }
      if (existing.length > 0) {
        console.log(`Skipping ${owner}/${repo}: snapshots already exist.`);
        continue;
      }

      const filePath = path.join(ownerDir, file);
      const repos = parseStarredMarkdown(await fs.readFile(filePath, "utf-8"));
      if (repos.length === 0) {
        console.log(`Skipping ${owner}/${repo}: no starred links found.`);
        continue;
      }

      const date = (await fs.stat(filePath)).mtime.toISOString().slice(0, 10);
      const snapshotPath = await writeSnapshot(owner, repo, date, repos);
      console.log(`Seeded ${snapshotPath} (${repos.length} repos)`);
    }
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
