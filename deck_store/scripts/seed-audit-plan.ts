import { writeFile } from "node:fs/promises";
import { createDefaultSourceAuditPlan } from "../src/audit/default-plan.js";
import { initializeDeckDataLayout } from "../src/bootstrap.js";
import { resolveDeckDataLayout } from "../src/config.js";

async function main() {
  const layout = resolveDeckDataLayout();
  await initializeDeckDataLayout(layout);
  await writeFile(layout.auditPlanPath, JSON.stringify(createDefaultSourceAuditPlan(), null, 2));

  console.log(`Seeded source audit plan at ${layout.auditPlanPath}`);
}

await main();
