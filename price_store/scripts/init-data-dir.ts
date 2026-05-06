import { initializePriceDataLayout, resolvePriceDataLayout } from "../src/index.js";

async function main() {
  const layout = resolvePriceDataLayout();
  await initializePriceDataLayout(layout);

  console.log(`Initialized Stage 1 price data directory at ${layout.rootDir}`);
}

await main();
