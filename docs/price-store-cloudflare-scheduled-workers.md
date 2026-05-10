# Price Store Cloudflare Scheduled Workers

## Purpose

This document explains the Stage 7 hosted price-store setup in enough detail
that you can:

- understand how the two workers actually work
- see what the repository code already defines
- see what must be configured in Cloudflare
- complete the remaining Cloudflare-side setup yourself without guessing

Stage 7 now includes the real scheduled Cloudflare flow. Cloudflare owns the
routine execution of the pipeline. There is no human-facing bearer-token
trigger in the normal design.

## Deployment Pattern

Use **Wrangler as the primary deployment mechanism** for these two Workers.
Use the Cloudflare dashboard to create account resources when needed and to
verify what was deployed.

This matters because the repository already defines:

- worker names
- entrypoints
- R2 bindings
- the Service Binding on the capture worker
- the cron trigger on the capture worker
- the non-public deployment posture for both workers

If you try to treat the dashboard as the primary place where code and bindings
are authored, you will be manually re-entering configuration that already
exists in the repo, and it is easier for the dashboard and codebase to drift.

For Stage 7, the safest first deployment path is:

1. create or confirm the shared R2 bucket
2. update the Wrangler config files with your real bucket name and any desired
   naming changes
3. deploy the publish worker with Wrangler
4. deploy the capture worker with Wrangler
5. add the JustTCG API key secret to the capture worker with Wrangler
6. use the Cloudflare dashboard to verify bindings, triggers, versions, logs,
   and R2 artifacts

Cloudflare's current docs support this pattern:

- Cron Triggers are supported through a `scheduled()` handler and Wrangler
  `triggers.crons`
- Service Bindings are configured on the caller worker
- R2 bindings are configured in the worker config
- `wrangler deploy` is the standard deployment path for Worker code

## Architecture

The hosted pipeline has two workers:

1. **Capture worker**
   - file: [workers/price-store-capture.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-capture.ts)
   - shared handler: [workers/shared/price-store-worker.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-worker.ts)
   - orchestration logic: [price_store/src/hosted/workers.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/workers.ts)
   - responsibility: run on a Cloudflare Cron Trigger, call JustTCG, page
     through results, write hosted raw payloads, write a canonical snapshot,
     and mark capture run status

2. **Publish worker**
   - file: [workers/price-store-publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-publish.ts)
   - shared handler: [workers/shared/price-store-worker.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-worker.ts)
   - orchestration logic: [price_store/src/hosted/workers.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/price_store/src/hosted/workers.ts)
   - responsibility: publish the latest completed capture into the
     frontend-facing manifest/snapshot artifact shape

The workers coordinate through:

- one shared R2 bucket
- run-status and state files written into that bucket
- one **Cloudflare Service Binding** from the capture worker to the publish
  worker

The publish worker does not call JustTCG directly.

## What Lives Where

### In repo code

These specifications are defined in code and should be treated as the source of
truth:

- Capture worker behavior:
  - schedule-driven entrypoint
  - no public run endpoint
  - code: [workers/price-store-capture.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-capture.ts)
- Publish worker behavior:
  - accepts internal `POST /publish`
  - code: [workers/price-store-publish.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/price-store-publish.ts)
- Service-binding handoff:
  - capture invokes publish through `PRICE_STORE_PUBLISHER.fetch(...)`
  - code: [workers/shared/price-store-worker.ts](C:/Users/ptier/repos/Deck%20Archive%20Project/workers/shared/price-store-worker.ts)
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
- Example Cloudflare config:
  - [wrangler.price-store-capture.example.toml](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-capture.example.toml)
  - [wrangler.price-store-publish.example.toml](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-publish.example.toml)

### In Cloudflare

These values/settings do **not** live in repo code and must be created or
confirmed in Cloudflare:

- the actual worker objects
- the R2 bucket name
- the JustTCG API key secret
- the Service Binding from capture to publish
- the Cron Trigger attached to the capture worker
- whether the publish worker is exposed publicly or kept internal-only in your
  deployment setup

## How The System Works

### Scheduled capture flow

1. Cloudflare fires the capture worker's `scheduled()` handler from its Cron
   Trigger.
2. The capture worker creates `state/active-capture.json`.
3. It calls JustTCG page by page.
4. For each page it writes:
   - raw payload JSON under `raw/...`
   - raw metadata JSON beside it
5. After all pages are fetched, it creates one canonical snapshot from the page
   set.
6. It writes:
   - canonical snapshot JSON under `canonical/...`
   - canonical metadata JSON beside it
   - capture run status under `runs/raw-capture/<runId>.json`
7. It updates `state/latest-successful-capture.json`.
8. It clears `state/active-capture.json`.
9. It calls the publish worker through the Cloudflare Service Binding.

### Internal publish flow

1. The capture worker makes an internal request to the publish worker through
   `PRICE_STORE_PUBLISHER.fetch(...)`.
2. The publish worker checks `state/active-capture.json`.
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
- Cloudflare Service Bindings remove the need for bearer-token auth between
  workers

## Scheduled Behavior

The capture worker is scheduled through a Cron Trigger, not a public manual run
endpoint.

The example configuration uses:

```toml
[triggers]
crons = [ "0 9 */2 * *" ]
```

That means:

- run at `09:00 UTC`
- on every second calendar day-of-month

Important:

- Cron Triggers run on UTC time
- this is "every second calendar day" behavior, not a perfect rolling 48-hour
  interval
- if you want a different UTC hour, you will change that in Cloudflare config

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

Verify before moving on:
- the bucket appears in the R2 bucket list
- you can open the bucket details page

### 2. Local repo step: update the Wrangler config files before first deploy

Files:
- [wrangler.price-store-publish.example.toml](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-publish.example.toml)
- [wrangler.price-store-capture.example.toml](C:/Users/ptier/repos/Deck%20Archive%20Project/wrangler.price-store-capture.example.toml)

What to edit locally:

- replace `bucket_name = "replace-with-your-price-store-bucket"` with your real
  bucket name in both files
- keep `binding = "PRICE_STORE_BUCKET"` unchanged
- keep `binding = "PRICE_STORE_PUBLISHER"` unchanged in the capture config
- keep `service = "price-store-publish"` aligned with the actual publish worker
  name
- keep `workers_dev = false`
- keep `preview_urls = false`
- keep the cron expression unless you intentionally want a different UTC
  schedule

Recommended first-deploy commands:

```bash
npx wrangler deploy --config wrangler.price-store-publish.example.toml
npx wrangler deploy --config wrangler.price-store-capture.example.toml
npx wrangler secret put JUSTTCG_API_KEY --config wrangler.price-store-capture.example.toml
```

Why this is the recommended path:

- it deploys the real repo code directly
- it applies the binding and trigger configuration from the same source of
  truth
- it keeps the workers from accidentally being exposed on `workers.dev` or
  Preview URLs when using the sample config
- it matches Cloudflare's documented deploy/config model better than trying to
  recreate the same setup manually in the dashboard editor

Verify before moving on:
- both config files contain your real bucket name
- the capture config still references the publish worker by the correct service
  name
- both config files still set `workers_dev = false`
- both config files still set `preview_urls = false`

### 3. Workers & Pages page: confirm the publish worker exists after deploy

Cloudflare dashboard area:
- `Workers & Pages`

Steps:
1. Open `Workers & Pages`.
2. Confirm a worker named `price-store-publish` exists after the Wrangler
   deploy.
3. Open that worker.

Verify before moving on:
- the publish worker exists
- it has a deployed version

### 4. Publish worker Settings > Bindings page

Cloudflare dashboard area:
- `Workers & Pages` -> `price-store-publish` -> `Settings` -> `Bindings`

Verify before moving on:
- the binding name is exactly `PRICE_STORE_BUCKET`
- it points at the intended bucket

### 5. Workers & Pages page: confirm the capture worker exists after deploy

Cloudflare dashboard area:
- `Workers & Pages`

Steps:
1. Return to `Workers & Pages`.
2. Confirm a worker named `price-store-capture` exists after the Wrangler
   deploy.
3. Open that worker.

Verify before moving on:
- the capture worker exists
- it has a deployed version

### 6. Capture worker Settings > Variables and Secrets page

Cloudflare dashboard area:
- `Workers & Pages` -> `price-store-capture` -> `Settings` -> `Variables and Secrets`

The deploy config plus Wrangler secret command should already establish these:

- Secret: `JUSTTCG_API_KEY`
  - value: your real JustTCG API key
- Variable: `JUSTTCG_DEFAULT_GAME`
  - value from code default:
    `riftbound-league-of-legends-trading-card-game`
- Variable: `JUSTTCG_DEFAULT_LIMIT`
  - value from code default: `20`
- Variable: `JUSTTCG_INCLUDE_PRICE_HISTORY`
  - value from code default: `true`
- Variable: `JUSTTCG_INCLUDE_STATISTICS`
  - value from code default: `false`
- Variable: `PRICE_STORE_CAPTURE_MAX_REQUESTS`
  - example value from code/docs: `55`
- Variable: `PRICE_STORE_CAPTURE_REQUEST_DELAY_MS`
  - example value from code/docs: `6500`

Verify before moving on:
- all variables/secrets are saved
- the names match exactly

### 7. Capture worker Settings > Bindings page

Cloudflare dashboard area:
- `Workers & Pages` -> `price-store-capture` -> `Settings` -> `Bindings`

Verify before moving on:
- the R2 binding name is exactly `PRICE_STORE_BUCKET`
- the Service Binding name is exactly `PRICE_STORE_PUBLISHER`
- the Service Binding points to the publish worker you created

### 8. Capture worker Settings > Triggers > Cron Triggers page

Cloudflare dashboard area:
- `Workers & Pages` -> `price-store-capture` -> `Settings` -> `Triggers` -> `Cron Triggers`

The Wrangler deploy should already apply the cron trigger from config.

What comes from code:
- the worker has a `scheduled()` handler and is ready to receive cron events
- the example config supplies:
  `0 9 */2 * *`

What you choose:
- whether to keep the repo cron expression or update it in the config file and
  redeploy
- the UTC hour that best matches your desired run time

Verify before moving on:
- the Cron Trigger appears in the trigger list
- the cron expression matches your intent

### 9. Worker overview pages: confirm deployed worker identities

Cloudflare dashboard area:
- `Workers & Pages` -> each worker overview page

Steps:
1. Open the capture worker overview page.
2. Confirm it shows a deployed version and the cron trigger.
3. Open the publish worker overview page.
4. Confirm it shows a deployed version.

Verify before moving on:
- capture is deployed and has the cron trigger
- publish is deployed and available as a binding target

### 10. Worker Settings > Domains & Routes page: confirm neither worker is
publicly exposed

Cloudflare dashboard areas:
- `Workers & Pages` -> `price-store-capture` -> `Settings` -> `Domains & Routes`
- `Workers & Pages` -> `price-store-publish` -> `Settings` -> `Domains & Routes`

Why this matters:

- the capture worker is meant to run from Cron Triggers, not a public URL
- the publish worker is meant to be called through a Service Binding, not by
  arbitrary internet clients

Verify before moving on:
- `workers.dev` is disabled for both workers
- Preview URLs are disabled for both workers
- no unexpected custom domains or routes are attached

### 11. Worker logs / Trigger Events pages: verify first execution

Cloudflare dashboard areas:
- `Workers & Pages` -> `price-store-capture` -> `Logs`
- `Workers & Pages` -> `price-store-capture` -> `Settings` -> `Trigger Events`
- `Workers & Pages` -> `price-store-publish` -> `Logs`

What to expect:

- the capture worker should log one scheduled run
- the publish worker should log one internal publish run after capture succeeds
- Cloudflare notes that new or changed cron triggers may take several minutes,
  and up to about 15 minutes, to propagate

Verify before moving on:
- at least one capture run appears
- publish logs appear only after a successful capture

### 12. R2 bucket page: verify scheduled artifacts after the first run

Cloudflare dashboard area:
- `R2` -> your bucket -> object browser

After the first successful scheduled run, confirm these categories exist:

- `raw/justtcg/...`
- `canonical/justtcg/...`
- `runs/raw-capture/...`
- `runs/publish/...`
- `state/latest-successful-capture.json`
- `published/prices/manifest.json`
- `published/prices/riftbound/latest.json`
- `published/prices/riftbound/latest.publish.meta.json`

Also verify:
- `state/active-capture.json` is gone after the run completes

## What To Look At If Something Fails

### Capture fails

Check:

- the capture worker logs
- `runs/raw-capture/<runId>.json`
- whether `state/active-capture.json` still exists

Common causes:

- missing `JUSTTCG_API_KEY`
- missing R2 binding
- missing Service Binding
- request cap hit

### Publish fails

Check:

- the publish worker logs
- `runs/publish/<publishRunId>.json`
- whether `state/active-capture.json` exists
- whether `state/latest-successful-capture.json` points to a real canonical
  snapshot

Common causes:

- capture is still running
- no successful capture exists yet
- missing R2 binding
- capture worker cannot reach publish worker through the Service Binding

## What Stage 8 Will Add

Stage 8 should not change the fundamental architecture. It should focus on:

- monitoring and stale-data detection
- runbook guidance for scheduled failures
- budget visibility for the scheduled pipeline
