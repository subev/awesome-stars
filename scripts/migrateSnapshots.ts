import { promises as fs } from "fs";
import path from "path";
import type { RepoDetailsGithub } from "../app/lib/stars.server.ts";
import {
  getSnapshotPath,
  toSnapshotRepos,
  writeSnapshot,
} from "../app/lib/snapshots.server.ts";

// Legacy dumps predating the snapshot store; dates are the original fetch dates.
const LEGACY_DUMPS = [
  {
    file: "repoDetails.json",
    owner: "rockerBOO",
    repo: "awesome-neovim",
    date: "2025-10-19",
  },
  {
    file: "repoDetails-neovim.json",
    owner: "rockerBOO",
    repo: "awesome-neovim",
    date: "2026-02-10",
  },
  {
    file: "repoDetails-nodejs.json",
    owner: "sindresorhus",
    repo: "awesome-nodejs",
    date: "2026-02-10",
  },
  {
    file: "repoDetails-awesome.json",
    owner: "sindresorhus",
    repo: "awesome",
    date: "2026-02-10",
  },
];

const run = async () => {
  for (const { file, owner, repo, date } of LEGACY_DUMPS) {
    const snapshotPath = getSnapshotPath(owner, repo, date);
    try {
      await fs.access(snapshotPath);
      console.log(`Skipping ${file}: ${snapshotPath} already exists.`);
      continue;
    } catch {
      // not migrated yet
    }

    let raw: string;
    try {
      raw = await fs.readFile(path.resolve(file), "utf-8");
    } catch {
      console.warn(`Skipping ${file}: not found.`);
      continue;
    }

    const details: RepoDetailsGithub[] = JSON.parse(raw);
    const repos = toSnapshotRepos(details);
    await writeSnapshot(owner, repo, date, repos);
    console.log(`Migrated ${file} -> ${snapshotPath} (${repos.length} repos)`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
