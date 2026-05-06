# DRAFT: Price Store Stage 7 Merge And Publish Pipeline

## Draft Status

This is a draft summary plan for Stage 7. It must be finalized and manually
approved before implementation begins.

When Stage 7 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 7 combines the per-source canonical outputs into one app-facing published
snapshot and defines the publish artifact layout.

## Pertinent Details So Far

- The serving model is a published daily snapshot.
- The merged snapshot should preserve per-source provenance and freshness.
- The app will eventually read published artifacts rather than source adapters.
- Failed source runs should not destroy the last known good published output.

## Expected Outputs

- merge logic for TCGplayer and Cardmarket source snapshots
- published snapshot artifact layout
- manifest/freshness/warning metadata
- deterministic tests for merge and publish behavior

## Explicit Non-Goals

- no runtime API route integration
- no production scheduler
- no monitoring/alerts overhaul

## Questions To Finalize In The Real Stage Plan

- default display-price selection rules
- file splitting strategy for published artifacts
- last-known-good retention behavior
- whether historical daily snapshots are part of this stage or deferred

## Test Plan

- deterministic merge tests with unchanged input
- tests for partial source failure behavior
- tests for freshness and warning metadata
- tests for publish output shape and validity

## Assumptions

- Stage 7 is the first point where prices become app-consumable artifacts.
