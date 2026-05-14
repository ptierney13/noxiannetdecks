# DRAFT: Price Store Stage 7.3 Old Price Method Removal

## Draft Status

This is a draft summary plan for Stage 7.3. It must be finalized and manually
approved before implementation begins.

When Stage 7.3 is completed, update later `price-store` planning docs with any
remaining cleanup, operational, or architectural notes.

## Summary

Stage 7.3 removes the legacy price-generation and read path only after the new
queue-based D1-backed hosted pipeline has been validated and rolled out live
successfully.

This is the simplification and cleanup sub-stage. It should retire the old
method, remove dead code and docs, and leave one clear source of truth for
price generation and serving.

## Pertinent Details So Far

- Stage 7.2 should already provide:
  - live Cloudflare deployment of the new hosted path
  - production verification while the old path still exists
  - KV-backed hosted `prices-d1` artifacts served through the Pages read path
  - discovery, ingestion, cook, publish, and maintenance workers operating
    against shared D1 tables and queues
- Earlier Stage 7.1 and pre-rearchitecture Stage 7.2 assumptions are not
  binding restrictions on Stage 7.3 cleanup decisions.
- The old path should not be removed until the new path is accepted.
- Stage 7.2 should also leave publish using a worker-safe bundled card metadata
  lookup rather than filesystem reads from `card_store`, so Stage 7.3 should
  preserve that hosted dependency while removing only the legacy price path.

## Expected Outputs

- removal of the old price method from runtime and generation paths
- cleanup of stale code, configs, and docs
- one clear maintained price path going forward
- updated operator guidance reflecting the post-migration steady state

## Likely Scope

- remove legacy read/write/generation code for the old method
- remove transitional comparison-only UI once it is no longer needed
- update docs to describe only the retained architecture
- simplify tests that only existed to compare legacy and new paths

## Explicit Non-Goals

- no large redesign beyond removing legacy behavior
- no unrelated frontend cleanup
- no new source integrations

## Questions To Finalize In The Real Stage Plan

- what exact parity/soak criteria must be met before removal
- whether any internal-only comparison tooling should remain after cleanup
- whether any temporary transitional D1/KV compatibility shims still need
  removal
- whether the hosted `prices-d1` path should be renamed back to the primary
  public `prices` path as part of cleanup or remain explicitly distinct

## Test Plan

- verify the live app still renders correct prices after legacy removal
- verify the hosted pipeline remains healthy after dead-code cleanup
- verify docs and operator instructions no longer reference obsolete paths

## Assumptions

- The new hosted path is already the accepted replacement by the time Stage 7.3
  begins.
