import { useState, useEffect } from "react";
import { Link, data, isRouteErrorResponse, useLoaderData } from "react-router";
import {
  MarkdownRenderer,
} from "~/components/MarkdownRenderer";
import { replaceMarkdownLinksWithStars } from "~/lib/starsMarkdown";
import { starsAssetUrl, type StarsAsset } from "~/lib/starsAsset";
import type { Route } from "./+types/awesome.$owner.$repo";

const STATIC_BUILD = import.meta.env.VITE_STATIC_BUILD === "1";

const fetchStarsAsset = async (
  owner: string,
  repo: string,
): Promise<StarsAsset | null> => {
  try {
    const res = await fetch(starsAssetUrl(owner, repo));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const fetchLiveReadme = async (owner: string, repo: string) => {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    { headers: { Accept: "application/vnd.github.raw+json" } },
  );
  if (res.status === 404) {
    throw data(`Repository ${owner}/${repo} not found or has no README.`, {
      status: 404,
    });
  }
  if (res.status === 403 || res.status === 429) {
    throw new Error(
      "GitHub API rate limit reached — try again in a few minutes.",
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub returned ${res.status} for ${owner}/${repo}.`);
  }
  return res.text();
};

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { owner, repo } = params;
  const [asset, readme] = await Promise.all([
    fetchStarsAsset(owner, repo),
    fetchLiveReadme(owner, repo),
  ]);

  const starMap = new Map(
    Object.entries(asset?.stars ?? {}).map(([fullName, stars]) => [
      fullName,
      { stargazers_count: stars },
    ]),
  );

  return {
    owner,
    repo,
    markdown: replaceMarkdownLinksWithStars(readme, starMap),
    badges: asset?.badges ?? {},
    tracked: asset !== null,
    snapshotDate: asset?.date ?? null,
  };
}

export function HydrateFallback({ params }: Route.HydrateFallbackProps) {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-4">
        <Link to="/" className="text-ink-dim hover:text-ink text-sm">
          &larr; All lists
        </Link>
      </div>
      <div className="border-edge bg-surface rounded-lg border p-6">
        <h2 className="font-display text-lg font-semibold">
          Loading {params.owner}/{params.repo}…
        </h2>
      </div>
    </div>
  );
}

export function ErrorBoundary({ params, error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const message = notFound
    ? String(error.data)
    : error instanceof Error
      ? error.message
      : String(error);
  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-4">
        <Link to="/" className="text-ink-dim hover:text-ink text-sm">
          &larr; All lists
        </Link>
      </div>
      <div className="border-down/30 bg-down/10 rounded-lg border p-6">
        <h2 className="text-down font-display mb-2 text-lg font-semibold">
          {notFound ? "Not found" : "Error"}
        </h2>
        <p className="text-down/90">{message}</p>
        {notFound && (
          <p className="text-ink-dim mt-2 text-sm">
            <a
              href={`https://github.com/${params.owner}/${params.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Look for it on GitHub
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

type ProgressState = {
  completed: number;
  total: number;
  current: string;
};

function FetchStarsProgress({ owner, repo }: { owner: string; repo: string }) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [statusMessage, setStatusMessage] = useState("Connecting...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/stars/${owner}/${repo}`);

    eventSource.addEventListener("status", (e) => {
      const data = JSON.parse(e.data);
      setStatusMessage(data.message);
    });

    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setProgress(data);
      setStatusMessage(`Fetching stars... ${data.completed}/${data.total}`);
    });

    eventSource.addEventListener("done", () => {
      eventSource.close();
      window.location.reload();
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
  }, [owner, repo]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
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
      <div className="border-edge bg-surface rounded-lg border p-6">
        <h2 className="font-display mb-4 text-lg font-semibold">
          Fetching stars for {owner}/{repo}
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
  const data = useLoaderData<typeof clientLoader>();
  const [fetching, setFetching] = useState(false);

  if (fetching) {
    return <FetchStarsProgress owner={data.owner} repo={data.repo} />;
  }

  return (
    <>
      {!data.tracked && (
        <div className="border-edge bg-surface mx-5 mt-4 rounded-lg border p-3 text-sm">
          <span className="text-ink-dim">
            This list isn&apos;t tracked yet — showing the live README without
            star counts.
          </span>
          {!STATIC_BUILD && (
            <button
              onClick={() => setFetching(true)}
              className="text-accent ml-2 font-medium hover:underline"
            >
              Fetch star data
            </button>
          )}
        </div>
      )}
      <MarkdownRenderer
        markdown={data.markdown}
        title={`${data.owner}/${data.repo}`}
        trendsHref={
          data.tracked ? `/awesome/${data.owner}/${data.repo}/trends` : undefined
        }
        badges={data.badges}
        onRefresh={
          STATIC_BUILD || !data.tracked ? undefined : () => setFetching(true)
        }
      />
    </>
  );
}
