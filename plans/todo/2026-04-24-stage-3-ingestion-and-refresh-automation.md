# Stage 3 Ingestion And Refresh Automation

## Summary

Stage 3 automates source collection, normalization, rollup generation, and
publication after the Stage 1 dataset model and Stage 2 hosted snapshot site
are stable. The goal is fresher public data without changing the core runtime
shape of the site.

## Key Changes

- Organize source intake under per-source folders so every public source keeps
  its own analysis, documentation, pull tools, and shared-format transform
  tools.
- Require a written source analysis and explicit approval before implementing
  pull code for any new public source.
- Add scheduled or operator-triggered collection workflows for the approved
  source list.
- Keep third-party aggregator sites out of automated collection unless a later
  approved plan explicitly changes that boundary.
- Keep the raw archive durable and append-only enough to avoid unnecessary
  re-collection.
- Normalize source captures into a shared event input format first, then
  process that shared format into canonical event/deck records using the Stage
  1 schema and classification rules.
- Regenerate rollups and static snapshot artifacts as part of the refresh
  pipeline.
- Publish refreshed snapshot artifacts to the hosted site without introducing
  live per-page calculations.
- Track failures and freshness so stale data can be detected without guessing.

## Test Plan

- Verify repeated refresh runs produce deterministic results when source inputs
  have not changed.
- Verify source-specific transform tools produce valid shared event input
  documents before canonical processing runs.
- Verify changed source inputs produce updated canonical records, rollups, and
  snapshots.
- Verify failed source captures or parsing problems do not silently corrupt the
  canonical dataset.
- Verify published hosted artifacts update cleanly after a successful refresh.

## Assumptions

- Automation is layered on top of the existing raw archive, canonical dataset,
  and snapshot contract rather than replacing them.
- Source-specific pull tools stop at raw capture and shared event input; a
  separate processing layer owns canonical storage writes.
- Public metagame pages continue to read precomputed exports after automation is
  added.
- Source capture remains text-only unless a later plan explicitly approves
  something broader.
- Automated refreshes operate only on approved green sources; manual-reference
  sources stay outside the ingestion pipeline.

## Future Database Addendum

- If/when a database is added, it should store canonical records and rollups,
  not become a reason to compute metagame statistics on demand at request time.
- Scaling should come from better ingestion discipline, indexed canonical
  storage, and precomputed exports rather than a rewrite of the public serving
  model.
