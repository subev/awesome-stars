import { Suspense, useState, useEffect } from "react";
import {
  Await,
  Link,
  isRouteErrorResponse,
  useAsyncError,
  useLoaderData,
} from "react-router";
import { ListSkeleton } from "~/components/ListSkeleton";
import { MarkdownRenderer } from "~/components/MarkdownRenderer";
import { GitHubLink } from "~/components/RepoActions";
import { replaceMarkdownLinksWithStars } from "~/lib/starsMarkdown";
import {
  loadListLookup,
  starsAssetUrl,
  type StarsAsset,
} from "~/lib/starsAsset";
import { resolveList } from "~/lib/listLookup";
import { listDisplayName } from "~/lib/favorites";
import { siteMeta } from "~/lib/meta";
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

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const fetchLiveReadme = async (owner: string, repo: string) => {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    { headers: { Accept: "application/vnd.github.raw+json" } },
  );
  if (res.status === 404) {
    throw httpError(
      `Repository ${owner}/${repo} not found or has no README.`,
      404,
    );
  }
  if (res.status === 403 || res.status === 429) {
    throw httpError(
      "GitHub API rate limit reached — try again in a few minutes.",
      res.status,
    );
  }
  if (!res.ok) {
    throw httpError(
      `GitHub returned ${res.status} for ${owner}/${repo}.`,
      res.status,
    );
  }
  return res.text();
};

const loadList = async (owner: string, repo: string) => {
  const listLookup = await loadListLookup();
  // Asset paths are case-sensitive on Pages while the URL carries whatever
  // casing the inbound link used, so resolve to the index's canonical name.
  const canonical = resolveList(listLookup, owner, repo) ?? `${owner}/${repo}`;
  const [assetOwner, assetRepo] = canonical.split("/");

  const [asset, readme] = await Promise.all([
    fetchStarsAsset(assetOwner, assetRepo),
    fetchLiveReadme(owner, repo),
  ]);

  const starMap = new Map(
    Object.entries(asset?.stars ?? {}).map(([fullName, stars]) => [
      fullName,
      { stargazers_count: stars },
    ]),
  );

  return {
    markdown: replaceMarkdownLinksWithStars(readme, starMap),
    badges: asset?.badges ?? {},
    tracked: asset !== null,
    snapshotDate: asset?.date ?? null,
    listLookup,
    canonical,
  };
};

type ListData = Awaited<ReturnType<typeof loadList>>;

export function meta({ params }: Route.MetaArgs) {
  const name = listDisplayName(params.owner, params.repo);
  return siteMeta({
    title: `${name} \u2014 live star counts and growth`,
    description: `${params.owner}/${params.repo} rendered live from GitHub, with a star count and %/month growth badge on every entry.`,
    path: `/awesome/${params.owner}/${params.repo}`,
  });
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { owner, repo } = params;
  const list = loadList(owner, repo);
  // <Await> reports the rejection; this keeps it from also surfacing as an
  // unhandled rejection when nothing is subscribed (navigated away, refetching).
  list.catch(() => {});
  return { owner, repo, list };
}

export function HydrateFallback({ params }: Route.HydrateFallbackProps) {
  return <ListSkeleton owner={params.owner} repo={params.repo} />;
}

type ErrorInfo = { status: number | null; message: string };

const describeError = (error: unknown): ErrorInfo => {
  if (isRouteErrorResponse(error)) {
    return { status: error.status, message: String(error.data) };
  }
  if (error instanceof Error) {
    return {
      status: (error as { status?: number }).status ?? null,
      message: error.message,
    };
  }
  return { status: null, message: String(error) };
};

const errorTitle = (status: number | null) => {
  if (status === 404) return "Not found";
  if (status === 403 || status === 429) return "Rate limited";
  return "Couldn't load this list";
};

const errorHint = (status: number | null) => {
  if (status === 404) {
    return "The repo may have been renamed or deleted, turned private, or it simply has no README file.";
  }
  if (status === 403 || status === 429) {
    return "READMEs are read straight from GitHub's public API, which allows 60 requests per hour per IP address. It should clear within the hour.";
  }
  return "GitHub may be unreachable, or the link pointed somewhere this app can't render.";
};

function ListError({
  owner,
  repo,
  status,
  message,
}: {
  owner: string;
  repo: string;
} & ErrorInfo) {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link to="/" className="text-ink-dim hover:text-ink text-sm">
          &larr; All lists
        </Link>
        <GitHubLink owner={owner} repo={repo} showLabel />
      </div>
      <div className="border-down/30 bg-down/10 rounded-lg border p-6">
        <h2 className="text-down font-display mb-2 text-lg font-semibold">
          {errorTitle(status)}
        </h2>
        <p className="text-down/90">{message}</p>
        <p className="text-ink-dim mt-2 text-sm">{errorHint(status)}</p>
      </div>
    </div>
  );
}

export function ErrorBoundary({ params, error }: Route.ErrorBoundaryProps) {
  return (
    <ListError
      owner={params.owner}
      repo={params.repo}
      {...describeError(error)}
    />
  );
}

function AsyncListError({ owner, repo }: { owner: string; repo: string }) {
  return (
    <ListError owner={owner} repo={repo} {...describeError(useAsyncError())} />
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
          <h2 className="text-down font-display mb-2 text-lg font-semibold">
            Error
          </h2>
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

function LoadedList({
  owner,
  repo,
  list,
  onFetchStars,
}: {
  owner: string;
  repo: string;
  list: ListData;
  onFetchStars: () => void;
}) {
  return (
    <>
      {!list.tracked && (
        <div className="border-edge bg-surface mx-5 mt-4 rounded-lg border p-3 text-sm">
          <span className="text-ink-dim">
            This list isn&apos;t tracked yet — showing the live README without
            star counts.
          </span>
          {!STATIC_BUILD && (
            <button
              onClick={onFetchStars}
              className="text-accent ml-2 font-medium hover:underline"
            >
              Fetch star data
            </button>
          )}
        </div>
      )}
      <MarkdownRenderer
        markdown={list.markdown}
        title={`${owner}/${repo}`}
        owner={owner}
        repo={repo}
        trendsHref={
          list.tracked ? `/awesome/${list.canonical}/trends` : undefined
        }
        badges={list.badges}
        listLookup={list.listLookup}
        onRefresh={STATIC_BUILD || !list.tracked ? undefined : onFetchStars}
      />
    </>
  );
}

export default function DynamicAwesomeList() {
  const { owner, repo, list } = useLoaderData<typeof clientLoader>();
  const [fetching, setFetching] = useState(false);

  if (fetching) {
    return <FetchStarsProgress owner={owner} repo={repo} />;
  }

  return (
    <Suspense fallback={<ListSkeleton owner={owner} repo={repo} />}>
      <Await
        resolve={list}
        errorElement={<AsyncListError owner={owner} repo={repo} />}
      >
        {(loaded: ListData) => (
          <LoadedList
            owner={owner}
            repo={repo}
            list={loaded}
            onFetchStars={() => setFetching(true)}
          />
        )}
      </Await>
    </Suspense>
  );
}
