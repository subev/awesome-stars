import PQueue from "p-queue";
import got from "got";
import { promises as fs } from "fs";
import type { AwesomeListConfig } from "../app/lists.ts";
import {
  fetchAndCacheRepoDetails,
  getDetailsCachePath,
  type RepoDetailsGithub,
} from "../app/lib/stars.server.ts";
import {
  getRepoNames,
  replaceMarkdownLinksWithStars,
} from "../app/lib/starsMarkdown.ts";
import {
  toSnapshotRepos,
  todayDate,
  writeSnapshot,
} from "../app/lib/snapshots.server.ts";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Missing GITHUB_TOKEN in .env file");
  process.exit(1);
}

export { getRepoNames, replaceMarkdownLinksWithStars };

export const fetchRepoDetails = async ({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) => {
  console.log(`Fetching details for ${owner}/${repo}`);
  const response = got(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
  });
  return response.json() as Promise<RepoDetailsGithub>;
};

export const fetchAndCacheRepoDetailsScript = async (
  { owner, repo }: { owner: string; repo: string },
  cache: Map<string, RepoDetailsGithub>,
) => {
  const cacheKey = `${owner}/${repo}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  const repoDetails = await fetchRepoDetails({ owner, repo });
  cache.set(cacheKey, repoDetails);
  return repoDetails;
};

export const main = async (
  listConfig: AwesomeListConfig,
  useCache?: boolean,
) => {
  const { owner, repo, name, readmeUrl } = listConfig;
  const cacheFile = getDetailsCachePath(owner, repo);

  console.log(`\nProcessing: ${name} (${owner}/${repo})`);

  const markdown = await got(readmeUrl).text();
  const repoInfos = getRepoNames(markdown);
  console.log(`Found ${repoInfos.length} repositories in markdown.`);

  const reposCache = new Map<string, RepoDetailsGithub>();
  const queue = new PQueue({ concurrency: 10 });

  if (useCache) {
    try {
      const cachedData = await fs.readFile(cacheFile, "utf-8");
      const cachedRepos: RepoDetailsGithub[] = JSON.parse(cachedData);
      for (const cachedRepo of cachedRepos) {
        const cacheKey = `${cachedRepo.owner.login}/${cachedRepo.name}`;
        reposCache.set(cacheKey, cachedRepo);
      }
      console.log(`Loaded ${reposCache.size} repositories from cache.`);
    } catch {
      console.warn("Failed to load cache, proceeding without it.");
    }
  } else {
    console.log("Fetching repository details from GitHub...");
  }

  const repoDetailsList = await Promise.all(
    repoInfos.map(({ owner: repoOwner, repo: repoName }) =>
      queue.add(async () => {
        try {
          return await fetchAndCacheRepoDetails(
            { owner: repoOwner, repo: repoName },
            reposCache,
            GITHUB_TOKEN!,
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`Failed to fetch ${repoOwner}/${repoName}: ${message}`);
          return null;
        }
      }),
    ),
  );

  if (repoInfos.length > 0 && reposCache.size === 0) {
    throw new Error(
      `All ${repoInfos.length} fetches failed for ${name} — check GITHUB_TOKEN. Nothing written.`,
    );
  }

  await fs.writeFile(
    cacheFile,
    JSON.stringify(repoDetailsList.filter(Boolean), null, 2),
  );
  console.log(`Repository details saved to ${cacheFile}`);

  const snapshotPath = await writeSnapshot(
    owner,
    repo,
    todayDate(),
    toSnapshotRepos([...reposCache.values()]),
  );
  console.log(`Snapshot saved to ${snapshotPath}`);
};
