import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  initializePriceDataLayout,
  loadCanonicalSnapshotMetadata,
  publishJustTcgCanonicalSnapshot,
  resolveDefaultPriceDataDir,
  resolvePriceDataLayout
} from "../src/index.js";

async function main() {
  const layout = resolvePriceDataLayout(resolveDefaultPriceDataDir());
  await initializePriceDataLayout(layout);

  const latestRelativeMetadataPath = await findLatestJustTcgCanonicalMetadata(layout.rootDir, layout.canonicalDir);
  if (!latestRelativeMetadataPath) {
    throw new Error("No JustTCG canonical metadata files were found under .price_data/canonical/justtcg.");
  }

  const canonicalMetadata = await loadCanonicalSnapshotMetadata(layout, latestRelativeMetadataPath);
  const result = await publishJustTcgCanonicalSnapshot(layout, canonicalMetadata);

  console.log(
    JSON.stringify(
      {
        canonicalRelativeMetadataPath: latestRelativeMetadataPath,
        exportManifestPath: result.metadata.exportManifestRelativePath,
        exportSnapshotPath: result.metadata.exportSnapshotRelativePath,
        frontendManifestPath: result.metadata.frontendManifestRelativePath,
        frontendSnapshotPath: result.metadata.frontendSnapshotRelativePath,
        rowCount: result.rowCount
      },
      null,
      2
    )
  );
}

async function findLatestJustTcgCanonicalMetadata(
  rootDir: string,
  canonicalDir: string
): Promise<string | undefined> {
  const justTcgRoot = join(canonicalDir, "justtcg");
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
