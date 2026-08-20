export type BasicRepoInfo = {
  owner: string;
  repo: string;
};

export type StarredRepo = {
  stargazers_count: number;
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
