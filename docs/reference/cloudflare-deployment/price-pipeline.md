# Price Pipeline

## Summary

The hosted price pipeline is owned by `price_store`.

Its job is to capture source marketplace data, process it into normalized
hosted rows, publish the current `prices-d1` artifacts, and maintain the hosted
state over time.

## Hosted Resources

The current Cloudflare-side components are:

- `noxian-price-discovery`
- `noxian-price-ingestion`
- `noxian-price-cook`
- `noxian-price-publish`
- `noxian-maintenance`

Their Wrangler configs live at the repo root:

- `wrangler.noxian-price-discovery.jsonc`
- `wrangler.noxian-price-ingestion.jsonc`
- `wrangler.noxian-price-cook.jsonc`
- `wrangler.noxian-price-publish.jsonc`
- `wrangler.noxian-maintenance.jsonc`

## Data Flow

The live hosted flow is:

1. discovery triggers or schedules a capture run
2. ingestion consumes discovery work and writes hosted raw/process state into D1
3. cook consumes ingestion output and materializes hosted price rows in D1
4. publish reads the cooked run and writes the public `prices-d1` artifacts
5. maintenance handles retention and pipeline hygiene

## Storage Roles

- D1 stores hosted pipeline state and processed price data
- the `PRICE_STORE_PUBLISHED_DATA` KV namespace stores public published
  artifacts

The publish implementation lives in
[`price_store/src/hosted/publish.ts`](../../../price_store/src/hosted/publish.ts).

## Boundary

This pipeline is the source of truth for generating and publishing hosted price
data.

Pages Functions and the frontend consume the published result, but do not own
the generation workflow.

## Update Triggers

Update this doc when:

- the set of hosted price workers, queues, D1 usage, or KV usage changes
- the discovery-to-publish flow changes shape
- `price_store` no longer owns the hosted generation and publish workflow
