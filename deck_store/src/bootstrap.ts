import { access, mkdir, writeFile } from "node:fs/promises";
import { createEmptyArchiveManifest } from "./archive/manifest.js";
import { createDefaultSourceAuditPlan } from "./audit/default-plan.js";
import type { DeckDataLayout } from "./config.js";

async function ensureDirectory(path: string) {
  await mkdir(path, { recursive: true });
}

async function ensureJsonFile(path: string, content: unknown) {
  try {
    await access(path);
  } catch {
    await writeFile(path, JSON.stringify(content, null, 2));
  }
}

export async function initializeDeckDataLayout(layout: DeckDataLayout) {
  await ensureDirectory(layout.rootDir);
  await ensureDirectory(layout.rawDir);
  await ensureDirectory(layout.canonicalDir);
  await ensureDirectory(layout.exportsDir);
  await ensureDirectory(layout.auditDir);
  await ensureJsonFile(layout.archiveManifestPath, createEmptyArchiveManifest());
  await ensureJsonFile(layout.auditPlanPath, createDefaultSourceAuditPlan());
}
