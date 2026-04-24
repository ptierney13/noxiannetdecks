import { describe, expect, it } from "vitest";
import { createDefaultSourceAuditPlan, sourceAuditPlanSchema } from "../src/index.js";
import { fixtureSourceAuditPlan } from "./fixtures.js";

describe("source audit plan", () => {
  it("validates the audit plan fixture", () => {
    expect(sourceAuditPlanSchema.parse(fixtureSourceAuditPlan)).toEqual(fixtureSourceAuditPlan);
  });

  it("creates a default plan that restricts aggregator sources to manual review only", () => {
    const plan = createDefaultSourceAuditPlan("2026-04-24T12:00:00.000Z");
    const topdeck = plan.sources.find((source) => source.sourceSite === "topdeck");
    const riftDecks = plan.sources.find((source) => source.sourceSite === "riftdecks");

    expect(plan.collectionPolicy.allowImages).toBe(false);
    expect(plan.collectionPolicy.allowAutomatedManualReviewSources).toBe(false);
    expect(topdeck?.role).toBe("backbone");
    expect(topdeck?.usePolicy).toBe("approved");
    expect(riftDecks?.role).toBe("manual-reference");
    expect(riftDecks?.usePolicy).toBe("manual-review-only");
    expect(riftDecks?.targets.every((target) => target.enabled === false)).toBe(true);
  });

  it("rejects manual-review-only targets when they are enabled for automated capture", () => {
    const plan = createDefaultSourceAuditPlan("2026-04-24T12:00:00.000Z");
    const invalid = {
      ...plan,
      sources: plan.sources.map((source) => (
        source.sourceSite !== "riftdecks"
          ? source
          : {
              ...source,
              targets: source.targets.map((target) => ({ ...target, enabled: true }))
            }
      ))
    };

    expect(() => sourceAuditPlanSchema.parse(invalid)).toThrow(/must not be enabled/i);
  });
});
