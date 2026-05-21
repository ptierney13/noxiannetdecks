# Price Store Stage 7.3 Legacy Price Path Removal

## Status

> Status: draft

This plan must be manually approved before implementation begins.

When Stage 7.3 is completed, update Stage 9 and any later `price-store`
planning docs with the final retained public path, deleted legacy surfaces, and
any newly relevant cleanup notes.

## Summary

Stage 7.3 removes the remaining legacy static publish/read path now that the
hosted queue-based D1 plus KV pipeline is the accepted live source of truth.

This stage should leave the repo with one maintained pricing path:

- hosted discovery, ingestion, cook, publish, and maintenance workers remain
  the only supported price-generation runtime
- the Pages-served KV-backed `prices-d1` contract remains the only supported
  current public price-read contract
- the local repo-materialized `frontend/public/data/prices-d1/` copy remains as
  the local dev/test mirror of that current contract
- legacy `/data/prices/*`, legacy publish scripts, compatibility-only static
  artifacts, and comparison-only UI/testing/docs are removed

This stage also updates current guidance docs so they describe:

- the hosted `prices-d1` path as the supported current contract
- the repo-local `frontend/public/data/prices-d1/` materialization as local
  dev/test support
- the legacy `/data/prices/*` path as removed historical baggage rather than an
  active option

Stage 7.3 is cleanup and simplification only. It should not redesign the
hosted runtime, rework the published snapshot schema, or introduce worker
deploy automation.

## Confirmed Starting Point

- The live hosted architecture is the queue-based Cloudflare pipeline
  documented in
  [docs/reference/cloudflare-deployment/price-pipeline.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/reference/cloudflare-deployment/price-pipeline.md).
- The frontend already defaults to the hosted-backed `/data/prices-d1/*` path
  in
  [frontend/src/lib/priceData.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/lib/priceData.ts).
- The local Node API already defaults to reading local `prices-d1` files in
  [card_store/src/api/app.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/card_store/src/api/app.ts).
- Legacy support still exists in the repo through:
  - the repo-tracked `frontend/public/data/prices/*` static artifact path
  - legacy static publish code under `price_store/src/sources/justtcg/publish.ts`
  - documentation and planning references that still mention the old path
- Worker deploy automation is intentionally deferred to its own future process
  and is not part of this cleanup stage.

## Key Changes

### 1. Remove the legacy static publish/generation path

Retire the older repo-tracked static publish flow that wrote
`frontend/public/data/prices/*`.

Implementation direction:

- remove the old static publish commands and any code paths that only exist to
  materialize the legacy `/data/prices/*` artifacts
- delete committed legacy artifact samples if they are no longer needed for
  tests or documentation
- preserve the hosted local-refresh workflow and hosted publish logic for
  `prices-d1`

### 2. Keep the current `prices-d1` contract as the only supported runtime path

Do not rename `prices-d1` back to `prices` in this stage.

Implementation direction:

- keep the live hosted public path stable
- keep the local repo-materialized `prices-d1` copy as the dev/test mirror
- avoid mixing cleanup with a production-path rename

### 3. Simplify tests, docs, and package guidance

Update the repository so it documents only the retained hosted/current path.

Implementation direction:

- replace dual-path or legacy-path fixtures with single-path hosted fixtures
  where possible
- update current guidance docs such as
  [price_store/README.md](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/README.md),
  [docs/reference/cloudflare-deployment/price-published-data.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/reference/cloudflare-deployment/price-published-data.md),
  and related Cloudflare/reference docs so they describe the hosted path as the
  only supported current runtime
- keep historical executed plans intact; only update current guidance docs

## Explicit Non-Goals

- no worker deploy automation
- no Cloudflare monitoring redesign
- no queue or D1 schema redesign
- no rename of the live `prices-d1` public path
- no new marketplace source integrations

## Suggested File/Area Targets

- [frontend/src/lib/priceData.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/lib/priceData.ts)
- [frontend/src/App.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/App.tsx)
- [frontend/src/App.test.tsx](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/src/App.test.tsx)
- [card_store/src/api/app.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/card_store/src/api/app.ts)
- [card_store/src/api/service.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/card_store/src/api/service.ts)
- [functions/data/[[path]].ts](C:/Users/ptier/repos/Deck%20Archive%20Project/functions/data/[[path]].ts)
- [price_store/src/sources/justtcg/publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/sources/justtcg/publish.ts)
- [price_store/src/published/repository.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/published/repository.ts)
- [price_store/README.md](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/README.md)
- [docs/reference/cloudflare-deployment/price-published-data.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/reference/cloudflare-deployment/price-published-data.md)
- [frontend/public/data/prices](C:/Users/ptier/repos/Deck%20Archive%20Project/frontend/public/data/prices)

## Test Plan

- `npm.cmd run build -w @noxiannet/price-store`
- `npm.cmd run test -w @noxiannet/price-store`
- `npx.cmd tsc -p tsconfig.cloudflare.json`
- `npm.cmd test`
- verify card detail and trade-balancer pricing still render correctly using the
  hosted/current path only
- verify the Pages data function still serves `prices-d1` artifacts and no
  runtime behavior depends on `/data/prices/*`
- verify current docs and package guidance no longer present the legacy path as
  an active supported option

## Assumptions

- The hosted `prices-d1` path is already the accepted live replacement.
- The local `frontend/public/data/prices-d1/` files remain useful as the
  local dev/test mirror of the current contract.
- Cloudflare monitoring is already in place outside this repo and is not a
  prerequisite for this cleanup stage.
- Worker deploy automation intentionally remains a future todo rather than a
  dependency of legacy removal.
