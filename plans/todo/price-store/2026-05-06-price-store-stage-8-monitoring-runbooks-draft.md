# DRAFT: Price Store Stage 8 Monitoring And Runbooks

## Draft Status

This is a draft summary plan for Stage 8. It must be finalized and manually
approved before implementation begins.

When Stage 8 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 8 makes the scheduled JustTCG-backed Cloudflare price pipeline
supportable in production with monitoring, runbook guidance, and clear
operator recovery paths.

The current repo assumption is that a practical Cloudflare monitoring baseline
already exists outside this repository. If Stage 8 is revisited, it should
focus on codifying that baseline in repo docs and operator guidance rather than
blocking cleanup or monetization work.

## Pertinent Details So Far

- Stage 7 should already provide:
  - a Cloudflare-hosted scheduled capture worker
  - a Cloudflare-hosted internal publish worker
  - a coordination contract where publish only runs from completed capture
    outputs
  - a D1-backed source of truth for capture state, canonical data, and
    published artifacts
  - a KV-backed public-serving `prices-d1` artifact layer
  - completion of a local dual-price validation pass before the live rollout
  - a defined deploy path, whether still manual or automated through Stage 7.2.1
  - the queue-based Stage 7.2 runtime rooted at `price_pipeline_runs`,
    `price_ingestion_chunks`, `price_raw_pages`, `price_cooked_rows`,
    `price_publish_runs`, `price_publish_artifacts`, and
    `price_pipeline_state`
- JustTCG plan limits and rate limits are an operational concern that should be
  visible to maintainers.
- The intended cadence is every 2 days, not daily.
- A 2-day full refresh cadence is viable but tight on the free plan at roughly
  825 requests in a 30-day month, so scheduled runs should prefer the
  incremental `updated_after` path even though it is only mildly better than a
  full refresh in currently observed data.
- A live `updated_after=2026-05-05T00:00:00Z` probe on 2026-05-07 returned
  `meta.total = 946`, showing that incremental runs can still approach
  full-refresh cost and should be treated as budget-aware rather than cheap.
- Incremental runs are expected to merge card-scoped deltas into a previously
  established full truth, so operators should understand the baseline/full-run
  dependency when recovering the pipeline.
- Stage 5 verified the current key's live request-size cap as `20`, which is a
  concrete operational invariant worth monitoring for drift or revalidation.
- V0 remains single-source, so upstream availability is a concentrated risk.
- D1 row counts, write patterns, and storage growth are now operational
  concerns worth observing alongside JustTCG request usage.
- Publish should use a worker-safe bundled card metadata lookup keyed by
  `tcgplayer_id`, so Stage 8 monitoring should consider whether missing
  metadata mappings or stale bundled metadata need their own operator-visible
  signal.

## Expected Outputs

- failure-mode inventory and operator runbook
- monitoring or status signals for stale snapshots and failed runs
- request-budget visibility for scheduled runs
- documented manual recovery procedures for auth, rate-limit, capture, and
  publish failures

## Explicit Non-Goals

- no second-source failover design
- no large architectural redesign

## Questions To Finalize In The Real Stage Plan

- which health signals are most actionable
- how stale-data thresholds should be defined
- how much request-usage telemetry should be retained from scheduled runs
- whether schedule drift or missed publish runs should have their own
  operator-visible indicators

## Test Plan

- verify monitorable failure paths can be simulated or inspected
- verify runbook steps are accurate against the implemented scheduled pipeline
- verify stale-data conditions are detectable

## Assumptions

- The scheduled capture/publish flow already exists by the time Stage 8 begins.
- Cloudflare-side monitoring already covers the immediate operational need even
  if repo-level runbooks and documentation are still worth improving later.
