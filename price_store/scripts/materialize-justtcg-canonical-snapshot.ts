import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  initializePriceDataLayout,
  loadRawCaptureMetadata,
  materializeJustTcgCanonicalSnapshot,
  resolveDefaultPriceDataDir,
  resolvePriceDataLayout
} from "../src/index.js";

async function main() {
  const layout = resolvePriceDataLayout(resolveDefaultPriceDataDir());
  await initializePriceDataLayout(layout);

  const latestRelativeMetadataPath = await findLatestJustTcgRawMetadata(layout.rootDir, layout.rawDir);
  if (!latestRelativeMetadataPath) {
    throw new Error("No JustTCG raw capture metadata files were found under .price_data/raw/justtcg.");
  }

  const rawMetadata = await loadRawCaptureMetadata(layout, latestRelativeMetadataPath);
  const result = await materializeJustTcgCanonicalSnapshot(layout, rawMetadata);

  console.log(
    JSON.stringify(
      {
        rawRelativeMetadataPath: latestRelativeMetadataPath,
        canonicalRelativeSnapshotPath: result.canonicalMetadata.relativeSnapshotPath,
        cardCount: result.snapshot.cards.length,
        variantCount: result.snapshot.cards.reduce((count, card) => count + card.variants.length, 0)
      },
      null,
      2
    )
  );
}

async function findLatestJustTcgRawMetadata(
  rootDir: string,
  rawDir: string
): Promise<string | undefined> {
  const justTcgRoot = join(rawDir, "justtcg");
  const files = await collectFiles(justTcgRoot);
  const metadataPaths = files.filter((path) => path.endsWith(".meta.json")).sort();
  const latest = metadataPaths.at(-1);
  return latest ? relative(rootDir, latest).replaceAll("\\", "/") : undefined;
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
      continue;
    }

    if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
