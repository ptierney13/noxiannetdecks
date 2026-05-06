# DRAFT: Price Store Stage 4 TCGplayer Pull And Transform

## Draft Status

This is a draft summary plan for Stage 4. It must be finalized and manually
approved before implementation begins.

When Stage 4 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 4 implements the first end-to-end source pipeline for TCGplayer:
authorized pull, raw capture preservation, and transform into the shared
normalized source snapshot.

## Pertinent Details So Far

- TCGplayer should be the first working source.
- Raw captures should be preserved for replay/debugging.
- Transforms should output the shared normalized per-source schema, not write
  directly into the final app-serving snapshot.
- The implementation should support affiliate-link output where appropriate.
- Tests should rely on fixtures for transform and matching behavior rather than
  live external calls.

## Expected Outputs

- TCGplayer auth/client layer
- raw capture persistence
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
- raw file naming/storage layout
- matching ambiguity handling and unresolved-record reporting
- how affiliate URLs are constructed and stored

## Test Plan

- fixture tests for transform behavior
- tests for raw capture persistence conventions
- tests for ambiguous/missing product matches
- tests for canonical source snapshot output validity

## Assumptions

- Stage 4 should stop at a validated per-source canonical snapshot.
