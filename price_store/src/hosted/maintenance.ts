import { createHostedPriceStoreRepository } from "./repository.js";
import type { D1DatabaseLike } from "./types.js";

const RETENTION_DAYS = 7;

export type RunHostedPriceMaintenanceInput = {
  database: D1DatabaseLike;
  now?: string;
};

export type HostedPriceMaintenanceResult = {
  cutoffIso: string | null;
  deletedRunCount: number;
  livePublishedAt: string | null;
};

export async function runHostedPriceMaintenance(input: RunHostedPriceMaintenanceInput): Promise<HostedPriceMaintenanceResult> {
  const repository = createHostedPriceStoreRepository(input.database);
  const livePublishedAt = await repository.getPipelineState("current_live_published_at");
  if (!livePublishedAt) {
    return {
      cutoffIso: null,
      deletedRunCount: 0,
      livePublishedAt: null
    };
  }

  const cutoffIso = subtractDays(livePublishedAt, RETENTION_DAYS);
  const currentLiveRunId = await repository.getPipelineState("current_live_run_id");
  const deletedRunCount = await repository.deleteRunsOlderThan(cutoffIso, currentLiveRunId);

  return {
    cutoffIso,
    deletedRunCount,
    livePublishedAt
  };
}

function subtractDays(value: string, days: number): string {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() - days);
  return next.toISOString();
}
