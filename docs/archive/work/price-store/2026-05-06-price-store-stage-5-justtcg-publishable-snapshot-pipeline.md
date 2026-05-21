# Price Store Stage 5 JustTCG Publishable Snapshot Pipeline

## Approval Status

This plan was approved and executed for Stage 5.

When Stage 5 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 5 will turn the Stage 4 source-oriented JustTCG canonical layer into the
first repo-tracked, frontend-readable publish pipeline. The work should produce
deterministic static snapshot artifacts that can ship with the app build while
still preserving raw and canonical provenance in the local `.price_data/`
workspace.

This stage is the bridge between:

- Stage 4's source-truth canonical JustTCG snapshots under `.price_data/`
- Stage 6's frontend integration that reads deployed static assets

The publish layer should stay intentionally narrow:

- single upstream provider path first (`justtcg`)
- single game target first (`riftbound-league-of-legends-trading-card-game`)
- no hosted automation yet
- no frontend wiring yet
- no multi-source merge or `card_store` mutation yet

## Key Changes

- Add a budget-aware larger JustTCG capture flow that can page through the game
  catalog with:
  - an explicit verification pass to confirm whether `limit=20` is the real
    cap for the current key
  - if `limit=21` works, an efficient bounded search to discover the actual
    maximum supported limit with minimal extra requests
  - explicit request pacing to stay within `10 requests/minute`
  - a guardrail on total pages or requests so accidental full-budget drains
    abort early
  - run metadata that records total pages, total cards observed, and request
    usage context
- Keep Stage 5 raw and canonical provenance inside `.price_data/` rather than
  writing tracked source snapshots directly into the repo.
- Expand canonical materialization from a one-off sample path into a
  repeatable catalog-scale path that can combine the bounded paged capture set
  into a single canonical source snapshot for one publish run.
- Introduce a publish contract under `price_store` that reads canonical JustTCG
  snapshots and emits tracked static artifacts for the app.
- Use two output tiers:
  - local export artifacts under `.price_data/exports/` for run-local publish
    metadata and intermediate inspection
  - repo-tracked static assets under `frontend/public/data/prices/` as the
    first deployable serving contract
- Publish a manifest-first asset layout so Stage 6 can load one small summary
  file before deciding which snapshot payload to read.
- Keep the published snapshot marketplace-specific rather than upstream-branded
  by exposing:
  - price source metadata such as `TCGPlayer`
  - upstream-provider provenance only where needed for debugging or operator
    context
  - game metadata
  - capture and publish timestamps
  - freshness metadata
  - flat variant-level price rows
- Preserve enough fields for direct downstream mapping into `card_store`
  without introducing legal-card grouping rules here. The published records
  should include stable matching fields such as:
  - card name
  - set slug and label
  - collector number
  - rarity
  - source card ID
  - source variant ID
  - language
  - condition
  - printing
  - external IDs like `tcgplayerId` and `tcgplayerSkuId` when available
- Treat each published variant row as a separate card-like price record. Stage
  5 should not collapse or deduplicate by legal identity because that behavior
  belongs in `card_store`.
- Keep Stage 5 history publication intentionally compact:
  - preserve normalized current-price data for all published variants
  - preserve normalized price-history arrays at the variant-row level when
    available and justified by artifact size
  - avoid shipping raw upstream history blobs or uneven source-native history
    shapes into tracked frontend assets
- Add source-local commands for:
  - controlled JustTCG catalog capture
  - canonical materialization for the captured catalog run
  - publish/export generation into tracked static assets
  - an optional all-in-one local operator command that chains the three steps
    in order
- Add tests that lock:
  - paged capture behavior and request-budget safeguards
  - canonical aggregation correctness for multi-page captures
  - publish-manifest and published-snapshot schemas
  - row-level mapping expectations for later `card_store` joins

## Publish Contract Direction

The Stage 5 serving contract should be static and manifest-driven.

Planned tracked asset layout:

- `frontend/public/data/prices/manifest.json`
- `frontend/public/data/prices/riftbound/latest.json`

The manifest should describe:

- contract version
- price source label
- upstream provider label only if useful for provenance/debugging
- game slug
- publish timestamp
- source capture timestamp
- relative path to the current snapshot payload
- row counts and variant counts
- freshness summary
- provenance summary suitable for UI attribution later

The published snapshot should contain:

- price source metadata and game metadata
- a top-level `publishedAt`
- a top-level `sourceCapturedAt`
- a top-level freshness summary
- a flat row-oriented collection where each priced variant is its own record
- descriptive matching fields suitable for direct downstream joins into
  `card_store`
- normalized variant pricing data and optional normalized variant history data

Stage 5 should keep the published snapshot self-sufficient for static reads,
but should not try to fully reshape it into the final frontend state model yet.

## Frontend Price Selection

Stage 5 should not bake a canonical display-price choice into the published
storage contract.

Instead, the published artifacts should expose all normalized variant rows and
leave default-display selection to the frontend or a later presentation-layer
adapter. That keeps the system flexible:

1. changing the default displayed price does not require redefining stored
   source truth
2. the frontend can experiment with lowest-price, preferred-condition, or
   finish-aware views without forcing a publish-contract rewrite
3. later API layers can add opinionated display helpers without losing the
   full variant-level dataset

If helpful, Stage 5 may still publish sortable fields that make future display
selection easier, but it should not publish one authoritative chosen price as a
required V0 contract field.

## Request-Budget Strategy

The first larger JustTCG pull should be explicitly designed around the free
plan rather than assuming the catalog is cheap enough to fetch casually.

Stage 5 should therefore:

- page with `limit=20`
- verify whether `20` is the actual per-request maximum for the current key
- if `21` succeeds, use an efficient bounded search to find the true maximum
- pause between requests enough to stay under `10 requests/minute`
- record total requests made during the run
- support an explicit max-pages or max-requests safety cap
- avoid refetching when raw captures for the intended publish run already
  exist locally
- rely on local raw and canonical artifacts for repeated publish/test work

The operator workflow should make it easy to do one deliberate capture and then
re-run transform and publish steps locally without consuming additional
upstream quota.

## Expected Outputs

- paged JustTCG capture command suitable for the first publishable catalog run
- request-limit verification flow for the current API key
- canonical aggregation flow for a multi-page JustTCG capture set
- publish schemas and repository helpers for export artifacts
- tracked static price assets under `frontend/public/data/prices/`
- docs describing the operator workflow and artifact boundaries
- fixture-backed tests for capture, canonical aggregation, and publish output

## Explicit Non-Goals

- no multi-source merge behavior
- no `card_store` schema changes or canonical card-data rewrites
- no frontend runtime integration yet
- no Cloudflare scheduler or hosted publishing yet
- no client-side JustTCG API calls
- no affiliate-link behavior yet

## Test Plan

- run `npm run build -w @noxiannet/price-store`
- run `npm run test -w @noxiannet/price-store`
- verify fixture coverage for paged capture and canonical aggregation behavior
- verify publish-manifest and published-snapshot schema tests
- run the new manual publish workflow locally against either:
  - tracked fixtures, or
  - one deliberate live paged capture
- manually inspect generated tracked assets under `frontend/public/data/prices/`
  for:
  - manifest correctness
  - marketplace attribution correctness without consumer-facing `JustTCG`
    coupling
  - direct row-level mappability into `card_store`
  - stable source attribution and freshness fields
  - absence of raw-source-only blob fields
- verify the limit-detection flow records whether `20` is the true cap for the
  current key, and if not, records the discovered maximum
- confirm repeated local publish runs can reuse local raw/canonical artifacts
  without extra upstream requests

## Assumptions

- Stage 5 is the first point where price data becomes a deployable app asset.
- The existing Stage 4 canonical contract is sufficient to derive the V0
  published snapshot without introducing a second normalization layer first.
- A manifest plus one current per-game snapshot file is enough for the initial
  static serving contract.
- The published contract should model variant rows rather than legal-card
  rollups because identity grouping belongs to `card_store`.
- Default display-price selection is a presentation concern rather than a
  storage concern for V0.
- The current Riftbound card volume will fit within a cautious paged capture
  flow that remains operationally acceptable on the JustTCG free plan.

## Execution Notes

- Implemented live request-limit verification for the current JustTCG key.
- Verified on the live API that:
  - `limit=20` works
  - `limit=21` fails
- Added paged catalog capture support with:
  - run-scoped raw metadata
  - request-limit verification
  - configurable pacing and request caps
- Added canonical run aggregation so multiple paged raw captures can become one
  canonical JustTCG source snapshot.
- Added a marketplace-facing publish contract that:
  - emits one row per source variant
  - exposes `TCGPlayer` as the price source
  - keeps `JustTCG` only in provenance/debug metadata
  - leaves default display-price selection to later frontend logic
- Added publish/export artifact writing to:
  - `.price_data/exports/prices/`
  - `frontend/public/data/prices/`
- Published the first tracked static snapshot from the latest existing
  canonical data:
  - `frontend/public/data/prices/manifest.json`
  - `frontend/public/data/prices/riftbound/latest.json`
- The current published snapshot contains:
  - 21 variant rows
  - marketplace attribution for `TCGPlayer`
  - variant-level current price and history data
- Added fixture and repository tests covering:
  - limit verification
  - paged capture
  - canonical aggregation
  - publish artifact generation
- Verified the package with:
  - `npm run build -w @noxiannet/price-store`
  - `npm run test -w @noxiannet/price-store`
  - `npm run publish:justtcg:prices -w @noxiannet/price-store`
  - `npm run verify:justtcg:limit -w @noxiannet/price-store`
