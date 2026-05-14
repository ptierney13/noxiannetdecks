export type D1Value = Uint8Array | number | string | null;

export type D1RunResult = {
  success: boolean;
  meta?: Record<string, unknown>;
};

export type D1AllResult<T> = {
  results: T[];
};

export type D1BatchResult = Array<D1RunResult>;

export interface D1PreparedStatementLike {
  bind(...values: D1Value[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1AllResult<T>>;
  run(): Promise<D1RunResult>;
}

export interface D1DatabaseLike {
  batch(statements: D1PreparedStatementLike[]): Promise<D1BatchResult>;
  prepare(query: string): D1PreparedStatementLike;
}

export interface KVNamespaceLike {
  get(key: string, type: "text"): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export type QueueSenderLike<T> = {
  send(body: T): Promise<void>;
};

export type QueueMessageLike<T> = {
  attempts: number;
  body: T;
  id: string;
};

export type QueueBatchLike<T> = {
  messages: Array<QueueMessageLike<T>>;
};

export type HostedPriceStoreLayout = {
  databasePath: string;
  migrationsDir: string;
};

export type HostedCaptureMode = "full" | "incremental";

export type HostedPipelineRunStatus =
  | "discovering"
  | "ingesting"
  | "ready_to_cook"
  | "cooking"
  | "ready_to_publish"
  | "publishing"
  | "succeeded"
  | "failed";

export type HostedPipelineRunRow = {
  runId: string;
  gameSlug: string;
  captureMode: HostedCaptureMode;
  status: HostedPipelineRunStatus;
  startedAt: string;
  discoveryCompletedAt: string | null;
  ingestionCompletedAt: string | null;
  cookStartedAt: string | null;
  cookCompletedAt: string | null;
  publishStartedAt: string | null;
  completedAt: string | null;
  updatedAfter: string | null;
  verifiedLimit: number;
  requestBudgetPerChunk: number;
  pageCount: number;
  chunkCount: number;
  completedChunkCount: number;
  remainingChunkCount: number;
  rawPageCount: number;
  cookedRowCount: number;
  publishedRowCount: number;
  cookEnqueueRequestedAt: string | null;
  publishEnqueueRequestedAt: string | null;
  livePublishedAt: string | null;
  latestError: string | null;
};

export type HostedIngestionChunkStatus = "queued" | "processing" | "completed";

export type HostedIngestionChunkRow = {
  chunkId: string;
  runId: string;
  pageStartIndex: number;
  pageEndIndex: number;
  requestCount: number;
  status: HostedIngestionChunkStatus;
  createdAt: string;
  claimedAt: string | null;
  completedAt: string | null;
  latestError: string | null;
};

export type HostedRawPageRow = {
  pageId: string;
  runId: string;
  pageIndex: number;
  pageOffset: number;
  capturedAt: string;
  requestUrl: string;
  rowCount: number;
  payloadJson: string;
};

export type HostedCookedPriceRow = {
  rowId: string;
  runId: string;
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
  runId: string;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  completedAt: string | null;
  manifestKey: string | null;
  snapshotKey: string | null;
  rowCount: number;
  message: string | null;
};

export type HostedPublishedArtifactRow = {
  artifactId: string;
  publishRunId: string;
  runId: string;
  gameKey: string;
  artifactType: string;
  payloadJson: string;
};

export type HostedPipelineStateKey =
  | "current_live_run_id"
  | "current_live_published_at"
  | "latest_successful_run_id";

export type HostedIngestionChunkMessage = {
  chunkId: string;
  game: string;
  includePriceHistory: boolean;
  includeStatistics: boolean;
  limit: number;
  pageEndIndex: number;
  pageStartIndex: number;
  runId: string;
  updatedAfter: string | null;
};

export type HostedCookMessage = {
  runId: string;
};

export type HostedPublishMessage = {
  runId: string;
};
