# DRAFT: Price Store Stage 2 TCGplayer Approval And Sample Payload Capture

## Draft Status

This is a draft summary plan for Stage 2. It must be finalized and manually
approved before implementation begins.

When Stage 2 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 2 approves TCGplayer as the first source and captures representative
sample payloads that later schema work can use as real evidence.

## Pertinent Details So Far

- Stage 1 has been implemented as the `@noxiannet/price-store` workspace.
- The default mutable data root is `.price_data/` via
  `NOXIANNET_PRICE_DATA_DIR` override support.
- Raw payloads are expected under `raw/<sourceId>/<YYYY>/<MM>/<DD>/` with a
  sibling `.meta.json` sidecar for capture metadata.
- Run-status records are expected under `runs/<runId>.json`.
- TCGplayer is the first planned source.
- The project wants a clearly maintained list of regularly used sources.
- Monetization matters, so affiliate-link support should be captured as part of
  the source analysis and data model.
- Source approval should happen before pull/transform implementation.
- The project prefers allowed/maintainable access paths over brittle scraping.
- Stage 3 schema work should be driven by sample payloads captured here, not by
  assumptions made in advance.

## Expected Outputs

- `price_store/src/sources/tcgplayer/analysis.md`
- source-specific operator `README.md`
- documented required secrets/config names
- documented field availability, mapping intent, rate-limit expectations, and
  commercialization notes
- a small representative set of raw TCGplayer sample payloads stored under the
  implemented Stage 1 raw-capture conventions
- notes identifying which fields or payload shapes are important for Stage 3
  contract design

## Explicit Non-Goals

- no full TCGplayer transform pipeline
- no canonical schema lock-in beyond observations from the samples
- no runtime reads

## Questions To Finalize In The Real Stage Plan

- official/allowed access mechanism and current terms constraints
- auth model and token lifecycle
- affiliate-link program details and output fields
- how TCGplayer products/variants map onto canonical card IDs
- acceptable fallback behavior if access terms or rate limits are restrictive
- what minimum sample set is sufficient to drive Stage 3 schema design

## Test Plan

- review the analysis for completeness against the source-policy expectations
- verify the sample payload set is representative enough to inform Stage 3
  without immediately requiring more live exploration

## Assumptions

- Source approval is a hard gate before TCGplayer code can be written.
- Limited sample capture is acceptable in this stage if it is part of approved,
  maintainable source access and remains clearly scoped to contract discovery.
