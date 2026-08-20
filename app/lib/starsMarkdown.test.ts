import { describe, it, expect } from "vitest";
import { getRepoNames, replaceMarkdownLinksWithStars } from "./starsMarkdown";

describe("getRepoNames", () => {
  it("rejects reserved github paths that are not repos", () => {
    const markdown = `
      [a](https://github.com/sponsors/sindresorhus)
      [b](https://github.com/topics/awesome)
      [c](https://github.com/orgs/nodejs/people)
      [d](https://github.com/apps/dependabot)
      [e](https://github.com/avelino/awesome-go)
    `;
    expect(getRepoNames(markdown)).toEqual([
      { owner: "avelino", repo: "awesome-go" },
    ]);
  });

  it("collapses deep links to their repo", () => {
    const names = getRepoNames(
      "https://github.com/sindresorhus/awesome/blob/main/readme.md",
    );
    expect(names).toEqual([{ owner: "sindresorhus", repo: "awesome" }]);
  });

  it("dedupes case-insensitively, keeping first-seen casing", () => {
    const names = getRepoNames(
      "https://github.com/Foo/Bar https://github.com/foo/bar",
    );
    expect(names).toEqual([{ owner: "Foo", repo: "Bar" }]);
  });

  it("extracts multiple repos and ignores non-GitHub links", () => {
    const markdown = `
      - [one](https://github.com/owner1/repo1)
      - [gitlab](https://gitlab.com/owner/repo)
      - [two](https://github.com/owner2/repo2)
      - [docs](https://example.com/owner/repo)
    `;
    expect(getRepoNames(markdown)).toEqual([
      { owner: "owner1", repo: "repo1" },
      { owner: "owner2", repo: "repo2" },
    ]);
  });

  it("handles dots and dashes in repo names", () => {
    expect(getRepoNames("https://github.com/nvim-mini/mini.nvim")).toEqual([
      { owner: "nvim-mini", repo: "mini.nvim" },
    ]);
    expect(
      getRepoNames("https://github.com/some-owner/some-long-repo-name"),
    ).toEqual([{ owner: "some-owner", repo: "some-long-repo-name" }]);
  });

  it("strips .git and trailing punctuation", () => {
    expect(getRepoNames("https://github.com/foo/bar.git")).toEqual([
      { owner: "foo", repo: "bar" },
    ]);
    expect(getRepoNames("see https://github.com/foo/baz.")).toEqual([
      { owner: "foo", repo: "baz" },
    ]);
  });
});

describe("replaceMarkdownLinksWithStars", () => {
  it("prefixes matched links with star counts", () => {
    const cache = new Map([["foo/bar", { stargazers_count: 1234 }]]);
    const out = replaceMarkdownLinksWithStars(
      "- [bar](https://github.com/foo/bar) - Does things.",
      cache,
    );
    expect(out).toBe(
      "- ⭐️ 1,234 [bar](https://github.com/foo/bar) - Does things.",
    );
  });

  it("handles URLs with a #fragment", () => {
    const cache = new Map([["foo/bar", { stargazers_count: 42 }]]);
    expect(
      replaceMarkdownLinksWithStars(
        "- [bar](https://github.com/foo/bar#readme) - Thing.",
        cache,
      ),
    ).toBe("- ⭐️ 42 [bar](https://github.com/foo/bar) - Thing.");
  });

  it("matches repo names containing dots or dashes", () => {
    const cache = new Map([["nvim-mini/mini.nvim", { stargazers_count: 5000 }]]);
    expect(
      replaceMarkdownLinksWithStars(
        "- [mini](https://github.com/nvim-mini/mini.nvim) - Plugins.",
        cache,
      ),
    ).toBe(
      "- ⭐️ 5,000 [mini](https://github.com/nvim-mini/mini.nvim) - Plugins.",
    );
  });

  it("leaves unknown repos untouched", () => {
    const out = replaceMarkdownLinksWithStars(
      "- [bar](https://github.com/foo/bar) - Does things.",
      new Map(),
    );
    expect(out).toBe("- [bar](https://github.com/foo/bar) - Does things.");
  });
});
