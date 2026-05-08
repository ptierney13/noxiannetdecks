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

  const latestRun = await findLatestJustTcgRun(layout.runsDir);
  if (!latestRun?.runId) {
    throw new Error("No JustTCG raw-capture run status files were found under .price_data/runs.");
  }

  const rawMetadataPaths = await findJustTcgRawMetadataPathsForRun(
    layout.rootDir,
    layout.rawDir,
    latestRun.runId,
    latestRun.pageCount
  );
  if (rawMetadataPaths.length === 0) {
    throw new Error(`No JustTCG raw capture metadata files were found for run ${latestRun.runId}.`);
  }

  const rawMetadatas = await Promise.all(
    rawMetadataPaths.map((metadataPath) => loadRawCaptureMetadata(layout, metadataPath))
  );
  const result = await materializeJustTcgCanonicalRunSnapshot(layout, rawMetadatas);

  console.log(
    JSON.stringify(
      {
        runId: latestRun.runId,
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

async function findLatestJustTcgRun(runsDir: string): Promise<
  | {
      runId?: string;
      pageCount?: number;
    }
  | undefined
> {
  const entries = await readdir(runsDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && entry.name.startsWith("justtcg-capture-") && entry.name.endsWith(".json"))
    .map((entry) => join(runsDir, entry.name));
  const runStatuses = await Promise.all(
    candidates.map(async (path) => {
      const content = await import("node:fs/promises").then(({ readFile }) => readFile(path, "utf8"));
      const parsed = JSON.parse(content) as {
        runId?: string;
        stage?: string;
        status?: string;
        completedAt?: string;
        startedAt?: string;
        pageCount?: number;
      };

      return {
        runId: parsed.runId,
        stage: parsed.stage,
        status: parsed.status,
        completedAt: parsed.completedAt,
        startedAt: parsed.startedAt,
        pageCount: parsed.pageCount
      };
    })
  );
  const latest = runStatuses
    .filter((entry) => entry.runId && entry.stage === "raw-capture" && entry.status === "succeeded")
    .sort((left, right) =>
      (left.completedAt ?? left.startedAt ?? "").localeCompare(right.completedAt ?? right.startedAt ?? "")
    )
    .at(-1);

  return latest ? { runId: latest.runId, pageCount: latest.pageCount } : undefined;
}

async function findJustTcgRawMetadataPathsForRun(
  rootDir: string,
  rawDir: string,
  runId: string,
  pageCount?: number
): Promise<string[]> {
  const files = await collectFiles(join(rawDir, "justtcg"));
  const metadataPaths = files.filter((path) => path.endsWith(".meta.json")).sort();
  const matches: Array<{
    relativePath: string;
    capturedAt: string;
  }> = [];

  for (const absolutePath of metadataPaths) {
    const content = await import("node:fs/promises").then(({ readFile }) => readFile(absolutePath, "utf8"));
    const candidate = JSON.parse(content) as { runId?: string; capturedAt?: string };
    if (candidate.runId === runId) {
      matches.push({
        relativePath: relative(rootDir, absolutePath).replaceAll("\\", "/"),
        capturedAt: candidate.capturedAt ?? ""
      });
    }
  }

  matches.sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));
  const trimmed = pageCount && matches.length > pageCount ? matches.slice(-pageCount) : matches;

  return trimmed.map((entry) => entry.relativePath);
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
