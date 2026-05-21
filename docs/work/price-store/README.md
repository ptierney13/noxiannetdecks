# Price Store Staged Delivery

> Status: in progress

## Summary

Implement the `price_store` initiative as a staged, reviewable project on a
dedicated `codex/price-store-*` branch. The V0 shipping source is now JustTCG
only, using an existing server-side API key and JustTCG's documented pricing
API as the sole upstream price feed before first release. The first usable
serving model is repo-tracked published price snapshots that can be deployed
with the app and read by the frontend without live marketplace calls or runtime
write access.

After the local-first published artifact flow is working, later stages should
move refresh generation into Cloudflare-hosted scheduled workers so the same
published artifact contract is refreshed without local maintenance.

Each implementation stage requires its own detailed approved plan before code
for that stage begins. The goal is to keep architectural decisions visible,
limit each review to one coherent slice of work, and avoid large mixed-purpose
commits.

## Key Changes

- Keep the active `price_store` initiative grouped under `docs/work/price-store/`.
- Keep completed `price_store` stages grouped under `docs/archive/work/price-store/`.
- Use JustTCG as the only V0 source.
- Treat the earlier TCGplayer exploratory work as historical context rather
  than the shipping source strategy.
- Use published price snapshots as the serving contract for the app.
- Keep Stage 4 canonical storage source-oriented so later stages can merge into
  `card_store` and frontend-facing shapes deliberately instead of prematurely.
- Make the first app-readable publish target repo-tracked files that can be
  deployed alongside the frontend.
- Reserve Cloudflare hosting for later stages that add a scheduled capture
  worker plus internal publish worker against the same published artifact
  contract.
- Defer affiliate-link setup until the hosted pricing path is accepted and the
  cleanup stage is complete, while allowing worker deploy automation to remain
  a separate later operational follow-up.
- Require a detailed approved plan for each implementation stage before code
  for that stage is written.
- Land the work as stage-by-stage commits on a dedicated `codex/price-store-*`
  branch rather than as one large feature dump.

## Planned Stages

1. Stage 1: `price_store` foundation and raw capture scaffolding
2. Stage 2: TCGplayer exploratory approval and sample capture
3. Stage 3: JustTCG approval, auth wiring, and first live capture
4. Stage 4: JustTCG-driven contracts and repositories
5. Stage 5: JustTCG publishable snapshot pipeline
6. Stage 6: frontend static read integration
7. Stage 7: Cloudflare-hosted scheduled capture and internal publish
   - Stage 7.1: D1 conversion, local worker validation, and local dual-price display
   - Stage 7.2: live worker/D1 rollout with the new hosted path enabled
   - Stage 7.2.1: worker deploy automation as a separate future process
   - Stage 7.3: removal of the old price method after verification
8. Stage 8: monitoring and runbooks
9. Stage 9: affiliate-link setup and rollout
10. Stage 10: server-owned price data delivery and frontend decoupling

Each stage should have its own detailed plan document written immediately
before implementation starts for that stage.

Each future stage should also keep a draft summary plan in this folder so a new
context window can read:

- the executed plans for prior completed stages
- the draft summary for the current stage

That draft summary must then be finalized and approved before implementation
begins for the stage. Completing any stage should include refreshing the
remaining future-stage draft summaries with any newly pertinent decisions,
constraints, or changed assumptions.

## Test Plan

- Review the planning convention updates in `AGENTS.md` and `docs/work/README.md`.
- Confirm the active initiative folder exists at `docs/work/price-store/`.
- Confirm the executed stage archive exists at `docs/archive/work/price-store/`.
- Confirm this initiative plan lives under `docs/work/price-store/`.
- Confirm the plan explicitly records:
  - JustTCG as the only V0 source
  - TCGplayer Stage 2 as historical context rather than the shipping plan
  - published snapshots as the serving model
  - repo-tracked deployable artifacts as the first frontend-readable output
  - scheduled Cloudflare workers for hosted refresh generation
  - affiliate setup after hosted rollout and cleanup, while deploy automation
    may remain a separate future follow-up
  - the requirement for a detailed approved plan per stage
  - stage-by-stage branch-based delivery

## Assumptions

- The `price_store` effort is large enough to qualify as a self-contained
  initiative with multiple related plans.
- The repo should keep active initiative work under `docs/work/` and completed
  initiative history under `docs/archive/work/`.
- Later stage plans should be grouped under the `price-store` feature folders
  even if some stages are further split into sub-stages.
- Later workers may operate in fresh contexts and should be able to orient
  themselves by reading prior completed stage plans plus the current stage
  draft summary.
- JustTCG's current documented API surface and the existing user-held API key
  are sufficient to make it the cleanest V0 source, even if later versions
  revisit multi-source coverage.
- The Stage 4 canonical contract should remain a source-truth layer, while the
  app-facing merge and publish shape is deferred to Stage 5.
