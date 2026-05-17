# Stage 4: Smoke Tests and Agent Dev Entrypoint

> **DRAFT** — This plan must be finalized and approved before implementation
> begins. Update this plan with any decisions from Stage 2–3 before finalizing.

## Summary

Add two product-level smoke test scripts that verify end-to-end API and search
behavior beyond what unit tests cover, and add a `dev:ci` npm script that
starts the API server in a way that works cleanly in agent sessions (no
interactive TUI, deterministic startup, machine-readable health signal).

The smoke tests are plain Node scripts, not Vitest tests. They require the dev
server to be running and target real HTTP endpoints. Their purpose is to catch
product-level regressions that unit tests miss: a field alias that parses
correctly in isolation but returns wrong results end-to-end, an API route
that returns 500 after a schema change, a card that passes schema validation
but renders broken in the frontend API response.

## Key Changes

### U1: `dev:ci` agent-friendly server entrypoint

**File:** `card_store/package.json`

Add a `dev:ci` script that starts the Fastify server and exits 0 once it is
listening, rather than staying attached. Alternatively, start the server in the
background and write its PID so an agent can kill it after verification.

**Options (finalize at implementation time):**

Option A — background with PID file:
```json
"dev:ci": "tsx src/server.ts & echo $! > .api.pid"
```
Agent can then `kill $(cat .api.pid)` after smoke tests.

Option B — wait-for-listening wrapper:
```json
"dev:ci": "tsx scripts/start-and-wait.ts"
```
Where `start-and-wait.ts` forks the server, polls `GET /api/metadata` until
200, then exits 0. Agent knows server is ready when the script exits.

Option B is preferred because it gives the agent a clean synchronous signal
rather than requiring a sleep or poll loop.

**Root `package.json` addition:**
```json
"dev:ci": "npm run dev:ci -w @noxiannet/card-store"
```

**CLAUDE.md addition:** Document `npm run dev:ci` in the Commands section.
Note that this is the preferred entrypoint for agent sessions that need to
verify API behavior without keeping a terminal blocked.

**Acceptance:** Running `npm run dev:ci` from the repo root starts the API
server and exits the script process once the server is confirmed listening on
`:4545`.

### U2: `smoke:api` — API endpoint smoke test

**File:** `scripts/smoke-api.mjs` (root scripts directory)

**Script behavior:**
1. Hit each of the 5 known API endpoints and assert HTTP 200:
   - `GET /api/cards` (no query) — expect 200, non-empty array
   - `GET /api/cards?q=name:jinx` — expect 200, array with ≥1 result
   - `GET /api/cards/{first-card-id}` — expect 200, card object with `id`
   - `POST /api/query/parse` with body `{"query": "energy>=3"}` — expect 200,
     valid AST
   - `GET /api/query/features` — expect 200, non-empty features object
   - `GET /api/metadata` — expect 200, metadata object
2. For each failure: print the endpoint, status code, and response body
   snippet.
3. Exit 0 if all pass, exit 1 if any fail.

**No test framework dependency** — use Node's built-in `fetch` (Node 18+).

**Root `package.json` script:**
```json
"smoke:api": "node scripts/smoke-api.mjs"
```

**Acceptance:** `npm run smoke:api` passes green against a running dev server.

### U3: `smoke:search` — end-to-end query smoke test

**File:** `scripts/smoke-search.mjs` (root scripts directory)

A more targeted smoke test that exercises the query engine end-to-end by
running a fixed set of query strings and verifying result shape and basic
correctness.

**Assertions (design as constants at top of the file so they're easy to update
when card data changes):**

| Query | Assertion |
|---|---|
| `energy>=3` | All results have `energy >= 3` |
| `domain:body` | All results include `body` in their domain array |
| `-keyword:stealth` | No result includes `stealth` in keywords |
| `name:jin*` | All result names start with "jin" (case-insensitive) |
| `cost:none` | All results have null or empty cost |
| `is:foil` | All results have `foil` in `finishes` array |
| `name:jinx energy>=2` | Results match both conditions (intersection) |

**Script behavior:**
1. For each query, `GET /api/cards?q=<encoded>`.
2. Assert HTTP 200.
3. Validate each result object against the assertion for that query.
4. Report per-query pass/fail.
5. Exit 0 if all pass, exit 1 if any fail.

**Caveats:**
- Results depend on actual card data in `cards.json`; if card data changes
  significantly, some assertions may need updating.
- Wildcard and domain assertions use exact field checks on the response JSON,
  not display text — verify field names match the API response shape at
  implementation time.

**Root `package.json` script:**
```json
"smoke:search": "node scripts/smoke-search.mjs"
```

**Acceptance:** `npm run smoke:search` passes green against a running dev
server with current `cards.json`.

### U4: `smoke:all` convenience script

**File:** root `package.json`

```json
"smoke": "npm run smoke:api && npm run smoke:search"
```

Allows an agent (or human) to run all smoke tests in sequence with one
command. Used as the final verification step in session close-out.

### U5: Wire smoke tests into AGENTS.md close-out procedure

**File:** root `AGENTS.md`

Add a "Session Close-Out" section that specifies the expected verification
steps before shipping a branch:

1. `npm run typecheck` (or `npm run test` for the affected workspace)
2. `npm run lint`
3. `npm run dev:ci` — start the API server
4. `npm run smoke` — run all smoke tests
5. Kill the API server (`kill $(cat card_store/.api.pid)` or equivalent)
6. `npm run release:ship`

This gives agents a concrete, ordered checklist rather than leaving close-out
behavior implicit.

## Test Plan

- Verify `npm run dev:ci` starts the server and exits cleanly in under 10
  seconds on a cold start.
- Run `npm run smoke:api` while the dev server is running and confirm all
  endpoints pass.
- Run `npm run smoke:search` and confirm all query assertions pass.
- Introduce a deliberate regression (break a field alias in `fields.ts`) and
  confirm `smoke:search` exits 1 and reports the failing queries.
- Run `npm run smoke` (combined) and confirm it exits 0 on a clean server and
  1 on the broken server.
- Verify the scripts are usable on the current Node version (no missing APIs).

## Assumptions

- Node 18+ is available (required for built-in `fetch`). The current dev
  environment uses a recent Node; confirm at implementation time.
- The smoke scripts target `127.0.0.1:4545` by default. If the port changes,
  the scripts should read from an env var or the Vite proxy config rather than
  hardcoding.
- `cards.json` is non-empty and contains at least: a card named "jinx", cards
  with `energy >= 3`, cards with domain body, and foil cards. If any of these
  are absent, the corresponding smoke assertion should be updated or skipped.
- The `POST /api/query/parse` endpoint accepts `{"query": "..."}` as the
  request body — verify the actual body schema against `app.ts` at
  implementation time.

## Open Questions

- Should `dev:ci` be Option A (background + PID) or Option B (wait-for-ready
  script)? Option B is cleaner but requires a small helper script.
- Should `smoke:search` fail if a query returns zero results, or only fail if
  individual results violate the assertion? (Currently: fail if 0 results AND
  if individual results violate, since both indicate a regression.)
- Should smoke tests be added to the GitHub Actions CI workflow from Stage 2?
  If yes, the API server needs to be started in the CI job before running
  them. This adds complexity but gives full automation. Decision deferred —
  default is smoke tests are manual/agent-invoked only.
