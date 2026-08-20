import { describe, it, expect } from "vitest";
import {
  computeTrends,
  monthsBetween,
  MIN_WINDOW_DAYS,
  type Snapshot,
} from "./trends";

const repo = (fullName: string, stars: number) => ({
  fullName,
  stars,
  description: null,
  htmlUrl: `https://github.com/${fullName}`,
  avatarUrl: "x",
});

describe("monthsBetween", () => {
  it("returns ~1 for a month apart", () => {
    expect(monthsBetween("2026-01-01", "2026-02-01")).toBeCloseTo(1, 0);
  });

  it("returns ~6 for half a year", () => {
    expect(monthsBetween("2025-10-19", "2026-04-19")).toBeCloseTo(6, 0);
  });
});

describe("computeTrends", () => {
  const snapshots: Snapshot[] = [
    {
      date: "2025-10-19",
      repos: [repo("a/one", 100), repo("b/two", 1000), repo("c/gone", 50)],
    },
    {
      date: "2026-02-10",
      repos: [repo("a/one", 150), repo("b/two", 1100)],
    },
    {
      date: "2026-08-19",
      repos: [repo("a/one", 200), repo("b/two", 1200), repo("d/fresh", 30)],
    },
  ];

  it("computes deltas over each repo's full window", () => {
    const { repos } = computeTrends(snapshots);
    const one = repos.find((r) => r.fullName === "a/one")!;
    expect(one.firstStars).toBe(100);
    expect(one.lastStars).toBe(200);
    expect(one.delta).toBe(100);
    expect(one.series).toEqual([100, 150, 200]);
    expect(one.addedAt).toBe("2025-10-19");
    expect(one.isNew).toBe(false);
  });

  it("normalizes growth per month", () => {
    const { repos } = computeTrends(snapshots);
    const one = repos.find((r) => r.fullName === "a/one")!;
    const months = monthsBetween("2025-10-19", "2026-08-19");
    expect(one.pctPerMonth).toBeCloseTo(100 / months, 5);
  });

  it("flags repos first seen in the latest snapshot as new", () => {
    const { repos, summary } = computeTrends(snapshots);
    const fresh = repos.find((r) => r.fullName === "d/fresh")!;
    expect(fresh.isNew).toBe(true);
    expect(fresh.pctPerMonth).toBeNull();
    expect(fresh.delta).toBe(0);
    expect(summary.newCount).toBe(1);
  });

  it("tracks repos dropped from the list", () => {
    const { removed, summary } = computeTrends(snapshots);
    expect(removed).toEqual([
      { fullName: "c/gone", lastSeen: "2025-10-19", stars: 50 },
    ]);
    expect(summary.removedCount).toBe(1);
  });

  it("leaves gaps in the series for missing snapshots", () => {
    const withGap: Snapshot[] = [
      { date: "2025-10-19", repos: [repo("a/one", 100)] },
      { date: "2026-02-10", repos: [] },
      { date: "2026-08-19", repos: [repo("a/one", 200)] },
    ];
    const { repos } = computeTrends(withGap);
    expect(repos[0].series).toEqual([100, null, 200]);
  });

  it("handles a single snapshot without trends", () => {
    const { repos, summary } = computeTrends([snapshots[0]]);
    const one = repos.find((r) => r.fullName === "a/one")!;
    expect(one.delta).toBe(0);
    expect(one.pctPerMonth).toBeNull();
    expect(one.isNew).toBe(false);
    expect(summary.newCount).toBe(0);
  });

  it("sorts snapshots by date regardless of input order", () => {
    const { dates, repos } = computeTrends([...snapshots].reverse());
    expect(dates).toEqual(["2025-10-19", "2026-02-10", "2026-08-19"]);
    expect(repos.find((r) => r.fullName === "a/one")!.series).toEqual([
      100, 150, 200,
    ]);
  });
});

describe("minimum observation window", () => {
  const twoDayWindow: Snapshot[] = [
    { date: "2026-08-18", repos: [repo("a/one", 2579), repo("b/two", 100)] },
    { date: "2026-08-20", repos: [repo("a/one", 2597), repo("b/two", 100)] },
  ];

  it("suppresses the percentage when the window is too short", () => {
    const { repos } = computeTrends(twoDayWindow);
    const one = repos.find((r) => r.fullName === "a/one")!;
    expect(one.delta).toBe(18);
    expect(one.pctPerMonth).toBeNull();
  });

  it("reports a percentage once the window is long enough", () => {
    const dates = ["2026-06-01", "2026-08-20"];
    const { repos } = computeTrends([
      { date: dates[0], repos: [repo("a/one", 1000)] },
      { date: dates[1], repos: [repo("a/one", 1100)] },
    ]);
    const one = repos.find((r) => r.fullName === "a/one")!;
    expect(monthsBetween(dates[0], dates[1]) * 30.44).toBeGreaterThan(
      MIN_WINDOW_DAYS,
    );
    expect(one.pctPerMonth).toBeCloseTo(
      (100 / 1000 / monthsBetween(dates[0], dates[1])) * 100,
      6,
    );
  });
});
