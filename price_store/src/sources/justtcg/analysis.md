# JustTCG Source Analysis

## Review Date

- Reviewed on 2026-05-06 for Stage 3 implementation.

## Current Approval Outcome

JustTCG is the approved and only V0 upstream source for price data.

Why this source is approved for V0:

- the user already has an API key
- the auth model is simple and well documented
- the `/cards` endpoint already exposes card-level identity plus variant-level
  pricing
- the API exposes update timestamps and optional history/statistics fields that
  can support later stages without introducing another source

## Auth Boundary

- All requests require `x-api-key` authentication.
- The key must remain server-side.
- The package loads `JUSTTCG_API_KEY` from process environment and may read a
  local untracked `price_store/.env.local` file for developer convenience.

## Base URL

- `https://api.justtcg.com/v1`

## Validated Request Shape

The validated Stage 3 call pattern is:

- method: `GET`
- host and versioned path: `https://api.justtcg.com/v1/cards`
- auth header: `x-api-key: <server-side key>`
- minimal query for the first Riftbound capture:
  - `game=riftbound-league-of-legends-trading-card-game`
  - `limit=20`
  - `include_price_history=true`

Example shape:

```text
GET /v1/cards?game=riftbound-league-of-legends-trading-card-game&limit=20&include_price_history=true
x-api-key: <server-side key>
Accept: application/json
```

## Stage 3 Call Strategy

The free plan is intentionally restrictive:

- `10 requests/minute`
- `100 requests/day`
- `1,000 requests/month`
- maximum `20` items per request on the free plan

Because of that, Stage 3 uses a deliberately tiny live capture path:

- one bounded `GET /cards` request per capture run
- the free-plan maximum default item limit
- include price history by default
- no statistics payload unless explicitly enabled later
- immediate raw artifact preservation so later schema and transform work can
  iterate locally
- use exact supported-game slugs from JustTCG, not shorthand labels

## Relevant Contract Surface

The `/cards` endpoint returns:

- stable card IDs
- card metadata such as game, set, name, number, rarity, and external IDs
- nested variants with pricing, condition, printing, language, and
  `lastUpdated`
- optional history/statistics fields depending on request parameters and plan

Observed live payload nuance from the bounded 20-card/history capture:

- some variants return `priceHistory: null`
- populated `priceHistory` arrays currently use compact points with:
  - `p` for price
  - `t` for timestamp
- Stage 4 therefore normalizes history into explicit `{ amount, observedAt }`
  records instead of exposing the source-native compact form directly

These fields are sufficient to drive Stage 4 contract design for a single-source
V0.

## Validated Response Shape

The live Stage 3 flow validated the same high-level structure described in the
docs:

- top-level `data` array
- optional top-level `meta` pagination object
- top-level `_metadata` usage information from the API
- per-card fields such as:
  - `id`
  - `name`
  - `game`
  - `set`
  - `set_name`
  - `number`
  - `rarity`
  - `tcgplayerId`
  - `details`
  - `variants`
- per-variant fields such as:
  - `id`
  - `condition`
  - `printing`
  - `language`
  - `tcgplayerSkuId`
  - `price`
  - `lastUpdated`
  - optional history/statistics fields when requested

For our package, Stage 3 preserves the raw upstream payload and only adds a
local metadata sidecar plus run-status record. No normalization happens yet.

Stage 4 adds a canonical source snapshot layer that preserves:

- source request context
- raw artifact linkage
- card and variant source identities
- current price and freshness
- optional normalized price history
- source usage metadata when the API provides it

## What Went Wrong Earlier

The original raw-fetch implementation had two real problems:

1. The game value was too informal.
   - We used `riftbound`.
   - The validated JustTCG slug is
     `riftbound-league-of-legends-trading-card-game`.

2. More importantly, the URL builder was wrong.
   - We used `new URL("/cards", "https://api.justtcg.com/v1/")`.
   - Because the path argument started with `/`, URL resolution dropped `/v1`
     and produced `https://api.justtcg.com/cards?...`.
   - That malformed host/path combination is what triggered the misleading
     Cloudflare `1014` response.

We verified the corrected endpoint separately without an API key:

- `https://api.justtcg.com/v1/cards?...` returns a normal API error body
  instead of Cloudflare when unauthenticated:
  - `{"error":"API key is required","code":"MISSING_API_KEY"}`

That confirms the endpoint itself is valid and the earlier failure was our
request construction bug.

## Manual Client Decision

We briefly used the official SDK as a diagnostic tool because it helped confirm
that the upstream API itself was healthy once called correctly.

The repository now intentionally uses a manual in-repo client instead.

Reasons:

- we now understand the correct request shape
- manual calls reduce third-party trust surface
- manual calls keep the exact upstream request and response handling visible in
  the repo
- manual calls make raw artifact preservation and debugging more explicit

The SDK is no longer required for the shipping V0 integration.

## Operational Notes

- The first integration should prefer a single game-scoped bounded sample rather
  than broad catalog traversal.
- For Riftbound, the validated game parameter is
  `riftbound-league-of-legends-trading-card-game`.
- The `updated_after` parameter looks useful for future delta refresh stages.
- Published snapshots remain the serving contract for the app. The frontend
  should not call JustTCG directly in V0.

## Sources

- JustTCG API docs: <https://justtcg.com/docs>
