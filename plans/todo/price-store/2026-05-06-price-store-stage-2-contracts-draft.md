# DRAFT: Price Store Stage 2 Contracts And Repositories

## Draft Status

This is a draft summary plan for Stage 2. It must be finalized and manually
approved before implementation begins.

When Stage 2 is completed, update all future `price-store` stage draft plans
with any newly pertinent details, changed constraints, or architectural
decisions.

## Summary

Stage 2 defines the internal and published data contracts for price data before
any external source integration is implemented.

## Pertinent Details So Far

- The app-facing serving contract is a published snapshot, not live source
  access.
- Price records should be keyed to existing canonical card IDs.
- Source-normalized records are expected to preserve provenance and source-level
  fields rather than collapsing everything immediately.
- Expected normalized fields discussed so far include:
  - `cardId`
  - `sourceId`
  - source product identifier
  - `capturedAt`
  - `currency`
  - `region`
  - `finish`
  - `condition`
  - `language` when available
  - source-native price metrics
  - availability/listing signals when available
  - affiliate URL
  - source URL
- The published snapshot is expected to include freshness metadata, source
  attribution, and warnings.

## Expected Outputs

- canonical per-source normalized schemas
- merged published snapshot schema
- repository interfaces for raw captures, canonical source snapshots, merged
  snapshots, and published snapshot reads
- tests for schema validation and repository behavior

## Explicit Non-Goals

- no external API clients
- no source approval implementation
- no scheduled automation
- no app/API routes

## Questions To Finalize In The Real Stage Plan

- exact normalized field names and which price fields are required vs optional
- condition/finish/language normalization policy
- currency strategy for multi-region sources
- how missing or ambiguous card matches are represented
- whether history/versioning is already part of the Stage 2 contract or deferred

## Test Plan

- validate accepted and rejected schema examples
- verify repository load/store interfaces against fixture data
- verify published snapshot reader shape is stable enough for later API work

## Assumptions

- Stage 2 should lock contracts before any source-specific code is written.
