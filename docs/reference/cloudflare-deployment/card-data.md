# Card Data

## Summary

Today the canonical card dataset is a single tracked JSON file:

- [`card_store/data/cards.json`](../../../card_store/data/cards.json)

This file is versioned in the repository, validated by `card_store`, and
bundled into the hosted Cloudflare API deployment.

## Current Source Of Truth

`card_store/data/cards.json` is the current source of truth for shipped card
records.

- the schema lives in
  [`card_store/src/data/schema.ts`](../../../card_store/src/data/schema.ts)
- the default loader lives in
  [`card_store/src/data/repository.ts`](../../../card_store/src/data/repository.ts)
- the hosted API imports the JSON directly from
  [`functions/api/[[route]].ts`](../../../functions/api/[[route]].ts)

At the moment, the production Cloudflare API serves card data that is bundled
from this repo snapshot, not from a separate hosted card database.

## Update Workflow

Card data updates are currently operator-invoked, not automatically published
through a hosted pipeline.

The main scripts are:

- [`card_store/scripts/import-riftcodex.ts`](../../../card_store/scripts/import-riftcodex.ts)
  fetches source card payloads from Riftcodex, normalizes them into the local
  canonical shape, validates the result, and rewrites `data/cards.json`
- [`card_store/scripts/refresh-derived-identities.ts`](../../../card_store/scripts/refresh-derived-identities.ts)
  recalculates derived identity fields in the existing local file

From the repo root, the common entrypoint is:

- `npm run import:riftcodex -w @noxiannet/card-store`

## Current Constraints

- `cards.json` is one large repo-tracked blob today
- card data changes ship by committing the updated file and deploying the repo
- this is separate from the hosted `price_store` pipeline, which publishes
  price data independently

Agents should treat `card_store/data/cards.json` as the authoritative shipped
card dataset.

## Update Triggers

Update this doc when:

- the hosted API stops bundling `card_store/data/cards.json` directly
- the canonical shipped card-data source or loader changes
- card-data updates move from manual script-driven refresh to a hosted publish flow
