import { fetchJustTcgCards } from "../sources/justtcg/client.js";
import type { JustTcgConfig } from "../sources/justtcg/config.js";
import { createHostedPriceStoreRepository } from "./repository.js";
import type {
  D1DatabaseLike,
  HostedCookMessage,
  HostedIngestionChunkMessage,
  QueueSenderLike
} from "./types.js";

export type RunHostedPriceIngestionInput = {
  cookQueue: QueueSenderLike<HostedCookMessage>;
  database: D1DatabaseLike;
  message: HostedIngestionChunkMessage;
  requestDelayMs?: number;
  startedAt?: string;
};

export type HostedPriceIngestionResult = {
  chunkId: string;
  rawPageCount: number;
  runId: string;
  shouldEnqueueCook: boolean;
};

export async function runHostedPriceIngestion(
  input: RunHostedPriceIngestionInput,
  config: JustTcgConfig
): Promise<HostedPriceIngestionResult> {
  const repository = createHostedPriceStoreRepository(input.database);
  const claimedAt = input.startedAt ?? new Date().toISOString();
  const requestDelayMs = Math.max(0, input.requestDelayMs ?? 8_500);
  const claimed = await repository.claimChunk(input.message.chunkId, claimedAt);
  if (!claimed) {
    return {
      chunkId: input.message.chunkId,
      rawPageCount: 0,
      runId: input.message.runId,
      shouldEnqueueCook: false
    };
  }

  try {
    let rawPageCount = 0;

    for (let pageIndex = input.message.pageStartIndex; pageIndex <= input.message.pageEndIndex; pageIndex += 1) {
      const offset = (pageIndex - 1) * input.message.limit;
      const capturedAt = new Date().toISOString();
      const response = await fetchJustTcgCards(config, {
        game: input.message.game,
        limit: input.message.limit,
        offset,
        includePriceHistory: input.message.includePriceHistory,
        includeStatistics: input.message.includeStatistics,
        updatedAfter: input.message.updatedAfter
          ? Math.floor(new Date(input.message.updatedAfter).getTime() / 1000)
          : undefined
      });
      await repository.upsertRawPage({
        pageId: `${input.message.runId}::page-${String(pageIndex).padStart(3, "0")}`,
        runId: input.message.runId,
        pageIndex,
        pageOffset: offset,
        capturedAt,
        requestUrl: response.requestUrl,
        rowCount: response.data.data.length,
        payloadJson: JSON.stringify(response.data)
      });
      rawPageCount += 1;

      if (requestDelayMs > 0 && pageIndex < input.message.pageEndIndex) {
        await delay(requestDelayMs);
      }
    }

    const completion = await repository.completeChunk(input.message.chunkId, input.message.runId, new Date().toISOString());
    if (completion.shouldEnqueueCook) {
      await input.cookQueue.send({
        runId: input.message.runId
      });
    }

    return {
      chunkId: input.message.chunkId,
      rawPageCount,
      runId: input.message.runId,
      shouldEnqueueCook: completion.shouldEnqueueCook
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion failure";
    await repository.markChunkFailed(input.message.chunkId, message);
    throw error;
  }
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
