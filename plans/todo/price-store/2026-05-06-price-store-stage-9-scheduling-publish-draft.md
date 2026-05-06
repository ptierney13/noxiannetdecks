# DRAFT: Price Store Stage 9 Cloudflare Worker Automation And Hosted Publishing

## Draft Status

This is a draft summary plan for Stage 9. It must be finalized and manually
approved before implementation begins.

When Stage 9 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 9 operationalizes the pipeline with a Cloudflare worker-driven daily run,
secrets management, and hosted publishing of the same artifact contract so the
frontend stays up to date without local operator steps.

## Pertinent Details So Far

- The intended cadence is daily price collection.
- The initial working flow should already exist locally with repo-tracked
  published artifacts and static frontend reads.
- Production automation should publish the same artifact shape that the
  frontend already knows how to consume.
- Secrets are required for external source auth and possibly affiliate
  configuration.
- The workflow should be idempotent and support reruns.

## Expected Outputs

- Cloudflare scheduler/worker configuration
- hosted publish wiring for the frontend-readable artifacts
- secret/config integration
- run-status recording and manual rerun path

## Explicit Non-Goals

- no major schema redesign
- no frontend contract rewrite away from the Stage 7/8 published artifact shape
- no alerting/runbook completion beyond what is strictly needed for automation

## Questions To Finalize In The Real Stage Plan

- exact Cloudflare deployment boundary and worker model
- publish target details and whether hosted artifacts remain in git, move to R2,
  or are otherwise exposed behind the same frontend-facing paths
- secret binding mechanism
- rerun/retry semantics
- what run-status data is persisted and where

## Test Plan

- validate scheduled pipeline flow in a non-production-safe way where possible
- verify rerun safety and last-success recording
- verify the hosted publish output preserves the same shape the frontend already
  consumes

## Assumptions

- Stage 9 should make the pipeline run daily without local maintenance while
  preserving the already-proven frontend data contract.
