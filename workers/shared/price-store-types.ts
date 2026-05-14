import type {
  D1DatabaseLike,
  HostedCookMessage,
  HostedIngestionChunkMessage,
  HostedPublishMessage,
  KVNamespaceLike,
  QueueSenderLike
} from "../../price_store/src/hosted/types.js";

type WorkerJustTcgConfig = {
  apiKey: string;
  baseUrl: string;
  defaultGame: string;
  defaultLimit: number;
  includePriceHistory: boolean;
  includeStatistics: boolean;
};

type SecretsStoreSecretBinding = {
  get(): Promise<string>;
};

export type PriceStoreWorkerEnv = {
  DB: D1DatabaseLike;
  JUSTTCG_API_KEY?: SecretsStoreSecretBinding;
  NOXIANNET_PRICE_CAPTURE_GAME?: string;
  NOXIANNET_PRICE_CAPTURE_MODE?: string;
  NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS?: string;
  NOXIANNET_PRICE_CAPTURE_UPDATED_AFTER?: string;
  NOXIANNET_PRICE_REQUEST_BUDGET_PER_CHUNK?: string;
  NOXIANNET_PRICE_CAPTURE_VERIFY_LIMIT?: string;
  PRICE_STORE_COOK_QUEUE?: QueueSenderLike<HostedCookMessage>;
  PRICE_STORE_INGESTION_QUEUE?: QueueSenderLike<HostedIngestionChunkMessage>;
  PRICE_STORE_PUBLISH_QUEUE?: QueueSenderLike<HostedPublishMessage>;
  PRICE_STORE_PUBLISHED_DATA?: KVNamespaceLike;
};

async function readSecretValue(value: SecretsStoreSecretBinding | undefined, name: string): Promise<string> {
  if (!value) {
    throw new Error(`${name} is not bound in this worker environment.`);
  }

  const secret = await value.get();
  const trimmed = secret.trim();
  if (!trimmed) {
    throw new Error(`${name} is configured but empty.`);
  }

  return trimmed;
}

export async function createWorkerJustTcgConfig(env: PriceStoreWorkerEnv): Promise<WorkerJustTcgConfig> {
  return {
    apiKey: await readSecretValue(env.JUSTTCG_API_KEY, "JUSTTCG_API_KEY"),
    baseUrl: "https://api.justtcg.com/v1/",
    defaultGame: "riftbound-league-of-legends-trading-card-game",
    defaultLimit: 20,
    includePriceHistory: true,
    includeStatistics: false
  };
}
