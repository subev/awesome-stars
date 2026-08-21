import { describe, expect, it } from "vitest";
import { buildListLookup, resolveList } from "./listLookup";

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
