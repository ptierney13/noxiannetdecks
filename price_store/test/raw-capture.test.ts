import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createCaptureTimestampId,
  rawCaptureMetadataSchema,
  resolvePriceDataLayout,
  resolveRawCapturePaths,
  writeRawCapture
} from "../src/index.js";

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("raw capture conventions", () => {
  it("builds source-scoped payload and metadata paths", () => {
    const layout = resolvePriceDataLayout("C:\\Price Archive");
    const paths = resolveRawCapturePaths(layout, {
      sourceId: "TCGplayer",
      capturedAt: "2026-05-06T12:34:56.789Z",
      captureKey: "Search Prices",
      extension: ".json"
    });

    expect(createCaptureTimestampId("2026-05-06T12:34:56.789Z")).toBe("2026-05-06T12-34-56.789Z");
    expect(paths.relativePayloadPath).toBe(
      "raw/tcgplayer/2026/05/06/2026-05-06T12-34-56.789Z--search-prices.json"
    );
    expect(paths.relativeMetadataPath).toBe(
      "raw/tcgplayer/2026/05/06/2026-05-06T12-34-56.789Z--search-prices.meta.json"
    );
  });

  it("writes payloads and validated sidecar metadata", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "price-store-raw-"));
    createdDirs.push(rootDir);
    const layout = resolvePriceDataLayout(rootDir);

    const metadata = await writeRawCapture(layout, {
      sourceId: "tcgplayer",
      capturedAt: "2026-05-06T12:34:56.789Z",
      captureKey: "search-prices",
      extension: "json",
      payload: "{\"ok\":true}",
      payloadFormat: "json",
      requestUrl: "https://example.com/prices",
      notes: ["sample payload"]
    });

    const payloadContent = await readFile(join(rootDir, metadata.relativePayloadPath), "utf8");
    const metadataContent = await readFile(
      join(rootDir, "raw", "tcgplayer", "2026", "05", "06", "2026-05-06T12-34-56.789Z--search-prices.meta.json"),
      "utf8"
    );

    expect(payloadContent).toBe("{\"ok\":true}");
    expect(rawCaptureMetadataSchema.parse(JSON.parse(metadataContent))).toEqual(metadata);
  });
});
