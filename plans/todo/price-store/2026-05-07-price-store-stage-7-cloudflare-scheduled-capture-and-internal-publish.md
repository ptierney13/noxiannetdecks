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

This stage should be executed as three explicit sub-stages:

1. **Stage 7.1** - convert the hosted path to relational D1 semantics, validate
   the workers locally with Wrangler/local D1, and add a local dual-price
   display path so the old and new price outputs can be compared side by side
   before deployment
2. **Stage 7.2** - deploy the workers, D1 bindings, and scheduled hosted path
   to Cloudflare production while preserving the old price method
3. **Stage 7.3** - remove the old price method only after the new path has been
   validated and accepted

The dedicated sub-stage documents for fresh implementation windows are:

- [2026-05-11-price-store-stage-7-1-d1-relational-local-validation-and-dual-price-display.md](C:/Users/ptier/repos/Deck%20Archive%20Project/plans/todo/price-store/2026-05-11-price-store-stage-7-1-d1-relational-local-validation-and-dual-price-display.md)
- [2026-05-11-price-store-stage-7-2-live-d1-worker-rollout-draft.md](C:/Users/ptier/repos/Deck%20Archive%20Project/plans/todo/price-store/2026-05-11-price-store-stage-7-2-live-d1-worker-rollout-draft.md)
- [2026-05-11-price-store-stage-7-3-old-price-method-removal-draft.md](C:/Users/ptier/repos/Deck%20Archive%20Project/plans/todo/price-store/2026-05-11-price-store-stage-7-3-old-price-method-removal-draft.md)

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
  - write capture rows, canonicalized card/variant rows, and run-status
    records into a hosted SQL database
  - materialize a database-backed canonical state for the completed run
  - mark the run as `succeeded` only after all pages and canonical tables are
    updated
- Add a publish worker whose job is to:
  - be reachable through a Cloudflare Service Binding from the capture worker
    rather than through a public manual endpoint
  - locate the latest completed hosted capture in the database
  - refuse to run if the latest candidate capture is still `running` or has
    failed
  - publish frontend-facing manifest and snapshot artifacts from that completed
    canonical database state
  - record publish run status separately from capture run status
  - be safely rerunnable without re-capturing upstream data

### Hosted Data Model

- Use Cloudflare-managed SQL storage as the hosted mutable source of truth for
  Stage 7. The default assumption for the implementation plan is D1.
- Model the hosted state explicitly in relational tables rather than as blobs:
  - capture runs
  - capture pages or page-ingest metadata
  - canonical cards and variants
  - publish runs
  - current published manifest/snapshot payloads or references
  - lightweight singleton state for active capture and latest successful
    capture/publish pointers
- Keep the existing repo-local `.price_data/` layout as a local development and
  historical mental model, but do not require Stage 7 runtime code to write to
  the local filesystem in production.
- Treat raw full-page JSON archival as optional and non-primary in this stage.
  If raw payload retention is needed, prefer storing normalized facts and
  minimal debugging metadata in D1 rather than recreating the R2 object model.

### Relational D1 Conversion Scope

- Replace the current temporary document-table bridge with a true relational D1
  schema.
- Treat the current `price_store_documents` approach only as a short-lived
  transition aid, not as the final Stage 7 architecture.
- The conversion work for this stage should explicitly include:
  - creating D1 migrations under repo-managed migration files
  - introducing typed repository helpers that query relational tables rather
    than logical JSON keys
  - migrating the hosted worker logic off document-style persistence
  - preserving the same publish output contract after the storage conversion

### Initial D1 Schema Direction

- Define a first-pass relational schema with clear ownership boundaries:
  - `capture_runs`
    - one row per scheduled or manual-equivalent hosted capture attempt
    - stores run id, mode, status, started/completed timestamps, request/page
      counts, verified limit, and failure/success message
  - `capture_pages`
    - one row per fetched upstream page
    - stores capture run id, page index, offset, captured timestamp,
      request URL, row count, and optional compact/raw payload representation
  - `canonical_cards`
    - one row per canonical card per capture run
    - stores run id, source card id, game identifiers, card metadata, and
      publish-relevant descriptive fields
  - `canonical_variants`
    - one row per canonical variant per capture run
    - stores run id, parent card linkage, rarity/finish/source identifiers,
      price/statistics fields, and freshness timestamps
  - `publish_runs`
    - one row per publish attempt
    - stores publish run id, source capture run id, status, timestamps,
      published row counts, and success/failure message
  - `published_artifacts`
    - stores the current manifest/snapshot payloads or equivalent persisted
      published outputs keyed by game/artifact type
  - `pipeline_state`
    - lightweight singleton/key-value table for active capture and latest
      successful capture/publish pointers only
- Add indexes that support the real worker queries rather than generic storage:
  - capture runs by status and completion time
  - capture pages by run id and page index
  - canonical cards by run id and source card id
  - canonical variants by run id and parent card id
  - publish runs by capture run id and completion time
  - published artifacts by game key and artifact type

### Query Pattern Expectations

- Prefer targeted SQL queries over item-by-item document loads.
- The intended worker query pattern should be:
  - capture worker:
    - insert a `capture_runs` row when the run starts
    - insert `capture_pages` rows as each page is fetched
    - upsert canonical card/variant rows for the completed run in a bounded
      write phase
    - mark the run `succeeded` or `failed` at the end
    - update `pipeline_state` pointers only after a successful commit path
  - publish worker:
    - query the active capture state
    - query the latest successful capture run
    - read canonical cards/variants for exactly that capture run
    - build manifest/snapshot from relational rows
    - record one `publish_runs` row
    - upsert current published artifact rows
- Avoid designing the publish worker around repeated "load one JSON blob by
  key" access patterns.
- Accept that some small singleton state may still be represented as keyed
  records in `pipeline_state`, but canonical price data should be row-oriented.

### Migration And Rollout Sequence

- Implement the D1 conversion in this order:
  1. add repo-managed D1 migration files and schema bootstrap instructions
  2. add relational repository helpers and typed row models
  3. dual-run or replace the current document-table adapter in local tests
  4. move hosted capture writes from document storage to relational inserts
  5. move hosted publish reads to relational selects
  6. add a local comparison surface that displays old and new prices
     simultaneously for parity validation during Stage 7.1
  7. preserve or reintroduce a minimal exported-artifact persistence layer only
     if needed for debugging or inspection
  8. update the operator document to reflect the real D1 tables and verification
     queries
- Prefer a clean replacement over long-term dual-write complexity unless a
  narrow temporary bridge is required only for test transition.

### Stage 7.1 / 7.2 / 7.3 Rollout

- **Stage 7.1 - local D1 conversion and dual-price validation**
  - finish the relational D1 migration work
  - validate capture/process/publish locally with Wrangler and local D1
  - expose both the old price method and the new D1-backed published output in
    the local UI at the same time
  - use the local dual-price display as the parity gate before any live deploy
- **Stage 7.2 - live hosted rollout**
  - deploy the capture worker, publish worker, D1 binding, and scheduled path
    to Cloudflare
  - keep the old price method intact while the hosted path is proven live
  - do not require the live site to drop the old path during this sub-stage
- **Stage 7.3 - old-path removal**
  - remove the old price generation/read path only after the new hosted path
    has passed validation
  - clean dead code, stale docs, and obsolete data-flow assumptions at the same
    time

### Local And Pre-Deploy Validation Strategy

- Treat local D1 under Wrangler as the primary semantic validation target
  before any remote deployment.
- The implementation should include:
  - local D1 migration application
  - local worker execution against D1 using the same `env.DB.prepare(...)`
    query shape Cloudflare uses in production
  - verification queries that inspect the resulting tables after capture and
    publish runs
- Only after local relational validation is stable should the stage handoff doc
  recommend remote non-production D1 testing.

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
  - publish reads only completed capture outputs from D1
  - publish must not infer partial state from in-flight row updates alone
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
  - what database-backed state replaces local `.price_data/` outputs in
    production
- Add one clear primary Stage 7 operator/setup document that explains:
  - the end-to-end architecture in plain language
  - what code and configuration live in the repository
  - what configuration and secrets live in Cloudflare
  - how the two workers coordinate through D1, run-status state, and a
    Cloudflare Service Binding
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
  - which worker, database, binding, secret, or cron-trigger page to use
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
- No requirement to introduce or manage an external PostgreSQL deployment for
  Stage 7.
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
  - D1 migration/schema initialization behavior for the hosted tables
- Review the new Stage 7 operator/setup document for completeness against the
  implementation, including:
  - architecture accuracy
  - clear separation of repo-owned code versus Cloudflare-owned configuration
  - page-by-page user action steps for all required Cloudflare setup,
    including D1, Cron Triggers, and Service Bindings
  - verification steps after each user-owned setup action
- Verify the hosted capture path still respects:
  - `limit=20`
  - request pacing compatible with the free-tier rate limit
  - request-count reporting in run metadata
- Manually validate the Stage 7 hosted workflow end to end in a bounded way:
  - Stage 7.1:
    - trigger or simulate one scheduled incremental capture locally
    - confirm hosted capture/canonical rows and run records are written in D1
    - confirm publish is invoked only after successful capture
    - confirm the published artifact shape matches the current frontend contract
    - confirm the local UI can display both old and new prices simultaneously
  - Stage 7.2:
    - confirm the live Cloudflare deployment can run the scheduled path safely
    - confirm rerunning publish does not make new JustTCG API requests
    - confirm attempting publish during an active capture is rejected safely
  - Stage 7.3:
    - confirm removing the old price method does not regress the UI or data
      path

## Assumptions

- Cloudflare Pages + Functions remains the deployed public site boundary, but
  Stage 7 may introduce additional Cloudflare-hosted runtime code for mutable
  price-data generation without redesigning the existing frontend read path.
- D1 is an acceptable Stage 7 hosted source-of-truth store for canonical
  prices, run metadata, and published outputs.
- The current JustTCG API key can be stored as a Cloudflare-managed secret and
  must remain fully server-side.
- The existing local `price_store` pipeline code can be refactored so shared
  capture, canonicalization, and publish logic is reusable by hosted workers
  rather than duplicated.
- The Stage 5/6 published contract is stable enough that Stage 7 should keep it
  unchanged and focus only on how the data is generated and stored.
- The user wants a strong explanatory handoff document as part of Stage 7, not
  just working code and not just a short deployment note.
- Cloudflare D1, Cron Triggers, and Service Bindings are acceptable Stage 7
  primitives for storage, scheduling, and internal worker-to-worker
  invocation.
