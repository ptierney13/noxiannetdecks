# DRAFT: Price Store Stage 8 Runtime API Read Integration

## Draft Status

This is a draft summary plan for Stage 8. It must be finalized and manually
approved before implementation begins.

When Stage 8 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 8 exposes published price snapshots to the application through a stable
runtime repository and read-only API routes.

## Pertinent Details So Far

- Runtime reads should use published snapshots, not live marketplace calls.
- The Pages Functions layer is the expected API surface for the public app.
- Responses should include source attribution and freshness metadata.
- Price lookup should be keyed to existing card IDs.

## Expected Outputs

- runtime `PriceRepository` or equivalent snapshot reader
- read-only API routes for manifest and card price lookups
- tests for lookup behavior and stale-snapshot metadata handling

## Explicit Non-Goals

- no source pulling
- no scheduled refresh logic
- no alerting/monitoring rollout

## Questions To Finalize In The Real Stage Plan

- exact route shapes and response schemas
- multi-card query behavior
- caching headers and runtime cache expectations
- missing-card and stale-data response behavior

## Test Plan

- API tests for single-card and multi-card lookups
- tests for missing-card behavior
- tests for freshness metadata propagation

## Assumptions

- Stage 8 should keep runtime coupling low by reading only published artifacts.
