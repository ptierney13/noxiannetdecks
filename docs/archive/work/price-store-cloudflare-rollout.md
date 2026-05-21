# Price Store Stage 7.2 Cloudflare Rollout

## Summary

The hosted price pipeline now has five workers:

- `noxian-price-discovery`
- `noxian-price-ingestion`
- `noxian-price-cook`
- `noxian-price-publish`
- `noxian-maintenance`

Runtime flow:

1. discovery runs on a cron, determines the total JustTCG page count, creates a
   `runId`, records the run in D1, and enqueues ingestion chunks
2. ingestion consumes chunk messages one at a time, fetches raw pages, and
   stores them in D1
3. the last completed ingestion chunk enqueues cook exactly once
4. cook transforms the raw run payloads into relational publish rows
5. publish writes the current `prices-d1` manifest/snapshot to KV and records
   the live run in D1
6. maintenance removes runs more than seven days older than the current live KV
   snapshot

The old hosted capture/process/publish worker flow is no longer the active
architecture.

## Repo Config Files

- [wrangler.noxian-price-discovery.jsonc](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.noxian-price-discovery.jsonc)
- [wrangler.noxian-price-ingestion.jsonc](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.noxian-price-ingestion.jsonc)
- [wrangler.noxian-price-cook.jsonc](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.noxian-price-cook.jsonc)
- [wrangler.noxian-price-publish.jsonc](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.noxian-price-publish.jsonc)
- [wrangler.noxian-maintenance.jsonc](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.noxian-maintenance.jsonc)

## Cloudflare Resources

Use these resource names and bindings:

- D1 database:
  - name: `noxian-db`
  - id: `e4035dc9-7064-484a-a1b7-c80ebfcaa447`
- KV namespace:
  - binding: `PRICE_STORE_PUBLISHED_DATA`
  - id: `8fb344571f90445d992bb82385289fbe`
- Secrets Store:
  - store id: `0b983ec163634815a374ab0c7ed7f4eb`
  - secret name: `JUSTTCG_API_KEY`
- Queues:
  - `noxian-price-ingestion-queue`
  - `noxian-price-cook-queue`
  - `noxian-price-publish-queue`

## Required Bindings By Worker

`noxian-price-discovery`

- D1 binding: `DB`
- secret binding: `JUSTTCG_API_KEY`
- queue producer binding: `PRICE_STORE_INGESTION_QUEUE`
- cron trigger: `0 9 */2 * *`

`noxian-price-ingestion`

- D1 binding: `DB`
- secret binding: `JUSTTCG_API_KEY`
- queue consumer: `noxian-price-ingestion-queue`
- queue producer binding: `PRICE_STORE_COOK_QUEUE`
- consumer requirement: `max_concurrency = 1`

`noxian-price-cook`

- D1 binding: `DB`
- queue consumer: `noxian-price-cook-queue`
- queue producer binding: `PRICE_STORE_PUBLISH_QUEUE`

`noxian-price-publish`

- D1 binding: `DB`
- KV binding: `PRICE_STORE_PUBLISHED_DATA`
- queue consumer: `noxian-price-publish-queue`

`noxian-maintenance`

- D1 binding: `DB`
- cron trigger: `0 11 */2 * *`

## Remote Migration

Run the D1 migrations against production from the repo root:

```powershell
npx.cmd wrangler d1 migrations apply noxian-db --config wrangler.noxian-price-discovery.jsonc --remote
```

After this succeeds, verify the new tables exist in Cloudflare D1:

- `price_pipeline_runs`
- `price_ingestion_chunks`
- `price_raw_pages`
- `price_cooked_rows`
- `price_publish_runs`
- `price_publish_artifacts`
- `price_pipeline_state`

## Deploy Order

Deploy in this order:

1. `noxian-price-publish`
2. `noxian-price-cook`
3. `noxian-price-ingestion`
4. `noxian-price-discovery`
5. `noxian-maintenance`

Commands:

```powershell
npx.cmd wrangler deploy --config wrangler.noxian-price-publish.jsonc
npx.cmd wrangler deploy --config wrangler.noxian-price-cook.jsonc
npx.cmd wrangler deploy --config wrangler.noxian-price-ingestion.jsonc
npx.cmd wrangler deploy --config wrangler.noxian-price-discovery.jsonc
npx.cmd wrangler deploy --config wrangler.noxian-maintenance.jsonc
```

## Queue Setup Checks

In Cloudflare Queues, confirm:

- `noxian-price-ingestion-queue` exists
- `noxian-price-cook-queue` exists
- `noxian-price-publish-queue` exists
- the consumer attached to `noxian-price-ingestion-queue` is
  `noxian-price-ingestion`
- the ingestion consumer concurrency is limited to one active worker instance
- the cook consumer points to `noxian-price-cook`
- the publish consumer points to `noxian-price-publish`

## Pages Binding

The Pages project still needs the KV binding used by
[functions/data/[[path]].ts](C:/Users/ptier/repos/Deck%20Archive%20Project/functions/data/[[path]].ts):

- binding: `PRICE_STORE_PUBLISHED_DATA`
- namespace: `noxian-namespace`

After Pages is deployed, verify:

- `/data/prices-d1/manifest.json`
- `/data/prices-d1/riftbound/latest.json`

The legacy path should still remain available during rollout:

- `/data/prices/manifest.json`

## First End-To-End Validation

1. Trigger `noxian-price-discovery` manually through its worker URL.
2. Confirm D1 gets a new `price_pipeline_runs` row with status `ingesting`.
3. Confirm chunk rows appear in `price_ingestion_chunks`.
4. Wait for the ingestion queue to drain and confirm raw rows appear in
   `price_raw_pages`.
5. Confirm the run transitions through:
   - `ingesting`
   - `ready_to_cook`
   - `cooking`
   - `ready_to_publish`
   - `publishing`
   - `succeeded`
6. Confirm cooked rows appear in `price_cooked_rows`.
7. Confirm KV now contains:
   - `prices-d1/manifest.json`
   - `prices-d1/riftbound/latest.json`
8. Confirm D1 state points to the live run:
   - `current_live_run_id`
   - `current_live_published_at`
9. Confirm the live Pages read path returns JSON for the two `prices-d1` URLs.

## Failure Checks

If ingestion stalls:

- inspect the `noxian-price-ingestion` worker logs
- inspect `price_ingestion_chunks.latest_error`
- confirm the ingestion queue consumer still has max concurrency `1`

If cook or publish never starts:

- inspect `price_pipeline_runs.remaining_chunk_count`
- confirm only one chunk completion path set `cook_enqueue_requested_at`
- inspect the `noxian-price-cook` and `noxian-price-publish` worker logs

If KV is still empty after a successful run:

- confirm `noxian-price-publish` has the `PRICE_STORE_PUBLISHED_DATA` binding
- inspect `price_publish_runs`
- verify the Pages KV binding points at the same namespace

## Rollback

If the hosted queue path misbehaves:

1. disable the `noxian-price-discovery` cron trigger
2. leave the legacy `/data/prices/*` path in place
3. inspect the failed run in D1 and the relevant worker logs
4. redeploy only after the queue bindings, migrations, and worker names are
   confirmed
