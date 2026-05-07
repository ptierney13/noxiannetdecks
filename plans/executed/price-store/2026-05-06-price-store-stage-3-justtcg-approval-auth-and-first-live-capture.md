# Price Store Stage 3 JustTCG Approval, Auth Wiring, And First Live Capture

## Approval Status

This plan is the proposed detailed Stage 3 implementation plan. It requires
manual approval before implementation begins.

When Stage 3 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 3 resets the shipping source strategy around JustTCG as the only V0 price
feed. It should document the approved integration boundary, wire server-side
authentication with the existing API key, and perform the first real live
capture into the Stage 1 raw data layout.

## Key Changes

- Approve JustTCG as the sole V0 upstream source for price data.
- Document the current JustTCG API boundary in
  `price_store/src/sources/justtcg/analysis.md`, including:
  - server-side API-key authentication via `x-api-key`
  - the documented base URL and core resource shape
  - free-plan rate-limit and plan-limit handling expectations
  - the expectation that client-side code must never receive the raw API key
- Add source-specific operator documentation in
  `price_store/src/sources/justtcg/README.md`.
- Introduce the minimum JustTCG-specific config surface needed for local
  capture, centered on a server-only `JUSTTCG_API_KEY` environment variable.
- Add a narrow server-side JustTCG client for the first approved calls.
- Capture a bounded live sample set from JustTCG under the existing Stage 1
  raw-capture layout and metadata conventions.
- Record run-status data for the live capture flow under `.price_data/runs/`.
- Preserve response metadata that matters to later stages, including update
  timestamps, variant pricing structure, and any request-usage metadata that
  helps operators understand plan limits.
- Update package documentation to make JustTCG the active source path and
  clearly separate the earlier TCGplayer exploratory work from the V0 plan.
- Treat the free-plan budget as a hard design constraint:
  - 10 requests per minute
  - 1,000 requests per month
  - minimize duplicate or exploratory calls aggressively

## Expected Outputs

- `price_store/src/sources/justtcg/analysis.md`
- `price_store/src/sources/justtcg/README.md`
- documented required config and secret names
- a minimal JustTCG client suitable for server-side capture
- local capture command(s) that fetch and persist a bounded live sample set
- representative raw JustTCG payloads stored under `.price_data/raw/justtcg/`
- run records showing success or failure under `.price_data/runs/`
- notes identifying which JustTCG fields should drive Stage 4 contract design

## Explicit Non-Goals

- no multi-source support
- no TCGplayer or Cardmarket implementation work
- no finalized canonical publish schema yet
- no frontend or runtime reads
- no scheduled automation
- no affiliate behavior

## Proposed Scope Boundaries

- Use only server-side authenticated capture flows.
- Prefer the narrowest implementation that preserves exact request and response
  visibility for debugging and raw artifact capture.
- Minimize call volume from the beginning:
  - prefer one bounded capture command over broad exploration tooling
  - preserve raw responses so later stages can iterate without re-calling the
    API
  - avoid fan-out requests unless a field is unavailable from lower-cost calls
- Keep the initial live sample set intentionally small but representative,
  covering enough cards and variants to reason about:
  - stable card IDs
  - variant IDs
  - pricing and condition fields
  - update timestamps
  - source links and provenance fields if exposed
  - optional history/analytics fields if present in the selected calls
- Preserve raw responses before any normalization so later stages can revisit
  contract decisions without re-pulling the same queries immediately.
- The capture flow should fail clearly when the API key is missing or invalid.

## Test Plan

- Review the JustTCG analysis document for completeness against the approved
  source-policy expectations.
- Add or update tests for:
  - config validation for the JustTCG API key
  - request-building or response-shape helper logic
  - raw-capture persistence from JustTCG payloads
  - run-status creation for successful and failed capture flows where practical
- Run `npm run test -w @noxiannet/price-store`.
- Run `npm run build -w @noxiannet/price-store`.
- Run the Stage 3 capture command locally with the existing API key and verify:
  - raw payloads are written under `.price_data/raw/justtcg/...`
  - metadata sidecars are written correctly
  - run status reflects the capture result

## Assumptions

- The existing user-held JustTCG API key is valid for server-side development
  and initial V0 capture work.
- JustTCG's documented `/cards` and related endpoints are sufficient to drive
  the first shipping version without introducing another marketplace source.
- The V0 product can tolerate a single-source price feed as long as the source
  is documented and the published snapshot contract is stable.
- The free JustTCG plan's 10-requests-per-minute and 1,000-requests-per-month
  limits are tight enough that minimalism should shape every capture and publish
  decision.

## Execution Notes

- Implemented the active JustTCG source area under
  `price_store/src/sources/justtcg/`, including:
  - local untracked API-key loading
  - manual card fetch logic against the validated `GET /v1/cards` endpoint
  - bounded raw-capture persistence
  - run-status recording
- Briefly used the official JustTCG SDK as a diagnostic aid, which helped prove
  the earlier failure was not an API-key issue and that our request
  construction/path handling was wrong.
- Removed the SDK afterward and kept the working manual client in-repo.
- Validated the correct Riftbound game slug as
  `riftbound-league-of-legends-trading-card-game`.
- Confirmed the earlier manual-fetch bug was in request construction:
  - the raw client resolved `/cards` against `https://api.justtcg.com/v1`
    incorrectly and dropped the `/v1` segment
  - the corrected endpoint `https://api.justtcg.com/v1/cards` returns normal
    API errors such as `MISSING_API_KEY` when unauthenticated
- Completed the first live JustTCG capture successfully with:
  - run record at
    `.price_data/runs/justtcg-capture-2026-05-07-riftbound-league-of-legends-trading-card-game.json`
  - raw payload at
    `.price_data/raw/justtcg/2026/05/07/2026-05-07T00-27-28.792Z--riftbound-league-of-legends-trading-card-game-cards-sample.json`
- Verified the package with:
  - `npm run build -w @noxiannet/price-store`
  - `npm run test -w @noxiannet/price-store`
  - `npm run capture:justtcg:sample -w @noxiannet/price-store`
