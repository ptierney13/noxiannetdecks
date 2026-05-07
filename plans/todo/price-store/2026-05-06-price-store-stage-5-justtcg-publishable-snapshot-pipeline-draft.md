# DRAFT: Price Store Stage 5 JustTCG Publishable Snapshot Pipeline

## Draft Status

This is a draft summary plan for Stage 5. It must be finalized and manually
approved before implementation begins.

When Stage 5 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 5 implements the first end-to-end JustTCG transform and publish flow,
producing repo-tracked frontend-readable snapshot artifacts without multi-source
merge logic.

## Pertinent Details So Far

- JustTCG is the only V0 source.
- Stage 4 has now defined the normalized JustTCG source contracts and
  repository interfaces.
- The canonical Stage 4 snapshot currently preserves:
  - source request context
  - raw artifact linkage
  - card-level descriptive records
  - variant-level price/freshness records
  - optional normalized price history
  - source usage metadata when available
- The first contract-safe bounded live snapshot now exists under
  `.price_data/canonical/justtcg/...` from a 20-card Riftbound capture with
  `include_price_history=true`.
- The initial shipping artifact model remains repo-tracked published snapshots.
- The free JustTCG plan is severely constrained at 10 requests per minute and
  1,000 requests per month, so the publish flow should avoid unnecessary source
  reads.
- JustTCG history fields are source-native and uneven:
  - some variants return `priceHistory: null`
  - populated history currently arrives as compact `{ p, t }` points
  - Stage 5 should publish only the normalized canonical history shape

## Expected Outputs

- JustTCG transform pipeline from raw captures into canonical source snapshots
- published snapshot generation for the frontend-serving contract
- source-local commands for capture, transform, and publish execution
- fixture-backed tests for transform and publish behavior

## Explicit Non-Goals

- no multi-source merge behavior
- no runtime fetches from JustTCG in the frontend
- no scheduler or hosted automation yet

## Questions To Finalize In The Real Stage Plan

- how the first controlled larger pull should page through the catalog without
  wasting monthly request budget
- exact publish artifact layout and manifest shape
- freshness metadata and last-success semantics
- how variant selection and display-price rules should work for V0
- which portion of canonical history should survive into published V0 artifacts
- how to keep monthly request consumption low enough for the free plan

## Test Plan

- fixture tests for transform and publish behavior
- tests for canonical snapshot output validity
- tests for published artifact shape and manifest consistency

## Assumptions

- Stage 5 is the first point where prices become deployable app artifacts.
- Stage 5 should begin with the first contract-safe larger JustTCG pull, using
  the Stage 4 canonical schema rather than inventing a new intermediate shape.
