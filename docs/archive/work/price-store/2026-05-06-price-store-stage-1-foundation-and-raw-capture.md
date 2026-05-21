# Price Store Stage 1 Foundation And Raw Capture Scaffolding

## Summary

Implement the first code stage for `price_store` by creating a new workspace
package, wiring it into the monorepo, and establishing the repo-local mutable
data layout and raw-capture scaffolding used by later source-specific stages.

This stage is intentionally narrow and source-agnostic. It should create the
package, storage boundary, and raw artifact conventions that later TCGplayer
and Cardmarket stages build on, without trying to invent normalized price
schemas before we have representative source payloads in hand.

## Key Changes

- Add a new `price_store/` workspace package registered in the repo root
  `package.json`.
- Use the package name `@noxiannet/price-store` to match the existing workspace
  naming pattern.
- Add package-level TypeScript setup consistent with the other workspaces:
  `package.json`, `tsconfig.json`, `src/`, `scripts/`, `test/`, and `README.md`.
- Introduce price-data configuration helpers that resolve a mutable local data
  root from `NOXIANNET_PRICE_DATA_DIR`, falling back to a repo-local
  git-ignored default at `repo-root/.price_data/`.
- Define the initial Stage 1 directory layout:
  - `raw/`
  - `canonical/`
  - `exports/`
  - `runs/`
- Add bootstrap logic and a small CLI script that initialize that directory
  structure and create only the minimal placeholder metadata needed to make the
  layout inspectable and testable.
- Define raw-capture conventions that later source stages must follow:
  - source-scoped paths under `raw/`
  - a durable capture timestamp representation
  - sidecar metadata for each saved payload or capture batch
  - a run-status record in `runs/` that can describe success/failure without
    implying a normalized downstream schema yet
- Provide helpers for resolving raw capture paths and writing capture metadata,
  but do not define normalized card-price record shapes yet.
- Export the configuration/bootstrap entry points from the package root so later
  stages can build on a stable foundation.
- Document the storage boundary, local data directory behavior, and the fact
  that published snapshots are the long-term serving contract rather than live
  marketplace reads.
- Document the intentionally deferred decisions that depend on real payloads,
  including normalized field names, condition/finish/language policy, price
  metric policy, and repository interfaces for canonical/published snapshots.

## Explicit Non-Goals

- No TCGplayer or Cardmarket client code.
- No source approval analysis beyond what is strictly necessary to explain the
  raw-capture scaffolding boundary.
- No sample payload acquisition yet.
- No normalized price schema.
- No repository interfaces for canonical or published price snapshots.
- No merge or publish pipeline.
- No runtime/API integration in the frontend or server.
- No production scheduler or monitoring behavior.

## Test Plan

- Verify the root workspace configuration recognizes `price_store`.
- Add unit tests for:
  - default and environment-configured price data root resolution
  - resolved Stage 1 layout paths
  - bootstrap behavior creating the expected directories/files
  - raw capture path and metadata helper behavior
  - run-status record creation/update behavior if included in this stage
- Run the package test suite for `@noxiannet/price-store`.
- Run the package build for `@noxiannet/price-store`.
- Manually verify the README and any supporting docs reflect the Stage 1 layout
  and raw-capture boundary accurately.

## Assumptions

- Stage 1 should mirror the successful `deck_store` pattern closely enough to
  stay familiar, while using price-specific names and directories.
- `runs/` is the preferred durable area for run metadata/status in this package
  instead of `logs/` or `audit/`, because source approval and operational
  logging are planned as later concerns.
- The repo-local mutable data store for prices should remain git ignored.
- The first implemented stage after approval is Stage 1, because there is not
  yet any existing `price_store` package in the repository.
- Schema design should wait until Stage 2 has produced representative TCGplayer
  payload examples that make the contract concrete instead of speculative.

## Execution Notes

- Implemented `@noxiannet/price-store` as a new workspace with build, test,
  `init:data-dir`, and `inspect:data-dir` commands.
- Wired the repo-local default data root to `.price_data/` and added that path
  to the root `.gitignore`.
- Implemented the Stage 1 directories `raw/`, `canonical/`, `exports/`, and
  `runs/`.
- Implemented raw capture path conventions under
  `raw/<sourceId>/<YYYY>/<MM>/<DD>/` with sibling `.meta.json` sidecars.
- Implemented run-status records at `runs/<runId>.json`.
- Verified the package with `npm run build -w @noxiannet/price-store` and
  `npm run test -w @noxiannet/price-store`.
