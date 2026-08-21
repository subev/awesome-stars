import { describe, it, expect } from "vitest";
import { looksLikeOrg, orgToMarkdown } from "./orgToMarkdown";

describe("orgToMarkdown", () => {
  it("keeps the title and drops the other export keywords", () => {
    const org = [
      "#+TITLE:     Awesome Package Manager",
      "#+AUTHOR:    damon-kwok",
      "#+OPTIONS: toc:nil",
      "# a plain comment",
      "",
      "A list of package manager.",
    ].join("\n");
    expect(orgToMarkdown(org)).toBe(
      "# Awesome Package Manager\n\nA list of package manager.",
    );
  });

  it("converts headings by depth and strips tags", () => {
    expect(orgToMarkdown("* Top\n** Nested :noexport:")).toBe(
      "# Top\n## Nested",
    );
  });

  it("converts links, keeping image descriptions as images", () => {
    expect(orgToMarkdown("[[https://example.com][Homepage]]")).toBe(
      "[Homepage](https://example.com)",
    );
    expect(
      orgToMarkdown("[[https://github.com/vim/vim][https://img.sh/b.svg]]"),
    ).toBe("[![](https://img.sh/b.svg)](https://github.com/vim/vim)");
    expect(orgToMarkdown("[[https://imgs.xkcd.com/p.png]]")).toBe(
      "![](https://imgs.xkcd.com/p.png)",
    );
    expect(orgToMarkdown("[[*Package Managers][jump]]")).toBe(
      "[jump](#package-managers)",
    );
  });

  it("converts emphasis without touching urls", () => {
    expect(orgToMarkdown("*[[https://ziglang.org/][Zig]]* is /fast/")).toBe(
      "**[Zig](https://ziglang.org/)** is *fast*",
    );
    expect(orgToMarkdown("run =npm i= or ~yarn~")).toBe(
      "run `npm i` or `yarn`",
    );
  });

  it("gives a table one GFM delimiter and folds grouping rules into rows", () => {
    const org = [
      "| Language | Installer |",
      "|----------+-----------|",
      "| Bash     | Built-in  |",
      "|----------+-----------|",
      "| *Lisp*   | Activity  |",
      "|----------+-----------|",
      "| Ada      | [[https://adacore.com][GANT]] |",
    ].join("\n");
    expect(orgToMarkdown(org)).toBe(
      [
        "| Language | Installer |",
        "| --- | --- |",
        "| Bash | Built-in |",
        "| **Lisp** | Activity |",
        "| Ada | [GANT](https://adacore.com) |",
      ].join("\n"),
    );
  });

  it("leaves a lone slash cell literal instead of opening emphasis", () => {
    const org = "| Name | Installer |\n|------+-----------|\n| Xcode | / |";
    expect(orgToMarkdown(org)).toBe(
      "| Name | Installer |\n| --- | --- |\n| Xcode | / |",
    );
  });

  it("adds a header row to a table that has no rule", () => {
    expect(orgToMarkdown("| a | b |\n| c | d |")).toBe(
      "| a | b |\n| --- | --- |\n| c | d |",
    );
  });

  it("fences source blocks and unwraps quotes", () => {
    expect(orgToMarkdown("#+BEGIN_SRC sh\nnpm i -g bpkg\n#+END_SRC")).toBe(
      "```sh\nnpm i -g bpkg\n```",
    );
    expect(orgToMarkdown("#+BEGIN_QUOTE\nA *good* list.\n#+END_QUOTE")).toBe(
      "> A **good** list.",
    );
  });

  it("normalizes list syntax org allows but markdown does not", () => {
    expect(orgToMarkdown("1) first\n2) second")).toBe("1. first\n2. second");
    expect(orgToMarkdown("- bpkg :: a bash package manager")).toBe(
      "- **bpkg** — a bash package manager",
    );
  });

  it("drops property drawers", () => {
    expect(orgToMarkdown(":PROPERTIES:\n:ID: 42\n:END:\ntext")).toBe("text");
  });
});

describe("looksLikeOrg", () => {
  it("recognizes org by its keyword lines", () => {
    expect(looksLikeOrg("#+TITLE: Awesome\n\n** Section")).toBe(true);
    expect(looksLikeOrg("#+BEGIN_SRC sh\nls\n#+END_SRC")).toBe(true);
  });

  it("recognizes org tables and link syntax", () => {
    expect(looksLikeOrg("| a | b |\n|---+---|\n| c | d |")).toBe(true);
    expect(looksLikeOrg("* Section\n[[https://example.com][Example]]")).toBe(
      true,
    );
  });

  it("leaves markdown alone", () => {
    expect(
      looksLikeOrg("# Awesome CS Courses\n\n- [MIT](https://mit.edu)"),
    ).toBe(false);
    expect(
      looksLikeOrg("Bullets\n\n* one\n* two\n\n[link](https://example.com)"),
    ).toBe(false);
    expect(looksLikeOrg("| a | b |\n| --- | --- |\n| c | d |")).toBe(false);
  });
});
