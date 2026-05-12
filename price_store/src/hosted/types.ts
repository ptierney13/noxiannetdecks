export type D1Value = Uint8Array | number | string | null;

export type D1RunResult = {
  success: boolean;
  meta?: Record<string, unknown>;
};

export type D1AllResult<T> = {
  results: T[];
};

export interface D1PreparedStatementLike {
  bind(...values: D1Value[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1AllResult<T>>;
  run(): Promise<D1RunResult>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export type HostedPriceStoreLayout = {
  databasePath: string;
  migrationsDir: string;
};

export type HostedCaptureRunRow = {
  runId: string;
  captureMode: "full" | "incremental";
  gameSlug: string;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  completedAt: string | null;
  updatedAfter: string | null;
  requestCount: number;
  pageCount: number;
  cardCount: number;
  verifiedLimit: number | null;
  includePriceHistory: boolean;
  includeStatistics: boolean;
  message: string | null;
};

export type HostedCapturePageRow = {
  pageId: string;
  captureRunId: string;
  pageIndex: number;
  pageOffset: number;
  capturedAt: string;
  requestUrl: string;
  rowCount: number;
  payloadJson: string;
  expiresAt: string;
};

export type HostedProcessRunRow = {
  processRunId: string;
  captureRunId: string;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  completedAt: string | null;
  rowCount: number;
  message: string | null;
};

export type HostedPriceDataRow = {
  rowId: string;
  processRunId: string;
  captureRunId: string;
  upstreamProviderId: "justtcg";
  priceSourceId: "tcgplayer";
  gameSlug: string;
  sourceCardId: string;
  sourceVariantId: string;
  tcgplayerId: string | null;
  tcgplayerSkuId: string | null;
  language: string | null;
  condition: string | null;
  printing: string | null;
  currency: "USD";
  currentPriceAmount: number | null;
  currentPriceLastUpdatedAt: string | null;
  priceHistoryJson: string;
};

export type HostedPublishRunRow = {
  publishRunId: string;
  processRunId: string;
  captureRunId: string;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  completedAt: string | null;
  artifactCount: number;
  rowCount: number;
  message: string | null;
};

export type HostedPublishedArtifactRow = {
  artifactId: string;
  publishRunId: string;
  processRunId: string;
  captureRunId: string;
  gameKey: string;
  artifactType: string;
  payloadJson: string;
};

export type HostedPipelineStateKey =
  | "active_capture_run_id"
  | "latest_successful_capture_run_id"
  | "latest_successful_publish_run_id";
