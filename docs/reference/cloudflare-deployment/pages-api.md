# Pages API

## Summary

The public API is served by Cloudflare Pages Functions from
[`functions/api/[[route]].ts`](../../../functions/api/[[route]].ts).

That file is the catch-all adapter for the public `/api/*` route space.

## Public Routes

The current hosted adapter serves:

- `GET /api/health`
- `GET /api/cards`
- `GET /api/cards/:id`
- `POST /api/query/parse`
- `GET /api/query/features`
- `GET /api/metadata`
- `GET /api/metagame/pilot`
- `GET /api/pack-generator/options`
- `POST /api/pack-generator/pools`

## Logic Boundary

The Pages adapter is an integration layer.

- `card_store` owns the core card API logic and schema behavior
- the adapter wires public HTTP routes to `card_store/src/api/service.ts`
- the adapter imports canonical card data directly from
  `card_store/data/cards.json`

Production should not depend on a separate Fastify process.

## Price Integration

The Pages API may depend on published price data for some `card_store`
behavior, but it does not own the price pipeline.

- the adapter may supply a derived price index into `card_store`
- `card_store` uses that index for price-aware query behavior
- the published price contract is documented in
  [price-published-data.md](price-published-data.md)
- the producer pipeline is documented in
  [price-pipeline.md](price-pipeline.md)

## Update Triggers

Update this doc when:

- the public `/api/*` route surface changes
- the adapter file or routing model changes
- the API's dependency on bundled card data or published price data changes
