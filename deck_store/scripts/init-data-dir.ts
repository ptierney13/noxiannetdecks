import { initializeDeckDataLayout } from "../src/bootstrap.js";
import { resolveDeckDataLayout } from "../src/config.js";

async function main() {
  const layout = resolveDeckDataLayout();
  await initializeDeckDataLayout(layout);

  console.log(`Initialized Stage 1 deck data directory at ${layout.rootDir}`);
}

await main();
