# Price Store Stage 10 Server-Owned Price Data Delivery

## Status

> Status: draft

This plan must be manually approved before implementation begins.

## Summary

This stage moves price data delivery out of frontend-owned published-data
loading and into server-provided `card_store` responses only.

The intended end state is:

- the frontend no longer fetches or indexes published price snapshot files
  directly
- `card_store` becomes the only application-layer consumer of published price
  data
- price-aware frontend UI is powered by server-provided card/API payloads
  rather than client-side joins against `/data/prices-d1/*`

This is a delivery-model change, not a source-pipeline redesign. `price_store`
continues to own generation and publish of the current hosted price artifacts.

## Why This Exists

The current frontend model downloads the published price snapshot into the
browser and performs client-side lookups for:

- card detail pricing
- quick-look pricing
- trade-balancer totals and item prices
- price-history rendering

That approach keeps the UI simple, but it also means:

- the browser downloads a large published price payload
- the client duplicates indexing/join logic that the server could own
- price delivery is split between direct frontend reads and API-side search
  integration

This stage is the follow-on to the current hosted-path stabilization work. It
collapses price delivery behind `card_store` so the frontend receives only the
price data it needs through API responses.

## Intended Outcome

- `price_store` still publishes the current hosted price artifacts
- `card_store` loads and joins published price data server-side
- frontend views consume server-provided current-price and history fields
- direct frontend reads from `/data/prices-d1/*` are removed from app code

## Likely Scope

### 1. Move price joins into `card_store`

Expected direction:

- extend `card_store` API/service responses so relevant card/search/detail
  payloads can include server-owned price fields
- decide which frontend needs require:
  - current display price only
  - variant-level prices
  - price history

### 2. Remove direct frontend published-price loading

Expected direction:

- remove or retire the frontend price loader under
  `frontend/src/lib/priceData.ts`
- remove frontend-local indexing and lookup helpers that only exist because the
  browser currently owns the published snapshot

### 3. Update UI surfaces to consume API-provided prices

Expected direction:

- card detail view
- quick-look / search-card presentation helpers
- trade balancer
- any other price-aware UI should consume server-owned payloads instead of
  fetching the published files directly

### 4. Update architecture and guidance docs

Expected direction:

- update Cloudflare deployment docs
- update `card_store` and `price_store` guidance
- document the new server-owned boundary clearly so future work does not
  reintroduce direct frontend published-price loading by accident

## Non-Goals

- no redesign of the `price_store` worker pipeline
- no replacement of the published `prices-d1` artifact contract
- no change to the upstream marketplace source strategy
- no frontend visual redesign unrelated to price delivery

## Suggested File/Area Targets

- [card_store/src/api/service.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/card_store/src/api/service.ts)
- [card_store/src/api/app.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/card_store/src/api/app.ts)
- [card_store/src/prices/published.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/card_store/src/prices/published.ts)
- [functions/api/[[route]].ts](C:/Users/ptier/repos/Deck%20Archive%20Project/functions/api/[[route]].ts)
- [frontend/src/lib/priceData.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/lib/priceData.ts)
- [frontend/src/pages/legacy/CardDetailView.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/pages/legacy/CardDetailView.tsx)
- [frontend/src/pages/legacy/TradeBalancerView.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/pages/legacy/TradeBalancerView.tsx)
- [frontend/src/cardFormat.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/cardFormat.tsx)
- [docs/reference/cloudflare-deployment/pages-api.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/reference/cloudflare-deployment/pages-api.md)
- [docs/reference/cloudflare-deployment/price-published-data.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/reference/cloudflare-deployment/price-published-data.md)

## Test Plan

- verify the frontend no longer fetches `/data/prices-d1/*` directly
- verify price-aware API behavior still works for price queries
- verify card detail, quick look, and trade balancer still show correct prices
- verify any price history UI still renders correctly if retained
- verify local dev still works without live Cloudflare dependencies

## Assumptions

- the hosted `prices-d1` publish contract remains the current backend artifact
  contract
- the current local `frontend/public/data/prices-d1/` materialization may still
  remain as server-local input even if the browser no longer reads it directly
- `card_store` is the right long-term application boundary for delivered price
  data
