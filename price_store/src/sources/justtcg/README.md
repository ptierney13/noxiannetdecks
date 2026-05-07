# JustTCG Source Notes

This folder contains the active V0 source integration for `price_store`.

## Current Stage Boundary

Stages 3 and 4 establish the practical JustTCG source baseline:

- load a server-side API key from local environment configuration
- perform a single bounded live capture against the documented `/cards` API
- preserve the raw response under the shared Stage 1 raw-capture conventions
- document the source contract and the free-plan limits that shape the design
- materialize a canonical JustTCG source snapshot under `.price_data/canonical/`

Stage 5 extends that baseline by:

- verifying the real request limit for the current API key
- capturing paged catalog runs under one run id
- aggregating paged captures into one canonical source snapshot
- publishing marketplace-facing static assets under `frontend/public/data/prices/`

## Free Plan Constraint

The free JustTCG plan is a hard operational constraint:

- `10 requests/minute`
- `100 requests/day`
- `1,000 requests/month`
- free-plan requests may return at most `20` items per request
- use exact JustTCG game slugs, such as
  `riftbound-league-of-legends-trading-card-game`

Minimalism is key. Avoid broad exploratory calls, preserve raw responses, and
prefer replaying local artifacts over re-querying the API.

The current key has been verified against the live API:

- `limit=20` works
- `limit=21` fails

## Commands

- `npm run capture:justtcg:sample -w @noxiannet/price-store`
- `npm run verify:justtcg:limit -w @noxiannet/price-store`
- `npm run capture:justtcg:catalog -w @noxiannet/price-store`
- `npm run materialize:justtcg:canonical -w @noxiannet/price-store`
- `npm run materialize:justtcg:canonical:run -w @noxiannet/price-store`
- `npm run publish:justtcg:prices -w @noxiannet/price-store`
- `npm run publish:justtcg:catalog -w @noxiannet/price-store`

## Current Capture And Canonical Flow

The current flow is intentionally tiny on the source side:

1. load `JUSTTCG_API_KEY` from local untracked configuration
2. issue one bounded `GET /v1/cards` request for Riftbound using the validated
   JustTCG game slug
3. store the raw JSON response under `.price_data/raw/justtcg/...`
4. store a sibling metadata sidecar with the request summary
5. store a run-status record under `.price_data/runs/`
6. materialize a canonical source snapshot under `.price_data/canonical/justtcg/...`

Stage 5 adds a larger publishable flow:

1. verify whether the current key is really capped at `20`
2. if needed, capture one or more paged `GET /v1/cards` responses under one
   run id
3. preserve each page under `.price_data/raw/justtcg/...`
4. aggregate the run into one canonical source snapshot
5. publish static price artifacts under:
   - `.price_data/exports/prices/`
   - `frontend/public/data/prices/`

The validated request shape is documented in [analysis.md](./analysis.md).

## Request Minimalism

The default sample capture intentionally keeps the upstream call narrow in
request count while still using the free-plan maximum card count:

- one request
- default item limit of `20` cards per request unless explicitly overridden
- include price history by default
- no statistics by default

That is meant to preserve monthly budget while still giving Stage 4 enough
evidence to define the normalized contracts.

The paged catalog capture path remains budget-aware too:

- it verifies the live request cap before assuming a higher page size
- it records a single run id across all raw pages
- it is designed to reuse local raw and canonical artifacts for repeat publish
  work

## Canonical Snapshot Intent

Stage 4 keeps the canonical layer source-oriented on purpose:

- preserve JustTCG card IDs and variant IDs as authoritative source keys
- preserve source request context and raw artifact linkage
- preserve current price, freshness, and optional price history
- preserve external IDs like `tcgplayerId` and `tcgplayerSkuId`
- avoid forcing the final `card_store` or published frontend shape too early

## Published Artifact Intent

Stage 5 keeps the published artifacts marketplace-facing rather than upstream
provider-facing:

- the published `priceSource` is `TCGPlayer`
- `JustTCG` is retained only for provenance/debug metadata
- each source variant becomes its own published row
- default display-price selection is intentionally deferred to frontend or
  presentation logic

## Local Secret Handling

- Store `JUSTTCG_API_KEY` only in local untracked environment configuration.
- The package will automatically read `price_store/.env.local` when present.
- Never expose the API key to client-side code or commit it into tracked files.
