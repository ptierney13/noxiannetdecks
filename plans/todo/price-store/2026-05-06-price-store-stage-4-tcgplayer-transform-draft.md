# DRAFT: Price Store Stage 4 TCGplayer Transform Pipeline

## Draft Status

This is a draft summary plan for Stage 4. It must be finalized and manually
approved before implementation begins.

When Stage 4 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 4 implements the first real TCGplayer transform pipeline using the
approved access path, the raw capture scaffolding, and the normalized contracts
defined after sample review.

## Pertinent Details So Far

- TCGplayer should be the first working source.
- Raw captures should already have a defined storage convention from Stage 1 and
  representative examples from Stage 2.
- The Stage 1 raw convention is currently
  `raw/<sourceId>/<YYYY>/<MM>/<DD>/timestamp--capture-key.*` with sibling
  metadata sidecars and run status files under `runs/<runId>.json`.
- Transforms should output the shared normalized per-source schema defined in
  Stage 3, not write directly into the final app-serving snapshot.
- The implementation should support affiliate-link output where appropriate.
- Tests should rely on fixtures for transform and matching behavior rather than
  live external calls.

## Expected Outputs

- TCGplayer auth/client layer
- capture replay or fixture ingestion as needed for transform execution
- transform to canonical source-normalized price records
- source-local commands for pull, transform, or combined execution
- fixture-backed tests

## Explicit Non-Goals

- no Cardmarket work
- no multi-source merge logic
- no app/API routes
- no production scheduler

## Questions To Finalize In The Real Stage Plan

- command surface and operator workflow
- idempotency and replay behavior
- matching ambiguity handling and unresolved-record reporting
- how affiliate URLs are constructed and stored

## Test Plan

- fixture tests for transform behavior
- tests for ambiguous/missing product matches
- tests for canonical source snapshot output validity

## Assumptions

- Stage 4 should stop at a validated per-source canonical snapshot.
