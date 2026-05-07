# Price Store Stage 4 JustTCG-Driven Contracts And Repositories

## Approval Status

This plan was approved and executed for Stage 4.

When Stage 4 was completed, the remaining future `price-store` stage draft
plans were refreshed with the newly relevant contract, provenance, and
free-plan details.

## Summary

Stage 4 defined the normalized source-oriented JustTCG contracts and
repository interfaces around real live payloads captured in Stage 3, then
materialized the first canonical JustTCG snapshot under `.price_data/canonical/`.

## Key Changes

- Stage 1 established the raw storage and run-record layout.
- Stage 3 established JustTCG as the only V0 upstream source and captured real
  live payloads through the corrected manual client.
- Stage 4 added canonical repository primitives under `price_store/src/canonical/`
  for:
  - canonical snapshot path resolution
  - canonical snapshot metadata validation
  - canonical snapshot read/write behavior
- Stage 4 expanded the JustTCG source schema to preserve the observed live
  fields needed for contract work, including:
  - `tcgplayerSkuId`
  - optional `priceHistory`
  - optional `statistics`
  - optional top-level `_metadata` usage information
- Stage 4 introduced a canonical JustTCG snapshot contract that preserves:
  - source snapshot identity and provenance
  - card-level source records
  - variant-level price and freshness records
  - external IDs like `tcgplayerId` and `tcgplayerSkuId`
  - optional normalized price history
  - upstream usage metadata when available
- Stage 4 intentionally kept the canonical layer source-oriented rather than
  forcing the final `card_store` or frontend output shape early.
- Stage 4 added a JustTCG canonical materialization command:
  - `npm run materialize:justtcg:canonical -w @noxiannet/price-store`
- Stage 4 updated source docs to reflect the live observed history nuance:
  - some variants return `priceHistory: null`
  - populated history currently arrives as compact `{ p, t }` points

## Expected Outputs

- normalized schema definitions informed by real JustTCG card and variant data
- repository interfaces and implementations for raw capture reads and canonical
  JustTCG source snapshots
- canonical JustTCG snapshot examples produced from the Stage 3/4 live sample
- fixture-backed schema validation tests based on captured JustTCG samples
- documented deferred questions that remain open for Stage 5 publish work

## Explicit Non-Goals

- no second source support
- no final published artifact generation
- no frontend/API routes
- no scheduler or hosted publishing
- no multi-source merge logic

## Proposed Schema Direction

- Treat JustTCG card IDs and variant IDs as the authoritative source-level
  identifiers in canonical snapshots.
- Keep canonical snapshots source-oriented rather than prematurely forcing
  local cross-source IDs, since V0 is single-source.
- Model card-level and variant-level data separately:
  - card-level shape for stable descriptive metadata
  - variant-level shape for sellable-price state and history
- Preserve current price and freshness as first-class required fields at the
  variant level when a priced variant is present.
- Keep history optional but structured, not opaque.
- Keep external IDs like `tcgplayerId` and `tcgplayerSkuId` optional passthrough
  fields rather than V0 primary keys.

## Test Plan

- validate accepted schema examples derived from Stage 3/4 sample fixtures
- verify canonical repository behavior in tests
- verify canonical snapshot write/read behavior under `.price_data/canonical/`
- run `npm run test -w @noxiannet/price-store`
- run `npm run build -w @noxiannet/price-store`
- run `npm run capture:justtcg:sample -w @noxiannet/price-store`
- run `npm run materialize:justtcg:canonical -w @noxiannet/price-store`
- manually inspect at least one canonical JustTCG snapshot written from the
  live sample

## Assumptions

- Stage 4 should stay evidence-driven and smaller than a full pipeline stage.
- The Stage 3/4 sample set is sufficient to lock the first canonical V0 schema
  without requiring another upstream source shift.
- Additional low-cost captures may still be useful later, but they should
  refine the contract rather than redefine it.

## Execution Notes

- Implemented the canonical layer in:
  - `price_store/src/canonical/paths.ts`
  - `price_store/src/canonical/schema.ts`
  - `price_store/src/canonical/repository.ts`
- Implemented the JustTCG canonical transform in:
  - `price_store/src/sources/justtcg/canonical.ts`
- Added raw read helpers so canonical materialization can load preserved
  payloads instead of re-calling the API.
- Added tracked JustTCG fixtures and tests for:
  - canonical normalization
  - history parsing
  - canonical repository behavior
- Verified that the free-plan maximum request shape is now preserved in live
  captures:
  - `limit=20`
  - `include_price_history=true`
- Captured a fresh 20-card live JustTCG sample at:
  - `.price_data/raw/justtcg/2026/05/07/2026-05-07T01-04-45.650Z--riftbound-league-of-legends-trading-card-game-cards-sample.json`
- Materialized the corresponding canonical snapshot at:
  - `.price_data/canonical/justtcg/2026/05/07/2026-05-07T01-04-45.650Z--riftbound-league-of-legends-trading-card-game-cards-snapshot.json`
- The live canonical snapshot preserved:
  - 20 cards
  - 21 priced variants
  - request usage metadata
  - normalized price history arrays from JustTCG's compact `{ p, t }` points
- Verified the package with:
  - `npm run build -w @noxiannet/price-store`
  - `npm run test -w @noxiannet/price-store`
  - `npm run capture:justtcg:sample -w @noxiannet/price-store`
  - `npm run materialize:justtcg:canonical -w @noxiannet/price-store`
