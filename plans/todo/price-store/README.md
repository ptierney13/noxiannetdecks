# Price Store Todo Plans

This folder contains pending or approved plans for the `price-store`
initiative.

Use it for:

- the initiative-level delivery plan
- stage-specific detailed plans before implementation starts
- follow-on or sub-stage plans that still represent pending work
- draft summary plans for future stages that later workers will refine into
  finalized stage plans

The current Stage 7 work is further split into dedicated sub-stage docs:

- `2026-05-11-price-store-stage-7-1-d1-relational-local-validation-and-dual-price-display.md`
- `2026-05-12-price-store-stage-7-2-live-d1-worker-rollout.md`
- `2026-05-12-price-store-stage-7-2-1-deploy-automation-draft.md`
- `2026-05-11-price-store-stage-7-3-old-price-method-removal-draft.md`

Stage 7 planning was re-architected on 2026-05-13 around a queue-driven
discovery, ingestion, cook, publish, and maintenance pipeline. Earlier Stage
7.1 and pre-rearchitecture Stage 7.2 assumptions are useful historical context
only and should not be treated as restrictions on the current plan set.

Current practical sequencing:

- Stage 7.3 is the cleanup stage that removes the legacy price path
- Stage 9 is the monetization-link rollout stage built on the retained hosted
  path
- Stage 7.2.1 remains a separate future todo for worker deploy automation
- Stage 8 monitoring has a Cloudflare-side baseline and can be revisited later
  for repo runbooks or documentation hardening

For this initiative, each stage starts from a draft summary plan in this folder.
Before implementation begins for that stage, the draft must be finalized and
approved. When a stage is completed, update the remaining future-stage draft
plans with any newly pertinent information so the next worker starts from the
latest context.
