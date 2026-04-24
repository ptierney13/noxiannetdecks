import { readdir, stat, writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { archiveLayerSchema, archiveManifestSchema, type ArchiveLayer, type ArchiveManifest, type ArchiveSourceStats } from "./manifest.js";
import type { DeckDataLayout } from "../config.js";

type DirectoryStats = {
  fileCount: number;
  totalBytes: number;
};

async function collectDirectoryStats(path: string): Promise<DirectoryStats> {
  let fileCount = 0;
  let totalBytes = 0;

  const entries = await readdir(path, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const nextPath = `${path}\\${entry.name}`;
    if (entry.isDirectory()) {
      const nested = await collectDirectoryStats(nextPath);
      fileCount += nested.fileCount;
      totalBytes += nested.totalBytes;
      continue;
    }

    if (entry.isFile()) {
      const details = await stat(nextPath);
      fileCount += 1;
      totalBytes += details.size;
    }
  }

  return { fileCount, totalBytes };
}

async function collectSourceStats(rawDir: string): Promise<ArchiveSourceStats[]> {
  const entries = await readdir(rawDir, { withFileTypes: true }).catch(() => []);
  const sources: ArchiveSourceStats[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const nextPath = `${rawDir}\\${entry.name}`;
    const stats = await collectDirectoryStats(nextPath);
    sources.push({
      sourceId: entry.name,
      captureCount: stats.fileCount,
      totalBytes: stats.totalBytes
    });
  }

  return sources.sort((left, right) => left.sourceId.localeCompare(right.sourceId));
}

export async function generateArchiveManifest(layout: DeckDataLayout, generatedAt = new Date().toISOString()): Promise<ArchiveManifest> {
  const layerPaths: Record<ArchiveLayer, string> = {
    raw: layout.rawDir,
    canonical: layout.canonicalDir,
    exports: layout.exportsDir,
    audit: layout.auditDir
  };

  const layers = [];
  let totalFiles = 0;
  let totalBytes = 0;

  for (const layer of archiveLayerSchema.options) {
    const stats = await collectDirectoryStats(layerPaths[layer]);
    layers.push({
      layer,
      fileCount: stats.fileCount,
      totalBytes: stats.totalBytes
    });
    totalFiles += stats.fileCount;
    totalBytes += stats.totalBytes;
  }

  const manifest = {
    version: 1 as const,
    generatedAt,
    totalFiles,
    totalBytes,
    layers,
    sources: await collectSourceStats(layout.rawDir)
  };

  return archiveManifestSchema.parse(manifest);
}

export async function writeArchiveManifest(layout: DeckDataLayout, manifest: ArchiveManifest) {
  await writeFile(layout.archiveManifestPath, JSON.stringify(manifest, null, 2));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function manifestSummaryLines(layout: DeckDataLayout, manifest: ArchiveManifest): string[] {
  const lines = [
    `Data root: ${layout.rootDir}`,
    `Archive manifest: ${layout.archiveManifestPath}`,
    `Generated at: ${manifest.generatedAt}`,
    `Total files: ${manifest.totalFiles}`,
    `Total bytes: ${manifest.totalBytes} (${formatBytes(manifest.totalBytes)})`,
    "Layer totals:"
  ];

  for (const layer of manifest.layers) {
    lines.push(`- ${layer.layer}: ${layer.fileCount} files, ${layer.totalBytes} bytes (${formatBytes(layer.totalBytes)})`);
  }

  lines.push("Raw source totals:");
  if (manifest.sources.length === 0) {
    lines.push("- none");
  } else {
    for (const source of manifest.sources) {
      lines.push(`- ${source.sourceId}: ${source.captureCount} files, ${source.totalBytes} bytes (${formatBytes(source.totalBytes)})`);
    }
  }

  return lines;
}
