import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  fetchAndCacheRepoDetails,
  fetchRepoDetails,
  getRepoNames,
  main,
  replaceMarkdownLinksWithStars,
} from "./updateStargazers";

describe("getRepoNames", () => {
  it("extracts single GitHub repo from markdown", () => {
    const markdown = `
      Check out [React](https://github.com/facebook/react)!
    `;
    const result = getRepoNames(markdown);
    expect(result).toEqual([{ owner: "facebook", repo: "react" }]);
  });

  it("handles repos with dots in names", () => {
    const markdown = `
    - [dot-repo](https://github.com/foo.bar/my.repo)
  `;
    const result = getRepoNames(markdown);
    expect(result).toEqual([{ owner: "foo.bar", repo: "my.repo" }]);
  });

  it("extracts multiple GitHub repos", () => {
    const markdown = `
      - [React](https://github.com/facebook/react)
      - [Vue](https://github.com/vuejs/vue)
    `;
    const result = getRepoNames(markdown);
    expect(result).toEqual([
      { owner: "facebook", repo: "react" },
      { owner: "vuejs", repo: "vue" },
    ]);
  });

  it("ignores non-GitHub links", () => {
    const markdown = `
      Here is a random link: https://example.com/foo/bar
    `;
    const result = getRepoNames(markdown);
    expect(result).toEqual([]);
  });

  it("handles repos with dashes in names", () => {
    const markdown = `
      - [awesome-neovim](https://github.com/rockerBOO/awesome-neovim)
    `;
    const result = getRepoNames(markdown);
    expect(result).toEqual([{ owner: "rockerBOO", repo: "awesome-neovim" }]);
  });
});

// Mock "got"
vi.mock("got", () => {
  return {
    default: vi.fn(() => ({
      json: vi.fn(),
      text: vi.fn(),
    })),
  };
});

import got from "got";

const mockGot = got as unknown as Mock;

describe("GitHub utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchRepoDetails calls GitHub API and returns data", async () => {
    const fakeData = {
      stargazers_count: 123,
      description: "A fake repo",
      html_url: "https://github.com/test/repo",
      name: "repo",
      owner: { login: "test", avatar_url: "x", html_url: "y" },
    };

    // Setup got mock
    mockGot.mockImplementationOnce(() => ({
      json: async () => fakeData,
    }));

    const result = await fetchRepoDetails({
      owner: "test",
      repo: "repo",
    });

    expect(result).toEqual(fakeData);
    expect(mockGot).toHaveBeenCalledWith(
      "https://api.github.com/repos/test/repo",
      expect.objectContaining({
        headers: expect.any(Object),
      }),
    );
  });

  it("fetchAndCacheRepoDetails caches results", async () => {
    const fakeData = {
      stargazers_count: 42,
      description: "cached repo",
      html_url: "https://github.com/foo/bar",
      name: "bar",
      owner: { login: "foo", avatar_url: "a", html_url: "b" },
    };

    mockGot.mockImplementation(() => ({
      json: async () => fakeData,
    }));

    const cache = new Map();

    const first = await fetchAndCacheRepoDetails(
      { owner: "foo", repo: "bar" },
      cache,
    );
    const second = await fetchAndCacheRepoDetails(
      { owner: "foo", repo: "bar" },
      cache,
    );

    // Should match fake data
    expect(first).toEqual(fakeData);
    expect(second).toEqual(fakeData);

    // Got should be called only once due to caching
    expect(mockGot).toHaveBeenCalledTimes(1);
  });
});

describe("main()", () => {
  vi.mock("fs", () => {
    return {
      promises: {
        writeFile: vi.fn(async () => {}),
        readFile: vi.fn(async () => {
          throw new Error("no cache");
        }),
      },
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testListConfig = {
    name: "Test List",
    slug: "test",
    readmeUrl: "https://example.com/README.md",
  };

  it("respects concurrency limit (10 at a time)", async () => {
    // Fake markdown with 25 repos
    const fakeMarkdown = Array.from(
      { length: 25 },
      (_, i) => `https://github.com/owner/repo${i}`,
    ).join("\n");

    // Track active calls
    let active = 0;
    let maxActive = 0;

    // First call is for the markdown file
    mockGot.mockImplementationOnce(() => ({
      text: async () => fakeMarkdown,
    }));

    // Subsequent calls are for repos
    mockGot.mockImplementation(() => {
      active++;
      maxActive = Math.max(maxActive, active);

      return {
        json: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50)); // simulate delay
          active--;
          return {
            stargazers_count: 1,
            description: "repo",
            html_url: "https://github.com/owner/repo",
            name: "repo",
            owner: { login: "owner", avatar_url: "x", html_url: "y" },
          };
        },
      };
    });

    await main(testListConfig);

    // Ensure we never exceeded concurrency of 10
    expect(maxActive).toBeLessThanOrEqual(10);
  });
});

describe("replaceMarkdownLinksWithStars", () => {
  it("adds stars to markdown links if cache has the repo", () => {
    const markdown = `
- [foo/bar](https://github.com/foo/bar)
- [baz/qux](https://github.com/baz/qux)
`;

    const cache = new Map();
    cache.set("foo/bar", { stargazers_count: 42 });

    const result = replaceMarkdownLinksWithStars(markdown, cache);

    expect(result).toContain("- ⭐️ 42 [foo/bar](https://github.com/foo/bar)");
    // Uncached repo stays unchanged
    expect(result).toContain("- [baz/qux](https://github.com/baz/qux)");
  });

  it("formats star counts with thousands separator", () => {
    const markdown = "- [big/repo](https://github.com/big/repo)";
    const cache = new Map();
    cache.set("big/repo", { stargazers_count: 19010 });

    const result = replaceMarkdownLinksWithStars(markdown, cache);
    expect(result).toContain("⭐️ 19,010");
  });

  it("does nothing if cache is empty", () => {
    const markdown = "- [foo/bar](https://github.com/foo/bar)";
    const cache = new Map();

    const result = replaceMarkdownLinksWithStars(markdown, cache);
    expect(result).toBe(markdown);
  });

  it("handles URLs with #fragment (e.g. #readme)", () => {
    const markdown =
      "- [Node.js](https://github.com/sindresorhus/awesome-nodejs#readme) - Runtime.";
    const cache = new Map();
    cache.set("sindresorhus/awesome-nodejs", { stargazers_count: 64900 });

    const result = replaceMarkdownLinksWithStars(markdown, cache);
    expect(result).toContain("⭐️ 64,900");
    expect(result).toContain("[Node.js]");
  });

  it("works with repo names containing dots or dashes", () => {
    const markdown = "- [foo.bar/baz-qux](https://github.com/foo.bar/baz-qux)";
    const cache = new Map();
    cache.set("foo.bar/baz-qux", { stargazers_count: 7 });

    const result = replaceMarkdownLinksWithStars(markdown, cache);
    expect(result).toContain("⭐️ 7");
  });
});
