import { resolve } from "node:path";
import {
  importTcgplayerSampleManifest,
  initializePriceDataLayout,
  resolveBundledTcgplayerSampleManifestPath,
  resolveDefaultPriceDataDir,
  resolvePriceDataLayout,
  resolvePriceStorePackageRoot
} from "../src/index.js";

async function main() {
  const packageRoot = resolvePriceStorePackageRoot(import.meta.url);
  const providedManifestPath = process.argv[2]?.trim();
  const manifestPath = providedManifestPath
    ? resolve(providedManifestPath)
    : resolveBundledTcgplayerSampleManifestPath(packageRoot);
  const layout = resolvePriceDataLayout(resolveDefaultPriceDataDir());

  await initializePriceDataLayout(layout);
  const result = await importTcgplayerSampleManifest(layout, manifestPath);

  console.log(JSON.stringify({ manifestPath, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
