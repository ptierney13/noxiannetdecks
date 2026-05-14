# Price Store Stage 9 Monetized TCGPlayer Link Rollout

## Status

This plan must be manually approved before implementation begins.

When Stage 9 is completed, update any later `price-store` planning docs with
the final outbound-link strategy, disclosure wording, and any follow-up work
needed to support true affiliate automation later.

## Summary

Stage 9 turns the now-primary pricing surface into an intentional outbound
marketplace surface by standardizing TCGPlayer buy links across the app.

This stage should:

- build TCGPlayer product and SKU URLs from the published row identifiers the
  pipeline already exposes
- centralize that URL construction so future affiliate parameterization can be
  added in one place
- add clear user-facing call-to-action links and lightweight disclosure in the
  primary pricing UI
- avoid changing upstream capture, canonical, cooked, or published storage just
  to support link rollout

For this stage, "monetization links" means standardized outbound TCGPlayer
product or product-plus-SKU links using the existing `tcgplayerId` and
`tcgplayerSkuId` data already present in the published contract. Actual worker
deploy automation and any future account-specific affiliate token injection stay
out of scope.

## Confirmed Starting Point

- The published price rows already contain:
  - `externalIds.tcgplayerId`
  - `externalIds.tcgplayerSkuId`
- The app already has ad hoc TCGPlayer links in:
  - [frontend/src/App.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/App.tsx)
  - [frontend/src/TradeBalancerView.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/TradeBalancerView.tsx)
- Those links are not yet treated as a consistent monetization surface and do
  not share one dedicated helper.
- The hosted `prices-d1` manifest and snapshot contract should remain stable
  unless a truly minimal schema addition becomes necessary.

## Key Changes

### 1. Centralize TCGPlayer URL construction

Introduce one shared frontend helper for marketplace links.

Implementation direction:

- accept `tcgplayerId` and optional `tcgplayerSkuId`
- prefer the product-plus-SKU link when a row-specific SKU is available
- fall back to the product page when only the product ID exists
- have card-detail and trade-balancer link surfaces both rely on the same
  helper

### 2. Add monetization-first link calls to the main pricing surface

The card detail pricing area should make it easy to click from the currently
selected price rows to the corresponding marketplace listing.

Implementation direction:

- add a primary outbound CTA in the pricing panel, not just the general card
  metadata link row
- where helpful, expose row-specific links tied to the selected printing and
  condition so the click target matches the displayed price row
- keep the UI compact and avoid burying the link behind comparison-only affordances

### 3. Keep the published contract stable unless a tiny extension is required

Preferred direction:

- do not add a dedicated outbound URL field to the published artifact when the
  existing external IDs are already sufficient
- if disclosure copy is needed, keep it in the frontend rather than the
  pipeline payload
- avoid touching hosted capture, cook, or D1 schema solely for monetization

### 4. Add lightweight disclosure and operator guidance

This stage should make the intent explicit without introducing heavy policy
machinery.

Implementation direction:

- add concise user-facing copy near the outbound link surface if needed
- update price-store docs so future work knows the site now treats TCGPlayer
  outbound links as a first-class product surface
- note that future affiliate-token or redirect-based automation can layer onto
  the centralized helper instead of rewriting the pipeline

## Explicit Non-Goals

- no worker deploy automation
- no queue, KV, or D1 redesign
- no partner-specific backend redirect service
- no new marketplace source integration
- no capture or publish schema redesign unless a concrete blocker appears

## Suggested File/Area Targets

- [frontend/src/priceData.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/priceData.ts)
- [frontend/src/App.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/App.tsx)
- [frontend/src/TradeBalancerView.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/TradeBalancerView.tsx)
- [frontend/src/App.test.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/App.test.tsx)
- [price_store/src/published/schema.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/published/schema.ts) only if a minimal contract extension proves necessary
- [price_store/README.md](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/README.md)

## Test Plan

- `npm.cmd test`
- verify card detail exposes the expected TCGPlayer link for the selected or
  preferred price row
- verify trade-balancer links still work and now share the same URL rules
- verify cards with only a product ID still link correctly
- verify cards with a row-specific SKU prefer the SKU deep link
- verify any added disclosure copy renders in the intended pricing surfaces

## Assumptions

- Standardized TCGPlayer product and SKU URLs are sufficient for this stage's
  monetization-link rollout.
- If account-specific affiliate parameters or redirect logic are needed later,
  they can be added behind the centralized helper without changing the price
  pipeline contract.
- Cleanup of the old legacy price path can happen before or alongside this
  stage without changing the monetization-link strategy.
