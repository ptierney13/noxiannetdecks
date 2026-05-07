# Price Store Stage 2 TCGplayer Approval And Sample Payload Capture

## Later Initiative Note

This executed stage remains a true record of what was implemented on
2026-05-06, but it is superseded as the V0 shipping source strategy. The
initiative was later reset to use JustTCG as the only V0 price source because
the user already has a JustTCG API key and the documented integration path is
cleaner for a first release.

## Approval Status

This plan is the proposed detailed Stage 2 implementation plan. It still
requires manual approval before implementation begins.

When Stage 2 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 2 approves TCGplayer as the first source, documents the allowed and
maintainable access path, and captures a bounded representative sample payload
set that later schema work can use as real evidence instead of assumptions.

## Key Changes

- Stage 1 has been implemented as the `@noxiannet/price-store` workspace.
- The default mutable data root is `.price_data/` via
  `NOXIANNET_PRICE_DATA_DIR` override support.
- Raw payloads are expected under `raw/<sourceId>/<YYYY>/<MM>/<DD>/` with a
  sibling `.meta.json` sidecar for capture metadata.
- Run-status records are expected under `runs/<runId>.json`.
- TCGplayer is the first planned source.
- The project wants a clearly maintained list of regularly used sources.
- Monetization matters, but affiliate-link setup is intentionally deferred to a
  final dedicated stage once the rest of the pipeline is already working.
- Source approval should happen before pull/transform implementation.
- The project prefers allowed/maintainable access paths over brittle scraping.
- Stage 3 schema work should be driven by sample payloads captured here, not by
  assumptions made in advance.
- Document the TCGplayer source decision in
  `price_store/src/sources/tcgplayer/analysis.md`, covering:
  - the approved access mechanism
  - required credentials or operator prerequisites
  - rate-limit or quota expectations if known
  - important terms or commercialization constraints
  - any product-linking primitives or attribution constraints that a final
    affiliate stage may need
- Add source-specific operator documentation describing:
  - how a maintainer obtains access
  - how capture is run locally
  - where artifacts are written
  - what is intentionally out of scope for this stage
- Introduce only the minimum TCGplayer-specific code needed to support approved,
  bounded sample capture under the existing Stage 1 raw-capture conventions.
- Store a small, curated set of raw sample payloads under `.price_data/raw/`
  using the existing source/date layout and metadata sidecars, with enough
  coverage to inform Stage 3 contract design.
- Capture run metadata in `.price_data/runs/` for any operator flow added in
  this stage so the approval and sampling path uses the same durable run record
  approach as later pipeline stages.
- Record what Stage 3 must answer from the samples, including likely entity
  boundaries such as product, printing, listing, condition, finish, language,
  market price metrics, and stable source-link fields.
- Keep the implementation intentionally narrow so Stage 2 produces evidence and
  docs, not a generalized ingestion or transform system.

## Expected Outputs

- `price_store/src/sources/tcgplayer/analysis.md`
- `price_store/src/sources/tcgplayer/README.md`
- documented required secrets/config names and operator prerequisites
- documented field availability, mapping intent, rate-limit expectations, and
  commercialization notes
- a small representative set of raw TCGplayer sample payloads stored under the
  implemented Stage 1 raw-capture conventions
- notes identifying which fields or payload shapes are important for Stage 3
  contract design

## Explicit Non-Goals

- no full TCGplayer transform pipeline
- no canonical schema lock-in beyond observations from the samples
- no frontend or runtime reads
- no Cardmarket work
- no automated recurring refreshes
- no attempt to backfill a comprehensive historical corpus
- no runtime reads

## Proposed Scope Boundaries

- Preferred source access should be an official or clearly allowed mechanism.
- If TCGplayer access is blocked, unstable, or incompatible with the repo's
  commercialization goals, Stage 2 may stop after documenting that outcome and
  capturing the blocker clearly enough to redirect Stage 3 planning.
- The minimum useful sample set should cover the payload types needed to reason
  about:
  - searchable product identity
  - variant or printing identity
  - pricing fields and price-type differences
  - condition or finish distinctions if present
  - product URLs or other stable linking data
- Sample capture can be manual or operator-invoked, but it should leave durable
  artifacts and documentation that a later worker can inspect without repeating
  live exploration immediately.

## Test Plan

- Review the analysis document for completeness against the source-policy
  expectations:
  - access method
  - auth/secrets
  - terms/commercialization notes
  - product-linking or attribution constraints that later stages must preserve
  - rate-limit or operational constraints
- Verify any added capture helpers or scripts write artifacts using the Stage 1
  raw-capture and run-record conventions.
- Add or update tests for any new TCGplayer-specific helper logic that is
  introduced in the package.
- Run `npm run test -w @noxiannet/price-store`.
- Run `npm run build -w @noxiannet/price-store`.
- Manually inspect the captured sample set and confirm it is representative
  enough to drive Stage 3 schema work without immediately requiring more live
  discovery.

## Assumptions

- Source approval is a hard gate before TCGplayer code can be written.
- Limited sample capture is acceptable in this stage if it is part of approved,
  maintainable source access and remains clearly scoped to contract discovery.
- The Stage 2 implementation may need to distinguish between "approved source
  for exploration" and "approved source for eventual production automation" if
  the access path has different operational requirements at different scales.
- The repo's eventual published snapshot model still applies, so any discovered
  source fields should be evaluated partly through the lens of what later
  published artifacts will need to preserve, while affiliate setup itself stays
  out of scope until the final stage.

## Execution Notes

- Added `price_store/src/sources/tcgplayer/analysis.md` and
  `price_store/src/sources/tcgplayer/README.md` to document the current source
  approval outcome and operator workflow.
- Implemented a manifest-driven TCGplayer sample import flow in
  `price_store/src/sources/tcgplayer/` plus the
  `npm run import:tcgplayer:samples -w @noxiannet/price-store` command.
- Added bundled docs-derived example payloads under
  `price_store/fixtures/tcgplayer/` so the repository has a stable baseline
  sample set even without partner credentials.
- Imported that bundled sample set into `.price_data/raw/tcgplayer/...` and
  `.price_data/runs/` using the Stage 1 raw-capture conventions.
- Verified the package with `npm run build -w @noxiannet/price-store`,
  `npm run test -w @noxiannet/price-store`, and
  `npm run import:tcgplayer:samples -w @noxiannet/price-store`.
