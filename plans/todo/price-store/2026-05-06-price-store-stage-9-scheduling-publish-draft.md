# DRAFT: Price Store Stage 9 Scheduling And Production Publishing

## Draft Status

This is a draft summary plan for Stage 9. It must be finalized and manually
approved before implementation begins.

When Stage 9 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 9 operationalizes the pipeline with a daily scheduled run, secrets
management, and production publishing of the snapshot artifacts.

## Pertinent Details So Far

- The intended cadence is daily price collection.
- The recommended serving model is published snapshots in managed storage.
- Secrets are required for external source auth and possibly affiliate
  configuration.
- The workflow should be idempotent and support reruns.

## Expected Outputs

- scheduler/job configuration
- production publish wiring
- secret/config integration
- run-status recording and manual rerun path

## Explicit Non-Goals

- no major schema redesign
- no alerting/runbook completion beyond what is strictly needed for automation

## Questions To Finalize In The Real Stage Plan

- exact scheduling platform and deployment boundary
- publish target details
- secret binding mechanism
- rerun/retry semantics
- what run-status data is persisted and where

## Test Plan

- validate scheduled pipeline flow in a non-production-safe way where possible
- verify rerun safety and last-success recording
- verify publish output is updated only on successful runs

## Assumptions

- Stage 9 should make the pipeline run daily without yet being the full
  observability stage.
