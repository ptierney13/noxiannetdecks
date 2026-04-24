import { describe, expect, it } from "vitest";
import { resolveDeckDataLayout, resolveDefaultDeckDataDir, resolveRepositoryLocalDeckDataDir } from "../src/config.js";

describe("deck data directory configuration", () => {
  it("prefers an explicit data directory when configured", () => {
    const rootDir = resolveDefaultDeckDataDir({
      NOXIANNET_DECK_DATA_DIR: "D:\\Deck Data"
    });

    expect(rootDir).toBe("D:\\Deck Data");
  });

  it("falls back to the repo-local git-ignored store by default", () => {
    const rootDir = resolveDefaultDeckDataDir({});

    expect(rootDir).toBe(resolveRepositoryLocalDeckDataDir());
  });

  it("builds the expected Stage 1 directory layout", () => {
    const layout = resolveDeckDataLayout("C:\\Deck Archive");

    expect(layout.rawDir).toBe("C:\\Deck Archive\\raw");
    expect(layout.canonicalDatasetPath).toBe("C:\\Deck Archive\\canonical\\stage1-dataset.json");
    expect(layout.snapshotManifestPath).toBe("C:\\Deck Archive\\exports\\snapshot-manifest.json");
  });
});
