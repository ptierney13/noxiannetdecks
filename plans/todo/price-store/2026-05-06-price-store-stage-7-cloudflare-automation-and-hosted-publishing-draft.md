# DRAFT: Price Store Stage 7 Cloudflare Automation And Hosted Publishing

## Draft Status

This is a draft summary plan for Stage 7. It must be finalized and manually
approved before implementation begins.

When Stage 7 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 7 operationalizes the single-source JustTCG pipeline with Cloudflare
automation, secret management, and hosted publishing of the same artifact
contract the frontend already consumes.

## Pertinent Details So Far

- The intended cadence is daily price collection.
- The initial working flow should already exist locally with repo-tracked
  published artifacts and static frontend reads.
- Production automation should publish the same artifact shape that the
  frontend already knows how to consume.
- Secrets are required for the JustTCG API key and should stay server-side.
- The free JustTCG plan allows only 10 requests per minute and 1,000 requests
  per month, so automation must be intentionally frugal.
- Stage 5 verified on the live API that the current key supports `limit=20`
  and rejects `limit=21`, so automation should assume `20` is the actual live
  page-size cap unless re-verified later.
- Stage 4 canonical snapshots now preserve request usage metadata from JustTCG
  when available, which Stage 7 can reuse for budget-aware automation logging.
- Stage 5's published contract is marketplace-facing:
  - `TCGPlayer` is the consumer-facing price source
  - `JustTCG` stays in provenance/debug metadata
  - variant rows are preserved without frontend display-price choices baked in

## Expected Outputs

- Cloudflare scheduler/worker configuration
- JustTCG secret/config integration
- hosted publish wiring for the frontend-readable artifacts
- run-status recording and manual rerun path

## Explicit Non-Goals

- no major schema redesign
- no frontend contract rewrite away from the Stage 5/6 artifact shape
- no multi-source ingest orchestration

## Questions To Finalize In The Real Stage Plan

- exact Cloudflare deployment boundary and worker model
- how the JustTCG API key is bound and rotated
- publish target details and whether hosted artifacts remain in git, move to
  R2, or are otherwise exposed behind the same frontend-facing paths
- rerun/retry semantics with upstream rate limits
- what daily cadence and request shape stay safely inside the monthly free-plan
  budget
- whether automation should re-run limit verification on a schedule or treat
  the Stage 5 `20` cap as stable until a manual recheck

## Test Plan

- validate scheduled pipeline flow in a non-production-safe way where possible
- verify rerun safety and last-success recording
- verify the hosted publish output preserves the same shape the frontend already
  consumes

## Assumptions

- Stage 7 should make the pipeline run daily without local maintenance while
  preserving the already-proven frontend data contract.
