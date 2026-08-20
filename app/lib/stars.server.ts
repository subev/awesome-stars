import got, { HTTPError } from "got";

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
