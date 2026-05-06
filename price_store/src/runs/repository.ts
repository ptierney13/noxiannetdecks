import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PriceDataLayout } from "../config.js";
import type { PriceRunStatus } from "./schema.js";
import { priceRunStatusSchema } from "./schema.js";

function sanitizeRunId(runId: string): string {
  const normalized = runId.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  const sanitized = normalized.replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Run id must contain at least one supported character");
  }

  return sanitized.toLowerCase();
}

export function resolveRunStatusPath(layout: PriceDataLayout, runId: string): string {
  return join(layout.runsDir, `${sanitizeRunId(runId)}.json`);
}

export async function writeRunStatus(layout: PriceDataLayout, status: PriceRunStatus): Promise<void> {
  const validated = priceRunStatusSchema.parse(status);
  await mkdir(layout.runsDir, { recursive: true });
  await writeFile(resolveRunStatusPath(layout, validated.runId), JSON.stringify(validated, null, 2));
}

export async function loadRunStatus(layout: PriceDataLayout, runId: string): Promise<PriceRunStatus> {
  const content = await readFile(resolveRunStatusPath(layout, runId), "utf8");
  return priceRunStatusSchema.parse(JSON.parse(content));
}
