# DRAFT: Price Store Stage 5 Cardmarket Source Approval

## Draft Status

This is a draft summary plan for Stage 5. It must be finalized and manually
approved before implementation begins.

When Stage 5 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 5 approves Cardmarket as the second source before any Cardmarket pull
code is implemented.

## Pertinent Details So Far

- Cardmarket is the planned second source.
- Cardmarket likely introduces more currency, regional, and possibly language
  considerations than TCGplayer.
- The same approval-before-code rule applies here as with TCGplayer.
- Commercial/affiliate implications should be captured in the source analysis
  if applicable.

## Expected Outputs

- `price_store/src/sources/cardmarket/analysis.md`
- source-specific operator `README.md`
- documented auth/access expectations
- documented field mapping, regional constraints, and normalization concerns

## Explicit Non-Goals

- no Cardmarket client code
- no raw capture implementation
- no transforms
- no merge/publish behavior

## Questions To Finalize In The Real Stage Plan

- official/allowed access mechanism and current terms constraints
- regional/auth constraints
- currency and language behavior
- affiliate/commercial support details
- product/variant mapping approach to canonical card IDs

## Test Plan

- review the analysis for completeness and implementation readiness
- verify the documented differences from TCGplayer are explicit enough for Stage
  6 planning

## Assumptions

- Cardmarket approval is a hard gate before implementation.
