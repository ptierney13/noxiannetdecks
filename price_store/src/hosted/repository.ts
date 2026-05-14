import type {
  D1DatabaseLike,
  HostedCookedPriceRow,
  HostedIngestionChunkRow,
  HostedPipelineRunRow,
  HostedPipelineStateKey,
  HostedPublishRunRow,
  HostedPublishedArtifactRow,
  HostedRawPageRow
} from "./types.js";

type CountRow = {
  count: number;
};

function normalizeNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function normalizeNullableString(value: unknown): string | null {
  return value == null ? null : String(value);
}

const COOKED_ROW_INSERT_BATCH_SIZE = 250;

function mapRun(row: Record<string, unknown>): HostedPipelineRunRow {
  return {
    runId: String(row.run_id),
    gameSlug: String(row.game_slug),
    captureMode: String(row.capture_mode) === "incremental" ? "incremental" : "full",
    status: String(row.status) as HostedPipelineRunRow["status"],
    startedAt: String(row.started_at),
    discoveryCompletedAt: normalizeNullableString(row.discovery_completed_at),
    ingestionCompletedAt: normalizeNullableString(row.ingestion_completed_at),
    cookStartedAt: normalizeNullableString(row.cook_started_at),
    cookCompletedAt: normalizeNullableString(row.cook_completed_at),
    publishStartedAt: normalizeNullableString(row.publish_started_at),
    completedAt: normalizeNullableString(row.completed_at),
    updatedAfter: normalizeNullableString(row.updated_after),
    verifiedLimit: normalizeNumber(row.verified_limit),
    requestBudgetPerChunk: normalizeNumber(row.request_budget_per_chunk),
    pageCount: normalizeNumber(row.page_count),
    chunkCount: normalizeNumber(row.chunk_count),
    completedChunkCount: normalizeNumber(row.completed_chunk_count),
    remainingChunkCount: normalizeNumber(row.remaining_chunk_count),
    rawPageCount: normalizeNumber(row.raw_page_count),
    cookedRowCount: normalizeNumber(row.cooked_row_count),
    publishedRowCount: normalizeNumber(row.published_row_count),
    cookEnqueueRequestedAt: normalizeNullableString(row.cook_enqueue_requested_at),
    publishEnqueueRequestedAt: normalizeNullableString(row.publish_enqueue_requested_at),
    livePublishedAt: normalizeNullableString(row.live_published_at),
    latestError: normalizeNullableString(row.latest_error)
  };
}

function mapChunk(row: Record<string, unknown>): HostedIngestionChunkRow {
  return {
    chunkId: String(row.chunk_id),
    runId: String(row.run_id),
    pageStartIndex: normalizeNumber(row.page_start_index),
    pageEndIndex: normalizeNumber(row.page_end_index),
    requestCount: normalizeNumber(row.request_count),
    status: String(row.status) as HostedIngestionChunkRow["status"],
    createdAt: String(row.created_at),
    claimedAt: normalizeNullableString(row.claimed_at),
    completedAt: normalizeNullableString(row.completed_at),
    latestError: normalizeNullableString(row.latest_error)
  };
}

function mapRawPage(row: Record<string, unknown>): HostedRawPageRow {
  return {
    pageId: String(row.page_id),
    runId: String(row.run_id),
    pageIndex: normalizeNumber(row.page_index),
    pageOffset: normalizeNumber(row.page_offset),
    capturedAt: String(row.captured_at),
    requestUrl: String(row.request_url),
    rowCount: normalizeNumber(row.row_count),
    payloadJson: String(row.payload_json)
  };
}

function mapCookedRow(row: Record<string, unknown>): HostedCookedPriceRow {
  return {
    rowId: String(row.row_id),
    runId: String(row.run_id),
    upstreamProviderId: "justtcg",
    priceSourceId: "tcgplayer",
    gameSlug: String(row.game_slug),
    sourceCardId: String(row.source_card_id),
    sourceVariantId: String(row.source_variant_id),
    tcgplayerId: normalizeNullableString(row.tcgplayer_id),
    tcgplayerSkuId: normalizeNullableString(row.tcgplayer_sku_id),
    language: normalizeNullableString(row.language),
    condition: normalizeNullableString(row.condition_name),
    printing: normalizeNullableString(row.printing),
    currency: "USD",
    currentPriceAmount: row.current_price_amount == null ? null : normalizeNumber(row.current_price_amount),
    currentPriceLastUpdatedAt: normalizeNullableString(row.current_price_last_updated_at),
    priceHistoryJson: String(row.price_history_json)
  };
}

function mapPublishRun(row: Record<string, unknown>): HostedPublishRunRow {
  return {
    publishRunId: String(row.publish_run_id),
    runId: String(row.run_id),
    status: String(row.status) as HostedPublishRunRow["status"],
    startedAt: String(row.started_at),
    completedAt: normalizeNullableString(row.completed_at),
    manifestKey: normalizeNullableString(row.manifest_key),
    snapshotKey: normalizeNullableString(row.snapshot_key),
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

    async insertRun(row: HostedPipelineRunRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_pipeline_runs (
            run_id, game_slug, capture_mode, status, started_at, discovery_completed_at,
            ingestion_completed_at, cook_started_at, cook_completed_at, publish_started_at,
            completed_at, updated_after, verified_limit, request_budget_per_chunk, page_count,
            chunk_count, completed_chunk_count, remaining_chunk_count, raw_page_count,
            cooked_row_count, published_row_count, cook_enqueue_requested_at,
            publish_enqueue_requested_at, live_published_at, latest_error, created_at, updated_at
          ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18,
            ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27
          )
        `)
        .bind(
          row.runId,
          row.gameSlug,
          row.captureMode,
          row.status,
          row.startedAt,
          row.discoveryCompletedAt,
          row.ingestionCompletedAt,
          row.cookStartedAt,
          row.cookCompletedAt,
          row.publishStartedAt,
          row.completedAt,
          row.updatedAfter,
          row.verifiedLimit,
          row.requestBudgetPerChunk,
          row.pageCount,
          row.chunkCount,
          row.completedChunkCount,
          row.remainingChunkCount,
          row.rawPageCount,
          row.cookedRowCount,
          row.publishedRowCount,
          row.cookEnqueueRequestedAt,
          row.publishEnqueueRequestedAt,
          row.livePublishedAt,
          row.latestError,
          row.startedAt,
          row.startedAt
        )
        .run();
    },

    async updateRun(row: HostedPipelineRunRow): Promise<void> {
      await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET game_slug = ?2,
              capture_mode = ?3,
              status = ?4,
              discovery_completed_at = ?5,
              ingestion_completed_at = ?6,
              cook_started_at = ?7,
              cook_completed_at = ?8,
              publish_started_at = ?9,
              completed_at = ?10,
              updated_after = ?11,
              verified_limit = ?12,
              request_budget_per_chunk = ?13,
              page_count = ?14,
              chunk_count = ?15,
              completed_chunk_count = ?16,
              remaining_chunk_count = ?17,
              raw_page_count = ?18,
              cooked_row_count = ?19,
              published_row_count = ?20,
              cook_enqueue_requested_at = ?21,
              publish_enqueue_requested_at = ?22,
              live_published_at = ?23,
              latest_error = ?24,
              updated_at = ?25
          WHERE run_id = ?1
        `)
        .bind(
          row.runId,
          row.gameSlug,
          row.captureMode,
          row.status,
          row.discoveryCompletedAt,
          row.ingestionCompletedAt,
          row.cookStartedAt,
          row.cookCompletedAt,
          row.publishStartedAt,
          row.completedAt,
          row.updatedAfter,
          row.verifiedLimit,
          row.requestBudgetPerChunk,
          row.pageCount,
          row.chunkCount,
          row.completedChunkCount,
          row.remainingChunkCount,
          row.rawPageCount,
          row.cookedRowCount,
          row.publishedRowCount,
          row.cookEnqueueRequestedAt,
          row.publishEnqueueRequestedAt,
          row.livePublishedAt,
          row.latestError,
          new Date().toISOString()
        )
        .run();
    },

    async getRun(runId: string): Promise<HostedPipelineRunRow | null> {
      const row = await database
        .prepare("SELECT * FROM price_pipeline_runs WHERE run_id = ?1")
        .bind(runId)
        .first<Record<string, unknown>>();
      return row ? mapRun(row) : null;
    },

    async getLatestSuccessfulRun(): Promise<HostedPipelineRunRow | null> {
      const row = await database
        .prepare(`
          SELECT * FROM price_pipeline_runs
          WHERE status = 'succeeded'
          ORDER BY completed_at DESC, started_at DESC
          LIMIT 1
        `)
        .first<Record<string, unknown>>();
      return row ? mapRun(row) : null;
    },

    async insertChunk(row: HostedIngestionChunkRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_ingestion_chunks (
            chunk_id, run_id, page_start_index, page_end_index, request_count,
            status, created_at, claimed_at, completed_at, latest_error
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        `)
        .bind(
          row.chunkId,
          row.runId,
          row.pageStartIndex,
          row.pageEndIndex,
          row.requestCount,
          row.status,
          row.createdAt,
          row.claimedAt,
          row.completedAt,
          row.latestError
        )
        .run();
    },

    async listChunks(runId: string): Promise<HostedIngestionChunkRow[]> {
      const rows = await database
        .prepare(`
          SELECT * FROM price_ingestion_chunks
          WHERE run_id = ?1
          ORDER BY page_start_index ASC
        `)
        .bind(runId)
        .all<Record<string, unknown>>();
      return rows.results.map(mapChunk);
    },

    async getChunk(chunkId: string): Promise<HostedIngestionChunkRow | null> {
      const row = await database
        .prepare("SELECT * FROM price_ingestion_chunks WHERE chunk_id = ?1")
        .bind(chunkId)
        .first<Record<string, unknown>>();
      return row ? mapChunk(row) : null;
    },

    async claimChunk(chunkId: string, claimedAt: string): Promise<boolean> {
      const result = await database
        .prepare(`
          UPDATE price_ingestion_chunks
          SET status = 'processing',
              claimed_at = ?2,
              latest_error = NULL
          WHERE chunk_id = ?1
            AND status != 'completed'
        `)
        .bind(chunkId, claimedAt)
        .run();
      return normalizeNumber(result.meta?.changes) > 0;
    },

    async markChunkFailed(chunkId: string, message: string): Promise<void> {
      await database
        .prepare(`
          UPDATE price_ingestion_chunks
          SET status = 'queued',
              latest_error = ?2
          WHERE chunk_id = ?1
            AND status != 'completed'
        `)
        .bind(chunkId, message)
        .run();
    },

    async upsertRawPage(row: HostedRawPageRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_raw_pages (
            page_id, run_id, page_index, page_offset, captured_at, request_url,
            row_count, payload_json, created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
          ON CONFLICT(run_id, page_index) DO UPDATE SET
            page_id = excluded.page_id,
            page_offset = excluded.page_offset,
            captured_at = excluded.captured_at,
            request_url = excluded.request_url,
            row_count = excluded.row_count,
            payload_json = excluded.payload_json
        `)
        .bind(
          row.pageId,
          row.runId,
          row.pageIndex,
          row.pageOffset,
          row.capturedAt,
          row.requestUrl,
          row.rowCount,
          row.payloadJson,
          row.capturedAt
        )
        .run();
    },

    async listRawPages(runId: string): Promise<HostedRawPageRow[]> {
      const rows = await database
        .prepare(`
          SELECT * FROM price_raw_pages
          WHERE run_id = ?1
          ORDER BY page_index ASC
        `)
        .bind(runId)
        .all<Record<string, unknown>>();
      return rows.results.map(mapRawPage);
    },

    async completeChunk(chunkId: string, runId: string, completedAt: string): Promise<{ chunkCompleted: boolean; shouldEnqueueCook: boolean }> {
      const markChunk = await database
        .prepare(`
          UPDATE price_ingestion_chunks
          SET status = 'completed',
              completed_at = ?2,
              latest_error = NULL
          WHERE chunk_id = ?1
            AND status != 'completed'
        `)
        .bind(chunkId, completedAt)
        .run();
      const chunkCompleted = normalizeNumber(markChunk.meta?.changes) > 0;

      if (!chunkCompleted) {
        return {
          chunkCompleted: false,
          shouldEnqueueCook: false
        };
      }

      const chunk = await this.getChunk(chunkId);
      if (!chunk) {
        throw new Error(`Chunk ${chunkId} disappeared before completion could be recorded.`);
      }

      await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET completed_chunk_count = completed_chunk_count + 1,
              remaining_chunk_count = CASE
                WHEN remaining_chunk_count > 0 THEN remaining_chunk_count - 1
                ELSE 0
              END,
              raw_page_count = raw_page_count + ?2,
              updated_at = ?3
          WHERE run_id = ?1
        `)
        .bind(runId, chunk.requestCount, completedAt)
        .run();

      const enqueueCook = await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET status = 'ready_to_cook',
              ingestion_completed_at = COALESCE(ingestion_completed_at, ?2),
              cook_enqueue_requested_at = ?2,
              updated_at = ?2
          WHERE run_id = ?1
            AND remaining_chunk_count = 0
            AND cook_enqueue_requested_at IS NULL
        `)
        .bind(runId, completedAt)
        .run();

      return {
        chunkCompleted: true,
        shouldEnqueueCook: normalizeNumber(enqueueCook.meta?.changes) > 0
      };
    },

    async claimCook(runId: string, startedAt: string): Promise<boolean> {
      const result = await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET status = 'cooking',
              cook_started_at = COALESCE(cook_started_at, ?2),
              latest_error = NULL,
              updated_at = ?2
          WHERE run_id = ?1
            AND status IN ('ready_to_cook', 'cooking')
        `)
        .bind(runId, startedAt)
        .run();
      return normalizeNumber(result.meta?.changes) > 0;
    },

    async replaceCookedRows(runId: string, rows: HostedCookedPriceRow[]): Promise<void> {
      await database
        .prepare("DELETE FROM price_cooked_rows WHERE run_id = ?1")
        .bind(runId)
        .run();

      for (let index = 0; index < rows.length; index += COOKED_ROW_INSERT_BATCH_SIZE) {
        const batch = rows.slice(index, index + COOKED_ROW_INSERT_BATCH_SIZE);
        const template = database.prepare(`
            INSERT INTO price_cooked_rows (
              row_id, run_id, upstream_provider_id, price_source_id, game_slug,
              source_card_id, source_variant_id, tcgplayer_id, tcgplayer_sku_id,
              language, condition_name, printing, currency, current_price_amount,
              current_price_last_updated_at, price_history_json, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
          `);
        const statements = batch.map((row) =>
          template.bind(
            row.rowId,
            row.runId,
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
        );
        await database.batch(statements);
      }
    },

    async listCookedRows(runId: string): Promise<HostedCookedPriceRow[]> {
      const rows = await database
        .prepare(`
          SELECT * FROM price_cooked_rows
          WHERE run_id = ?1
          ORDER BY source_card_id ASC, source_variant_id ASC
        `)
        .bind(runId)
        .all<Record<string, unknown>>();
      return rows.results.map(mapCookedRow);
    },

    async completeCook(runId: string, rowCount: number, completedAt: string): Promise<boolean> {
      await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET status = 'ready_to_publish',
              cook_completed_at = ?2,
              cooked_row_count = ?3,
              latest_error = NULL,
              updated_at = ?2
          WHERE run_id = ?1
        `)
        .bind(runId, completedAt, rowCount)
        .run();

      const enqueuePublish = await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET publish_enqueue_requested_at = ?2,
              updated_at = ?2
          WHERE run_id = ?1
            AND publish_enqueue_requested_at IS NULL
        `)
        .bind(runId, completedAt)
        .run();
      return normalizeNumber(enqueuePublish.meta?.changes) > 0;
    },

    async markRunFailed(runId: string, message: string, failedAt: string): Promise<void> {
      await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET status = 'failed',
              latest_error = ?2,
              completed_at = ?3,
              updated_at = ?3
          WHERE run_id = ?1
        `)
        .bind(runId, message, failedAt)
        .run();
    },

    async claimPublish(runId: string, startedAt: string): Promise<boolean> {
      const result = await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET status = 'publishing',
              publish_started_at = COALESCE(publish_started_at, ?2),
              latest_error = NULL,
              updated_at = ?2
          WHERE run_id = ?1
            AND status IN ('ready_to_publish', 'publishing')
        `)
        .bind(runId, startedAt)
        .run();
      return normalizeNumber(result.meta?.changes) > 0;
    },

    async insertPublishRun(row: HostedPublishRunRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_publish_runs (
            publish_run_id, run_id, status, started_at, completed_at, manifest_key,
            snapshot_key, row_count, message, created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        `)
        .bind(
          row.publishRunId,
          row.runId,
          row.status,
          row.startedAt,
          row.completedAt,
          row.manifestKey,
          row.snapshotKey,
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
              manifest_key = ?4,
              snapshot_key = ?5,
              row_count = ?6,
              message = ?7,
              updated_at = ?8
          WHERE publish_run_id = ?1
        `)
        .bind(
          row.publishRunId,
          row.status,
          row.completedAt,
          row.manifestKey,
          row.snapshotKey,
          row.rowCount,
          row.message,
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
    },

    async upsertPublishedArtifact(row: HostedPublishedArtifactRow): Promise<void> {
      await database
        .prepare(`
          INSERT INTO price_publish_artifacts (
            artifact_id, publish_run_id, run_id, game_key, artifact_type, payload_json,
            created_at, updated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
          ON CONFLICT(run_id, game_key, artifact_type) DO UPDATE SET
            artifact_id = excluded.artifact_id,
            publish_run_id = excluded.publish_run_id,
            payload_json = excluded.payload_json,
            updated_at = excluded.updated_at
        `)
        .bind(
          row.artifactId,
          row.publishRunId,
          row.runId,
          row.gameKey,
          row.artifactType,
          row.payloadJson,
          new Date().toISOString(),
          new Date().toISOString()
        )
        .run();
    },

    async completePublish(
      runId: string,
      input: { completedAt: string; livePublishedAt: string; publishedRowCount: number }
    ): Promise<void> {
      await database
        .prepare(`
          UPDATE price_pipeline_runs
          SET status = 'succeeded',
              published_row_count = ?2,
              live_published_at = ?3,
              completed_at = ?4,
              latest_error = NULL,
              updated_at = ?4
          WHERE run_id = ?1
        `)
        .bind(runId, input.publishedRowCount, input.livePublishedAt, input.completedAt)
        .run();
    },

    async countRunsOlderThan(cutoffIso: string, currentLiveRunId: string | null): Promise<number> {
      const row = await database
        .prepare(`
          SELECT COUNT(*) AS count
          FROM price_pipeline_runs
          WHERE started_at < ?1
            AND (?2 IS NULL OR run_id != ?2)
        `)
        .bind(cutoffIso, currentLiveRunId)
        .first<CountRow>();
      return row?.count ?? 0;
    },

    async deleteRunsOlderThan(cutoffIso: string, currentLiveRunId: string | null): Promise<number> {
      const result = await database
        .prepare(`
          DELETE FROM price_pipeline_runs
          WHERE started_at < ?1
            AND (?2 IS NULL OR run_id != ?2)
        `)
        .bind(cutoffIso, currentLiveRunId)
        .run();
      return normalizeNumber(result.meta?.changes);
    }
  };
}
