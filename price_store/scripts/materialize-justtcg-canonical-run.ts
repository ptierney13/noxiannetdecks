import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  initializePriceDataLayout,
  loadRawCaptureMetadata,
  materializeJustTcgCanonicalRunSnapshot,
  resolveDefaultPriceDataDir,
  resolvePriceDataLayout
} from "../src/index.js";

async function main() {
  const layout = resolvePriceDataLayout(resolveDefaultPriceDataDir());
  await initializePriceDataLayout(layout);

  const latestRunId = await findLatestJustTcgRunId(layout.runsDir);
  if (!latestRunId) {
    throw new Error("No JustTCG raw-capture run status files were found under .price_data/runs.");
  }

  const rawMetadataPaths = await findJustTcgRawMetadataPathsForRun(layout.rootDir, layout.rawDir, latestRunId);
  if (rawMetadataPaths.length === 0) {
    throw new Error(`No JustTCG raw capture metadata files were found for run ${latestRunId}.`);
  }

  const rawMetadatas = await Promise.all(
    rawMetadataPaths.map((metadataPath) => loadRawCaptureMetadata(layout, metadataPath))
  );
  const result = await materializeJustTcgCanonicalRunSnapshot(layout, rawMetadatas);

  console.log(
    JSON.stringify(
      {
        runId: latestRunId,
        rawRelativeMetadataPaths: rawMetadataPaths,
        canonicalRelativeSnapshotPath: result.canonicalMetadata.relativeSnapshotPath,
        cardCount: result.snapshot.cards.length,
        variantCount: result.snapshot.cards.reduce((count, card) => count + card.variants.length, 0)
      },
      null,
      2
    )
  );
}

async function findLatestJustTcgRunId(runsDir: string): Promise<string | undefined> {
  const entries = await readdir(runsDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && entry.name.startsWith("justtcg-capture-") && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
  const latest = candidates.at(-1);
  return latest ? latest.slice(0, -".json".length) : undefined;
}

async function findJustTcgRawMetadataPathsForRun(
  rootDir: string,
  rawDir: string,
  runId: string
): Promise<string[]> {
  const files = await collectFiles(join(rawDir, "justtcg"));
  const metadataPaths = files.filter((path) => path.endsWith(".meta.json")).sort();
  const matches: string[] = [];

  for (const absolutePath of metadataPaths) {
    const content = await import("node:fs/promises").then(({ readFile }) => readFile(absolutePath, "utf8"));
    const candidate = JSON.parse(content) as { runId?: string };
    if (candidate.runId === runId) {
      matches.push(relative(rootDir, absolutePath).replaceAll("\\", "/"));
    }
  }

  return matches;
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
