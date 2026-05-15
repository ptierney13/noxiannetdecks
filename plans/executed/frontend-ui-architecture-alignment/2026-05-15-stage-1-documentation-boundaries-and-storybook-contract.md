# Draft Plan: Frontend UI Alignment Stage 1

## Stage 0 Completion Notes (2026-05-15)

Stage 0 is complete. The following changes were made:

- `frontend/AGENTS.md` — full rewrite: removed CSS-first guidance as default,
  added Migration Era Contract, Target Architecture Layers table, Storybook
  Requirement section, and task routing table modeled on manavault's pattern.
- `frontend/UI_ARCHITECTURE.md` — full rewrite: added Migration Era Contract
  table at the top, added Target Layer Structure section, updated Shared Design
  System to mark `styles.css` as legacy-only, kept all responsive/navigation/
  design preferences (still valid).
- Root `AGENTS.md` — updated Frontend UI Guidance section: replaced the old
  token/inline-style description with the new routing table and pointer to the
  migration-era rule set.
- Stage 0 plan moved to `plans/executed/frontend-ui-architecture-alignment/`.

**Constraints inherited by Stage 1:**

- `frontend/AGENTS.md` and `frontend/UI_ARCHITECTURE.md` are now aligned with
  the initiative's locked decisions. Stage 1 should not reopen basic instruction
  cleanup.
- The task routing table in `frontend/AGENTS.md` is the new authoritative
  start-here for future agents working on the frontend.
- `ui-foundation.css` stays as a CSS custom property declaration file only.
- No new `styles.css` rules in any stage.

---

## Summary

This is a draft summary plan and must be finalized and approved before
implementation begins.

Stage 1 builds on Stage 0's instruction cleanup by inventorying the current
component and route architecture, defining the intended shared-boundary
structure in more detail, and making Storybook-first verification an explicit
enforceable contract for future UI work.

This stage should not spend its time debating which existing frontend docs are
authoritative; Stage 0 resolves that. Its job is to make later subagent work
safe, discoverable, and consistent before the structural extraction and
platform-migration stages begin.

## Confirmed decisions this stage inherits (do not reopen)

| Concern | Decision |
|---|---|
| CSS | Tailwind CSS; no new rules in `styles.css` |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Module public API | Barrel `index.ts` per layer; consumers import from barrel |
| Tests | Co-located `ComponentName.test.tsx` |
| Shared utilities | `lib/` layer (e.g. `useDebounce`) |

## Key Changes

### 1. Validate and extend the Stage 0 instruction handoff

- Confirm the Stage 0 updates left `frontend/AGENTS.md` and
  `frontend/UI_ARCHITECTURE.md` as the single authoritative frontend guidance.
- Tighten or clarify any remaining ambiguity discovered while preparing the
  inventory, but do not reopen the basic instruction cleanup itself unless the
  docs are still contradictory.

### 2. Study and adapt `manavault` documentation patterns

- Read the reference repo at `C:\Users\ptier\repos\manavault`, especially:
  - root `AGENTS.md`
  - nested `AGENTS.md` files
  - frontend architecture docs
  - Storybook/testing guidance
  - TanStack Router and TanStack Query usage patterns
- Identify which documentation patterns should be copied or adapted locally.

### 3. Strengthen local AI-first guidance

- Update repo and frontend guidance so future workers are directed toward:
  - shared component reuse first, from the barrel index
  - Storybook-first UI verification
  - Tailwind for all new styles; no new `styles.css` additions
  - the `features/` rule: if two or more routes need it, it's a feature; if
    only one route will ever use it, keep it in the route module
  - how completion notes must point users to relevant Storybook stories

### 4. Produce a durable frontend inventory

- Document the current state of:
  - route modules and route-like views (`DeckExplorerView`, `QueryBuilderView`,
    etc.) and which of them share domain UI that belongs in `features/`
  - oversized files: `App.tsx` (113 KB), `styles.css` (122 KB), `App.test.tsx`
    (61 KB) — call out their specific ownership problems
  - shared-ish components that should become canonical `ui/` exports
  - selectors in `styles.css` that block Tailwind migration and their
    associated components
  - current Storybook coverage gaps per component
- Identify components and nested subcomponents that lack inspectable stories.
- For `styles.css`: produce a mapping of selector groups → owning component so
  Stage 2 agents know exactly what to migrate and delete during extraction.

### 5. Write the target frontend directory structure as a reference document

The output of this task is `frontend/UI_ARCHITECTURE.md` (updated) plus
`frontend/AGENTS.md` (updated). The documents must state:

- Directory layout with one-line descriptions of what each folder owns:
  ```
  src/
    app/        — providers, shell, top-level route mounting
    routes/     — TanStack Router route definitions and loaders
    features/   — domain UI shared by more than one route
    ui/         — product-agnostic primitives (Tailwind, no API calls)
    data/       — TanStack Query keys, query/mutation defs, API client
    lib/        — shared React utilities (useDebounce, formatters, etc.)
  ```
- Barrel index rule: import from `ui/`, not `ui/Button/Button`
- Import direction table (from the initiative contract)
- "Where does X go?" quick reference:
  - New button or input primitive → `ui/`
  - New card-domain component used by multiple routes → `features/`
  - New card-domain component used by one route → keep in the route file
  - New API call or query → `data/`
  - New non-domain hook or utility → `lib/`
  - New page route → `routes/`
- CSS protocol: write Tailwind on the component; delete matching `styles.css`
  selector after confirming migration; never add new rules to `styles.css`
- Test co-location rule: tests live next to their source file
- Storybook tier contract (see key change 6)
- Completion-reporting requirement: every component PR must name changed
  components and list Storybook paths to open for inspection

### 6. Define the Storybook contract

Tiers:

| Tier | When required |
|---|---|
| Required | Exported `ui/` components; exported `features/` components |
| Required | Route-shell and feature states the user should inspect |
| Optional | Tiny private implementation helpers with no meaningful inspectable state |

- Stories must cover: default, loading, empty, error states where applicable
- Interaction states (hover, focus, open/closed) should use `@storybook/test`
  play functions where meaningful
- Completion messages must reference the Storybook path(s) to open

### 7. Define measurable exit criteria for all later stages

Document the specific per-stage exit criteria that later plans inherit:

**Stage 2 exit (shell + shared UI):**
- `App.tsx` owns only: provider wrappers and a single `<RouteRenderer route={currentRoute} />` call
- All shell and presentational UI is extracted into `ui/` or `features/`
- Every extracted shared component has Storybook coverage
- No new rules added to `styles.css`; at least the shell and header selectors
  are migrated to Tailwind and deleted from `styles.css`
- Tests for extracted components are co-located

**Stage 3 exit (TanStack Router):**
- Zero `window.history` calls remain in any route, feature, or shell file
- All routes are defined as TanStack Router route objects
- Search param schemas use `validateSearch` — no direct `URLSearchParams` reads
  in route or feature code
- Navigation uses TanStack Router's `navigate` or `<Link>` — no `pushState`

**Stage 4 exit (TanStack Query):**
- Zero bare `useEffect` data-fetching waterfalls remain in route or feature code
- All data entry points for routes flow through route loaders calling
  `queryClient.ensureQueryData()`
- Components read from the query cache, not from local state initialized by
  `useEffect`

**Stage 5 exit (rollout + cleanup):**
- `styles.css` is empty or deleted
- `App.test.tsx` monolith is disbanded; tests are co-located
- No legacy routing or fetching code remains
- Docs reflect the actual final structure

## Test Plan

- Run:
  - `npm run test -w @noxiannet/frontend`
  - `npm run build -w @noxiannet/frontend`
  - `npm run test:storybook -w @noxiannet/frontend`
  - `npm run build-storybook -w @noxiannet/frontend`
- Verify updated docs correctly direct future workers to confirmed decisions.
- Verify Stage 0 no longer leaves contradictory frontend instructions in place.
- Confirm the inventory explicitly calls out:
  - monolith hotspots (`App.tsx`, `styles.css`, `App.test.tsx`)
  - Stage 2 shell and shared UI extraction candidates
  - Stage 3 router migration seams (all `window.history` and `parseAppRoute` callsites)
  - Stage 4 data-loading migration seams (all `useEffect` data fetches)

## Assumptions

- The highest-value Stage 1 output is a precise inventory plus durable
  architecture guidance layered on top of Stage 0's aligned instructions, not
  visible UI redesign.
- `manavault` contains reusable documentation and agent-guidance patterns worth
  adapting directly.
- All stack decisions (Tailwind, TanStack Router, TanStack Query) are settled
  and must appear as locked facts in the updated docs.
