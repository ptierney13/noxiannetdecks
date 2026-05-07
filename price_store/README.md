# Price Store

Price archive pipeline for capturing, normalizing, and publishing static
marketplace snapshots.

This package is intentionally narrow at the start:

- Preserve raw source payloads and capture metadata first.
- Keep mutable operational data in a repo-local git-ignored store by default.
- Delay normalized price-schema decisions until representative TCGplayer sample
  payloads exist.
- Keep the long-term serving model focused on published snapshots instead of
  live marketplace reads from the app.

## Local Data Directory

The code in this package resolves its data root from
`NOXIANNET_PRICE_DATA_DIR`. If that variable is not set, it falls back to a
repo-local git-ignored store:

- `repo-root/.price_data/`

The current layout is:

- `raw/`: captured source payloads and sidecar metadata
- `canonical/`: normalized source snapshots
- `exports/`: local publish artifacts and publish metadata
- `runs/`: run-status records for capture-oriented workflows

Stage 1 also establishes raw capture conventions:

- raw payloads are stored under `raw/<sourceId>/<YYYY>/<MM>/<DD>/`
- each payload gets a sibling `.meta.json` sidecar
- run status records are stored under `runs/<runId>.json`

## Commands

- `npm run init:data-dir -w @noxiannet/price-store`
- `npm run inspect:data-dir -w @noxiannet/price-store`
- `npm run import:tcgplayer:samples -w @noxiannet/price-store`
- `npm run capture:justtcg:sample -w @noxiannet/price-store`
- `npm run verify:justtcg:limit -w @noxiannet/price-store`
- `npm run capture:justtcg:catalog -w @noxiannet/price-store`
- `npm run materialize:justtcg:canonical -w @noxiannet/price-store`
- `npm run materialize:justtcg:canonical:run -w @noxiannet/price-store`
- `npm run publish:justtcg:prices -w @noxiannet/price-store`
- `npm run publish:justtcg:catalog -w @noxiannet/price-store`

## Current Boundary

Stage 1 does not define normalized card price records yet. That contract is
deferred until TCGplayer sample payloads are approved and captured in Stage 2.

Stage 2 now adds:

- TCGplayer source approval notes under `src/sources/tcgplayer/`
- a manifest-driven sample import command that preserves bounded representative
  payloads under `.price_data/raw/`
- docs-derived bundled example payloads that do not require partner credentials
  to inspect the initial contract space

Stage 3 now adds:

- JustTCG as the active V0 source path under `src/sources/justtcg/`
- local untracked API-key loading from `price_store/.env.local`
- a single bounded live-capture command designed around the free-plan limits

Stage 4 now adds:

- source-oriented canonical JustTCG snapshots under `.price_data/canonical/`
- normalized variant-level current-price and history handling
- raw-to-canonical materialization commands that preserve provenance

Stage 5 now adds:

- live request-limit verification for the current JustTCG key
- paged JustTCG catalog capture under one run id
- canonical run aggregation across multiple raw capture pages
- published static price artifacts under:
  - `.price_data/exports/prices/`
  - `frontend/public/data/prices/`
- a marketplace-facing published contract that:
  - exposes `TCGPlayer` as the price source
  - keeps `JustTCG` in provenance/debug metadata only
  - emits one row per source variant
  - leaves default display-price selection to later frontend logic

## Plans

- [Stage 1 executed plan](../plans/executed/price-store/2026-05-06-price-store-stage-1-foundation-and-raw-capture.md)
- [Stage 2 executed plan](../plans/executed/price-store/2026-05-06-price-store-stage-2-tcgplayer-approval-and-samples.md)
- [Stage 3 executed plan](../plans/executed/price-store/2026-05-06-price-store-stage-3-justtcg-approval-auth-and-first-live-capture.md)
- [Stage 4 executed plan](../plans/executed/price-store/2026-05-06-price-store-stage-4-justtcg-contracts-and-repositories.md)
- [Stage 5 executed plan](../plans/executed/price-store/2026-05-06-price-store-stage-5-justtcg-publishable-snapshot-pipeline.md)
