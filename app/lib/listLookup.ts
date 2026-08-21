/**
 * Decides whether a GitHub link inside a README opens in our reader or goes out
 * to GitHub.
 *
 * The signal is a measured property of the page, not a guess about its name: the
 * crawler records every GitHub repo a README links to as `members`, so a list of
 * 400 packages has 400 members while an ordinary project README has a handful
 * (its own deps, a badge, a "see also"). Ten is where the crawl index separates:
 * below it only ~54% of entries are even awesome-named, above it ~89% are.
 *
 * Naming is deliberately not consulted. `jnv/lists` (1,437 members) and
 * `protontypes/open-sustainable-technology` (2,551) are exactly the pages our
 * reader adds the most to, and neither has "awesome" anywhere in the name.
 */
export const LIST_MEMBER_THRESHOLD = 10;

/** Lowercased `owner/repo` → the same name in GitHub's canonical casing. */
export type ListLookup = Map<string, string>;

export const buildListLookup = (
  canonicalNames: readonly string[],
): ListLookup =>
  new Map(canonicalNames.map((name) => [name.toLowerCase(), name]));

/**
 * READMEs link repos in whatever casing the author typed, while the index keys
 * on GitHub's canonical casing. Returning the canonical name rather than a
 * boolean fixes the route and the (case-sensitive) stars asset path together —
 * a link to `Kiloreux/awesome-robotics` resolves to the indexed
 * `kiloreux/awesome-robotics` instead of silently missing its star data.
 */
export const resolveList = (
  lookup: ListLookup | undefined,
  owner: string,
  repo: string,
): string | null => lookup?.get(`${owner}/${repo}`.toLowerCase()) ?? null;
