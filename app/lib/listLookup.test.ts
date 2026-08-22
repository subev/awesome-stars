import { describe, expect, it } from "vitest";
import { buildListLookup, isReadableList, resolveList } from "./listLookup";

const lookup = buildListLookup([
  "sindresorhus/awesome",
  "kiloreux/awesome-robotics",
  "jnv/lists",
  "protontypes/open-sustainable-technology",
]);

describe("resolveList", () => {
  it("opens indexed lists that have no 'awesome' in the name", () => {
    expect(resolveList(lookup, "jnv", "lists")).toBe("jnv/lists");
    expect(
      resolveList(lookup, "protontypes", "open-sustainable-technology"),
    ).toBe("protontypes/open-sustainable-technology");
  });

  it("sends awesome-named repos that are not indexed lists to GitHub", () => {
    expect(resolveList(lookup, "max", "awesome-lint")).toBeNull();
    expect(resolveList(lookup, "criswell", "awesome-bugs")).toBeNull();
  });

  it("returns the index's casing, not the casing the README used", () => {
    // A README linking Kiloreux/... used to miss the lowercase stars asset.
    expect(resolveList(lookup, "Kiloreux", "Awesome-Robotics")).toBe(
      "kiloreux/awesome-robotics",
    );
  });

  it("treats a missing lookup as 'not a list' rather than throwing", () => {
    expect(resolveList(undefined, "jnv", "lists")).toBeNull();
  });
});

const list = (members: number, topics: string[] = []) => ({
  meta: { topics },
  members: Array.from({ length: members }, (_, i) => `owner/repo-${i}`),
});

describe("isReadableList", () => {
  it("takes any page linking enough repos, whatever its topics", () => {
    // protontypes/open-sustainable-technology carries none of our topics.
    expect(isReadableList(list(2551))).toBe(true);
    expect(isReadableList(list(10))).toBe(true);
  });

  it("rescues small lists that declare an awesome topic", () => {
    // AllThingsSmitty/css-protips: a real list, one linked repo.
    expect(isReadableList(list(1, ["css", "awesome"]))).toBe(true);
    expect(isReadableList(list(5, ["awesome-list"]))).toBe(true);
  });

  it("matches topics case-insensitively, as GitHub normalises them", () => {
    expect(isReadableList(list(3, ["Awesome-List"]))).toBe(true);
  });

  it("rejects small pages with no awesome topic", () => {
    // apache/pulsar and JonathanSalwan/Triton sit here.
    expect(isReadableList(list(9, ["rust", "consensus"]))).toBe(false);
    expect(isReadableList(list(1))).toBe(false);
  });

  it("rejects a topic-carrying page that links no repos at all", () => {
    // LeCoupa/awesome-cheatsheets is content, not repos: nothing to enrich.
    expect(isReadableList(list(0, ["awesome", "awesome-list"]))).toBe(false);
  });
});
