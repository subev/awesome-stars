import { useState, useEffect } from "react";
import { useLoaderData } from "react-router";
import {
  MarkdownRenderer,
  type RepoBadges,
} from "~/components/MarkdownRenderer";
import { readCachedMarkdown } from "~/lib/stars.server";
import { readSnapshots } from "~/lib/snapshots.server";
import { computeTrends } from "~/lib/trends";
import type { Route } from "./+types/awesome.$owner.$repo";

type LoaderData =
  | {
      status: "ready";
      markdown: string;
      owner: string;
      repo: string;
      badges: RepoBadges;
    }
  | { status: "loading"; owner: string; repo: string };

async function computeBadges(owner: string, repo: string): Promise<RepoBadges> {
  const snapshots = await readSnapshots(owner, repo);
  if (snapshots.length < 2) return {};

  const { repos } = computeTrends(snapshots);
  const badges: RepoBadges = {};
  for (const r of repos) {
    if (r.isNew || (r.pctPerMonth !== null && Math.abs(r.pctPerMonth) >= 0.05)) {
      badges[r.fullName.toLowerCase()] = {
        pct: r.pctPerMonth,
        delta: r.delta,
        since: r.addedAt,
        isNew: r.isNew,
      };
    }
  }
  return badges;
}

export async function loader({
  params,
}: Route.LoaderArgs): Promise<LoaderData> {
  const { owner, repo } = params;
  const cached = await readCachedMarkdown(owner, repo);

  if (cached) {
    return {
      status: "ready",
      markdown: cached,
      owner,
      repo,
      badges: await computeBadges(owner, repo),
    };
  }

  return { status: "loading", owner, repo };
}

type ProgressState = {
  completed: number;
  total: number;
  current: string;
};

function LoadingProgress({
  owner,
  repo,
  refresh,
}: {
  owner: string;
  repo: string;
  refresh?: boolean;
}) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [statusMessage, setStatusMessage] = useState("Connecting...");
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/stars/${owner}/${repo}${refresh ? "?refresh=1" : ""}`,
    );

    eventSource.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      setStatusMessage(data.message);
    });

    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setProgress(data);
      setStatusMessage(`Fetching stars... ${data.completed}/${data.total}`);
    });

    eventSource.addEventListener("done", (e) => {
      eventSource.close();
      if (refresh) {
        window.location.reload();
        return;
      }
      const data = JSON.parse(e.data);
      setMarkdown(data.markdown);
    });

    eventSource.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        const data = JSON.parse(e.data);
        setError(data.message);
      } else {
        setError("Connection lost");
      }
      eventSource.close();
    });

    return () => eventSource.close();
  }, [owner, repo, refresh]);

  if (markdown) {
    return (
      <MarkdownRenderer
        markdown={markdown}
        title={`${owner}/${repo}`}
        trendsHref={`/awesome/${owner}/${repo}/trends`}
      />
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="mb-4">
          <a href="/" className="text-ink-dim hover:text-ink text-sm">
            &larr; All lists
          </a>
        </div>
        <div className="border-down/30 bg-down/10 rounded-lg border p-6">
          <h2 className="text-down font-display mb-2 text-lg font-semibold">Error</h2>
          <p className="text-down/90">{error}</p>
        </div>
      </div>
    );
  }

  const percentage =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-4">
        <a href="/" className="text-ink-dim hover:text-ink text-sm">
          &larr; All lists
        </a>
      </div>
      <div className="border-edge bg-surface rounded-lg border p-6">
        <h2 className="font-display mb-4 text-lg font-semibold">
          Loading {owner}/{repo}
        </h2>
        {progress ? (
          <>
            <p className="text-ink-dim mb-3 text-sm">
              {progress.completed}/{progress.total} repo details retrieved
            </p>
            <div className="bg-surface-2 mb-2 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-accent h-full rounded-full transition-all duration-200"
                style={{ width: `${percentage}%` }}
              />
            </div>
            {progress.current && (
              <p className="text-ink-dim/80 font-data mt-1 truncate text-xs">
                {progress.current}
              </p>
            )}
          </>
        ) : (
          <p className="text-ink-dim text-sm">{statusMessage}</p>
        )}
      </div>
    </div>
  );
}

export default function DynamicAwesomeList() {
  const data = useLoaderData<typeof loader>();
  const [refreshing, setRefreshing] = useState(false);

  if (refreshing) {
    return <LoadingProgress owner={data.owner} repo={data.repo} refresh />;
  }

  if (data.status === "ready") {
    return (
      <MarkdownRenderer
        markdown={data.markdown}
        title={`${data.owner}/${data.repo}`}
        trendsHref={`/awesome/${data.owner}/${data.repo}/trends`}
        badges={data.badges}
        onRefresh={() => setRefreshing(true)}
      />
    );
  }

  return <LoadingProgress owner={data.owner} repo={data.repo} />;
}
