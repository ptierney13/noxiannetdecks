import { readFile } from "node:fs/promises";
import { sourceAuditPlanSchema, type SourceAuditPlan } from "./schema.js";
import { resolveDeckDataLayout } from "../config.js";

export type SourceAuditPlanSource = {
  load(): Promise<SourceAuditPlan>;
};

export class JsonFileSourceAuditPlanSource implements SourceAuditPlanSource {
  constructor(private readonly planPath = resolveDeckDataLayout().auditPlanPath) {}

  async load(): Promise<SourceAuditPlan> {
    const raw = await readFile(this.planPath, "utf8");
    return sourceAuditPlanSchema.parse(JSON.parse(raw));
  }
}

export async function loadSourceAuditPlan(source: SourceAuditPlanSource = new JsonFileSourceAuditPlanSource()) {
  return source.load();
}
