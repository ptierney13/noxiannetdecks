# Price Store Stage 7.2 Delta-Merge Process And Publish

## Status

This archived document records the pre-execution Stage 7.2 proposal that
originally required manual approval before implementation began.

It covers a focused Stage 7.2 follow-up discovered during local May 12, 2026
worker validation: incremental captures currently publish only the changed
subset instead of merging against the previously published full truth.

## Summary

Update the hosted process/publish worker flow so incremental captures are
treated as deltas rather than a standalone all-truth source. The result should
be that:

- removed source variants disappear from the merged truth for cards included in
  the incremental capture
- unchanged cards that were not present in the incremental capture remain in
  the published output
- the D1-backed published snapshot remains a full site-serving dataset after an
  incremental run

This work should stay local-only and should not perform live Cloudflare
deployment.

## Problem Statement

Current behavior:

- capture can run in `incremental` mode
- process writes only the variants present in that one capture run
- publish reads only the latest processed run and emits artifacts directly from
  those rows

That causes two different outcomes:

- acceptable: if a captured card is present but a former variant is absent, the
  variant correctly disappears for that card
- incorrect: cards not present in the incremental capture disappear from the
  published dataset entirely

The local May 12, 2026 validation confirmed both:

- `Vex - Apathetic` likely reflects a real upstream variant removal
- the D1-backed artifact set dropped to `1332` rows because the publish layer
  treated the incremental capture as the full universe

## Key Changes

### 1. Define delta-aware process semantics

For incremental captures, processing should produce a card-scoped delta set:

- all variants for cards included in the capture run
- enough metadata to identify which logical cards were touched
- explicit handling of cards whose variant set shrank since the prior truth

This means process must preserve the distinction between:

- cards touched in this incremental run
- cards absent from this incremental run

### 2. Define merged publish semantics

Publish should build the outgoing full snapshot by merging:

- the previous published or previous successful processed truth
- the new processed delta from the current incremental run

Merge behavior:

- if a card is untouched in the incremental run, keep its prior rows
- if a card is touched in the incremental run, replace that card's prior rows
  with the new rows from the delta
- if a touched card now has fewer variants, the missing old variants are
  removed
- if a touched card now has zero variants, its prior rows are removed entirely

### 3. Persist enough state to support deterministic merges

Implementation may use one of these patterns:

- read previous published artifact payload from `price_publish_artifacts`
- read previous successful processed truth from relational tables
- add explicit repository helpers that materialize the current full merged view

Preferred direction:

- keep relational truth in D1
- avoid using frontend artifact files as merge inputs
- use `price_publish_artifacts` only as a publish record, not the sole merge
  source if relational helpers are cleaner

### 4. Keep full capture behavior unchanged

For `full` captures:

- process should continue producing the full dataset
- publish should continue emitting directly from that full processed truth

### 5. Add validation coverage for the exact bug

Tests should cover:

- incremental run updates one card while preserving unrelated prior cards
- incremental run removes one variant from a touched card and that variant is
  removed in the merged publish output
- incremental run with an untouched card never drops that card from the merged
  output
- full capture still replaces the entire dataset as before

## Suggested File/Area Targets

- [price_store/src/hosted/process.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/process.ts)
- [price_store/src/hosted/publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/publish.ts)
- [price_store/src/hosted/repository.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/repository.ts)
- [workers/price-store-publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-publish.ts)
- [price_store/test/hosted-price-store.test.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/test/hosted-price-store.test.ts)
- [docs/price-store-stage-7-1-local-d1.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/price-store-stage-7-1-local-d1.md)

## Test Plan

- `npm.cmd run build -w @noxiannet/price-store`
- `npm.cmd run test -w @noxiannet/price-store`
- `npx.cmd tsc -p tsconfig.cloudflare.json`
- local worker-style validation:
  - seed a full prior truth
  - run an incremental delta capture/process/publish scenario
  - confirm merged output preserves untouched cards
  - confirm touched-card variant removals propagate correctly

## Assumptions

- local-only validation remains sufficient for this fix
- no live Cloudflare deployment is part of this change
- card metadata remains outside D1 for now
- the correct semantics are card-scoped replacement on touched cards, not
  variant-scoped additive merge
