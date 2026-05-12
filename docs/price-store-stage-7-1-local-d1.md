# Price Store Stage 7.1 Local D1 Guide

## Summary

Stage 7.1 replaces the temporary hosted/document-table idea with a repo-managed
relational schema and a locally runnable capture/process/publish pipeline.

This stage does **not** deploy anything to Cloudflare production. It keeps the
legacy published price path in place while adding a parallel D1-backed artifact
path for side-by-side validation.

## Current Local Schema

- `price_capture_justtcg_runs`
- `price_capture_justtcg_pages`
- `price_process_runs`
- `price_data`
- `price_publish_runs`
- `price_publish_artifacts`
- `price_pipeline_state`

Important semantic split:

- capture source: `JustTCG`
- logical price source on published rows: `TCGPlayer`

The `price_data` rows store:

- run linkage (`capture_run_id`, `process_run_id`)
- source identifiers (`source_card_id`, `source_variant_id`)
- price-source identifiers (`tcgplayer_id`, `tcgplayer_sku_id`)
- price-bearing fields (amount, freshness, history, condition, printing)

Card metadata is still owned outside D1 at this stage. Publish enriches the
rows from `card_store` via `tcgplayer_id`.

## Local Commands

Run from the repo root:

```powershell
npm run hosted:local:migrate -w @noxiannet/price-store
npm run hosted:local:capture -w @noxiannet/price-store
npm run hosted:local:process -w @noxiannet/price-store
npm run hosted:local:publish -w @noxiannet/price-store
npm run hosted:local:cleanup -w @noxiannet/price-store
```

One-shot refresh for the D1-backed localhost artifacts:

```powershell
npm run price:d1:refresh-local
```

Environment knobs:

- `NOXIANNET_PRICE_CAPTURE_MODE=full|incremental`
- `NOXIANNET_PRICE_CAPTURE_UPDATED_AFTER=<ISO timestamp>`
- `NOXIANNET_PRICE_CAPTURE_MAX_PAGES=<number>`
- `NOXIANNET_PRICE_CAPTURE_MAX_REQUESTS=<number>`
- `NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS=<number>`
- `NOXIANNET_PRICE_CAPTURE_RUN_ID=<run id>` for explicit processing
- `NOXIANNET_PRICE_PROCESS_RUN_ID=<run id>` for explicit publishing
- `NOXIANNET_PRICE_CLEANUP_BEFORE=<ISO timestamp>` for retention cleanup

## Local Data Locations

- local SQLite-backed D1 file:
  - `.price_data/hosted/local-d1/price-store.sqlite`
- legacy artifacts:
  - `.price_data/exports/prices/`
  - `frontend/public/data/prices/`
- D1-backed comparison artifacts:
  - `.price_data/exports/prices-d1/`
  - `frontend/public/data/prices-d1/`

## Localhost Validation

Default localhost app:

```powershell
npm run dev
```

D1-backed localhost app as the active price source:

```powershell
npm run dev:price-d1
```

That mode does two things:

- proxies `/api/*` from Vite to the local card-store server on `127.0.0.1:4545`
- points the frontend price loader at `/data/prices-d1/*` as the primary price
  source

You can also force the source on a direct URL:

- legacy: `http://127.0.0.1:5173/cards/card-1?priceSource=legacy`
- D1-backed: `http://127.0.0.1:5173/cards/card-1?priceSource=d1`

For localhost validation that is actually using D1-backed output, use the D1
mode or the `?priceSource=d1` URL after running the local capture/process/
publish flow.

## Worker-Equivalent Entry Points

Stage 7.1 adds local worker-shaped files for the future Cloudflare split:

- [workers/price-store-capture.ts](/C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-capture.ts)
- [workers/price-store-publish.ts](/C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-publish.ts)
- [workers/price-store-maintenance.ts](/C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-maintenance.ts)

Wrangler-local config stubs for Stage 7.2 rollout prep:

- [wrangler.price-store-capture.jsonc](/C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-capture.jsonc)
- [wrangler.price-store-publish.jsonc](/C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-publish.jsonc)
- [wrangler.price-store-maintenance.jsonc](/C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-maintenance.jsonc)

The capture worker also accepts override controls through either request query
parameters or worker environment variables:

- `mode=full|incremental`
- `updatedAfter=<ISO timestamp>`
- `maxPages=<number>`
- `maxRequests=<number>`
- `requestDelayMs=<number>`
- `verifyLimit=true|false`

Worker environment names mirror the local script knobs:

- `NOXIANNET_PRICE_CAPTURE_MODE`
- `NOXIANNET_PRICE_CAPTURE_UPDATED_AFTER`
- `NOXIANNET_PRICE_CAPTURE_MAX_PAGES`
- `NOXIANNET_PRICE_CAPTURE_MAX_REQUESTS`
- `NOXIANNET_PRICE_CAPTURE_REQUEST_DELAY_MS`
- `NOXIANNET_PRICE_CAPTURE_VERIFY_LIMIT`

## Dual-Price Comparison

The frontend card detail view now loads the legacy and D1-backed artifact sets
in local development and shows a comparison panel with:

- legacy vs D1 row counts for the current card
- published/freshness timestamps
- per-row price deltas by printing and condition

The legacy path remains authoritative for now.
