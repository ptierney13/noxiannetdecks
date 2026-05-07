import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  importTcgplayerSampleManifest,
  loadRunStatus,
  rawCaptureMetadataSchema,
  resolvePriceDataLayout
} from "../src/index.js";

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("tcgplayer sample import", () => {
  it("imports manifest payloads into raw captures and records a run status", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "price-store-tcgplayer-"));
    const manifestDir = await mkdtemp(join(tmpdir(), "price-store-tcgplayer-manifest-"));
    createdDirs.push(rootDir, manifestDir);

    await writeFile(join(manifestDir, "catalog.json"), "{\"results\":[{\"productId\":1}]}");
    await writeFile(join(manifestDir, "pricing.json"), "{\"results\":[{\"productId\":1,\"marketPrice\":2.5}]}");
    await writeFile(
      join(manifestDir, "manifest.json"),
      JSON.stringify(
        {
          version: 1,
          sourceId: "tcgplayer",
          datasetLabel: "unit-test-samples",
          entries: [
            {
              captureKey: "catalog-products",
              capturedAt: "2026-05-06T10:00:00.000Z",
              payloadFile: "catalog.json",
              payloadFormat: "json",
              extension: "json",
              requestUrl: "https://example.com/catalog",
              notes: ["catalog sample"]
            },
            {
              captureKey: "pricing-group",
              capturedAt: "2026-05-06T10:01:00.000Z",
              payloadFile: "pricing.json",
              payloadFormat: "json",
              extension: "json",
              requestUrl: "https://example.com/pricing",
              notes: ["pricing sample"]
            }
          ]
        },
        null,
        2
      )
    );

    const layout = resolvePriceDataLayout(rootDir);
    const result = await importTcgplayerSampleManifest(
      layout,
      join(manifestDir, "manifest.json"),
      "2026-05-06T12:00:00.000Z"
    );

    expect(result.runId).toBe("tcgplayer-samples-2026-05-06-unit-test-samples");
    expect(result.rawCaptureCount).toBe(2);

    const firstPayload = await readFile(join(rootDir, result.relativePayloadPaths[0]), "utf8");
    const firstMetadataPath = result.relativePayloadPaths[0].replace(/\.json$/, ".meta.json");
    const firstMetadata = JSON.parse(await readFile(join(rootDir, firstMetadataPath), "utf8"));

    expect(firstPayload).toContain("\"productId\":1");
    expect(rawCaptureMetadataSchema.parse(firstMetadata).notes).toContain("dataset:unit-test-samples");

    await expect(loadRunStatus(layout, result.runId)).resolves.toMatchObject({
      status: "succeeded",
      rawCaptureCount: 2,
      sourceId: "tcgplayer",
      stage: "raw-capture"
    });
  });
});
