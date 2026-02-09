import { main } from "./updateStargazers.ts";
import { AWESOME_LISTS } from "../app/lists.ts";

const args = process.argv.slice(2);
const listFlagIndex = args.indexOf("--list");
const listArg = listFlagIndex !== -1 ? args[listFlagIndex + 1] : "all";
const useCache = Boolean(process.env.USE_CACHE);

const run = async () => {
  if (listArg === "all") {
    for (const config of Object.values(AWESOME_LISTS)) {
      await main(config, useCache);
    }
    return;
  }

  const config = AWESOME_LISTS[listArg];
  if (!config) {
    console.error(
      `❌ Unknown list: "${listArg}". Available: ${Object.keys(AWESOME_LISTS).join(", ")}`,
    );
    process.exit(1);
  }

  await main(config, useCache);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
