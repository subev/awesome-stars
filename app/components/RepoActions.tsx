import { githubUrl, isPinnedList, useFavorites } from "~/lib/favorites";

export function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

/**
 * Heart toggle wired straight to the stored favourites, so any surface that
 * shows a list (home cards, explore rows, the list and trends headers) can
 * favourite it without a detour through the search box.
 */
export function FavoriteButton({
  owner,
  repo,
  name,
  showLabel = false,
  className = "",
}: {
  owner: string;
  repo: string;
  name?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();

  // The home list is always present, so there is nothing to toggle.
  if (isPinnedList(owner, repo)) return null;

  const favorited = isFavorite(owner, repo);
  const label = favorited
    ? `Remove ${owner}/${repo} from favourites`
    : `Add ${owner}/${repo} to favourites`;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={favorited}
      title={label}
      onClick={() => toggle(owner, repo, name)}
      className={`flex items-center gap-1.5 rounded p-1 text-sm font-medium transition-colors ${
        favorited ? "text-accent" : "text-ink-dim hover:text-accent"
      } ${className}`}
    >
      <HeartIcon filled={favorited} />
      {showLabel && <span>{favorited ? "Favourited" : "Favourite"}</span>}
    </button>
  );
}

/** Escape hatch to the real repo — starring, forking, issues live there. */
export function GitHubLink({
  owner,
  repo,
  showLabel = false,
  className = "",
}: {
  owner: string;
  repo: string;
  showLabel?: boolean;
  className?: string;
}) {
  const label = `Open ${owner}/${repo} on GitHub`;
  return (
    <a
      href={githubUrl(owner, repo)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
      className={`text-ink-dim hover:text-accent flex items-center gap-1.5 rounded p-1 text-sm font-medium no-underline transition-colors ${className}`}
    >
      <GitHubIcon />
      {showLabel && <span>GitHub</span>}
    </a>
  );
}
