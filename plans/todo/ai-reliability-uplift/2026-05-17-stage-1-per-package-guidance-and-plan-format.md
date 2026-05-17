# Stage 1: Per-Package AI Guidance and Plan Format Upgrade

> **DRAFT** — This plan must be finalized and approved before implementation
> begins. When Stage 1 is complete, update Stage 2–4 draft plans with any
> newly relevant decisions or changed assumptions.

## Summary

Documentation-only stage. Add AGENTS.md files to each workspace that currently
lacks one, and upgrade the plan format requirements so that future plans contain
enough detail for an agent to execute a stage without resolving ambiguities
mid-session. No code changes in this stage.

## Key Changes

### 1. `card_store/AGENTS.md`

Create a local agent guide for the API and query engine workspace. Contents:

**Schema invariants to enforce:**
- All schema changes go through the Zod `CardRecord` definition in
  `src/data/schema.ts` — never patch raw JSON directly.
- The `finishes` array is the canonical way to represent foil/nonfoil variants;
  never add a top-level `foil: boolean` field.
- `signed` cards must always have `overnumbered: true` — this is a validated
  constraint, not a convention.
- All cards with the same `clean_name` must share one `riftbound_id`; check
  this invariant when writing any deduplication logic.
- IDs are globally unique; never reuse or reassign.

**Query engine invariants:**
- New field aliases belong in `src/query/fields.ts`, not scattered into
  `evaluator.ts` or `parser.ts`.
- The Chevrotain parser rule order is load-bearing; reordering rules can
  introduce ambiguities. Test the parser with `npm run test -w @noxiannet/card-store`
  after any grammar change.
- `evaluateQueryNode()` is recursive; any new AST node type must add a matching
  case — an unhandled node type silently returns `false` for all cards.

**Test requirements:**
- New query fields need at least one test case in `card_store/test/evaluator.test.ts`.
- New schema fields need a test case in `card_store/test/schema.test.ts`.
- Parser changes need a test case in `card_store/test/parser.test.ts`.

**Task routing:**

| Task | Read this first |
|---|---|
| Query field or alias work | `src/query/fields.ts`, `src/query/evaluator.ts` |
| Schema additions | `src/data/schema.ts`, `src/data/source.ts` |
| New API routes | `src/api/app.ts` |
| Card import or data refresh | `scripts/import-riftcodex.ts` |
| Pack generator | `src/packs/` |

### 2. `price_store/AGENTS.md`

Create a local agent guide for the price data pipeline workspace. Contents:

**Pipeline invariants:**
- Raw capture scripts write to `data/raw/` — never modify raw capture output
  by hand; it is treated as an immutable source snapshot.
- The canonical price repository (`CanonicalPriceRepository`) is the only
  layer that merges raw captures into queryable state; don't query raw files
  directly from routes.
- Delta merge (`stage-7-2`) uses a date-keyed append model; never overwrite
  an existing date key once published.
- TCGPlayer and JustTCG have separate auth flows; credentials and rate limits
  are documented in the stage plan files — read `plans/executed/price-store/`
  before modifying scraper logic.

**Test requirements:**
- Each scraper or parser change needs a test case in `price_store/test/`.
- Bootstrap tests (`test/bootstrap.test.ts`) verify the pipeline can run from
  a clean state; keep these passing after any structural change.

**Task routing:**

| Task | Read this first |
|---|---|
| Adding a new price source | `plans/executed/price-store/` initiative plans |
| Modifying the D1 relational schema | `price_store/src/`, stage-7-1 plan |
| Delta merge or publish logic | stage-7-2 plan |
| Frontend price display | `frontend/AGENTS.md`, `src/data/` |

### 3. `deck_store/AGENTS.md`

Minimal stub for the not-yet-implemented workspace. Contents:

- Status: placeholder — implementation not started.
- Do not add implementation code here without a plan approved for deck store
  work.
- The intended purpose is deck persistence and archive; see
  `plans/todo/2026-04-24-source-intake-architecture.md` for intended direction.
- The `riftbound_id` on card records is the canonical identifier for use in
  decklists; `id` is print-specific and should not be used for deck references.

### 4. Root `AGENTS.md` — plan format upgrade

Expand the "Plan Contents" section to require a richer format for significant
plans. New required sections:

**Required for all significant plans:**
- Summary
- Key Changes
- Test Plan
- Assumptions

**Required additionally for multi-stage or feature-level plans:**
- Open Questions — unresolved decisions that must be settled before
  implementation begins; explicitly listing these forces resolution rather than
  mid-session guessing.
- Implementation Units — numbered breakdown of the work into atomic pieces,
  each with its own scope and acceptance criteria. An agent should be able to
  complete one unit, verify it, and stop cleanly if needed.
- Risks — known constraints, gotchas, or dependencies that could block or
  invalidate a unit.

**Format example to embed in AGENTS.md:**

```markdown
## Implementation Units

### U1: <unit name>
Files: <list of files>
Acceptance: <what done looks like>

### U2: <unit name>
...
```

Update `plans/todo/README.md` to reflect the richer format expectation.

### 5. Root `AGENTS.md` — task routing table

Add a root-level task routing table that maps work types to the right
workspace AGENTS.md and plans. Mirror the pattern that already exists in
`frontend/AGENTS.md`. Covers:

| If you are doing... | Read this first |
|---|---|
| Query engine or API work | `card_store/AGENTS.md` |
| Frontend UI work | `frontend/AGENTS.md`, `frontend/UI_ARCHITECTURE.md` |
| Price scraping or pipeline | `price_store/AGENTS.md` |
| Deck storage or archive | `deck_store/AGENTS.md` |
| Any significant new work | `plans/todo/` |
| Releasing or deploying | `CLAUDE.md` Release section |

## Test Plan

- Confirm all new AGENTS.md files are reachable from the root AGENTS.md routing
  table.
- Manually read each new file and verify the invariants stated are accurate
  against the current source code.
- Check that the updated plan format section in root AGENTS.md does not
  contradict the existing single-stage plan format (the new richer sections are
  additive, not replacement).
- No code changes means no build or test suite verification needed.

## Assumptions

- The schema and query engine invariants described above are accurate at the
  time of writing; a future worker should re-verify them against current code
  before treating them as authoritative.
- The price store AGENTS.md can reference executed plan files without those
  plans needing to be updated; the plans already capture the relevant history.
- Adding a routing table to the root AGENTS.md will not conflict with the
  existing frontend routing table (different scope).
