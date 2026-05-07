# DRAFT: Price Store Stage 6 Frontend Static Read Integration

## Draft Status

This is a draft summary plan for Stage 6. It must be finalized and manually
approved before implementation begins.

When Stage 6 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 6 exposes the published JustTCG-derived snapshots to the frontend through
static same-origin asset reads so the deployed app can display prices without
live upstream API requests.

## Pertinent Details So Far

- Stage 5 should produce repo-tracked published price artifacts.
- V0 should continue avoiding direct runtime reads from the upstream source.
- The first integration target is static deployment compatibility.
- Stage 4 kept the canonical layer source-oriented, so Stage 6 should consume
  Stage 5 published artifacts rather than canonical JustTCG snapshots directly.
- Canonical snapshots already preserve price history, freshness, and source
  attribution, so Stage 6 can expose those only if Stage 5 chooses to publish
  them.

## Expected Outputs

- app integration that reads the published manifest and price payloads from the
  deployed static asset path
- frontend helpers for loading, caching, and surfacing freshness metadata
- UI updates that expose source attribution and last-updated information

## Explicit Non-Goals

- no client-side JustTCG API calls
- no hosted scheduler logic
- no second price source support

## Questions To Finalize In The Real Stage Plan

- exact asset location and loading strategy
- fallback behavior when price artifacts are missing or stale
- which screens expose prices in V0
- how source attribution should be displayed to users

## Test Plan

- verify local frontend reads work against published artifacts
- verify stale or missing artifact handling
- verify source attribution and freshness rendering

## Assumptions

- Static same-origin asset reads are sufficient for V0.
