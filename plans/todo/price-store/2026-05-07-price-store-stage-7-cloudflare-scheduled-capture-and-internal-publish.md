# Price Store Stage 7 Cloudflare Scheduled Capture And Internal Publish

## Summary

Implement Stage 7 of the `price-store` initiative by moving the existing
JustTCG refresh flow into Cloudflare-hosted scheduled runtime code with a
deliberate two-worker split:

1. a scheduled capture worker that talks to JustTCG and writes hosted run data
2. an internal publish worker that converts the latest completed capture into
   the same frontend-readable artifact contract introduced in Stages 5 and 6

This stage should include the real Cloudflare scheduling boundary now rather
than deferring it. The intended result is a fully hosted, fully scheduled
pipeline where Cloudflare runs capture on the desired cadence and the capture
worker then invokes publish internally once the capture has succeeded.

The new hosted path should still preserve both capture modes in shared code:

- `incremental` capture using `updated_after` as the default scheduled path
- `full` capture as an explicit code path for future operator recovery use

The publish worker must be rerunnable without spending additional upstream API
requests, and it must refuse to publish from an in-progress or failed capture.

This stage must also produce a durable operator-facing setup document that lets
the user understand the real hosted architecture and complete the required
Cloudflare-side setup outside Codex without guesswork.

## Key Changes

- Introduce a Cloudflare-hosted mutable price-data runtime boundary that is
  separate from the existing Pages Functions read API under `functions/`.
- Keep Stage 7 focused on two hosted workers:
  - scheduled capture worker
  - internal publish worker
- Preserve the Stage 5/6 published JSON contract so the frontend continues to
  consume the same manifest/snapshot shape without UI or loader changes.

### Worker Responsibilities

- Add a capture worker whose job is to:
  - load the JustTCG API key from Cloudflare-managed server-side secrets
  - respond to a Cloudflare `scheduled()` event
  - use the scheduled path as the primary production entrypoint
  - perform paged JustTCG capture using the validated free-tier cap of
    `limit=20`
  - preserve hosted raw page payloads, capture metadata, and run-status records
  - materialize a hosted canonical snapshot for the completed run
  - mark the run as `succeeded` only after all pages and canonical outputs are
    written
- Add a publish worker whose job is to:
  - be reachable through a Cloudflare Service Binding from the capture worker
    rather than through a public manual endpoint
  - locate the latest completed hosted canonical capture
  - refuse to run if the latest candidate capture is still `running` or has
    failed
  - publish frontend-facing manifest and snapshot artifacts from that completed
    canonical data
  - record publish run status separately from capture run status
  - be safely rerunnable without re-capturing upstream data

### Hosted Storage Model

- Use Cloudflare-managed object storage as the hosted mutable artifact layer for
  Stage 7. The default assumption for the implementation plan is R2.
- Mirror the current local artifact tiers in hosted form:
  - raw capture payloads and metadata
  - canonical snapshots and metadata
  - published manifest/snapshot outputs
  - run-status records
- Keep the existing repo-local `.price_data/` layout as the local development
  mental model, but do not require Stage 7 runtime code to write to the local
  filesystem in production.

### Capture Modes And Budget Semantics

- Support `incremental` capture using `updated_after`, but treat it as only
  mildly cheaper than full refresh until proven otherwise in production.
- Record the live observed budget signal that informed this decision:
  - on 2026-05-07, a live probe with
    `updated_after=2026-05-05T00:00:00Z` returned `meta.total = 946`
  - the current full catalog is about 1,092 cards / 55 requests
  - therefore incremental capture must be supported, but it must not be assumed
    to be a low-cost delta path
- Make `full` capture explicit in shared logic, but not part of the routine
  scheduled flow for this stage.
- Preserve or reintroduce request guardrails in the hosted path:
  - request delay compatible with the `10 requests/minute` free-tier limit
  - optional request-count cap
  - run metadata that records total cards, pages, and requests used
- Configure the real scheduled cadence in Cloudflare as part of this stage,
  with the default target being an every-2-days capture schedule.

### Coordination Contract

- Define one explicit coordination contract between the workers:
  - capture owns upstream calls and canonicalization
  - publish owns published frontend artifacts
  - publish reads only completed capture outputs
  - publish must not infer partial state from raw pages alone
- Use run-status records as the source of truth for whether a capture is
  publishable.
- Prefer latest successful completed capture selection over implicit timestamp
  guesses inside the publish worker.
- Prefer Cloudflare-native worker-to-worker communication over shared bearer
  tokens. Service Bindings are the intended Stage 7 internal invocation
  mechanism.

### Trigger Surface

- The capture worker should be driven by Cloudflare Cron Triggers via a
  `scheduled()` handler.
- The publish worker should be driven internally by the capture worker via a
  Cloudflare Service Binding after successful capture completion.
- Do not require a public operator-facing bearer-token endpoint between workers
  in this stage.
- Keep the publish worker isolated from public usage where practical; it should
  exist primarily as an internal bound service.

### Repository And Documentation Updates

- Add docs describing:
  - the two-worker hosted boundary
  - scheduled trigger expectations
  - capture vs publish responsibilities
  - what hosted artifacts replace local `.price_data/` outputs in production
- Add one clear primary Stage 7 operator/setup document that explains:
  - the end-to-end architecture in plain language
  - what code and configuration live in the repository
  - what configuration and secrets live in Cloudflare
  - how the two workers coordinate through hosted storage, run-status state,
    and a Cloudflare Service Binding
  - how the scheduled cadence is configured
  - what the shared code paths mean for `incremental` vs `full`
  - what a successful capture run produces
  - what a successful publish run produces
  - what failure states mean and how they block publish
  - how later stages will build on the scheduled setup
- Make that operator/setup document explicit enough that the user can learn how
  the system really works from reading it, not just click through a checklist.
- Include a step-by-step Cloudflare handoff section that lists the exact user
  actions still required outside Codex, grouped by Cloudflare area/page.
- Write those handoff steps at the per-webpage level wherever practical, such
  as:
  - which Cloudflare dashboard area to open
  - which worker, bucket, binding, secret, or cron-trigger page to use
  - what values come from repo code versus what the user must supply or confirm
  - what post-save verification to perform on that page before moving on
- Update future-stage draft plans so Stage 8 assumes:
  - a scheduled capture worker already exists
  - an internal publish worker already exists
  - capture already triggers publish after successful completion

## Explicit Non-Goals

- No attempt to make `updated_after` smart enough to avoid large deltas beyond
  the upstream API's current behavior.
- No frontend contract redesign away from the Stage 5/6 manifest and snapshot
  shape.
- No second-source ingest orchestration.
- No monitoring/runbook hardening beyond the minimum run-status and failure
  visibility needed for manual operation.
- No requirement that Cloudflare setup be fully self-service from the repo
  alone; some account-side configuration will still be user-completed in Stage
  7 and must be documented precisely.

## Test Plan

- Run the `@noxiannet/price-store` build and test suites after adapting shared
  logic for hosted execution.
- Add targeted tests for:
  - hosted capture mode selection (`incremental` vs `full`)
  - hosted run-status transitions for capture and publish
  - publish refusal when a capture is still running or has failed
  - rerunnable publish from the same completed canonical capture
  - preservation of the existing frontend manifest/snapshot JSON contract
  - scheduled capture invocation of the same hosted capture logic
  - internal capture-to-publish handoff via the worker boundary
- Review the new Stage 7 operator/setup document for completeness against the
  implementation, including:
  - architecture accuracy
  - clear separation of repo-owned code versus Cloudflare-owned configuration
  - page-by-page user action steps for all required Cloudflare setup,
    including Cron Triggers and Service Bindings
  - verification steps after each user-owned setup action
- Verify the hosted capture path still respects:
  - `limit=20`
  - request pacing compatible with the free-tier rate limit
  - request-count reporting in run metadata
- Manually validate the Stage 7 hosted workflow end to end in a bounded way:
  - trigger or simulate one scheduled incremental capture
  - confirm hosted raw/canonical artifacts and run records are written
  - confirm publish is invoked only after successful capture
  - confirm the published artifact shape matches the current frontend contract
  - confirm rerunning publish does not make new JustTCG API requests
  - confirm attempting publish during an active capture is rejected safely

## Assumptions

- Cloudflare Pages + Functions remains the deployed public site boundary, but
  Stage 7 may introduce additional Cloudflare-hosted runtime code for mutable
  price-data generation without redesigning the existing frontend read path.
- R2 is an acceptable Stage 7 hosted storage target for raw, canonical,
  published, and run-status JSON artifacts.
- The current JustTCG API key can be stored as a Cloudflare-managed secret and
  must remain fully server-side.
- The existing local `price_store` pipeline code can be refactored so shared
  capture, canonicalization, and publish logic is reusable by hosted workers
  rather than duplicated.
- The Stage 5/6 published contract is stable enough that Stage 7 should keep it
  unchanged and focus only on how the data is generated and stored.
- The user wants a strong explanatory handoff document as part of Stage 7, not
  just working code and not just a short deployment note.
- Cloudflare Cron Triggers and Service Bindings are acceptable Stage 7
  primitives for scheduling and internal worker-to-worker invocation.
