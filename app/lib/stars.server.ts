import PQueue from "p-queue";
import got, { HTTPError } from "got";
import { promises as fs } from "fs";
import path from "path";

type BasicRepoInfo = {
  owner: string;
  repo: string;
};

export type RepoDetailsGithub = {
  stargazers_count: number;
  description: string | null;
  html_url: string;
  name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
};

export type ProgressEvent = {
  completed: number;
  total: number;
  current: string;
};

export const getRepoNames = (markdown: string): BasicRepoInfo[] => {
  const repoNames: BasicRepoInfo[] = [];
  const repoRegex = /https:\/\/github\.com\/([\w-.]+)\/([\w-.]+)/g;
  let match: RegExpExecArray | null;
  while ((match = repoRegex.exec(markdown)) !== null) {
    repoNames.push({ owner: match[1], repo: match[2] });
  }
  return repoNames;
};

const githubFetch = async <T>(url: string, token: string): Promise<T> => {
  const response = got(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const fetchRepoDetails = async (
  { owner, repo }: BasicRepoInfo,
  token: string,
) => {
  const repoDetails = await githubFetch<RepoDetailsGithub>(
    `https://api.github.com/repos/${owner}/${repo}`,
    token,
  );
  return repoDetails;
};

export const fetchAndCacheRepoDetails = async (
  { owner, repo }: BasicRepoInfo,
  cache: Map<string, RepoDetailsGithub>,
  token: string,
) => {
  const cacheKey = `${owner}/${repo}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  const repoDetails = await fetchRepoDetails({ owner, repo }, token);
  cache.set(cacheKey, repoDetails);
  return repoDetails;
};

export const replaceMarkdownLinksWithStars = (
  markdown: string,
  cache: Map<string, RepoDetailsGithub>,
) => {
  const repoRegex =
    /\[([^\]]+)\]\(https:\/\/github\.com\/([\w.-]+\/[\w.-]+)(?:[/#][^)]*)?\)(.*)/g;

  return markdown.replace(
    repoRegex,
    (match, linkText: string, repoSlug: string, description: string) => {
      const repoDetails = cache.get(repoSlug);

      if (repoDetails) {
        return `⭐️ ${repoDetails.stargazers_count.toLocaleString("en-US")} [${linkText}](https://github.com/${repoSlug})${description}`;
      }

      return match;
    },
  );
};

const formatRateLimitMessage = (
  headers: Record<string, string | string[] | undefined>,
) => {
  const reset = headers["x-ratelimit-reset"];
  if (reset) {
    const resetTime = new Date(Number(reset) * 1000);
    const minutesLeft = Math.max(
      1,
      Math.ceil((resetTime.getTime() - Date.now()) / 60000),
    );
    return `GitHub API rate limit exceeded. Try again in ~${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`;
  }
  return "GitHub API rate limit exceeded. Try again later.";
};

export const fetchReadme = async (
  owner: string,
  repo: string,
  token: string,
): Promise<string> => {
  try {
    const response = await got(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.raw+json",
        },
      },
    );
    return response.body;
  } catch (err) {
    if (err instanceof HTTPError) {
      if (err.response.statusCode === 401) {
        throw new Error(
          "GitHub rejected the token (401). GITHUB_TOKEN is invalid or expired — update .env and restart the server.",
        );
      }
      if (err.response.statusCode === 403) {
        throw new Error(formatRateLimitMessage(err.response.headers));
      }
      if (err.response.statusCode === 404) {
        throw new Error(
          `Repository ${owner}/${repo} not found or has no README.`,
        );
      }
      throw new Error(
        `GitHub API returned ${err.response.statusCode} for ${owner}/${repo}.`,
      );
    }
    throw new Error(`Failed to fetch README for ${owner}/${repo}.`);
  }
};

export const STARS_CACHE_DIR = path.resolve("public/stars-cache");

export const getCachePath = (owner: string, repo: string) =>
  path.join(STARS_CACHE_DIR, owner, `${repo}.md`);

export const getDetailsCachePath = (owner: string, repo: string) =>
  path.resolve(`repoDetails-${owner}-${repo}.json`);

export const readCachedMarkdown = async (
  owner: string,
  repo: string,
): Promise<string | null> => {
  try {
    return await fs.readFile(getCachePath(owner, repo), "utf-8");
  } catch {
    return null;
  }
};

export const writeCachedMarkdown = async (
  owner: string,
  repo: string,
  markdown: string,
) => {
  const cachePath = getCachePath(owner, repo);
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, markdown);
};

export const fetchStarsWithProgress = async (
  markdown: string,
  token: string,
  onProgress?: (event: ProgressEvent) => void,
): Promise<{
  updatedMarkdown: string;
  cache: Map<string, RepoDetailsGithub>;
}> => {
  const repoInfos = getRepoNames(markdown);
  const total = repoInfos.length;
  let completed = 0;

  const reposCache = new Map<string, RepoDetailsGithub>();
  const queue = new PQueue({ concurrency: 10 });

  await Promise.all(
    repoInfos.map(({ owner, repo }) =>
      queue.add(async () => {
        try {
          await fetchAndCacheRepoDetails({ owner, repo }, reposCache, token);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`⚠️ Failed to fetch ${owner}/${repo}: ${message}`);
        } finally {
          completed++;
          onProgress?.({ completed, total, current: `${owner}/${repo}` });
        }
      }),
    ),
  );

  const updatedMarkdown = replaceMarkdownLinksWithStars(markdown, reposCache);
  return { updatedMarkdown, cache: reposCache };
};
