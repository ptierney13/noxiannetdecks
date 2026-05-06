# DRAFT: Price Store Stage 1 Foundation

## Draft Status

This is a draft summary plan for Stage 1. It must be finalized and manually
approved before implementation begins.

When Stage 1 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 1 establishes the `price_store` workspace and its local data-layout
contract without introducing source-specific logic, external integrations, or
runtime API reads.

## Pertinent Details So Far

- Add a new `price_store` workspace/package separate from `card_store` and
  `deck_store`.
- Follow the repo's archive-oriented pattern with local git-ignored mutable
  data.
- Expected top-level layout should parallel existing data-pipeline structure:
  - `raw/`
  - `canonical/`
  - `exports/`
  - `logs/` or an equivalent run-status area
- The long-term serving model is published daily snapshots, not live source
  calls from the app.
- Initial planned sources are TCGplayer first and Cardmarket second, but no
  source code belongs in Stage 1.

## Expected Outputs

- `price_store` workspace scaffolding
- package README and package metadata
- config/bootstrap helpers for the repo-local price data directory
- initial architecture docs for the price pipeline boundary and storage layout

## Explicit Non-Goals

- no TCGplayer or Cardmarket client code
- no source approval docs
- no canonical price schema beyond what is strictly needed for workspace shape
- no merge/publish pipeline
- no runtime API routes
- no production scheduler

## Questions To Finalize In The Real Stage Plan

- exact package name and workspace registration details
- exact directory names and whether `logs/` is the right durable run-status
  location
- whether config/bootstrap should mirror `deck_store` directly or introduce a
  shared pattern later
- which docs live in `price_store/README.md` versus a dedicated docs file

## Test Plan

- verify the workspace is recognized by the repo tooling
- verify the bootstrap helpers create the expected local directory structure
- verify docs describe the intended storage and serving boundaries

## Assumptions

- Stage 1 is documentation and package-foundation work only.
- The price data root should be git ignored and treated as mutable operational
  data.
