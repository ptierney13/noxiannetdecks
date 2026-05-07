import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  canonicalSnapshotMetadataSchema,
  loadCanonicalSnapshotJson,
  loadCanonicalSnapshotMetadata,
  resolveCanonicalSnapshotPaths,
  resolvePriceDataLayout,
  writeCanonicalSnapshot
} from "../src/index.js";

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("canonical snapshot conventions", () => {
  it("builds source-scoped canonical snapshot and metadata paths", () => {
    const layout = resolvePriceDataLayout("C:\\Price Archive");
    const paths = resolveCanonicalSnapshotPaths(layout, {
      sourceId: "JustTCG",
      capturedAt: "2026-05-06T12:34:56.789Z",
      snapshotKey: "Riftbound Cards Snapshot",
      extension: "json"
    });

    expect(paths.relativeSnapshotPath).toBe(
      "canonical/justtcg/2026/05/06/2026-05-06T12-34-56.789Z--riftbound-cards-snapshot.json"
    );
    expect(paths.relativeMetadataPath).toBe(
      "canonical/justtcg/2026/05/06/2026-05-06T12-34-56.789Z--riftbound-cards-snapshot.meta.json"
    );
  });

  it("writes and reloads canonical snapshots plus sidecar metadata", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "price-store-canonical-"));
    createdDirs.push(rootDir);
    const layout = resolvePriceDataLayout(rootDir);

    const metadata = await writeCanonicalSnapshot(layout, {
      sourceId: "justtcg",
      capturedAt: "2026-05-06T12:34:56.789Z",
      snapshotKey: "riftbound-cards-snapshot",
      snapshot: "{\"sourceId\":\"justtcg\"}",
      rawRelativePayloadPath: "raw/justtcg/example.json",
      rawRelativeMetadataPath: "raw/justtcg/example.meta.json",
      notes: ["canonical-source-snapshot"]
    });

    const reloadedMetadata = await loadCanonicalSnapshotMetadata(
      layout,
      metadata.relativeSnapshotPath.replace(/\.json$/u, ".meta.json")
    );
    const reloadedSnapshot = await loadCanonicalSnapshotJson<{ sourceId: string }>(layout, metadata);
    const snapshotContent = await readFile(join(rootDir, metadata.relativeSnapshotPath), "utf8");

    expect(snapshotContent).toBe("{\"sourceId\":\"justtcg\"}");
    expect(canonicalSnapshotMetadataSchema.parse(reloadedMetadata)).toEqual(metadata);
    expect(reloadedSnapshot.sourceId).toBe("justtcg");
  });
});
