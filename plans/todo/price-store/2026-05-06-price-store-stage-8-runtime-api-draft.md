# DRAFT: Price Store Stage 8 Frontend Static Read Integration

## Draft Status

This is a draft summary plan for Stage 8. It must be finalized and manually
approved before implementation begins.

When Stage 8 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 8 exposes the repo-published price snapshots to the frontend through
static same-origin asset reads so the deployed app can use price data without a
dedicated runtime API layer.

## Pertinent Details So Far

- Runtime reads should use published snapshots, not live marketplace calls.
- The first frontend integration should prefer static deployed files over a new
  API route when that keeps deployment and maintenance simpler.
- Responses should include source attribution and freshness metadata.
- Price lookup should be keyed to existing card IDs.

## Expected Outputs

- frontend-facing snapshot loader utilities for static asset reads
- app integration that reads the published manifest and card price payloads from
  the deployed static asset path
- tests for lookup behavior and stale-snapshot metadata handling

## Explicit Non-Goals

- no source pulling
- no scheduled refresh logic
- no mandatory API/Function layer if static assets are sufficient
- no alerting/monitoring rollout

## Questions To Finalize In The Real Stage Plan

- exact static asset paths and manifest lookup flow
- multi-card query behavior
- frontend caching behavior and cache-busting expectations
- missing-card and stale-data response behavior

## Test Plan

- frontend/static loader tests for single-card and multi-card lookups
- tests for missing-card behavior
- tests for freshness metadata propagation

## Assumptions

- Stage 8 should keep runtime coupling low by reading only published artifacts
  that were already deployed with the frontend.
