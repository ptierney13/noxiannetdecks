# Price Store Cloudflare Manual Workers

## Purpose

This document explains the Stage 7 hosted price-store setup in enough detail
that you can:

- understand how the two workers actually work
- see what the repository code already defines
- see what must be configured in Cloudflare
- complete the remaining Cloudflare-side setup yourself without guessing

Stage 7 is manual-trigger only. It does **not** add the every-2-days schedule
yet. Stage 8 will layer the schedule on top of the same two-worker setup.

## Architecture

The hosted pipeline now has two workers:

1. **Capture worker**
   - file: [workers/price-store-capture.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-capture.ts)
   - shared handler: [workers/shared/price-store-worker.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-worker.ts)
   - orchestration logic: [price_store/src/hosted/workers.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/workers.ts)
   - responsibility: call JustTCG, page through results, write hosted raw payloads, write a canonical snapshot, and mark the capture run status

2. **Publish worker**
   - file: [workers/price-store-publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-publish.ts)
   - shared handler: [workers/shared/price-store-worker.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-worker.ts)
   - orchestration logic: [price_store/src/hosted/workers.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/workers.ts)
   - responsibility: read the latest completed capture, generate the publishable manifest and snapshot, and write the frontend-facing artifact contract

The workers coordinate through one shared R2 bucket. The publish worker does
not call JustTCG directly.

## What Lives Where

### In repo code

These specifications are defined in code and should be treated as the source of
truth:

- Worker request auth model:
  - both workers require a bearer token in `Authorization`
  - code: [workers/shared/price-store-worker.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-worker.ts)
- Capture request body:
  - `mode: "incremental" | "full"`
  - optional `updatedAfter`
  - optional `maxRequests`
  - optional `requestDelayMs`
  - code: [price_store/src/hosted/schema.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/schema.ts)
- Publish request body:
  - optional `captureRunId`
  - code: [price_store/src/hosted/schema.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/schema.ts)
- Hosted storage key layout:
  - `raw/...`
  - `canonical/...`
  - `runs/raw-capture/...`
  - `runs/publish/...`
  - `published/prices/manifest.json`
  - `published/prices/<game>/latest.json`
  - `state/active-capture.json`
  - `state/latest-successful-capture.json`
  - code: [price_store/src/hosted/paths.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/paths.ts)
- Capture/publish coordination rules:
  - publish refuses to run while capture is active
  - publish reads only the latest successful capture pointer
  - publish is rerunnable without new JustTCG requests
  - code: [price_store/src/hosted/workers.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/workers.ts)
- JustTCG defaults:
  - `JUSTTCG_DEFAULT_LIMIT` is bounded by code to `<= 20`
  - config parser: [price_store/src/sources/justtcg/config.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/sources/justtcg/config.ts)
- Published output contract:
  - manifest/snapshot schema consumed by the frontend
  - code: [price_store/src/published/schema.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/published/schema.ts)
  - publish transform: [price_store/src/sources/justtcg/publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/sources/justtcg/publish.ts)

### In Cloudflare

These values/settings do **not** live in repo code and must be created or
confirmed in Cloudflare:

- the actual worker objects
- the R2 bucket name
- the JustTCG API key secret
- the trigger bearer token secret
- the binding from each worker to the shared R2 bucket
- the deployed worker URLs

## How The System Works

### Capture flow

1. You send a `POST` request to the capture worker with a bearer token.
2. The capture worker validates the request body.
3. It writes `state/active-capture.json` to mark the worker as busy.
4. It calls JustTCG page by page.
5. For each page it writes:
   - raw payload JSON under `raw/...`
   - raw metadata JSON under the matching `.meta.json`
6. After all pages are fetched, it creates one canonical snapshot from the page
   set.
7. It writes:
   - canonical snapshot JSON under `canonical/...`
   - canonical metadata JSON beside it
   - capture run status under `runs/raw-capture/<runId>.json`
8. It updates `state/latest-successful-capture.json`.
9. It deletes `state/active-capture.json`.

### Publish flow

1. You send a `POST` request to the publish worker with a bearer token.
2. The publish worker first checks `state/active-capture.json`.
3. If capture is still running, publish stops immediately.
4. Otherwise it reads `state/latest-successful-capture.json`.
5. It loads the canonical metadata and canonical snapshot for that run.
6. It creates the same publishable manifest/snapshot shape the frontend already
   expects.
7. It writes:
   - `published/prices/manifest.json`
   - `published/prices/riftbound/latest.json`
   - `published/prices/riftbound/latest.publish.meta.json`
8. It writes publish status under `runs/publish/<publishRunId>.json`.

### Why this is split

The split is intentional:

- capture owns the upstream request budget
- publish owns the frontend-facing artifact shape
- publish can be rerun after code changes without spending more JustTCG calls
- partial or failed capture data is never silently published

## Trigger Shapes

### Capture worker request

`POST` body:

```json
{
  "mode": "incremental",
  "updatedAfter": "2026-05-05T00:00:00.000Z",
  "maxRequests": 55,
  "requestDelayMs": 6500
}
```

Notes:

- `mode: "incremental"` uses `updated_after`
- `mode: "full"` ignores `updatedAfter`
- if incremental omits `updatedAfter`, the code defaults to the latest
  successful capture timestamp

### Publish worker request

`POST` body:

```json
{}
```

Optional explicit run targeting:

```json
{
  "captureRunId": "justtcg-capture-2026-05-07-riftbound-league-of-legends-trading-card-game"
}
```

## Repo Files You Should Know

- Worker entrypoints:
  - [workers/price-store-capture.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-capture.ts)
  - [workers/price-store-publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-publish.ts)
- Shared Cloudflare adapter:
  - [workers/shared/price-store-worker.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-worker.ts)
- Shared hosted orchestration:
  - [price_store/src/hosted/workers.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/workers.ts)
- Hosted storage path rules:
  - [price_store/src/hosted/paths.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/paths.ts)
- Hosted storage repository helpers:
  - [price_store/src/hosted/repository.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/repository.ts)
- Example Wrangler configs:
  - [wrangler.price-store-capture.example.toml](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-capture.example.toml)
  - [wrangler.price-store-publish.example.toml](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-publish.example.toml)

## Cloudflare Setup Steps

These are the actions you still need to take outside Codex for Stage 7.

### 1. R2 page: create the shared bucket

Cloudflare dashboard area:
- `R2`

Steps:
1. Open the Cloudflare dashboard.
2. Open `R2`.
3. Click `Create bucket`.
4. Create one bucket for both workers.
   Recommended name: `price-store-prod`
5. Save the exact bucket name you chose.

What comes from code:
- both workers expect one shared binding named `PRICE_STORE_BUCKET`

What you choose:
- the actual bucket name

Verify before moving on:
- the bucket appears in the R2 bucket list
- you can open the bucket details page

### 2. Workers & Pages page: create the capture worker

Cloudflare dashboard area:
- `Workers & Pages`

Steps:
1. Open `Workers & Pages`.
2. Click `Create application`.
3. Choose `Worker`.
4. Create a worker for the capture runtime.
   Recommended name: `price-store-capture`
5. Deploy the worker code from [workers/price-store-capture.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-capture.ts) using your normal Worker deployment flow.

What comes from code:
- worker filename
- expected binding names
- request body shape

What you choose:
- final worker name if you do not use the recommended one

Verify before moving on:
- the worker exists in `Workers & Pages`
- the worker has a deployed version

### 3. Workers & Pages page: create the publish worker

Cloudflare dashboard area:
- `Workers & Pages`

Steps:
1. Stay in `Workers & Pages`.
2. Click `Create application`.
3. Choose `Worker`.
4. Create a worker for the publish runtime.
   Recommended name: `price-store-publish`
5. Deploy the worker code from [workers/price-store-publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-publish.ts) using your normal Worker deployment flow.

Verify before moving on:
- the publish worker exists
- the publish worker has a deployed version

### 4. Capture worker Settings > Variables and Secrets page

Cloudflare dashboard area:
- `Workers & Pages` -> `price-store-capture` -> `Settings` -> `Variables and Secrets`

Add these secrets/variables:

- Secret: `JUSTTCG_API_KEY`
  - value: your real JustTCG API key
- Secret: `PRICE_STORE_TRIGGER_TOKEN`
  - value: a strong random token you will use as the bearer token when manually triggering the worker
- Variable: `JUSTTCG_DEFAULT_GAME`
  - value from code default:
    `riftbound-league-of-legends-trading-card-game`
- Variable: `JUSTTCG_DEFAULT_LIMIT`
  - value from code default: `20`
- Variable: `JUSTTCG_INCLUDE_PRICE_HISTORY`
  - value from code default: `true`
- Variable: `JUSTTCG_INCLUDE_STATISTICS`
  - value from code default: `false`

Verify before moving on:
- all variables/secrets are saved
- the names match exactly

### 5. Publish worker Settings > Variables and Secrets page

Cloudflare dashboard area:
- `Workers & Pages` -> `price-store-publish` -> `Settings` -> `Variables and Secrets`

Add this secret:

- Secret: `PRICE_STORE_TRIGGER_TOKEN`
  - use the same token as the capture worker unless you intentionally want two
    different manual trigger tokens

Verify before moving on:
- the secret is saved
- the name matches exactly

### 6. Capture worker Settings > Bindings page

Cloudflare dashboard area:
- `Workers & Pages` -> `price-store-capture` -> `Settings` -> `Bindings`

Steps:
1. Add an `R2 bucket` binding.
2. Binding name must be:
   `PRICE_STORE_BUCKET`
3. Choose the bucket you created earlier.

Verify before moving on:
- the binding name is exactly `PRICE_STORE_BUCKET`
- it points at the intended bucket

### 7. Publish worker Settings > Bindings page

Cloudflare dashboard area:
- `Workers & Pages` -> `price-store-publish` -> `Settings` -> `Bindings`

Steps:
1. Add an `R2 bucket` binding.
2. Binding name must be:
   `PRICE_STORE_BUCKET`
3. Choose the same shared bucket as the capture worker.

Verify before moving on:
- both workers point at the same bucket

### 8. Worker overview page: confirm manual trigger URLs

Cloudflare dashboard area:
- `Workers & Pages` -> each worker overview page

Steps:
1. Open the capture worker overview page.
2. Note the deployed worker URL.
3. Open the publish worker overview page.
4. Note the deployed worker URL.

Verify before moving on:
- you have one URL for capture
- you have one URL for publish

### 9. Manual trigger test: capture worker

Use your preferred HTTP client with:

- method: `POST`
- header: `Authorization: Bearer <PRICE_STORE_TRIGGER_TOKEN>`
- header: `Content-Type: application/json`

Incremental example:

```json
{
  "mode": "incremental",
  "updatedAfter": "2026-05-05T00:00:00.000Z",
  "maxRequests": 55,
  "requestDelayMs": 6500
}
```

Full example:

```json
{
  "mode": "full",
  "maxRequests": 55,
  "requestDelayMs": 6500
}
```

Verify before moving on:
- the response is `200`
- it returns a `runId`
- it reports canonical output paths

### 10. R2 bucket page: verify capture artifacts

Cloudflare dashboard area:
- `R2` -> your bucket -> object browser

After a successful capture, confirm these categories now exist:

- `raw/justtcg/...`
- `canonical/justtcg/...`
- `runs/raw-capture/...`
- `state/latest-successful-capture.json`

Also verify:
- `state/active-capture.json` is gone after the run completes

### 11. Manual trigger test: publish worker

Use your preferred HTTP client with:

- method: `POST`
- header: `Authorization: Bearer <PRICE_STORE_TRIGGER_TOKEN>`
- header: `Content-Type: application/json`

Body:

```json
{}
```

Verify before moving on:
- the response is `200`
- it returns manifest/snapshot output paths
- it names the capture run it published from

### 12. R2 bucket page: verify publish artifacts

Cloudflare dashboard area:
- `R2` -> your bucket -> object browser

After publish, confirm these objects exist:

- `published/prices/manifest.json`
- `published/prices/riftbound/latest.json`
- `published/prices/riftbound/latest.publish.meta.json`
- `runs/publish/...`

## What To Look At If Something Fails

### Capture fails

Check:
- capture worker response body
- `runs/raw-capture/<runId>.json`
- whether `state/active-capture.json` still exists

Common causes:
- missing `JUSTTCG_API_KEY`
- wrong bearer token
- missing R2 binding
- request cap hit

### Publish fails

Check:
- publish worker response body
- `runs/publish/<publishRunId>.json`
- whether `state/active-capture.json` exists
- whether `state/latest-successful-capture.json` points to a real canonical
  snapshot

Common causes:
- capture is still running
- no successful capture exists yet
- missing R2 binding

## What Stage 8 Will Add

Stage 8 should not change this architecture. It should only:

- trigger the **capture worker** on a 2-day cadence
- decide when publish runs after successful capture
- document the schedule-specific Cloudflare settings on top of the same worker,
  secret, and bucket setup
