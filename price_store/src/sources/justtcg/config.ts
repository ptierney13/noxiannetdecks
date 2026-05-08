import { join } from "node:path";
import { z } from "zod";
import { applyLocalEnvFile } from "../../local-env.js";
import { resolvePriceStorePackageRoot } from "../../package-root.js";

export type JustTcgEnvironment = Partial<
  Record<
    | "JUSTTCG_API_KEY"
    | "JUSTTCG_BASE_URL"
    | "JUSTTCG_DEFAULT_GAME"
    | "JUSTTCG_DEFAULT_LIMIT"
    | "JUSTTCG_INCLUDE_PRICE_HISTORY"
    | "JUSTTCG_INCLUDE_STATISTICS",
    string
  >
>;

export type JustTcgConfig = {
  apiKey: string;
  baseUrl: string;
  defaultGame: string;
  defaultLimit: number;
  includePriceHistory: boolean;
  includeStatistics: boolean;
};

const justTcgConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  baseUrl: z.string().trim().url(),
  defaultGame: z.string().trim().min(1),
  defaultLimit: z.number().int().min(1).max(20),
  includePriceHistory: z.boolean(),
  includeStatistics: z.boolean()
});

export function resolveJustTcgLocalEnvPath(packageRoot: string = resolvePriceStorePackageRoot()): string {
  return join(packageRoot, ".env.local");
}

export function parseJustTcgConfig(environment: JustTcgEnvironment): JustTcgConfig {
  const defaultLimit = Number(environment.JUSTTCG_DEFAULT_LIMIT?.trim() ?? "20");

  return justTcgConfigSchema.parse({
    apiKey: environment.JUSTTCG_API_KEY,
    baseUrl: environment.JUSTTCG_BASE_URL?.trim() || "https://api.justtcg.com/v1",
    defaultGame:
      environment.JUSTTCG_DEFAULT_GAME?.trim() ||
      "riftbound-league-of-legends-trading-card-game",
    defaultLimit,
    includePriceHistory: parseBooleanFlag(environment.JUSTTCG_INCLUDE_PRICE_HISTORY, true),
    includeStatistics: parseBooleanFlag(environment.JUSTTCG_INCLUDE_STATISTICS, false)
  });
}

export function loadJustTcgConfig(environment: JustTcgEnvironment = process.env): JustTcgConfig {
  applyLocalEnvFile(resolveJustTcgLocalEnvPath(), environment as NodeJS.ProcessEnv);
  return parseJustTcgConfig(environment);
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return defaultValue;
  }

  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }

  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }

  throw new Error(`Invalid boolean flag value: ${value}`);
}
