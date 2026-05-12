# Price Store Stage 7.1 D1 Relational Conversion, Local Validation, And Dual-Price Display

## Status

This is the implementation kickoff document for Stage 7.1. It is intended to
be sufficient context for starting a fresh implementation window with a prompt
such as `7.1 implementation`.

Stage 7.1 inherits its scope from the approved Stage 7 plan in
[2026-05-07-price-store-stage-7-cloudflare-scheduled-capture-and-internal-publish.md](C:/Users/ptier/repos/Deck%20Archive%20Project/plans/todo/price-store/2026-05-07-price-store-stage-7-cloudflare-scheduled-capture-and-internal-publish.md),
but narrows execution to the local-only conversion and validation slice.

## Summary

Implement the local half of the hosted price-store migration by converting the
current temporary D1 document-table bridge into a real relational D1 model,
keeping all validation local, and exposing both the old and new price outputs
simultaneously in the local UI so parity can be checked before any Cloudflare
deployment.

Stage 7.1 does **not** perform live Cloudflare rollout. It should leave the
repo in a state where:

- the new price pipeline is D1-backed with relational semantics
- the logical hosted flow is split into capture, process, and publish
  responsibilities
- local Wrangler/D1 validation exercises the same `env.DB.prepare(...)` query
  shape used in Cloudflare
- the local app can show old and new prices side by side
- the next window can start Stage 7.2 deployment work without needing this
  thread

## Current Architectural Decisions

- JustTCG remains the only upstream source in V0.
- D1 is the authoritative storage layer for Stage 7, not R2.
- The logical pipeline should be treated as:
  1. raw capture
  2. process/canonicalize
  3. publish/distribute
- The live site should **not** read D1 directly per page request.
- Published public-facing artifacts should be treated as a separate serving
  layer from D1 truth.
- KV is the preferred public-serving target later, but Stage 7.1 may keep KV
  abstracted or local-only if that reduces rollout risk.
- Raw capture data may be stored in D1 if scoped to compact operational
  retention rather than indefinite blob archival.
- Raw capture retention should target roughly **7 days** using explicit
  `expires_at` semantics.
- A daily maintenance worker that clears expired raw rows is the preferred
  cleanup pattern, but local validation of the cleanup query is sufficient in
  Stage 7.1.

## Key Changes

### 1. Replace the temporary D1 document store

- Remove the long-term dependency on the transitional
  `price_store_documents` table.
- Introduce repo-managed D1 migrations for the real relational schema.
- Refactor repository helpers so hosted logic queries relational tables rather
  than logical JSON document keys.

### 2. Establish the first-pass relational schema

At minimum, Stage 7.1 should define and use tables shaped like:

- `capture_runs`
- `capture_pages`
- `process_runs` or equivalent processing-state table if needed
- `canonical_cards`
- `canonical_variants`
- `publish_runs`
- `published_artifacts`
- `pipeline_state`

Expected data ownership:

- `capture_runs`
  - run lifecycle, mode, request counts, page counts, status, messages
- `capture_pages`
  - one row per fetched page
  - include `expires_at` for raw retention
  - include enough raw payload or compact source representation to support
    debugging and reprocessing during the retention window
- `canonical_cards`
  - canonical card facts by run
- `canonical_variants`
  - canonical variant price/statistics/freshness by run
- `publish_runs`
  - publish lifecycle and result counts
- `published_artifacts`
  - persisted current manifest/snapshot payloads or equivalent structured
    published outputs
- `pipeline_state`
  - active capture pointer
  - latest successful capture pointer
  - latest successful publish pointer

Expected indexing:

- `capture_runs(status, completed_at)`
- `capture_pages(capture_run_id, page_index)`
- `capture_pages(expires_at)`
- `canonical_cards(capture_run_id, source_card_id)`
- `canonical_variants(capture_run_id, source_card_id)`
- `publish_runs(capture_run_id, completed_at)`
- `published_artifacts(game_key, artifact_type)`

### 3. Separate the logical worker responsibilities

Stage 7.1 should make the codebase reflect three logical responsibilities even
if Cloudflare deployment wiring waits until Stage 7.2:

- **capture**
  - fetch from JustTCG
  - insert `capture_runs`
  - insert `capture_pages`
  - no canonical output generation here beyond handing off to processing
- **process**
  - consume one completed capture run
  - write `canonical_cards` and `canonical_variants`
  - be rerunnable without re-fetching upstream
- **publish**
  - read the latest successful processed capture
  - build the current frontend manifest/snapshot contract
  - persist publish state and published artifacts

Implementation note:

- It is acceptable for Stage 7.1 to keep these responsibilities in shared code
  or locally invokable adapters rather than fully separate deployed Workers.
- The important outcome is that the repo code and repository boundaries clearly
  reflect the three stages.

### 4. Validate with local Wrangler + local D1

Stage 7.1 should add or update local workflow support so a developer can:

- apply D1 migrations locally
- run the relevant Workers or worker-equivalent entrypoints locally
- trigger capture/process/publish against local D1
- inspect resulting rows with local D1 queries

The intended validation target is:

- same SQL query shape as production:
  - `env.DB.prepare(...).bind(...).first()/all()/run()`
- local-only execution
- no live Cloudflare account dependency

### 5. Add local dual-price display

Expose both price paths simultaneously in local development:

- the old price method
- the new D1-backed published output

The comparison UI does not need final polish, but it should make parity checks
fast and obvious. It should be enough to answer:

- are both paths loading?
- are row counts/freshness roughly aligned?
- where do price discrepancies show up?

This local dual-price display is the explicit Stage 7.1 gate before any live
deployment work begins.

## Explicit Non-Goals

- No live Cloudflare deployment.
- No production Cron Trigger activation.
- No production D1 creation or binding work.
- No permanent decision that the public site will read D1 directly.
- No removal of the old price method.

## Suggested File/Area Targets

The exact file set may evolve, but Stage 7.1 should expect to touch areas like:

- [price_store/src/hosted](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted)
- [workers/shared/price-store-worker.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-worker.ts)
- [workers/price-store-capture.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-capture.ts)
- [workers/price-store-publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-publish.ts)
- [price_store/test](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/test)
- relevant frontend/UI files for local dual-price comparison
- new D1 migration files under a repo-managed migration location

## Test Plan

- Run `npm.cmd run build -w @noxiannet/price-store`
- Run `npm.cmd run test -w @noxiannet/price-store`
- Run `npx.cmd tsc -p tsconfig.cloudflare.json`
- Add/adjust tests for:
  - D1 schema initialization/migration behavior
  - capture inserting raw rows correctly
  - process generating canonical rows from a completed capture
  - publish reading relational rows rather than document-style keys
  - rerunnable process/publish behavior
  - refusal to publish while a capture/process run is still active
  - raw retention cleanup query behavior using `expires_at`
- Manually validate locally:
  - run capture locally against local D1
  - run process locally against that capture
  - run publish locally against processed rows
  - inspect D1 rows with local queries
  - confirm old/new price outputs can both be displayed in the local UI

## Assumptions

- The current transitional D1-backed document-store bridge can be replaced
  without needing to preserve compatibility as a long-term architecture.
- Raw payload retention for about one week is sufficient for debugging and
  reprocessing needs in V0.
- Local D1 validation is the correct gate before any production rollout.
- The Stage 5/6 published manifest/snapshot contract remains the frontend
  contract to preserve.
- Stage 7.2 will handle actual Cloudflare deployment, bindings, and scheduling
  after Stage 7.1 proves parity locally.
