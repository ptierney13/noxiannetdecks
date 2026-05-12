import type { D1DatabaseLike } from "../../price_store/src/hosted/index.js";
import type { JustTcgConfig } from "../../price_store/src/sources/justtcg/index.js";

export type ServiceBindingLike = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

export type PriceStoreWorkerEnv = {
  DB: D1DatabaseLike;
  JUSTTCG_API_KEY: string;
  PRICE_STORE_PUBLISH?: ServiceBindingLike;
};

export function createWorkerJustTcgConfig(env: PriceStoreWorkerEnv): JustTcgConfig {
  return {
    apiKey: env.JUSTTCG_API_KEY,
    baseUrl: "https://api.justtcg.com/v1/",
    defaultGame: "riftbound-league-of-legends-trading-card-game",
    defaultLimit: 20,
    includePriceHistory: true,
    includeStatistics: false
  };
}
