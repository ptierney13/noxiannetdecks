# Price Store Stage 7.2 Queue-Based Hosted Worker Re-Architecture

## Status

This plan must be manually approved before implementation begins.

When Stage 7.2 is completed, refresh the Stage 7.2.1, Stage 7.3, and any later
`price-store` draft summaries with the final runtime shape, Cloudflare
configuration facts, and any newly discovered operational caveats.

## Summary

Stage 7.2 replaces the current hosted price-store worker architecture with a
queue-based Cloudflare runtime built around discovery, ingestion, cook,
publish, and maintenance workers.

This stage should leave the repo and Cloudflare setup in a state where:

- discovery runs on a Cloudflare Cron Trigger and generates one `runId` per
  refresh
- discovery determines the total page count and enqueues ingestion chunks sized
  to stay within a 45-request processing budget
- ingestion is queue-driven, persists raw upstream payloads into D1, and is
  configured so only one consumer instance runs at a time
- the final ingestion completion path uses D1-tracked run state and
  transactional completion updates to enqueue exactly one cook job
- cook is queue-driven and converts the raw captured batch for a run into the
  relational publishable shape
- publish is queue-driven and writes the site-serving manifest/snapshot payloads
  to KV and the supporting records to D1
- maintenance runs every two days and removes run data older than one week past
  the currently live KV snapshot
- the incorrect current price ingestion and processing flow is removed rather
  than left in place beside the replacement pipeline
- the live site can keep reading the existing frontend contract while the old
  generation path remains available during rollout
- the operator docs explain the exact D1, Queue, KV, Worker, secret, and
  trigger setup steps plus any required manual migrations

This plan explicitly supersedes earlier Stage 7.1 and pre-rearchitecture Stage
7.2 runtime assumptions. Those documents remain useful as historical context,
but they are not restrictions on this implementation.

## Confirmed Starting Point

- The repo currently has a hosted capture/process/publish code path plus three
  worker entrypoints for capture, publish, and maintenance.
- The current D1 schema and repository are centered on:
  - `price_capture_justtcg_runs`
  - `price_capture_justtcg_pages`
  - `price_process_runs`
  - `price_data`
  - `price_publish_runs`
  - `price_publish_artifacts`
  - `price_pipeline_state`
- The current runtime shape does not match the desired queue-based boundaries:
  - capture owns upstream paging directly instead of splitting discovery from
    ingestion
  - publish still runs process internally instead of being a separate final
    stage
  - there is no queue-backed ingestion serialization
  - there is no D1-tracked "last ingestion chunk finished, enqueue cook once"
    coordination model
- There is no persisted data worth preserving. Breaking schema changes and
  table replacement are acceptable if the plan includes the necessary migration
  and Cloudflare update steps.

## Key Changes

### 1. Replace the runtime model with a five-worker queue pipeline

Stage 7.2 should make the hosted boundary match the desired production shape:

- discovery worker
  - deployed as `noxian-price-discovery`
  - runs on a schedule
  - verifies or discovers the effective page limit
  - determines how many upstream pages exist for the run
  - creates the new `runId`
  - persists a top-level run record in D1
  - partitions the work into ingestion chunks sized for 45 requests each
  - enqueues those chunks to the ingestion queue
- ingestion worker
  - deployed as `noxian-price-ingestion`
  - is triggered only by queue messages
  - reads exactly the pages declared in a chunk message
  - stores the raw upstream page payloads in D1
  - records per-chunk and per-page completion in D1
  - uses transactional completion logic so the "last chunk wins" path enqueues
    cook exactly once
- cook worker
  - deployed as `noxian-price-cook`
  - is triggered only after ingestion is fully complete for a run
  - reads the raw run payloads from D1
  - converts them into the relational publishable shape needed by the site
  - records cook run status and output counts in D1
  - enqueues the publish instruction when cook succeeds
- publish worker
  - deployed as `noxian-price-publish`
  - is triggered only after cook succeeds
  - writes the current frontend manifest/snapshot artifacts to KV
  - records publish completion and current-live pointers in D1
- maintenance worker
  - deployed as `noxian-maintenance`
  - runs every two days
  - uses the currently live KV-backed snapshot/run metadata as the retention
    anchor
  - deletes data older than one week beyond the live snapshot

### 2. Rebuild the D1 schema around shared runs and queue coordination

Multiple runs should coexist in the same general tables, keyed by `runId`.
Stage 7.2 should replace or heavily reshape the existing schema so D1 tracks:

- top-level refresh runs
  - lifecycle status across discovery, ingestion, cook, and publish
  - scheduling and completion timestamps
  - source game, mode, and summary counts
- ingestion chunks
  - chunk id, run id, page start/end, expected request count, queue status,
    claimed/completed timestamps, and whether cook was already enqueued from
    this completion path
- raw ingested pages
  - run id, page index, request URL, capture timestamp, row count, and raw
    payload JSON
- cooked price rows or equivalent normalized relational truth
  - stored by run id so publish can operate without re-fetching upstream data
- publish runs and published artifact records
  - enough to identify which run is currently live and what was written
- global pipeline metadata
  - latest live run
  - latest live published timestamp
  - any retention anchor fields needed by maintenance

Implementation direction:

- prefer a clean new migration over compatibility shims
- use explicit status enums/strings per phase instead of overloading the old
  capture/process/publish tables
- remove the incorrect existing capture/process/publish ingestion flow rather
  than keep both architectures active in parallel
- add indexes around:
  - runs by status and completion
  - chunks by run and status
  - raw pages by run and page index
  - cooked rows by run and publish joins

### 3. Make ingestion serialization an explicit Cloudflare queue requirement

The ingestion queue must be configured so only one ingestion consumer instance
runs at a time.

Stage 7.2 should therefore include:

- a repo-level configuration shape that makes the single-consumer intent clear
- operator documentation for the Cloudflare queue consumer setting that enforces
  max-one ingestion worker concurrency
- tests and implementation that do not rely on parallel ingestion for
  correctness
- D1 transaction boundaries around chunk completion so correctness holds even if
  Cloudflare retries a message

The correctness rule is:

- each chunk may be retried safely
- each chunk completion updates D1 exactly once in an idempotent way
- only the transactional "all chunks complete and cook not yet enqueued" path
  may enqueue the cook message

### 4. Keep published frontend contracts stable while changing internals

Stage 7.2 should preserve the current frontend manifest/snapshot contract even
though the generation internals change substantially.

Implementation direction:

- keep the current `prices-d1/manifest.json` and snapshot shape unless a
  concrete mismatch forces a change
- continue using a worker-safe card metadata lookup rather than `node:fs`
- keep KV as the live serving target for the published data
- keep the legacy read/generation path available during rollout until Stage 7.3

### 5. Finalize Cloudflare resources and operator-facing setup

The new architecture requires Cloudflare-managed resources that the repo and
docs should name explicitly:

- one D1 database for the hosted price-store runtime
- one queue for ingestion chunks
- one queue for cook instructions
- one queue for publish instructions
- one KV namespace for the live published artifacts
- one discovery worker named `noxian-price-discovery`
- one ingestion worker named `noxian-price-ingestion`
- one cook worker named `noxian-price-cook`
- one publish worker named `noxian-price-publish`
- one maintenance worker named `noxian-maintenance`
- JustTCG API key secret on the workers that call upstream
- Cron Triggers for discovery and maintenance

The Stage 7.2 output should include exact guidance for:

- which Wrangler files define each worker
- which bindings are committed in repo versus supplied in Cloudflare
- how to create or update the queues and their consumers
- how to apply the new D1 migration set
- how to verify the single-consumer ingestion setting
- how to run a first manual discovery-to-publish validation
- how to recover if a run fails mid-pipeline

## Explicit Non-Goals

- no removal of the old price method
- no broad legacy cleanup beyond removing the incorrect current price ingestion
  and processing flow and replacing it with the new hosted path
- no attempt to preserve old D1 row compatibility where that would complicate
  the design
- no requirement that raw rows be preserved indefinitely once a newer live run
  exists
- no second-source ingest work
- no assumption that the current capture/process/publish table layout should be
  retained

## Suggested File/Area Targets

- [workers/noxian-price-discovery.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/noxian-price-discovery.ts)
- [workers/noxian-price-ingestion.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/noxian-price-ingestion.ts)
- [workers/noxian-price-cook.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/noxian-price-cook.ts)
- [workers/noxian-price-publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/noxian-price-publish.ts)
- [workers/noxian-maintenance.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/noxian-maintenance.ts)
- [workers/shared/price-store-types.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-types.ts)
- [price_store/src/hosted/discovery.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/discovery.ts)
- [price_store/src/hosted/ingestion.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/ingestion.ts)
- [price_store/src/hosted/cook.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/cook.ts)
- [price_store/src/hosted/publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/publish.ts)
- [price_store/src/hosted/repository.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/repository.ts)
- [price_store/migrations/d1](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/migrations/d1)
- [price_store/src/published](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/published)
- new worker-safe card-metadata support under `price_store/src/` or a nearby
  shared location
- [price_store/test/hosted-price-store.test.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/test/hosted-price-store.test.ts)
- `wrangler.noxian-*.jsonc`
- new or updated Stage 7 operator documentation under [docs](C:/Users/ptier/repos/Deck%20Archive%20Project/docs)

## Test Plan

- `npm.cmd run build -w @noxiannet/price-store`
- `npm.cmd run test -w @noxiannet/price-store`
- `npx.cmd tsc -p tsconfig.cloudflare.json`
- add or update tests for:
  - discovery determining total pages and chunk boundaries
  - chunk messages carrying the expected page ranges for ingestion
  - ingestion raw-page persistence into D1
  - idempotent chunk completion and single cook enqueue on last-chunk finish
  - cook transforming a completed run into relational publish rows
  - publish writing the expected KV artifact shape
  - maintenance deleting only runs older than the live-snapshot retention
    window
  - worker-safe card metadata enrichment without `node:fs`
- locally validate:
  - one full discovery -> ingestion -> cook -> publish run into local D1
  - chunk retry/idempotency behavior
  - legacy and queue-backed hosted paths can still coexist during rollout
  - config values map cleanly onto the local/test code paths
- production rollout validation:
  - create or update the production D1 database schema
  - create or update the Cloudflare queues and single-consumer ingestion
    setting
  - deploy the workers with their bindings and required names:
    `noxian-price-discovery`, `noxian-price-ingestion`,
    `noxian-price-cook`, `noxian-price-publish`, and
    `noxian-maintenance`
  - verify one manual full hosted run end to end
  - verify the live `prices-d1` reader path returns the expected manifest and
    snapshot payloads
  - verify the legacy path still works unchanged
  - verify maintenance cleanup can run without affecting the live run

## Assumptions

- The existing hosted code can be substantially refactored or replaced without
  needing backward compatibility for persisted data.
- Cloudflare KV is acceptable as the first production-serving artifact layer for
  the D1-backed path.
- The Stage 5/6 published manifest/snapshot contract should remain unchanged in
  Stage 7.2.
- A build-generated or bundled metadata lookup is lower risk for this stage
  than moving card metadata ownership into D1 immediately.
- Discovery can reliably determine the total page count needed to partition work
  before ingestion begins.
- A 45-request chunk budget is the correct unit for ingestion work sizing.
