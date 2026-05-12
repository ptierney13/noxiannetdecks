# DRAFT: Price Store Stage 7.2 Live D1 Worker Rollout

## Draft Status

This is a draft summary plan for Stage 7.2. It must be finalized and manually
approved before implementation begins.

When Stage 7.2 is completed, update Stage 7.3 and later planning docs with any
newly pertinent deployment details, constraints, or operational decisions.

## Summary

Stage 7.2 deploys the D1-backed price pipeline to Cloudflare production after
Stage 7.1 has already proven the relational model and local dual-price parity.

This sub-stage should create or bind the production D1 database, deploy the
worker topology, wire scheduling and service bindings, and enable the new hosted
path live while preserving the old price method for safety.

## Pertinent Details So Far

- Stage 7.1 should already provide:
  - a relational D1 schema with repo-managed migrations
  - local Wrangler/D1 validation of capture/process/publish behavior
  - local dual-price comparison proving acceptable parity
  - the concrete Stage 7.1 table set:
    - `price_capture_justtcg_runs`
    - `price_capture_justtcg_pages`
    - `price_process_runs`
    - `price_data`
    - `price_publish_runs`
    - `price_publish_artifacts`
    - `price_pipeline_state`
- D1 is the source of truth for hosted price data.
- The public site should not read D1 directly for every page load.
- A public-serving artifact layer should sit downstream of D1 truth.
- KV is the preferred public-serving target if Stage 7.2 includes the public
  distribution layer.
- A daily maintenance worker that deletes expired raw capture rows is the
  preferred retention cleanup model.
- The old price method must remain available during this rollout.
- Stage 7.1 deliberately did **not** move card metadata into D1.
  Publish currently enriches `price_data` rows from `card_store` using
  `tcgplayer_id`.
- Stage 7.1 publishes the D1-backed local comparison artifacts to
  `frontend/public/data/prices-d1/` while leaving the legacy
  `frontend/public/data/prices/` path untouched.

## Expected Outputs

- deployed Cloudflare workers and bindings for the new hosted path
- production D1 database configured and migrated
- scheduled execution configured in Cloudflare
- maintenance cleanup worker or equivalent scheduled cleanup path enabled
- production-safe verification guidance and rollback notes

## Likely Scope

- deploy capture/process/publish responsibilities in their Cloudflare form
- bind production D1
- bind any KV/public-serving target if included in the final 7.2 shape
- wire Service Bindings and Cron Triggers
- validate that the hosted path can run without removing the old path
- update the operator/setup document with exact production page-by-page steps

## Explicit Non-Goals

- no removal of the old price method
- no aggressive code cleanup of legacy paths
- no multi-source ingest rollout yet

## Questions To Finalize In The Real Stage Plan

- whether publish also owns KV updates or whether distribution is separated
- whether process is deployed as a fully separate Worker or remains an internal
  logical boundary behind capture/publish orchestration
- whether Stage 7.2 should keep publish-time card metadata enrichment in
  `card_store` or move that metadata into D1 as part of rollout preparation
- what exact production verification gate allows Stage 7.3 to begin
- whether the live site should expose both price paths simultaneously or keep
  the comparison limited to non-public/internal surfaces

## Test Plan

- validate production D1 migration success
- validate one end-to-end hosted run in production
- validate maintenance cleanup scheduling
- validate that the old path still functions while the new path is live
- validate any public-serving artifact layer reads correctly from the new
  published output

## Assumptions

- Stage 7.1 has already established local parity confidence.
- Cloudflare production deployment should happen only after local D1 semantics
  and local UI comparison are stable.
