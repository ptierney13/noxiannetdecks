# Price Store

Stage 1 foundation for the price archive pipeline that will later capture,
normalize, and publish daily marketplace snapshots.

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

The Stage 1 layout is:

- `raw/`: captured source payloads and sidecar metadata
- `canonical/`: reserved for later normalized source snapshots
- `exports/`: reserved for later publishable snapshot artifacts
- `runs/`: run-status records for capture-oriented workflows

Stage 1 also establishes raw capture conventions:

- raw payloads are stored under `raw/<sourceId>/<YYYY>/<MM>/<DD>/`
- each payload gets a sibling `.meta.json` sidecar
- run status records are stored under `runs/<runId>.json`

## Commands

- `npm run init:data-dir -w @noxiannet/price-store`
- `npm run inspect:data-dir -w @noxiannet/price-store`

## Current Boundary

Stage 1 does not define normalized card price records yet. That contract is
deferred until TCGplayer sample payloads are approved and captured in Stage 2.

## Plans

- [Stage 1 executed plan](../plans/executed/price-store/2026-05-06-price-store-stage-1-foundation-and-raw-capture.md)
- [Stage 2 draft](../plans/todo/price-store/2026-05-06-price-store-stage-2-tcgplayer-approval-and-samples-draft.md)
- [Stage 3 draft](../plans/todo/price-store/2026-05-06-price-store-stage-3-tcgplayer-contracts-draft.md)
