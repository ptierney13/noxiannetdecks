# Card Search Price Query

## Summary

Add `price` as a queryable card-search field so users can filter cards by their
current published market price using the same search DSL as other numeric card
properties.

This work extends the existing server-side card search flow to join published
price data onto search evaluation without changing the canonical card JSON
schema. The implemented V1 behavior treats `price` as the selected card
version's published `Near Mint` market price keyed by `tcgplayer_id`, with
cards lacking a matching published price behaving as missing values.

## Key Changes

- Added a shared published-price helper that builds a `tcgplayer_id` to
  near-mint-price index from the active published manifest/snapshot.
- Extended card search evaluation to support a numeric `price` field and
  numeric comparisons such as:
  - `price>=10`
  - `price<2`
  - `price:none`
- Kept the canonical card dataset unchanged by passing price context into the
  query evaluator rather than storing mutable price data on `CardRecord`.
- Defined and documented the V1 price-selection rule used for search:
  - use published rows joined by `tcgplayer_id`
  - prefer `Near Mint`
  - prefer non-foil when multiple `Near Mint` rows are present
  - fall back to the first sorted `Near Mint` row if needed
- Updated query field metadata so `price` appears in the searchable-fields API
  output consumed by the frontend.
- Wired runtime loading to the active environment:
  - local dev reads `frontend/public/data/prices-d1`
  - Cloudflare Pages Functions read the `prices-d1/*` payloads from the
    `PRICE_STORE_PUBLISHED_DATA` KV binding
- Added targeted tests for evaluator behavior, missing-price handling, and API
  integration.

## Test Plan

- Ran `npm test -w @noxiannet/card-store`.
- Ran `npm run build -w @noxiannet/card-store`.
- Ran `npm test -w @noxiannet/frontend`.
- Ran `npm run build -w @noxiannet/frontend`.

## Assumptions

- Published price artifacts remain the authoritative runtime source for current
  searchable prices.
- Using the published `Near Mint` market price is the correct V1 semantics for
  a single numeric `price` field.
- Cards without a published `Near Mint` price should not match numeric
  comparisons and should match `price:none`.
- This work is a bounded extension of existing card search behavior, not a
  broader redesign of price presentation or sorting.
