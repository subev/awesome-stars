import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useEffect, type ComponentPropsWithoutRef } from "react";
import { Link } from "react-router";
import { FavoriteButton, GitHubLink } from "~/components/RepoActions";
import { AWESOME_LISTS } from "~/lists";

const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/;

// READMEs link GitHub-style anchors (#utilities) but slugged heading ids can differ
// when headings embed images/counts (-utilities-27), so match tolerantly.
const resolveFragment = (fragment: string) => {
  const slug = decodeURIComponent(fragment.replace(/^#/, "")).toLowerCase();
  if (!slug) return null;
  const exact = document.getElementById(slug);
  if (exact) return exact;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("[id]"));
  return (
    candidates.find((el) => el.id.replace(/^-+/, "") === slug) ??
    candidates.find((el) => el.id.replace(/^-+/, "").startsWith(`${slug}-`)) ??
    candidates.find((el) => el.id.includes(slug)) ??
    null
  );
};

const CONFIGURED_REPOS = new Set(
  Object.values(AWESOME_LISTS).map((l) => `${l.owner}/${l.repo}`),
);

// Only actual curated lists get the internal star-fetching view; leaf repos go to GitHub.
const looksLikeAwesomeList = (owner: string, repo: string) =>
  /awesome/i.test(repo) || CONFIGURED_REPOS.has(`${owner}/${repo}`);

export type RepoBadge = {
  pct: number | null;
  delta: number;
  since: string;
  isNew: boolean;
};

export type RepoBadges = Record<string, RepoBadge>;

const formatBadgePct = (pct: number) => {
  const abs = Math.abs(pct);
  const value = abs >= 10 ? Math.round(abs).toString() : abs.toFixed(1);
  return `${pct > 0 ? "↑" : "↓"}${value}%/mo`;
};

// Tiers follow the observed distribution: median ~0.5%/mo, p90 ~3, top ~4% above 8.
const growthClass = (pct: number) => {
  const abs = Math.abs(pct);
  if (pct > 0) {
    if (abs >= 8) return "glow-hot font-bold text-up-strong";
    if (abs >= 3) return "font-semibold text-up";
    if (abs >= 1) return "font-medium text-up-dim";
    return "font-normal text-up-dim";
  }
  if (abs >= 3) return "font-semibold text-down-strong";
  if (abs >= 1) return "font-medium text-down";
  return "font-normal text-down-dim";
};

function GrowthBadge({ badge }: { badge: RepoBadge }) {
  if (badge.isNew) {
    return (
      <span
        className="text-accent font-data ml-1 align-middle text-xs font-medium whitespace-nowrap"
        title={`Added to the list since ${badge.since}`}
      >
        new
      </span>
    );
  }
  if (badge.pct === null || Math.abs(badge.pct) < 0.05) return null;
  return (
    <span
      className={`font-data ml-1 align-middle text-xs whitespace-nowrap ${growthClass(badge.pct)}`}
      title={`${badge.delta > 0 ? "+" : ""}${badge.delta.toLocaleString("en-US")} stars since ${badge.since}`}
    >
      {formatBadgePct(badge.pct)}
    </span>
  );
}

function RewrittenLink(
  props: ComponentPropsWithoutRef<"a"> & { badges?: RepoBadges },
) {
  const { href, children, badges, ...rest } = props;

  if (href?.startsWith("#")) {
    return (
      <a
        href={href}
        onClick={(e) => {
          const target = resolveFragment(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView();
            history.replaceState(null, "", href);
          }
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }

  if (href) {
    const match = href.match(GITHUB_REPO_REGEX);
    if (match) {
      const [, owner, repo] = match;
      const badge = badges?.[`${owner}/${repo}`.toLowerCase()];
      const internal = looksLikeAwesomeList(owner, repo);
      return (
        <>
          {internal ? (
            <Link to={`/awesome/${owner}/${repo}`} {...rest}>
              {children}
            </Link>
          ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
              {children}
            </a>
          )}
          {badge && <GrowthBadge badge={badge} />}
        </>
      );
    }
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

export function ListHeader({
  owner,
  repo,
  trendsHref,
  onRefresh,
}: {
  owner?: string;
  repo?: string;
  trendsHref?: string;
  onRefresh?: () => void;
}) {
  return (
    <div className="pointer-events-none sticky top-0 z-10 -mx-5 mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
      <Link
        to="/"
        className="border-edge bg-surface/90 text-ink-dim hover:text-ink pointer-events-auto rounded-full border px-3 py-1.5 text-sm no-underline backdrop-blur-sm"
      >
        &larr; All lists
      </Link>
      <div className="border-edge bg-surface/90 pointer-events-auto flex items-center gap-3 rounded-full border px-3 py-1.5 backdrop-blur-sm">
        {owner && repo && (
          <>
            <FavoriteButton owner={owner} repo={repo} showLabel />
            <GitHubLink owner={owner} repo={repo} showLabel />
          </>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-accent text-sm font-medium hover:underline"
            title="Refetch stars from GitHub and record a new snapshot"
          >
            ↻ Refresh stars
          </button>
        )}
        {trendsHref && (
          <Link
            to={trendsHref}
            className="text-accent text-sm font-medium no-underline hover:underline"
          >
            📈 Trends
          </Link>
        )}
      </div>
    </div>
  );
}

export function MarkdownRenderer({
  markdown,
  title,
  owner,
  repo,
  trendsHref,
  badges,
  onRefresh,
}: {
  markdown: string;
  title: string;
  owner?: string;
  repo?: string;
  trendsHref?: string;
  badges?: RepoBadges;
  onRefresh?: () => void;
}) {
  useEffect(() => {
    if (window.location.hash) {
      resolveFragment(window.location.hash)?.scrollIntoView();
    }
  }, [markdown]);

  return (
    <div className="prose prose-sm dark:prose-invert prose-a:text-accent prose-ul:marker:text-ink-dim max-w-none p-5">
      <ListHeader
        owner={owner}
        repo={repo}
        trendsHref={trendsHref}
        onRefresh={onRefresh}
      />
      <h1 className="sr-only">{title}</h1>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSanitize,
          rehypeAutolinkHeadings,
          rehypeSlug,
        ]}
        components={{
          a: (props) => <RewrittenLink {...props} badges={badges} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
