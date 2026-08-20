import { loadCrawlState, readRunLogs } from "../app/lib/crawlState.server.ts";
import { listIndexedLists, readAllRepos } from "../app/lib/repoIndex.server.ts";

const run = async () => {
  const state = await loadCrawlState();
  const nodes = Object.values(state.nodes);

  if (nodes.length === 0) {
    console.log("No crawl state yet — run `npm run crawl`.");
    return;
  }

  const byStatus = new Map<string, number>();
  const byDepth = new Map<number, Map<string, number>>();
  const reasons = new Map<string, number>();

  for (const node of nodes) {
    byStatus.set(node.status, (byStatus.get(node.status) ?? 0) + 1);
    const depth = byDepth.get(node.depth) ?? new Map<string, number>();
    depth.set(node.status, (depth.get(node.status) ?? 0) + 1);
    byDepth.set(node.depth, depth);
    if (node.reason) reasons.set(node.reason, (reasons.get(node.reason) ?? 0) + 1);
  }

  console.log(`Frontier: ${nodes.length} nodes`);
  for (const [status, count] of [...byStatus].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${status.padEnd(9)} ${String(count).padStart(6)}`);
  }

  console.log("\nBy depth:");
  for (const [depth, statuses] of [...byDepth].sort((a, b) => a[0] - b[0])) {
    const summary = [...statuses]
      .sort()
      .map(([status, count]) => `${status} ${count}`)
      .join(", ");
    console.log(`  depth ${depth}: ${summary}`);
  }

  if (reasons.size > 0) {
    console.log("\nSkip/error reasons:");
    for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${reason.padEnd(18)} ${count}`);
    }
  }

  const [repos, lists] = await Promise.all([readAllRepos(), listIndexedLists()]);
  console.log(
    `\nIndex: ${repos.size.toLocaleString()} unique repos across ${lists.length.toLocaleString()} list files`,
  );

  const runs = await readRunLogs();
  if (runs.length > 0) {
    console.log(`\nLast ${Math.min(5, runs.length)} runs:`);
    for (const entry of runs.slice(-5)) {
      const minutes = Math.round(
        (Date.parse(entry.endedAt) - Date.parse(entry.startedAt)) / 60_000,
      );
      console.log(
        `  ${entry.startedAt.slice(0, 16)}  ${String(entry.listsCrawled).padStart(4)} lists  ${String(entry.pointsSpent).padStart(5)} pts  ${String(minutes).padStart(3)}m  stopped: ${entry.stoppedBy}`,
      );
    }
    const total = runs.reduce((sum, entry) => sum + entry.pointsSpent, 0);
    console.log(`  total points spent across ${runs.length} runs: ${total.toLocaleString()}`);
  }

  const pending = byStatus.get("pending") ?? 0;
  if (pending > 0) {
    console.log(
      `\n~${Math.ceil((pending * 136) / 50 + pending / 50).toLocaleString()} points to drain the remaining ${pending} pending lists.`,
    );
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
