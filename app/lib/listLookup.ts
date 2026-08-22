/**
 * Decides whether a GitHub link inside a README opens in our reader or goes out
 * to GitHub.
 *
 * Two signals, both measured properties of the page rather than guesses about
 * its name:
 *
 * 1. Member count. The crawler records every GitHub repo a README links to as
 *    `members`, so a list of 400 packages has 400 members while an ordinary
 *    project README has a handful (its own deps, a badge, a "see also"). Ten is
 *    where the crawl index separates: below it only ~54% of entries are even
 *    awesome-named, above it ~89% are.
 *
 * 2. The repository's own topics. `awesome` and `awesome-list` are declared by
 *    the author and normalised by GitHub, and the crawl gate already trusts
 *    them to decide what is worth fetching at all. They rescue lists the member
 *    count alone rejects: `AllThingsSmitty/css-protips`,
 *    `DataExpert-io/data-engineer-handbook` and 247 others are real curated
 *    lists that happen to link fewer than ten repos.
 *
 * A topic only counts alongside at least one member. The reader's whole
 * value-add is a star count and a growth badge per entry, so a page linking no
 * repos at all — `LeCoupa/awesome-cheatsheets` is content, not repos — would
 * render as a strictly worse GitHub.
 *
 * Naming is deliberately not consulted. Matching /awesome/ on the repo name
 * scored 44.8% precision against this index (see #2); it admits Font-Awesome,
 * vue-awesome and awesome_print while missing `jnv/lists` (1,437 members) and
 * `protontypes/open-sustainable-technology` (2,551), which are exactly the
 * pages our reader adds the most to.
 */
export const LIST_MEMBER_THRESHOLD = 10;

/** Topics GitHub normalises onto curated lists, as trusted by the crawl gate. */
export const LIST_TOPICS = ["awesome", "awesome-list"] as const;

/**
 * The crawl index holds every page the crawler fetched, lists and ordinary
 * project READMEs alike; this is the line between them.
 */
export const isReadableList = (list: {
  meta: { topics: string[] };
  members: string[];
}): boolean => {
  if (list.members.length >= LIST_MEMBER_THRESHOLD) return true;
  if (list.members.length === 0) return false;
  const topics = list.meta.topics.map((topic) => topic.toLowerCase());
  return LIST_TOPICS.some((topic) => topics.includes(topic));
};

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
