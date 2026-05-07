import {
  initializePriceDataLayout,
  loadJustTcgConfig,
  verifyJustTcgRequestLimit,
  resolveDefaultPriceDataDir,
  resolvePriceDataLayout
} from "../src/index.js";

async function main() {
  const config = loadJustTcgConfig();
  const layout = resolvePriceDataLayout(resolveDefaultPriceDataDir());
  await initializePriceDataLayout(layout);

  const result = await verifyJustTcgRequestLimit(config);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
