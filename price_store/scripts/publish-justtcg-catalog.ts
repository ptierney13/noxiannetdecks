import {
  captureJustTcgCardsCatalog,
  initializePriceDataLayout,
  loadJustTcgConfig,
  loadRawCaptureMetadata,
  materializeJustTcgCanonicalRunSnapshot,
  publishJustTcgCanonicalSnapshot,
  resolveDefaultPriceDataDir,
  resolvePriceDataLayout
} from "../src/index.js";

const REQUEST_DELAY_MS = 6_500;

async function main() {
  const config = loadJustTcgConfig();
  const layout = resolvePriceDataLayout(resolveDefaultPriceDataDir());
  await initializePriceDataLayout(layout);

  const capture = await captureJustTcgCardsCatalog(layout, config, {
    verifyLimit: true,
    requestDelayMs: REQUEST_DELAY_MS
  });
  const rawMetadatas = await Promise.all(
    capture.relativeMetadataPaths.map((metadataPath) => loadRawCaptureMetadata(layout, metadataPath))
  );
  const canonical = await materializeJustTcgCanonicalRunSnapshot(layout, rawMetadatas);
  const published = await publishJustTcgCanonicalSnapshot(layout, canonical.canonicalMetadata);

  console.log(
    JSON.stringify(
      {
        runId: capture.runId,
        verifiedLimit: capture.verifiedLimit,
        pageCount: capture.pageCount,
        cardCount: capture.cardCount,
        canonicalRelativeSnapshotPath: canonical.canonicalMetadata.relativeSnapshotPath,
        frontendManifestPath: published.metadata.frontendManifestRelativePath,
        frontendSnapshotPath: published.metadata.frontendSnapshotRelativePath,
        rowCount: published.rowCount
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
