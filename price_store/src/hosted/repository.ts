import type {
  D1DatabaseLike,
  HostedCapturePageRow,
  HostedCaptureRunRow,
  HostedPipelineStateKey,
  HostedPriceDataRow,
  HostedProcessRunRow,
  HostedPublishedArtifactRow,
  HostedPublishRunRow
} from "./types.js";

type CountRow = {
  count: number;
};

function normalizeBoolean(value: unknown): boolean {
  return value === 1 || value === "1" || value === true;
}

function normalizeNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function normalizeNullableNumber(value: unknown): number | null {
  return value == null ? null : normalizeNumber(value);
}

function normalizeNullableString(value: unknown): string | null {
  return value == null ? null : String(value);
}

function mapCaptureRun(row: Record<string, unknown>): HostedCaptureRunRow {
  return {
    runId: String(row.run_id),
    captureMode: String(row.capture_mode) === "incremental" ? "incremental" : "full",
    gameSlug: String(row.game_slug),
    status: String(row.status) as HostedCaptureRunRow["status"],
    startedAt: String(row.started_at),
    completedAt: normalizeNullableString(row.completed_at),
    updatedAfter: normalizeNullableString(row.updated_after),
    requestCount: normalizeNumber(row.request_count),
    pageCount: normalizeNumber(row.page_count),
    cardCount: normalizeNumber(row.card_count),
    verifiedLimit: normalizeNullableNumber(row.verified_limit),
    includePriceHistory: normalizeBoolean(row.include_price_history),
    includeStatistics: normalizeBoolean(row.include_statistics),
    message: normalizeNullableString(row.message)
  };
}

function mapCapturePage(row: Record<string, unknown>): HostedCapturePageRow {
  return {
    pageId: String(row.page_id),
    captureRunId: String(row.capture_run_id),
    pageIndex: normalizeNumber(row.page_index),
    pageOffset: normalizeNumber(row.page_offset),
    capturedAt: String(row.captured_at),
    requestUrl: String(row.request_url),
    rowCount: normalizeNumber(row.row_count),
    payloadJson: String(row.payload_json),
    expiresAt: String(row.expires_at)
  };
}

function mapProcessRun(row: Record<string, unknown>): HostedProcessRunRow {
  return {
    processRunId: String(row.process_run_id),
    captureRunId: String(row.capture_run_id),
    status: String(row.status) as HostedProcessRunRow["status"],
    startedAt: String(row.started_at),
    completedAt: normalizeNullableString(row.completed_at),
    rowCount: normalizeNumber(row.row_count),
    message: normalizeNullableString(row.message)
  };
}

function mapPriceData(row: Record<string, unknown>): HostedPriceDataRow {
  return {
    rowId: String(row.row_id),
    processRunId: String(row.process_run_id),
    captureRunId: String(row.capture_run_id),
    upstreamProviderId: "justtcg",
    priceSourceId: "tcgplayer",
    gameSlug: String(row.game_slug),
    sourceCardId: String(row.source_card_id),
    sourceVariantId: String(row.source_variant_id),
    tcgplayerId: normalizeNullableString(row.tcgplayer_id),
    tcgplayerSkuId: normalizeNullableString(row.tcgplayer_sku_id),
    language: normalizeNullableString(row.language),
    condition: normalizeNullableString(row.condition),
    printing: normalizeNullableString(row.printing),
    currency: "USD",
    currentPriceAmount: normalizeNullableNumber(row.current_price_amount),
    currentPriceLastUpdatedAt: normalizeNullableString(row.current_price_last_updated_at),
    priceHistoryJson: String(row.price_history_json)
  };
}

function mapPublishRun(row: Record<string, unknown>): HostedPublishRunRow {
  return {
    publishRunId: String(row.publish_run_id),
    processRunId: String(row.process_run_id),
    captureRunId: String(row.capture_run_id),
    status: String(row.status) as HostedPublishRunRow["status"],
    startedAt: String(row.started_at),
    completedAt: normalizeNullableString(row.completed_at),
    artifactCount: normalizeNumber(row.artifact_count),
    rowCount: normalizeNumber(row.row_count),
    message: normalizeNullableString(row.message)
  };
}

export function createHostedPriceStoreRepository(database: D1DatabaseLike) {
  return {
    async setPipelineState(key: HostedPipelineStateKey, value: string | null): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_pipeline_state (state_key, state_value, updated_at)
          VALUES (?1, ?2, ?3)
          ON CONFLICT(state_key) DO UPDATE SET
            state_value = excluded.state_value,
            updated_at = excluded.updated_at
        `)
        .bind(key, value, new Date().toISOString())
        .run();
    },

    async getPipelineState(key: HostedPipelineStateKey): Promise<string | null> {
      return (
        await database
          .prepare("SELECT state_value FROM price_pipeline_state WHERE state_key = ?1")
          .bind(key)
          .first<string>("state_value")
      ) ?? null;
    },

    async insertCaptureRun(row: HostedCaptureRunRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_capture_justtcg_runs (
            run_id, capture_mode, game_slug, status, started_at, completed_at, updated_after,
            request_count, page_count, card_count, verified_limit, include_price_history,
            include_statistics, message, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
        `)
        .bind(
          row.runId,
          row.captureMode,
          row.gameSlug,
          row.status,
          row.startedAt,
          row.completedAt,
          row.updatedAfter,
          row.requestCount,
          row.pageCount,
          row.cardCount,
          row.verifiedLimit,
          row.includePriceHistory ? 1 : 0,
          row.includeStatistics ? 1 : 0,
          row.message,
          row.startedAt,
          row.startedAt
        )
        .run();
    },

    async updateCaptureRun(row: HostedCaptureRunRow): Promise<void> {
      await database
        .prepare(`
          UPDATE price_capture_justtcg_runs
          SET status = ?2,
              completed_at = ?3,
              updated_after = ?4,
              request_count = ?5,
              page_count = ?6,
              card_count = ?7,
              verified_limit = ?8,
              include_price_history = ?9,
              include_statistics = ?10,
              message = ?11,
              updated_at = ?12
          WHERE run_id = ?1
        `)
        .bind(
          row.runId,
          row.status,
          row.completedAt,
          row.updatedAfter,
          row.requestCount,
          row.pageCount,
          row.cardCount,
          row.verifiedLimit,
          row.includePriceHistory ? 1 : 0,
          row.includeStatistics ? 1 : 0,
          row.message,
          new Date().toISOString()
        )
        .run();
    },

    async getCaptureRun(runId: string): Promise<HostedCaptureRunRow | null> {
      const row = await database
        .prepare("SELECT * FROM price_capture_justtcg_runs WHERE run_id = ?1")
        .bind(runId)
        .first<Record<string, unknown>>();

      return row ? mapCaptureRun(row) : null;
    },

    async getLatestSuccessfulCaptureRun(): Promise<HostedCaptureRunRow | null> {
      const row = await database
        .prepare(`
          SELECT * FROM price_capture_justtcg_runs
          WHERE status = 'succeeded'
          ORDER BY completed_at DESC, started_at DESC
          LIMIT 1
        `)
        .first<Record<string, unknown>>();

      return row ? mapCaptureRun(row) : null;
    },

    async countRunningCaptureRuns(): Promise<number> {
      const row = await database
        .prepare("SELECT COUNT(*) AS count FROM price_capture_justtcg_runs WHERE status = 'running'")
        .first<CountRow>();
      return row?.count ?? 0;
    },

    async insertCapturePage(row: HostedCapturePageRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_capture_justtcg_pages (
            page_id, capture_run_id, page_index, page_offset, captured_at, request_url,
            row_count, payload_json, expires_at, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        `)
        .bind(
          row.pageId,
          row.captureRunId,
          row.pageIndex,
          row.pageOffset,
          row.capturedAt,
          row.requestUrl,
          row.rowCount,
          row.payloadJson,
          row.expiresAt,
          row.capturedAt
        )
        .run();
    },

    async listCapturePages(captureRunId: string): Promise<HostedCapturePageRow[]> {
      const rows = await database
        .prepare(`
          SELECT * FROM price_capture_justtcg_pages
          WHERE capture_run_id = ?1
          ORDER BY page_index ASC
        `)
        .bind(captureRunId)
        .all<Record<string, unknown>>();

      return rows.results.map(mapCapturePage);
    },

    async deleteExpiredCapturePages(expiresBefore: string): Promise<number> {
      const result = await database
        .prepare("DELETE FROM price_capture_justtcg_pages WHERE expires_at <= ?1")
        .bind(expiresBefore)
        .run();
      return normalizeNumber(result.meta?.changes);
    },

    async insertProcessRun(row: HostedProcessRunRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_process_runs (
            process_run_id, capture_run_id, status, started_at, completed_at,
            row_count, message, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        `)
        .bind(
          row.processRunId,
          row.captureRunId,
          row.status,
          row.startedAt,
          row.completedAt,
          row.rowCount,
          row.message,
          row.startedAt,
          row.startedAt
        )
        .run();
    },

    async updateProcessRun(row: HostedProcessRunRow): Promise<void> {
      await database
        .prepare(`
          UPDATE price_process_runs
          SET status = ?2,
              completed_at = ?3,
              row_count = ?4,
              message = ?5,
              updated_at = ?6
          WHERE process_run_id = ?1
        `)
        .bind(
          row.processRunId,
          row.status,
          row.completedAt,
          row.rowCount,
          row.message,
          new Date().toISOString()
        )
        .run();
    },

    async getProcessRun(processRunId: string): Promise<HostedProcessRunRow | null> {
      const row = await database
        .prepare("SELECT * FROM price_process_runs WHERE process_run_id = ?1")
        .bind(processRunId)
        .first<Record<string, unknown>>();
      return row ? mapProcessRun(row) : null;
    },

    async getLatestSuccessfulProcessRun(): Promise<HostedProcessRunRow | null> {
      const row = await database
        .prepare(`
          SELECT * FROM price_process_runs
          WHERE status = 'succeeded'
          ORDER BY completed_at DESC, started_at DESC
          LIMIT 1
        `)
        .first<Record<string, unknown>>();
      return row ? mapProcessRun(row) : null;
    },

    async countRunningProcessRuns(): Promise<number> {
      const row = await database
        .prepare("SELECT COUNT(*) AS count FROM price_process_runs WHERE status = 'running'")
        .first<CountRow>();
      return row?.count ?? 0;
    },

    async replacePriceDataForProcessRun(processRunId: string, rows: HostedPriceDataRow[]): Promise<void> {
      await database
        .prepare("DELETE FROM price_data WHERE process_run_id = ?1")
        .bind(processRunId)
        .run();

      for (const row of rows) {
        await database
          .prepare(`
            INSERT INTO price_data (
              row_id, process_run_id, capture_run_id, upstream_provider_id, price_source_id,
              game_slug, source_card_id, source_variant_id, tcgplayer_id, tcgplayer_sku_id,
              language, condition, printing, currency, current_price_amount,
              current_price_last_updated_at, price_history_json, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
          `)
          .bind(
            row.rowId,
            row.processRunId,
            row.captureRunId,
            row.upstreamProviderId,
            row.priceSourceId,
            row.gameSlug,
            row.sourceCardId,
            row.sourceVariantId,
            row.tcgplayerId,
            row.tcgplayerSkuId,
            row.language,
            row.condition,
            row.printing,
            row.currency,
            row.currentPriceAmount,
            row.currentPriceLastUpdatedAt,
            row.priceHistoryJson,
            new Date().toISOString()
          )
          .run();
      }
    },

    async listPriceDataForProcessRun(processRunId: string): Promise<HostedPriceDataRow[]> {
      const rows = await database
        .prepare(`
          SELECT * FROM price_data
          WHERE process_run_id = ?1
          ORDER BY source_card_id ASC, source_variant_id ASC
        `)
        .bind(processRunId)
        .all<Record<string, unknown>>();

      return rows.results.map(mapPriceData);
    },

    async insertPublishRun(row: HostedPublishRunRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_publish_runs (
            publish_run_id, process_run_id, capture_run_id, status, started_at,
            completed_at, artifact_count, row_count, message, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        `)
        .bind(
          row.publishRunId,
          row.processRunId,
          row.captureRunId,
          row.status,
          row.startedAt,
          row.completedAt,
          row.artifactCount,
          row.rowCount,
          row.message,
          row.startedAt,
          row.startedAt
        )
        .run();
    },

    async updatePublishRun(row: HostedPublishRunRow): Promise<void> {
      await database
        .prepare(`
          UPDATE price_publish_runs
          SET status = ?2,
              completed_at = ?3,
              artifact_count = ?4,
              row_count = ?5,
              message = ?6,
              updated_at = ?7
          WHERE publish_run_id = ?1
        `)
        .bind(
          row.publishRunId,
          row.status,
          row.completedAt,
          row.artifactCount,
          row.rowCount,
          row.message,
          new Date().toISOString()
        )
        .run();
    },

    async upsertPublishedArtifact(row: HostedPublishedArtifactRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_publish_artifacts (
            artifact_id, publish_run_id, process_run_id, capture_run_id, game_key,
            artifact_type, payload_json, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
          ON CONFLICT(game_key, artifact_type) DO UPDATE SET
            artifact_id = excluded.artifact_id,
            publish_run_id = excluded.publish_run_id,
            process_run_id = excluded.process_run_id,
            capture_run_id = excluded.capture_run_id,
            payload_json = excluded.payload_json,
            updated_at = excluded.updated_at
        `)
        .bind(
          row.artifactId,
          row.publishRunId,
          row.processRunId,
          row.captureRunId,
          row.gameKey,
          row.artifactType,
          row.payloadJson,
          new Date().toISOString(),
          new Date().toISOString()
        )
        .run();
    },

    async getLatestSuccessfulPublishRun(): Promise<HostedPublishRunRow | null> {
      const row = await database
        .prepare(`
          SELECT * FROM price_publish_runs
          WHERE status = 'succeeded'
          ORDER BY completed_at DESC, started_at DESC
          LIMIT 1
        `)
        .first<Record<string, unknown>>();
      return row ? mapPublishRun(row) : null;
    }
  };
}
