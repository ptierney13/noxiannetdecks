import { access, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { initializePriceDataLayout, resolvePriceDataLayout } from "../src/index.js";

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("price data layout bootstrap", () => {
  it("creates the expected directory structure", async () => {
    const rootDir = join(tmpdir(), `price-store-bootstrap-${Date.now()}`);
    createdDirs.push(rootDir);
    const layout = resolvePriceDataLayout(rootDir);

    await initializePriceDataLayout(layout);

    await access(layout.rawDir);
    await access(layout.canonicalDir);
    await access(layout.exportsDir);
    await access(layout.runsDir);

    await expect(stat(layout.rawDir)).resolves.toMatchObject({ isDirectory: expect.any(Function) });
  });
});
