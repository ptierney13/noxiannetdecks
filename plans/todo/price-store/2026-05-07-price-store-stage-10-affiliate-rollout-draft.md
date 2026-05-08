# DRAFT: Price Store Stage 10 Affiliate-Link Setup And Rollout

## Draft Status

This is a draft summary plan for Stage 10. It must be finalized and manually
approved before implementation begins.

When Stage 10 is completed, update any remaining related planning documents
with newly pertinent decisions, constraints, or operational notes.

## Summary

Stage 10 is the literal final stage of the `price_store` initiative. It adds
affiliate-link or monetization behavior only after the JustTCG-backed pipeline,
publishing flow, frontend integration, hosted worker flow, scheduled cadence,
and monitoring are already working.

## Pertinent Details So Far

- Earlier stages should preserve stable source URLs and attribution metadata
  without implementing affiliate behavior.
- Affiliate configuration should not block the first shipping version of the
  pricing pipeline.
- The final monetization approach must fit the already-established published
  snapshot and frontend serving contract instead of redefining it.
- Stage 4 preserves source attribution and raw provenance in canonical
  snapshots, but affiliate behavior should still be introduced only through the
  later published/runtime contract, not by mutating source-level records.
- Stage 5's published contract is consumer-facing around the marketplace source
  (`TCGPlayer`) rather than the upstream provider (`JustTCG`), so affiliate
  rollout should preserve that boundary.
- Stage 5 also leaves default display-price choice to frontend logic, so any
  affiliate link behavior should not assume one canonical row is already chosen
  for display.

## Expected Outputs

- finalized monetization or affiliate policy for the shipping source strategy
- configuration requirements and operator guidance
- published artifact and runtime updates needed to expose monetized links if
  applicable
- validation that attribution and disclosure requirements are satisfied

## Explicit Non-Goals

- no re-architecture of the published snapshot model
- no redo of earlier source integration stages unless a true blocker is found

## Questions To Finalize In The Real Stage Plan

- whether JustTCG itself is the only required attribution surface or whether
  downstream marketplace links are needed
- whether affiliate behavior attaches per published variant row or only after
  frontend display grouping decisions
- where any monetization configuration lives and how it is secured
- what UI or API fields should expose outbound links
- what attribution or disclosure requirements must be shown to users

## Test Plan

- verify monetized output does not break existing published snapshot consumers
- verify required attribution or disclosure behavior is implemented correctly
- verify source-specific configuration works for the chosen rollout shape

## Assumptions

- All non-affiliate price-store capabilities are expected to be in place before
  this stage begins.
