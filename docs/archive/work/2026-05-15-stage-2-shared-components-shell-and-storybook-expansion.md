# Draft Plan: Frontend UI Alignment Stage 2

## Stage 1 Completion Notes (2026-05-15)

Stage 1 is complete. Key findings and constraints for Stage 2:

- **Inventory**: documented in `frontend/UI_ARCHITECTURE.md` (Architecture Inventory section).
- **App.tsx is 3,116 lines** — owns routing, all nav state, 25+ useState hooks, all 17 route renderers, inline SVG icons, and large inline view logic.
- **No `ui/`, `features/`, `data/`, `lib/`, `routes/` directories exist yet** — Stage 2 creates them.
- **`styles.css` is 5,931 lines** — see CSS Selector → Component Map in `UI_ARCHITECTURE.md`.
- **Storybook has 6 stories** (all under `src/storybook/`), all home-page focused. Major coverage gaps documented in `UI_ARCHITECTURE.md`.
- **No TanStack Router or TanStack Query** installed yet.
- **`useDebounce.ts`, `headerLayout.ts`, `priceData.ts`** are in `src/` root — candidates for `lib/` in Stage 2.
- **`QueryChip.tsx`** is a natural `ui/` extraction candidate.
- All 52 tests pass; build is clean on this branch.

**Stage 2 must not install TanStack Router or Query** — those belong to Stages 3 and 4 respectively.

---

## Summary

This is a draft summary plan and must be finalized and approved before
implementation begins.

Stage 2 extracts the shared shell and reusable UI pieces out of the current
monolithic app structure, expands Storybook so every meaningful component and
nested component can be inspected visually, and replaces route-local one-off UI
with canonical shared implementations where practical.

This stage should prioritize maintainable shared component boundaries over
large-scale behavior changes.
It should explicitly avoid route-platform choices that belong to Stage 3.
It inherits aligned migration instructions from Stage 0 and the inventory plus
boundary definitions from Stage 1.

## Confirmed decisions this stage inherits (do not reopen)

| Concern | Decision |
|---|---|
| CSS | Tailwind on components; delete migrated selectors from `styles.css`; no new additions |
| Routing | Hand-rolled router stays in place — Stage 3 swaps it |
| Stage 3 seam | `App.tsx` must exit this stage calling one `<RouteRenderer route={currentRoute} />` |
| Module public API | Barrel `index.ts` per layer |
| Tests | Co-located `ComponentName.test.tsx` |

## Key Changes

### 1. Break shared shell concerns out of `App.tsx`

- Extract the site shell, header/nav, route shell wrappers, and shared empty or
  error treatments into `ui/` and create barrel exports.
- Style extracted components with Tailwind; delete the corresponding selectors
  from `styles.css` after confirming each extraction.
- The hand-rolled `parseAppRoute()` stays in `routes.ts` — do not touch it.

**`App.tsx` exit criteria for this stage (non-negotiable):**
`App.tsx` must be reduced to only:
1. Provider wrappers (context, query client setup stub, etc.)
2. A single `<AppShell>` wrapper
3. A single `<RouteRenderer route={currentRoute} />` call inside the shell

`RouteRenderer` is a new thin dispatcher component that maps the current route
object to the appropriate view — it is the seam Stage 3 will replace with a
TanStack Router outlet. It must be kept as a flat switch/map with no embedded
presentational UI. Everything else that is currently in `App.tsx` is either
moved to `ui/`, `features/`, or a route-scoped module.

If any concern in `App.tsx` is not clearly shell, provider, or routing dispatch,
stop and classify it before extracting. It belongs in one of: `ui/` (shared
visual), `features/` (cross-route domain UI), or a route module (route-local).

### 2. Establish the `ui/`, `features/`, and `lib/` directory boundaries

- Create `src/ui/`, `src/features/`, `src/lib/` and place an `index.ts` barrel
  in each.
- Move existing shared-ish components to the appropriate layer; update all
  import sites to use the barrel.
- Shared `ui/` candidates from the current flat structure:
  - `QueryChip.tsx` → `ui/`
  - `LtsDetailOverlay.tsx` → evaluate: shared across routes → `ui/`; route-local → leave
  - `siteSystem.tsx` (HomePage component) → evaluate which parts are shell vs feature
- Move `useDebounce.ts` → `lib/`
- Populate `ui/` with at minimum:
  - controls (inputs, chips, toggles)
  - panels and cards
  - menus and overlays
  - empty, loading, error feedback states
  - route shell wrapper

### 3. Expand Storybook coverage for every touched component

- Add or refine stories for each extracted or newly established shared component.
- Cover: default, loading, empty, and error states.
- Use `@storybook/test` play functions for interaction states where meaningful.
- Build route-level stories from shared components so Storybook supports both
  isolated and assembled review.
- Do not add standalone stories for tiny private helpers that exist only to
  support a larger shared story surface.
- Co-locate new test files next to their component source files.

### 4. CSS migration — run in parallel with each extraction

- For every component extracted in this stage:
  1. Write all styles as Tailwind utility classes on the component
  2. Identify the corresponding selectors in `styles.css`
  3. Delete those selectors after confirming the component renders correctly
- Do not leave duplicate CSS ownership (both Tailwind classes and a matching
  `styles.css` rule for the same element).
- `ui-foundation.css` may be preserved as a design-token declaration file
  (custom property definitions only) if needed. No utility selectors there.

### 5. Completion reporting

Each work item's completion note must state:
- which components were added or modified
- which Storybook story paths to open for inspection
- which `styles.css` selectors were removed

### 6. Stage 3 seam — the only routing concern in this stage

The single routing-adjacent task is ensuring the seam is clean:

- `RouteRenderer` is a new component in `app/` that receives the current parsed
  route and returns the matching view component
- It must be a flat, readable dispatch (switch or object map) with no JSX of
  its own beyond the matched component
- Stage 3 will delete `RouteRenderer` and replace the call site with a TanStack
  Router outlet — this must require zero changes to `AppShell` or any `ui/`
  component

Do not make any other routing changes. Do not touch `routes.ts` or
`parseAppRoute()`.

## Test Plan

- Run:
  - `npm run test -w @noxiannet/frontend`
  - `npm run build -w @noxiannet/frontend`
  - `npm run test:storybook -w @noxiannet/frontend`
  - `npm run build-storybook -w @noxiannet/frontend`
- Manually inspect all new and updated component stories in Storybook before
  calling the stage complete.
- Verify `App.tsx` meets its exit criteria: providers + `<AppShell>` +
  `<RouteRenderer>` only.
- Verify `RouteRenderer` is a flat dispatch with no embedded presentational UI.
- Verify no new `styles.css` rules were added; verify selectors for migrated
  components were deleted.

## Assumptions

- The best Stage 2 outcome is a clean shared UI surface and a well-formed Stage
  3 seam, not a full app platform migration.
- `RouteRenderer` is intentionally temporary — Stage 3 removes it.
- Some route-level view files will still contain mixed concerns after this
  stage; Stage 4/5 finishes that cleanup after routing and data are settled.
