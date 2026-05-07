import {
  captureJustTcgCardsCatalog,
  initializePriceDataLayout,
  loadJustTcgConfig,
  resolveDefaultPriceDataDir,
  resolvePriceDataLayout
} from "../src/index.js";

const REQUEST_DELAY_MS = 6_500;

async function main() {
  const config = loadJustTcgConfig();
  const layout = resolvePriceDataLayout(resolveDefaultPriceDataDir());
  await initializePriceDataLayout(layout);

  const result = await captureJustTcgCardsCatalog(layout, config, {
    verifyLimit: true,
    requestDelayMs: REQUEST_DELAY_MS
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
