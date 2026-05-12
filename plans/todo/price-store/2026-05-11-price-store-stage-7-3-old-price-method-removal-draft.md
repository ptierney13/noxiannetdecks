# DRAFT: Price Store Stage 7.3 Old Price Method Removal

## Draft Status

This is a draft summary plan for Stage 7.3. It must be finalized and manually
approved before implementation begins.

When Stage 7.3 is completed, update later `price-store` planning docs with any
remaining cleanup, operational, or architectural notes.

## Summary

Stage 7.3 removes the legacy price-generation and read path only after the
new D1-backed hosted pipeline has been validated locally and rolled out live
successfully.

This is the simplification and cleanup sub-stage. It should retire the old
method, remove dead code and docs, and leave one clear source of truth for
price generation and serving.

## Pertinent Details So Far

- Stage 7.1 should already provide:
  - relational D1-backed capture/process/publish logic
  - local dual-price comparison proving acceptable parity
  - a D1-backed comparison artifact path at `prices-d1`
- Stage 7.2 should already provide:
  - live Cloudflare deployment of the new hosted path
  - production verification while the old path still exists
- The old path should not be removed until the new path is accepted.
- Stage 7.1 kept card metadata outside D1 and enriches publish output from
  `card_store`, so Stage 7.3 should remove the old method carefully without
  accidentally deleting metadata dependencies that the hosted publish path still
  needs.

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

## Test Plan

- verify the live app still renders correct prices after legacy removal
- verify the hosted pipeline remains healthy after dead-code cleanup
- verify docs and operator instructions no longer reference obsolete paths

## Assumptions

- The new hosted path is already the accepted replacement by the time Stage 7.3
  begins.
