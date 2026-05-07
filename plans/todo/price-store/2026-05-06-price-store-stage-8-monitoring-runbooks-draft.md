# DRAFT: Price Store Stage 8 Monitoring And Runbooks

## Draft Status

This is a draft summary plan for Stage 8. It must be finalized and manually
approved before implementation begins.

When Stage 8 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 8 makes the JustTCG-backed daily price pipeline supportable in production
with monitoring, runbook guidance, and clear operator recovery paths.

## Pertinent Details So Far

- Stage 7 should already automate daily refresh and hosted publishing.
- JustTCG plan limits and rate limits are an operational concern that should be
  visible to maintainers.
- Stage 5 verified the current key's live request-size cap as `20`, which is a
  concrete operational invariant worth monitoring for drift or revalidation.
- V0 remains single-source, so upstream availability is a concentrated risk.
- Stage 4 canonical snapshots can already preserve upstream usage-limit
  metadata, giving Stage 8 a concrete place to source request-budget signals.
- Stage 5's published artifacts are marketplace-facing variant rows, so stale
  data checks should verify both publish freshness and the presence of the
  tracked `frontend/public/data/prices/` outputs.

## Expected Outputs

- failure-mode inventory and operator runbook
- monitoring or status signals for stale snapshots and failed runs
- documented manual recovery procedures for auth, rate-limit, and publish
  failures

## Explicit Non-Goals

- no second-source failover design
- no large architectural redesign

## Questions To Finalize In The Real Stage Plan

- which health signals are most actionable
- how stale-data thresholds should be defined
- how much request-usage telemetry should be persisted from upstream responses
- whether request-limit verification should have its own monitorable drift check

## Test Plan

- verify monitorable failure paths can be simulated or inspected
- verify runbook steps are accurate against the implemented automation
- verify stale-data conditions are detectable

## Assumptions

- The single-source V0 pipeline needs especially clear operator guidance because
  there is no alternate live source fallback.
