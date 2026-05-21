# Price Published Data

## Summary

This doc describes the published price artifact contract that current app
surfaces read.

Today that contract exists in three closely related forms:

- hosted current data under the public `/data/prices-d1/*` path
- local repo-materialized `prices-d1` files used for local dev and tests
- a legacy static `/data/prices/*` path that still exists in the repo but is no
  longer the primary runtime path

Producer details belong primarily in [price-pipeline.md](price-pipeline.md).
This doc focuses on the published contract itself and how the rest of the app
reads it.

## Published Contract

The current hosted `prices-d1` keys are:

- `prices-d1/manifest.json`
- `prices-d1/riftbound/latest.json`

Those are exposed publicly as:

- `/data/prices-d1/manifest.json`
- `/data/prices-d1/riftbound/latest.json`

The legacy static path still exists as repo-tracked files under:

- [`frontend/public/data/prices/manifest.json`](../../../frontend/public/data/prices/manifest.json)
- [`frontend/public/data/prices/riftbound/latest.json`](../../../frontend/public/data/prices/riftbound/latest.json)

That legacy path is historical compatibility/output baggage, not the preferred
runtime contract.

## Producer Boundary

`price_store` owns generating and publishing the current `prices-d1` contract.

For the hosted current path:

- the hosted worker pipeline writes published artifacts into the external
  Cloudflare KV namespace `PRICE_STORE_PUBLISHED_DATA`
- the hosted publish implementation lives in
  [`price_store/src/hosted/publish.ts`](../../../price_store/src/hosted/publish.ts)

For the older legacy static path:

- the older static publisher lives in
  [`price_store/src/sources/justtcg/publish.ts`](../../../price_store/src/sources/justtcg/publish.ts)
- shared filesystem artifact writing lives in
  [`price_store/src/published/repository.ts`](../../../price_store/src/published/repository.ts)

The pipeline mechanics and worker roles are documented in
[price-pipeline.md](price-pipeline.md).

## Hosted Vs Local Materialization

The same `prices-d1` contract is materialized differently in hosted and local
environments.

Hosted:

- source of truth is the external Cloudflare KV namespace
  `PRICE_STORE_PUBLISHED_DATA`
- the public app reaches it through Pages Functions

Local development and tests:

- the Node API app reads local files from
  [`frontend/public/data/prices-d1/`](../../../frontend/public/data/prices-d1/)
- the frontend also reads the same local static files when running in the repo

This local materialization exists so local app behavior and tests do not depend
on live Cloudflare resources.

## Serving And Loading Paths

Hosted raw file exposure:

- [`functions/data/[[path]].ts`](../../../functions/data/[[path]].ts) serves the
  public `/data/prices-d1/*` path from `PRICE_STORE_PUBLISHED_DATA`

Hosted API-side loading:

- [`functions/api/[[route]].ts`](../../../functions/api/[[route]].ts) reads
  `prices-d1/manifest.json` and the manifest-linked snapshot from
  `PRICE_STORE_PUBLISHED_DATA`
- it builds a search price index and passes that into `card_store` service
  logic

Local API-side loading:

- [`card_store/src/api/app.ts`](../../../card_store/src/api/app.ts) reads the
  same manifest/snapshot contract from
  [`frontend/public/data/prices-d1/`](../../../frontend/public/data/prices-d1/)

## Consumers

The current consumers are:

- the frontend price loader in
  [`frontend/src/lib/priceData.ts`](../../../frontend/src/lib/priceData.ts)
- `card_store` search logic through
  [`card_store/src/api/service.ts`](../../../card_store/src/api/service.ts)
  and the hosted/local API adapters that supply its price index

The frontend reads the manifest and snapshot directly for UI price display.

The API side uses the same published contract indirectly:

- adapters load the published manifest and snapshot
- adapters build a search price index
- `card_store` uses that index for price-aware query behavior

The public `/data/prices-d1/*` endpoint is therefore only one part of the
surfacing. A primary public consumption path is the card search/query API using
published price data through `card_store`.

## Update Triggers

Update this doc when:

- the published `prices-d1` or legacy `prices` key/path structure changes
- the hosted-vs-local materialization model changes
- the producer boundary, serving/loading path, or consumer set changes
- the manifest or snapshot contract changes
