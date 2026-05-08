# DRAFT: Price Store Stage 8 Every-2-Days Scheduled Refresh Setup

## Draft Status

This is a draft summary plan for Stage 8. It must be finalized and manually
approved before implementation begins.

When Stage 8 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 8 takes the manually runnable Cloudflare capture and publish workers from
Stage 7 and turns them into the intended every-2-days scheduled refresh path,
while also producing the operator-facing setup walkthrough for the user's
Cloudflare-side configuration.

## Pertinent Details So Far

- Stage 7 should already provide:
  - a Cloudflare-hosted manual capture worker
  - a Cloudflare-hosted manual publish worker
  - a coordination contract where publish only runs from completed capture
    outputs
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
- Stage 5 verified the current key's live request-size cap as `20`, which is a
  concrete operational invariant worth monitoring for drift or revalidation.
- V0 remains single-source, so upstream availability is a concentrated risk.

## Expected Outputs

- finalized every-2-days trigger shape for the Cloudflare capture worker
- Cloudflare-side setup walkthrough tailored for the user to complete
- request-budget guidance for the scheduled cadence
- documented fallback guidance for when an incremental run is too large and a
  full refresh must remain manual
- a clear scheduled orchestration rule for when publish should run after a
  successful capture

## Explicit Non-Goals

- no monitoring/runbook hardening yet
- no second-source failover design
- no large architectural redesign

## Questions To Finalize In The Real Stage Plan

- what exact scheduled trigger boundary Cloudflare should own versus what stays
  as operator-managed configuration
- whether the scheduled path should always run incremental or first run a cheap
  count/probe and abort when the projected request cost is too high
- what threshold should distinguish an acceptable incremental run from a
  manual-only full refresh case
- what setup materials are sufficient for the user to complete the Cloudflare
  configuration confidently on their end

## Test Plan

- verify the scheduled trigger invokes the same capture worker path as the
  manual run
- verify publish runs only after successful completed capture output exists
- verify the setup walkthrough matches the implemented worker configuration
- verify the scheduled path preserves the same published artifact shape

## Assumptions

- The user wants help wiring the every-2-days schedule in Cloudflare, but some
  final setup actions will still be completed on the user's side.
