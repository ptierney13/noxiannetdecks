import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadRunStatus,
  priceRunStatusSchema,
  resolvePriceDataLayout,
  resolveRunStatusPath,
  writeRunStatus
} from "../src/index.js";

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("run status records", () => {
  it("writes and reloads run status files from the runs area", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "price-store-runs-"));
    createdDirs.push(rootDir);
    const layout = resolvePriceDataLayout(rootDir);
    const status = priceRunStatusSchema.parse({
      version: 1,
      runId: "tcgplayer-sample-run",
      sourceId: "tcgplayer",
      stage: "raw-capture",
      status: "succeeded",
      startedAt: "2026-05-06T12:00:00.000Z",
      completedAt: "2026-05-06T12:01:00.000Z",
      rawCaptureCount: 2
    });

    await writeRunStatus(layout, status);

    expect(resolveRunStatusPath(layout, status.runId)).toBe(
      join(layout.runsDir, "tcgplayer-sample-run.json")
    );
    await expect(loadRunStatus(layout, status.runId)).resolves.toEqual(status);
  });
});
