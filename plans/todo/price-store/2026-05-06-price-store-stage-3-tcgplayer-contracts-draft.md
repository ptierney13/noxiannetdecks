# DRAFT: Price Store Stage 3 TCGplayer-Driven Contracts And Repositories

## Draft Status

This is a draft summary plan for Stage 3. It must be finalized and manually
approved before implementation begins.

When Stage 3 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 3 defines the normalized price schemas and repository interfaces after
representative TCGplayer sample payloads have been captured and reviewed.

## Pertinent Details So Far

- Stage 1 is implemented as the `@noxiannet/price-store` workspace with the
  `.price_data/` root, the `raw/`, `canonical/`, `exports/`, and `runs/`
  directories, source-scoped raw capture paths, sibling metadata sidecars, and
  run-status records.
- Stage 2 should confirm the allowed TCGplayer access path and capture real
  sample payloads before schema decisions are locked.
- The first normalized contracts should be driven by actual source fields, not
  guessed in advance.
- The app-facing serving model is still published snapshots rather than live
  marketplace reads.

## Expected Outputs

- normalized per-source schema definitions informed by real TCGplayer payloads
- repository interfaces for raw capture reads, canonical source snapshots, and
  published snapshot metadata as far as they can be defined confidently
- fixture-backed schema validation tests based on captured samples
- documented deferred questions that still should not be solved until later
  stages

## Explicit Non-Goals

- no new live source pulling behavior beyond what Stage 2 needed for samples
- no full end-to-end source transform pipeline
- no Cardmarket implementation
- no runtime/API routes
- no scheduler or production publishing

## Questions To Finalize In The Real Stage Plan

- exact normalized field names and required/optional boundaries
- how card matching ambiguity is represented
- how provenance, affiliate links, and source-native metrics are preserved
- how much published snapshot metadata can be locked before merge work starts
- whether any repository interfaces should remain intentionally narrower until
  Stage 4 transform work is underway

## Test Plan

- validate accepted and rejected schema examples derived from captured fixtures
- verify repository behavior against fixture-backed sample data
- review deferred decisions to ensure the stage does not overfit to one early
  sample set

## Assumptions

- Stage 3 should be evidence-driven and smaller than a full pipeline stage.
