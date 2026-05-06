# Price Store Staged Delivery

## Summary

Implement the `price_store` initiative as a staged, reviewable project on a
dedicated `codex/price-store-*` branch. The initial source scope is TCGplayer
and Cardmarket, and the serving model is published daily price snapshots that
other application parts can read without live marketplace calls.

Each implementation stage requires its own detailed approved plan before code
for that stage begins. The goal is to keep architectural decisions visible,
limit each review to one coherent slice of work, and avoid large mixed-purpose
commits.

## Key Changes

- Create a dedicated `price_store` initiative plan area under
  `plans/todo/price-store/` and `plans/executed/price-store/`.
- Keep the overall initiative plan plus all stage-specific detailed plans
  grouped in the `price-store` feature folders for the life of the project.
- Start with TCGplayer as the first source and Cardmarket as the second source.
- Use published daily snapshots as the serving contract for the app.
- Require a detailed approved plan for each implementation stage before code
  for that stage is written.
- Land the work as stage-by-stage commits on a dedicated `codex/price-store-*`
  branch rather than as one large feature dump.

## Planned Stages

1. Stage 1: `price_store` foundation
2. Stage 2: canonical contracts and repositories
3. Stage 3: TCGplayer source approval
4. Stage 4: TCGplayer pull and transform
5. Stage 5: Cardmarket source approval
6. Stage 6: Cardmarket pull and transform
7. Stage 7: merge and publish pipeline
8. Stage 8: runtime/API read integration
9. Stage 9: scheduling and production publishing
10. Stage 10: monitoring and runbooks

Each stage should have its own detailed plan document written immediately
before implementation starts for that stage.

## Test Plan

- Review the planning convention updates in `AGENTS.md`,
  `plans/todo/README.md`, and `plans/executed/README.md`.
- Confirm the `price-store` feature folders exist under both `plans/todo/` and
  `plans/executed/`.
- Confirm this initiative plan lives under `plans/todo/price-store/`.
- Confirm the plan explicitly records:
  - TCGplayer and Cardmarket as the initial sources
  - published daily snapshots as the serving model
  - the requirement for a detailed approved plan per stage
  - stage-by-stage branch-based delivery

## Assumptions

- The `price_store` effort is large enough to qualify as a self-contained
  initiative with multiple related plans.
- The repo should keep the existing `plans/todo/` and `plans/executed/`
  lifecycle rather than replacing it with a new root-level structure.
- Later stage plans should be grouped under the `price-store` feature folders
  even if some stages are further split into sub-stages.
