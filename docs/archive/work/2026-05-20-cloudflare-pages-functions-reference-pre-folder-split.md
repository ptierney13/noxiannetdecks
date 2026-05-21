# Cloudflare Pages + Functions

## Summary

Production is a single-origin Cloudflare deployment:

- static frontend assets are built from `frontend/`
- API routes are served from Cloudflare Pages Functions under `/api/*`
- hosted price payloads are served from `/data/prices-d1/*`

Use this file as the current deployment contract. Historical rollout details
belong in archived work docs, not here.

## Source Of Truth

The core deployment settings live in [`cloudflare-pages.config.json`](../../cloudflare-pages.config.json):

- project name: `noxiannetdecks`
- production branch: `main`
- production URL: `https://noxiannetdecks.com`

Branch preview URLs are derived locally with `npm run preview:url`, which runs
[`scripts/print-cloudflare-preview-url.mjs`](../../scripts/print-cloudflare-preview-url.mjs).

## Runtime Surface

### Static app

- `frontend` builds the browser app
- `npm run build` produces the deployable static output in `frontend/dist`

### API routes

[`functions/api/[[route]].ts`](../../functions/api/[[route]].ts) is the Pages
Functions adapter for the card API. It serves:

- `GET /api/health`
- `GET /api/cards`
- `GET /api/cards/:id`
- `POST /api/query/parse`
- `GET /api/query/features`
- `GET /api/metadata`
- `GET /api/metagame/pilot`
- `GET /api/pack-generator/options`
- `POST /api/pack-generator/pools`

This adapter reuses `card_store` service logic. Production should not depend on
a separate Fastify process.

### Hosted price payloads

[`functions/data/[[path]].ts`](../../functions/data/[[path]].ts) serves
`/data/prices-d1/*` from the `PRICE_STORE_PUBLISHED_DATA` KV binding.

The same binding is also used by the API adapter to load the published search
price index when that data is available.

## Local Expectations

Use:

- `npm run dev:api`
- `npm run dev:web`
- `npm run build`

Local frontend requests default to same-origin paths. In local Vite
development, `/api` is proxied to `http://127.0.0.1:4545`. `VITE_API_ORIGIN`
remains available as an override when needed.

## Release Flow

Use:

- `npm run release:ship` to push the current branch and report the preview URL
- `npm run release:publish` to fast-forward the dedicated `main` worktree and
  push `origin main`

Preview deployments are the default verification target for branch work.

## Update Triggers

Update this reference when any of the following change:

- `cloudflare-pages.config.json`
- the public API route surface in `functions/api/[[route]].ts`
- the hosted data path contract in `functions/data/[[path]].ts`
- preview URL derivation or release command behavior
