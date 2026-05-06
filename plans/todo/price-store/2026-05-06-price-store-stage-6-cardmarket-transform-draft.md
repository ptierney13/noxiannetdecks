# DRAFT: Price Store Stage 6 Cardmarket Transform Pipeline

## Draft Status

This is a draft summary plan for Stage 6. It must be finalized and manually
approved before implementation begins.

When Stage 6 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 6 implements the second end-to-end source pipeline for Cardmarket:
authorized pull, raw capture preservation, and transform into the shared
normalized source snapshot.

## Pertinent Details So Far

- Cardmarket should be added after TCGplayer, not alongside it initially.
- This stage should follow the shared schema introduced earlier rather than
  creating Cardmarket-specific downstream contracts.
- Special care is expected around currency, region, condition, and language
  normalization.

## Expected Outputs

- Cardmarket auth/client layer
- raw capture persistence
- transform to canonical source-normalized price records
- source-local commands for pull, transform, or combined execution
- fixture-backed tests

## Explicit Non-Goals

- no multi-source merge/publish logic
- no runtime API routes
- no scheduler

## Questions To Finalize In The Real Stage Plan

- exact normalization rules for currency/language/condition
- how Cardmarket-specific product structures map to canonical cards
- unresolved-match reporting
- raw artifact layout and replay behavior

## Test Plan

- fixture tests for transform behavior
- tests for currency/language normalization
- tests for canonical source snapshot validity

## Assumptions

- Stage 6 should stop at a validated per-source canonical snapshot.
