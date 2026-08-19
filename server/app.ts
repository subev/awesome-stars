import { createRequestHandler } from "@react-router/express";
import express from "express";
import "react-router";

import {
  fetchReadme,
  fetchStarsWithProgress,
  readCachedMarkdown,
  writeCachedMarkdown,
} from "~/lib/stars.server";
import {
  toSnapshotRepos,
  todayDate,
  writeSnapshot,
} from "~/lib/snapshots.server";

export const app = express();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// In-memory lock to prevent duplicate concurrent fetches
const activeFetches = new Map<string, Promise<string>>();

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

  const refresh = req.query.refresh === "1";
  if (!refresh) {
    const cached = await readCachedMarkdown(owner, repo);
    if (cached) {
      sendEvent("done", { markdown: cached });
      res.end();
      return;
    }
  }

  // If another request is already fetching this repo, wait for it
  const existing = activeFetches.get(cacheKey);
  if (existing) {
    try {
      const markdown = await existing;
      sendEvent("done", { markdown });
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

    const { updatedMarkdown, cache } = await fetchStarsWithProgress(
      readme,
      GITHUB_TOKEN,
      (progress) => {
        sendEvent("progress", progress);
      },
    );

    if (cache.size === 0) {
      const message =
        "All star fetches failed — GITHUB_TOKEN may be invalid or expired.";
      sendEvent("error", { message });
      res.end();
      throw new Error(message);
    }

    await writeCachedMarkdown(owner, repo, updatedMarkdown);
    await writeSnapshot(
      owner,
      repo,
      todayDate(),
      toSnapshotRepos([...cache.values()]),
    );
    sendEvent("done", { markdown: updatedMarkdown });
    res.end();
    return updatedMarkdown;
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
