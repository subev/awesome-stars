import { useLoaderData } from "react-router";
import { AWESOME_LISTS } from "~/lists";
import { listTrackedLists } from "~/lib/snapshots.server";

export async function loader() {
  const configured = new Set(
    Object.values(AWESOME_LISTS).map((l) => `${l.owner}/${l.repo}`),
  );
  const browsed = (await listTrackedLists())
    .filter((l) => !configured.has(`${l.owner}/${l.repo}`))
    .sort((a, b) =>
      b.snapshotDates[b.snapshotDates.length - 1].localeCompare(
        a.snapshotDates[a.snapshotDates.length - 1],
      ),
    );
  return { browsed };
}

export default function Index() {
  const { browsed } = useLoaderData<typeof loader>();
  const lists = Object.values(AWESOME_LISTS);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="font-display mb-2 text-3xl font-bold tracking-tight">
        Awesome Lists with Stars
      </h1>
      <p className="text-ink-dim mb-8">
        Curated awesome lists enriched with GitHub star counts.
      </p>
      <ul className="space-y-4">
        {lists.map((list) => (
          <li key={list.slug}>
            <a
              href={`/awesome/${list.owner}/${list.repo}`}
              className="border-edge bg-surface hover:border-accent/50 hover:bg-surface-2 block rounded-lg border p-4 transition-colors"
            >
              <span className="text-accent font-display text-lg font-medium">
                {list.name}
              </span>
              <span className="text-ink-dim font-data ml-2 text-xs">
                {list.owner}/{list.repo}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {browsed.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display mb-1 text-xl font-semibold">
            Browsed lists
          </h2>
          <p className="text-ink-dim mb-4 text-sm">
            Lists you opened on demand — each keeps collecting star history when
            refetched.
          </p>
          <ul className="divide-edge border-edge bg-surface divide-y rounded-lg border">
            {browsed.map(({ owner, repo, snapshotDates }) => (
              <li
                key={`${owner}/${repo}`}
                className="flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div className="min-w-0">
                  <a
                    href={`/awesome/${owner}/${repo}`}
                    className="text-accent font-medium hover:underline"
                  >
                    {owner}/{repo}
                  </a>
                  <p className="text-ink-dim font-data text-xs">
                    {snapshotDates.length} snapshot
                    {snapshotDates.length === 1 ? "" : "s"}, latest{" "}
                    {snapshotDates[snapshotDates.length - 1]}
                  </p>
                </div>
                <a
                  href={`/awesome/${owner}/${repo}/trends`}
                  className="text-accent shrink-0 hover:underline"
                >
                  Trends
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
