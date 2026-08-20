import { promises as fs } from "fs";
import path from "path";
import { listTrackedLists } from "../app/lib/snapshots.server.ts";
import { buildStarsAsset } from "../app/lib/starsAsset.server.ts";

const OUT_DIR = path.resolve("public/stars");

const run = async () => {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  const lists = await listTrackedLists();
  for (const { owner, repo } of lists) {
    const asset = await buildStarsAsset(owner, repo);
    if (!asset) continue;
    const outPath = path.join(OUT_DIR, owner, `${repo}.json`);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(asset));
  }
  console.log(`✅ ${lists.length} star assets written to public/stars`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
