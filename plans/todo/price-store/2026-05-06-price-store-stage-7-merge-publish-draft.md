# DRAFT: Price Store Stage 7 Merge And Repo-Publish Pipeline

## Draft Status

This is a draft summary plan for Stage 7. It must be finalized and manually
approved before implementation begins.

When Stage 7 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 7 combines the per-source canonical outputs into one app-facing published
snapshot and writes deployable repo-tracked artifacts that can ship with the
frontend.

## Pertinent Details So Far

- The serving model is a published snapshot.
- The merged snapshot should preserve per-source provenance and freshness.
- The first app integration should read published artifacts rather than source
  adapters or runtime write targets.
- Failed source runs should not destroy the last known good published output.
- The first publish target should live in the git-tracked repo so the frontend
  can deploy it as static files, likely under `frontend/public/price-data/` or
  an equivalent tracked asset path.

## Expected Outputs

- merge logic for TCGplayer and Cardmarket source snapshots
- published snapshot artifact layout
- repo-tracked publish output written into the agreed frontend-readable static
  asset path
- manifest/freshness/warning metadata
- deterministic tests for merge and publish behavior

## Explicit Non-Goals

- no frontend consumption changes beyond producing the files it will read later
- no Cloudflare scheduler/worker automation
- no monitoring/alerts overhaul

## Questions To Finalize In The Real Stage Plan

- default display-price selection rules
- file splitting strategy for published artifacts
- exact tracked publish path inside the repo and how it maps into the deployed
  frontend asset tree
- last-known-good retention behavior
- whether historical daily snapshots are part of this stage or deferred

## Test Plan

- deterministic merge tests with unchanged input
- tests for partial source failure behavior
- tests for freshness and warning metadata
- tests for publish output shape and validity
- verify the generated files are suitable for static frontend reads after a
  normal frontend build/deploy

## Assumptions

- Stage 7 is the first point where prices become frontend-deployable artifacts.
