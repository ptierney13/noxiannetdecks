import { describe, expect, it } from "vitest";
import {
  resolveDefaultPriceDataDir,
  resolvePriceDataLayout,
  resolveRepositoryLocalPriceDataDir
} from "../src/index.js";

describe("price data directory configuration", () => {
  it("prefers an explicit data directory when configured", () => {
    const rootDir = resolveDefaultPriceDataDir({
      NOXIANNET_PRICE_DATA_DIR: "D:\\Price Data"
    });

    expect(rootDir).toBe("D:\\Price Data");
  });

  it("falls back to the repo-local git-ignored store by default", () => {
    const rootDir = resolveDefaultPriceDataDir({});

    expect(rootDir).toBe(resolveRepositoryLocalPriceDataDir());
  });

  it("builds the expected Stage 1 directory layout", () => {
    const layout = resolvePriceDataLayout("C:\\Price Archive");

    expect(layout.rawDir).toBe("C:\\Price Archive\\raw");
    expect(layout.canonicalDir).toBe("C:\\Price Archive\\canonical");
    expect(layout.exportsDir).toBe("C:\\Price Archive\\exports");
    expect(layout.runsDir).toBe("C:\\Price Archive\\runs");
  });
});
