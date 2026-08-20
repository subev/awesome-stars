import { createRequestHandler } from "@react-router/express";
import express from "express";
import "react-router";

import { fetchReadme } from "~/lib/stars.server";
import { getRepoNames } from "~/lib/starsMarkdown";
import {
  createBudgetTracker,
  fetchRepos,
} from "~/lib/graphql.server";
import {
  createRepoIndex,
  readAllRepos,
  readListIndex,
  writeListIndex,
} from "~/lib/repoIndex.server";
import { loadHistory, mergeHistoryDate, todayDate } from "~/lib/history.server";
import { buildIndexStarsAsset } from "~/lib/starsAsset.server";

export const app = express();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Dev twin of the static /stars assets baked at build time.
app.get("/stars/:owner/:file", async (req, res) => {
  const { owner, file } = req.params;
  if (!file.endsWith(".json")) {
    res.status(404).end();
    return;
  }
  const wantsTrends = file.endsWith(".trends.json");
  const name = file.slice(0, -(wantsTrends ? ".trends.json" : ".json").length);
  const repos = await readAllRepos();
  const built = await buildIndexStarsAsset(
    owner,
    name,
    repos,
    await loadHistory(repos),
  );
  const payload = wantsTrends ? built?.trends : built?.asset;
  if (!payload) {
    res.status(404).end();
    return;
  }
  res.json(payload);
});

// In-memory lock to prevent duplicate concurrent fetches
const activeFetches = new Map<string, Promise<void>>();

app.get("/api/stars/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params;
  const cacheKey = `${owner}/${repo}`;

  if (!GITHUB_TOKEN) {
    res.status(500).json({ error: "GITHUB_TOKEN not configured" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // If another request is already fetching this repo, wait for it
  const existing = activeFetches.get(cacheKey);
  if (existing) {
    try {
      await existing;
      sendEvent("done", {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendEvent("error", { message });
    }
    res.end();
    return;
  }

  const fetchPromise = (async () => {
    sendEvent("status", { message: "Fetching README..." });

    let readme: string;
    try {
      readme = await fetchReadme(owner, repo, GITHUB_TOKEN);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch README.";
      sendEvent("error", { message });
      res.end();
      throw err;
    }

    sendEvent("status", { message: "Extracting repository links..." });

    const members = getRepoNames(readme).map((r) => `${r.owner}/${r.repo}`);
    const budget = createBudgetTracker({ maxPoints: 500, maxMinutes: 10 });
    const { repos } = await fetchRepos(members, GITHUB_TOKEN!, budget, {
      onProgress: (completed, total) =>
        sendEvent("progress", { completed, total, current: "" }),
    });

    if (repos.size === 0) {
      const message =
        "All star fetches failed — GITHUB_TOKEN may be invalid or expired.";
      sendEvent("error", { message });
      res.end();
      throw new Error(message);
    }

    const index = createRepoIndex();
    const observed: Record<string, number> = {};
    const canonical: string[] = [];
    for (const detail of repos.values()) {
      await index.upsert(detail.nameWithOwner, [
        detail.stargazerCount,
        detail.owner.databaseId ?? 0,
        detail.description ?? "",
      ]);
      observed[detail.nameWithOwner] = detail.stargazerCount;
      canonical.push(detail.nameWithOwner);
    }
    await index.flush();
    await mergeHistoryDate(todayDate(), observed);
    // Keep whatever the crawler already recorded; on-demand fetches only know
    // the membership.
    const existing = await readListIndex(owner, repo);
    await writeListIndex(owner, repo, {
      ...existing,
      meta: existing?.meta ?? {
        description: "",
        defaultBranch: "",
        topics: [],
        readmeSha: "",
      },
      members: canonical,
    });

    sendEvent("done", {});
    res.end();
  })();

  activeFetches.set(cacheKey, fetchPromise);

  try {
    await fetchPromise;
  } catch {
    // Error already sent via SSE
  } finally {
    activeFetches.delete(cacheKey);
  }
});

app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
  }),
);
