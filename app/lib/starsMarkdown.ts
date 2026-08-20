export type BasicRepoInfo = {
  owner: string;
  repo: string;
};

export type StarredRepo = {
  stargazers_count: number;
};

// github.com/<first>/<second> is only a repo when <first> is a real account.
const RESERVED_OWNERS = new Set([
  "about",
  "apps",
  "collections",
  "enterprise",
  "events",
  "features",
  "login",
  "marketplace",
  "orgs",
  "pricing",
  "readme",
  "search",
  "security",
  "sponsors",
  "topics",
  "trending",
  "users",
]);

export const getRepoNames = (markdown: string): BasicRepoInfo[] => {
  const repoNames: BasicRepoInfo[] = [];
  const repoRegex = /https:\/\/github\.com\/([\w-.]+)\/([\w-.]+)/g;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = repoRegex.exec(markdown)) !== null) {
    const owner = match[1];
    if (RESERVED_OWNERS.has(owner.toLowerCase())) continue;
    const repo = match[2].replace(/\.git$/, "").replace(/\.+$/, "");
    if (!repo || repo === "." || repo === "..") continue;
    const key = `${owner}/${repo}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    repoNames.push({ owner, repo });
  }
  return repoNames;
};

export const replaceMarkdownLinksWithStars = (
  markdown: string,
  cache: Map<string, StarredRepo>,
) => {
  const repoRegex =
    /\[([^\]]+)\]\(https:\/\/github\.com\/([\w.-]+\/[\w.-]+)(?:[/#][^)]*)?\)(.*)/g;

  return markdown.replace(
    repoRegex,
    (match, linkText: string, repoSlug: string, description: string) => {
      const repoDetails =
        cache.get(repoSlug) ?? cache.get(repoSlug.toLowerCase());

      if (repoDetails) {
        return `⭐️ ${repoDetails.stargazers_count.toLocaleString("en-US")} [${linkText}](https://github.com/${repoSlug})${description}`;
      }

      return match;
    },
  );
};
