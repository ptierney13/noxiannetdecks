# Cloudflare Pages + Functions Deployment

## Summary

The public deployment target for this repository is `Cloudflare Pages +
Functions`.

- Production hostname: `noxiannetdecks.com`
- Preview flow: Cloudflare preview deployments for branch and pull request work
- Static assets: built from `frontend/`
- Server-backed API: served under the same origin from `/api/*`

This repo now treats the local Vite + API split as a development convenience,
not as the production architecture.

## Cloudflare Setup Checklist

### Account and DNS

Before the first production deploy:

- add `noxiannetdecks.com` to Cloudflare as a zone
- update the registrar nameservers to the Cloudflare-assigned nameservers
- wait for the zone to become active in Cloudflare

### Pages project settings

When creating the Pages project from this repository, use:

- Framework preset: `None`
- Production branch: your primary branch, typically `main`
- Root directory: repository root
- Build command: `npm run build`
- Build output directory: `frontend/dist`

This repository already defines the same output directory in
[`wrangler.toml`](../wrangler.toml).

### Environment variables and bindings

The current public deployment does not require:

- Cloudflare Pages environment variables
- Cloudflare Secrets
- D1 bindings
- KV bindings
- R2 bindings

The frontend defaults to same-origin `/api/*` calls in production, so
`VITE_API_ORIGIN` is only needed for local development.

## Runtime Responsibilities

### Static frontend assets

Built output from `frontend/dist` serves:

- Cards UI
- Deck Explorer routes
- Tier List routes
- Sealed Pools routes

SPA route fallback is handled by `frontend/public/_redirects` so direct
navigation to hosted routes resolves to `index.html`.

### Cloudflare Pages Functions

The Pages Functions surface lives under [`functions/`](../functions) and owns:

- `GET /api/health`
- `GET /api/cards`
- `GET /api/cards/:id`
- `POST /api/query/parse`
- `GET /api/query/features`
- `GET /api/metadata`
- `GET /api/metagame/pilot`
- `GET /api/pack-generator/options`
- `POST /api/pack-generator/pools`

The runtime adapter in `functions/api/[[route]].ts` reuses domain logic from
`card_store/src/api/service.ts` instead of depending on Fastify.

The metagame pilot route is preserved as part of the public API shape, but the
Cloudflare adapter currently returns `404` for it until a publishable snapshot
is promoted out of the local git-ignored `.deck_data` area.

### Future separate workers

Mutable price data is intentionally not part of the canonical card dataset.
The expected future split is:

- `card_store/data/cards.json` remains canonical static metadata
- a separate scheduled Worker publishes derived price snapshots
- runtime API code can merge static card metadata with published price data
  later when needed

This refactor does not implement scheduled refreshes or price merging.

## Local Development

### Frontend

- `frontend/.env.development` points browser API calls at
  `http://127.0.0.1:4545`
- the frontend now uses `VITE_API_ORIGIN` instead of relying on a Vite proxy

Run:

- `npm run dev:api`
- `npm run dev:web`

### Cloudflare-style validation

The Pages deployment boundary is defined by:

- [`wrangler.toml`](../wrangler.toml)
- [`functions/`](../functions)
- [`frontend/public/_routes.json`](../frontend/public/_routes.json)
- [`frontend/public/_redirects`](../frontend/public/_redirects)

Build the deployable artifact with:

- `npm run build`

That produces static assets in `frontend/dist`, while Cloudflare maps `/api/*`
through the Pages Functions entrypoint.

## Preview And Production Expectations

- Preview deployments should be the default validation path for branches and
  pull requests.
- Branch preview URLs can be derived locally with `npm run preview:url`.
  This repo assumes the Pages project name is `noxiannetdecks`, and follows
  Cloudflare's documented branch-alias rule where aliases are lowercased and
  non-alphanumeric branch characters are replaced with `-`.
- Production serves the same app shape at `noxiannetdecks.com`:
  - static frontend assets from Pages
  - same-origin API routes from Pages Functions
- The repo should not assume production depends on a separate Fastify process,
  a Vite proxy, or a live database.

## Post-Deploy Verification

After the first deploy, verify:

- `/` loads from the custom domain
- direct navigation to frontend routes loads correctly
- `GET /api/health` returns `200`
- card search works against same-origin `/api/cards`
- pack generation works through `/api/pack-generator/*`
