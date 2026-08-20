import {
  fetchReadme,
  fetchStarsWithProgress,
} from "../app/lib/stars.server.ts";
import {
  todayDate,
  toSnapshotRepos,
  writeSnapshot,
} from "../app/lib/snapshots.server.ts";

const [owner, repo] = process.argv.slice(2);
if (!owner || !repo) {
  console.error("Usage: refresh-list.ts <owner> <repo>");
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("❌ GITHUB_TOKEN is required");
  process.exit(1);
}

const run = async () => {
  console.log(`Fetching README for ${owner}/${repo}...`);
  const readme = await fetchReadme(owner, repo, token);

  const { cache } = await fetchStarsWithProgress(
    readme,
    token,
    ({ completed, total }) => {
      if (completed % 100 === 0 || completed === total) {
        console.log(`  ${completed}/${total}`);
      }
    },
  );

  if (cache.size === 0) {
    throw new Error(
      "All star fetches failed — GITHUB_TOKEN may be invalid or rate limited.",
    );
  }

  await writeSnapshot(
    owner,
    repo,
    todayDate(),
    toSnapshotRepos([...cache.values()]),
  );
  console.log(`✅ ${owner}/${repo}: ${cache.size} repos snapshotted`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
