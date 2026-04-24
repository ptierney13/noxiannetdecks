import { describe, expect, it } from "vitest";
import {
  createStage1DatasetRepository,
  loadSnapshotManifest,
  type SnapshotManifestSource,
  type Stage1DatasetSource
} from "../src/index.js";
import { fixtureDataset, fixtureSnapshotManifest } from "./fixtures.js";

describe("Stage 1 repositories", () => {
  it("caches the canonical dataset when loaded through the repository", async () => {
    let calls = 0;
    const source: Stage1DatasetSource = {
      async load() {
        calls += 1;
        return fixtureDataset;
      }
    };

    const repository = createStage1DatasetRepository(source);

    await expect(repository.loadDataset()).resolves.toEqual(fixtureDataset);
    await expect(repository.loadDataset()).resolves.toEqual(fixtureDataset);
    expect(calls).toBe(1);
  });

  it("loads snapshot manifests through an injectable source", async () => {
    const source: SnapshotManifestSource = {
      async load() {
        return fixtureSnapshotManifest;
      }
    };

    await expect(loadSnapshotManifest(source)).resolves.toEqual(fixtureSnapshotManifest);
  });
});
