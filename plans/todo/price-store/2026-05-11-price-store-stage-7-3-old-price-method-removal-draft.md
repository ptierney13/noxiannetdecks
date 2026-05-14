# Price Store Stage 7.3 Legacy Price Path Removal

## Status

This plan must be manually approved before implementation begins.

When Stage 7.3 is completed, update Stage 9 and any later `price-store`
planning docs with the final retained public path, deleted legacy surfaces, and
any newly relevant cleanup notes.

## Summary

Stage 7.3 removes the legacy static publish/read path now that the hosted
queue-based D1 plus KV pipeline is the accepted live source of truth.

This stage should leave the repo with one maintained pricing path:

- hosted discovery, ingestion, cook, publish, and maintenance workers remain
  the only supported price-generation runtime
- the Pages-served KV-backed `prices-d1` contract remains the only supported
  public price-read contract for now
- legacy `/data/prices/*`, legacy publish scripts, dual-source toggle logic,
  and comparison-only UI/testing/docs are removed

Stage 7.3 is cleanup and simplification only. It should not redesign the
hosted runtime, rework the published snapshot schema, or introduce worker
deploy automation.

## Confirmed Starting Point

- The live hosted architecture is the queue-based Cloudflare pipeline documented
  in [docs/price-store-stage-7-2-cloudflare-rollout.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/price-store-stage-7-2-cloudflare-rollout.md).
- The app already defaults to the hosted-backed `/data/prices-d1/*` path in
  [frontend/src/priceData.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/priceData.ts).
- Legacy support still exists in the repo through:
  - the `/data/prices/*` static artifact path
  - `priceSource=legacy` switching logic
  - local dual-price comparison UI and related tests/docs
  - earlier static publish commands and price-store docs that still describe the
    old path as an active comparison target
- Worker deploy automation is intentionally deferred to its own future process
  and is not part of this cleanup stage.

## Key Changes

### 1. Collapse the frontend onto one supported price source

Remove legacy read-path switching from the frontend so card pricing features
read from one source only.

Implementation direction:

- remove the legacy path constant and `priceSource=legacy` query override from
  [frontend/src/priceData.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/priceData.ts)
- remove any comparison-only card-detail UI that exists only to contrast legacy
  versus hosted output
- keep the current hosted-backed `prices-d1` path as the live frontend contract
  rather than renaming it in this stage

### 2. Remove the legacy static publish/generation path

Retire the older repo-tracked static publish flow that wrote
`frontend/public/data/prices/*`.

Implementation direction:

- remove the old static publish commands and any code paths that only exist to
  materialize or read the legacy `/data/prices/*` artifacts
- delete committed legacy artifact samples if they are no longer needed for
  tests or documentation
- preserve the hosted local-refresh workflow and hosted publish logic

### 3. Simplify tests, docs, and package guidance

Update the repository so it documents only the retained hosted path.

Implementation direction:

- replace dual-path test fixtures with single-path hosted fixtures where
  possible
- update [price_store/README.md](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/README.md),
  [docs/price-store-stage-7-1-local-d1.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/price-store-stage-7-1-local-d1.md),
  and other price-store docs so they describe the hosted path as the only
  supported runtime
- keep historical executed plans intact; only update current guidance docs

### 4. Keep the current hosted public path stable

Stage 7.3 should not rename `prices-d1` back to `prices`.

Reasoning:

- the live Pages function currently serves only the `prices-d1` namespace path
- keeping the path stable reduces rollout risk and keeps cleanup focused on
  deleting old code rather than introducing a new production path rename
- a future rename can be treated as a separate cleanup if it becomes worth the
  churn

## Explicit Non-Goals

- no worker deploy automation
- no Cloudflare monitoring redesign
- no queue or D1 schema redesign
- no rename of the live `prices-d1` public path
- no new marketplace source integrations

## Suggested File/Area Targets

- [frontend/src/priceData.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/priceData.ts)
- [frontend/src/App.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/App.tsx)
- [frontend/src/App.test.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/App.test.tsx)
- [functions/data/[[path]].ts](C:/Users/ptier/repos/Deck%20Archive%20Project/functions/data/[[path]].ts)
- [price_store/README.md](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/README.md)
- [docs/price-store-stage-7-1-local-d1.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/price-store-stage-7-1-local-d1.md)
- [frontend/public/data/prices](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/public/data/prices)
- any remaining legacy publish scripts or package commands under
  [price_store](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store)

## Test Plan

- `npm.cmd run build -w @noxiannet/price-store`
- `npm.cmd run test -w @noxiannet/price-store`
- `npx.cmd tsc -p tsconfig.cloudflare.json`
- `npm.cmd test`
- verify card detail and trade-balancer pricing still render correctly using the
  hosted path only
- verify the Pages data function still serves `prices-d1` artifacts and no
  frontend behavior depends on `/data/prices/*`
- verify docs and package guidance no longer present the legacy path as an
  active supported option

## Assumptions

- The hosted `prices-d1` path is already the accepted live replacement.
- Cloudflare monitoring is already in place outside this repo and is not a
  prerequisite for this cleanup stage.
- Worker deploy automation intentionally remains a future todo rather than a
  dependency of legacy removal.
