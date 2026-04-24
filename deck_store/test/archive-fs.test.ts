import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatBytes, generateArchiveManifest, resolveDeckDataLayout } from "../src/index.js";

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("archive filesystem helpers", () => {
  it("computes archive layer and source stats from the external data layout", async () => {
    const root = await mkdtemp(join(tmpdir(), "deck-store-archive-"));
    createdDirs.push(root);
    const layout = resolveDeckDataLayout(root);

    await mkdir(join(layout.rawDir, "riftdecks", "samples"), { recursive: true });
    await mkdir(layout.auditDir, { recursive: true });
    await writeFile(join(layout.rawDir, "riftdecks", "samples", "homepage.html"), "<html></html>");
    await writeFile(join(layout.rawDir, "riftdecks", "samples", "homepage.meta.json"), "{\"textOnly\":true}");
    await writeFile(join(layout.auditDir, "source-audit-plan.json"), "{\"version\":1}");

    const manifest = await generateArchiveManifest(layout, "2026-04-24T12:00:00.000Z");

    expect(manifest.totalFiles).toBe(3);
    expect(manifest.sources).toEqual([
      {
        sourceId: "riftdecks",
        captureCount: 2,
        totalBytes: Buffer.byteLength("<html></html>") + Buffer.byteLength("{\"textOnly\":true}")
      }
    ]);
    expect(manifest.layers.find((layer) => layer.layer === "raw")?.fileCount).toBe(2);
    expect(manifest.layers.find((layer) => layer.layer === "audit")?.fileCount).toBe(1);
  });

  it("formats byte values into readable units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.00 KB");
  });
});
