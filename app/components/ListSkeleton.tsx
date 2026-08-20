import { ListHeader } from "./MarkdownRenderer";

const SECTIONS = [
  ["w-11/12", "w-3/4", "w-5/6", "w-2/3"],
  ["w-4/5", "w-11/12", "w-3/5", "w-3/4", "w-2/3"],
  ["w-2/3", "w-5/6", "w-3/4"],
];

export function ListSkeleton({ owner, repo }: { owner: string; repo: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none p-5" aria-busy>
      <ListHeader />
      <p className="text-ink-dim not-prose mb-6 text-sm">
        Loading {owner}/{repo}…
      </p>
      <div className="not-prose animate-pulse space-y-8">
        <div className="bg-surface-2 h-8 w-64 rounded" />
        {SECTIONS.map((rows, section) => (
          <div key={section} className="space-y-3">
            <div className="bg-surface-2 h-5 w-44 rounded" />
            {rows.map((width, row) => (
              <div key={row} className={`bg-surface-2 h-4 rounded ${width}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
