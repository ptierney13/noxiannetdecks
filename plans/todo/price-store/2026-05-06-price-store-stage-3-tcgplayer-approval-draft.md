# DRAFT: Price Store Stage 3 TCGplayer Source Approval

## Draft Status

This is a draft summary plan for Stage 3. It must be finalized and manually
approved before implementation begins.

When Stage 3 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 3 approves TCGplayer as the first source before any TCGplayer pull code
is implemented.

## Pertinent Details So Far

- TCGplayer is the first planned source.
- The project wants a clearly maintained list of regularly used sources.
- Monetization matters, so affiliate-link support should be captured as part of
  the source analysis and data model.
- Source approval should happen before pull/transform implementation.
- The project prefers allowed/maintainable access paths over brittle scraping.

## Expected Outputs

- `price_store/src/sources/tcgplayer/analysis.md`
- source-specific operator `README.md`
- documented required secrets/config names
- documented field availability, mapping intent, rate-limit expectations, and
  commercialization notes

## Explicit Non-Goals

- no TCGplayer client implementation
- no raw capture code
- no transforms
- no runtime reads

## Questions To Finalize In The Real Stage Plan

- official/allowed access mechanism and current terms constraints
- auth model and token lifecycle
- affiliate-link program details and output fields
- how TCGplayer products/variants map onto canonical card IDs
- acceptable fallback behavior if access terms or rate limits are restrictive

## Test Plan

- review the analysis for completeness against the source-policy expectations
- verify the docs provide enough information to implement Stage 4 without
  hidden architecture choices

## Assumptions

- Source approval is a hard gate before TCGplayer code can be written.
