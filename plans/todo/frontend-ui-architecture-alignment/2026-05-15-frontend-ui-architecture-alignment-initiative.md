# Plan: Frontend UI Architecture Alignment Initiative

## Summary

Reorganize the `frontend/` application so it moves from a large app-local Vite
SPA with hand-rolled routing and mixed legacy/new styling patterns toward a
more maintainable, AI-friendly architecture modeled on the stronger patterns in
the reference repo at `C:\Users\ptier\repos\manavault`.

This initiative is intentionally staged. It should absorb the strongest ideas
from `manavault`, especially its AI-first documentation, `AGENTS.md` layering,
shared UI boundaries, route/data-loading discipline, and Storybook-first UI
review habits, while still respecting this repository's existing plan-first and
approval workflow.

This initiative-level plan is the durable umbrella plan. Each implementation
stage must use a finalized, approved stage plan before code changes begin.
Stage 0 exists specifically to align the written instructions before later
stages begin structural code migration.

## Top-Level Instructions For The Managing Agent

1. Read local repo instructions first:
   - `AGENTS.md`
   - `frontend/AGENTS.md`
   - `frontend/UI_ARCHITECTURE.md`
2. Read the reference repo at `C:\Users\ptier\repos\manavault` before finalizing
   any stage plan, with special focus on:
   - repo-level and nested `AGENTS.md` files
   - frontend architecture docs
   - shared UI package/component organization
   - Storybook organization and test conventions
   - routing/data-loading patterns
3. Treat `manavault` as the preferred source of pattern inspiration unless a
   local repo constraint clearly blocks direct reuse.
4. Use subagents per approved plan element with clear file ownership and
   non-overlapping write scopes.
5. Require Storybook-first UI verification:
   - every changed component must have Storybook coverage
   - nested subcomponents should also have stories/tests where they represent
     meaningful inspectable UI states
   - shared components should be visually reviewed in Storybook before route
     pages are considered complete
6. Prefer existing shared components and patterns before introducing new ones.
7. Whenever new components are introduced or existing component capabilities
   are expanded, the completion message for that work must:
   - explicitly say which components were added or changed
   - point to the Storybook stories/tests that let the user inspect them
8. Do not start implementation from this umbrella plan alone. Finalize and gain
   approval for the active stage first.
9. When a stage completes:
   - move/record the enacted stage plan under the matching
     `plans/executed/frontend-ui-architecture-alignment/` folder
   - refresh the remaining future-stage draft summaries with newly relevant
     constraints, discoveries, and architectural decisions

## Confirmed Stack Decisions

These decisions are locked. Stage plans must not reopen them.

| Concern | Decision |
|---|---|
| CSS / styling | Tailwind CSS — utility classes on components; no new raw CSS selectors |
| Query / server state | TanStack Query (`@tanstack/react-query`) |
| Routing | TanStack Router (`@tanstack/react-router`) |
| Search params | TanStack Router `validateSearch` — the canonical URL-state API |
| Tests | Co-located: `ComponentName.test.tsx` next to `ComponentName.tsx` |
| Module public API | Each layer exposes a barrel `index.ts`; consumers import from the barrel, not from internal files |

CSS migration protocol: write new component styles as Tailwind utility classes on the component.
Remove the corresponding selector from `styles.css` only after the component is confirmed migrated.
Never add new rules to `styles.css`; let it shrink to zero across stages.

## Target Architecture Contract

The initiative should converge on a frontend structure with these ownership
rules:

- `app/`
  - owns app composition, top-level providers, shell wiring, and route mounting
  - may import from `routes/`, `features/`, `ui/`, `data/`, and `lib/`
- `routes/`
  - owns route entry modules, TanStack Router route definitions, route-level
    loaders, and route-to-feature composition
  - may import from `features/`, `ui/`, `data/`, and `lib/`
  - should stay thin; reusable presentational UI belongs in `features/` or `ui/`
- `features/`
  - owns domain-specific UI and interaction state shared by more than one route
  - rule: if only one route will ever use it, keep it in the route module;
    if two or more routes share it, move it to `features/`
  - may import from `ui/`, `data/`, and `lib/`
- `ui/`
  - owns shared presentational primitives and composites that are product-agnostic
  - styled with Tailwind; no API calls; no domain knowledge
  - must not import from `routes/`, `app/`, `features/`, or `data/`
- `data/`
  - owns API clients, TanStack Query query keys, query/mutation definitions,
    route-loader helpers, and shared URL-state utilities
  - must not contain route or presentational component code
- `lib/`
  - owns shared non-domain React utilities and pure helpers: `useDebounce`,
    formatters, date utilities, and similar
  - must not import from any other layer above it

The approved stage plans should preserve these import expectations:

- `app -> routes/features/ui/data/lib`
- `routes -> features/ui/data/lib`
- `features -> ui/data/lib`
- `ui -> lib`
- `data -> lib`
- `lib -> (nothing in this repo)`

If a later stage proposes exceptions, that stage plan must call them out
explicitly and explain why the default boundary is not sufficient.

## Key Changes

### 1. Align local frontend guidance with the stronger AI-first reference model

- Review `C:\Users\ptier\repos\manavault` and port over the best documentation
  and nested `AGENTS.md` patterns that improve discoverability and reduce
  architectural drift.
- Expand this repo's frontend instructions so future agents are routed toward:
  - shared UI reuse first
  - Storybook-first UI work
  - route/data architecture boundaries
  - where visual primitives vs route composition vs feature logic should live

### 2. Reorganize frontend code around clearer app, route, feature, and UI boundaries

- Reduce `frontend/src/App.tsx` as the primary monolith.
- Create a structure that separates:
  - app shell and navigation
  - route modules
  - feature modules
  - shared UI primitives/composites
  - shared data/query utilities
- Prefer durable boundaries that are easy for later subagents to work within.

### 3. Move toward shared-component and canonical-pattern usage

- Establish a stronger shared component inventory inside the repo, with a path
  toward a package-level shared UI boundary if that proves worthwhile.
- Replace route-local one-off implementations with canonical shared components
  where practical:
  - menus and overlays
  - inputs and controls
  - page/route shells
  - cards/panels
  - empty/loading/error states
  - common list/result controls

### 4. Make Storybook the primary UI verification harness

- Storybook coverage is required for:
  - exported shared UI components
  - shared shell compositions
  - route-level assemblies that are intended as reusable review surfaces
  - feature components with meaningful inspectable states
- Tiny private leaf helpers do not need standalone stories unless they expose a
  meaningful state or interaction the user should inspect directly.
- Organize stories so the user can inspect both:
  - isolated primitives/components
  - shared shell compositions
  - route-level assemblies built from those components
- Use Storybook-first verification for all UI additions and modifications.

### 5. Adopt TanStack Router for routing and TanStack Query for server state

- TanStack Router replaces the hand-rolled `parseAppRoute()` + `window.history`
  system. Migration happens in Stage 3 as a pure routing swap.
- TanStack Query replaces scattered `useEffect` data-fetching in Stage 4.
- Route loader functions should call `queryClient.ensureQueryData()` so data is
  prefetched before the route renders; components read from the query cache.
- Search param schemas use TanStack Router `validateSearch` — this is the
  canonical owner of URL query state (search query, sort, filters, view mode).
  No route or feature component should read `window.location.search` directly.

## Migration Guardrails

- Stage 0 updates documentation and frontend instructions only. It must not
  move components, alter routing behavior, change data-loading behavior, or
  begin the styling migration itself.

- Stage 2 extracts shell and presentational boundaries only. It must leave
  `App.tsx` with a single `<RouteRenderer route={currentRoute} />` call as the
  seam for Stage 3. The hand-rolled router is not touched.
- Stage 3 swaps the router only. No component UI changes, no data fetching
  changes. `RouteRenderer` is replaced by TanStack Router's outlet. If the
  router migration exposes a Stage 2 extraction that needs adjustment, record
  the delta in the Stage 3 plan before implementing it.
- Stage 4 wires TanStack Query only. Routing is already settled and must not be
  reopened. No unrelated design changes.
- Stage 5 focuses on rollout and cleanup. Core architectural decisions must be
  settled in Stages 0–4; Stage 5 must not reopen them.

## Done Criteria For The Initiative

The initiative should not be considered complete until all of the following are
true:

- `frontend/src/App.tsx` is no longer the primary owner of route parsing,
  route switching, navigation state orchestration, and shared shell rendering
- route entrypoints live under a dedicated route boundary instead of primarily
  inside a monolithic app component
- direct `window.history` orchestration is removed from feature and shell code
  in favor of the approved routing boundary
- shared UI components are discoverable under a dedicated shared UI area with
  Storybook coverage for exported surfaces
- shared async state helpers and route-loading helpers are discoverable under a
  dedicated data boundary
- documentation reflects the final boundaries and tells future agents where new
  work should go by default

### 6. Finish the transition from mixed legacy styling to a disciplined design system

- Continue migrating from mixed raw tokens and legacy selectors toward semantic
  tokens and canonical shared surface/control patterns.
- Break up overly broad CSS ownership so shared foundation, shell composition,
  and route-specific styling are easier to reason about and test.

## Stage Overview

Stage 3 and Stage 4 intentionally separate router adoption from data-loading
modernization. They are mechanically different operations touching different
files; combining them in one stage makes debugging harder and exit criteria
ambiguous.

1. Stage 0 draft:
   documentation alignment, instruction cleanup, and migration-era handoff so
   later agents do not inherit contradictory frontend guidance
2. Stage 1 draft:
   component inventory, Storybook policy refinement, and frontend boundary
   definition on top of the aligned Stage 0 docs
3. Stage 2 draft:
   shared shell/component extraction and Storybook coverage expansion;
   `App.tsx` exits this stage owning only provider wrappers and a single
   `<RouteRenderer>` call
4. Stage 3 draft:
   TanStack Router adoption — pure routing swap, no data-loading changes;
   exit criteria: navigation works, zero `window.history` calls remain
5. Stage 4 draft:
   TanStack Query adoption — replace `useEffect` waterfalls, wire route loaders
   to `queryClient.ensureQueryData()`; routing is not touched
6. Stage 5 draft:
   route-by-route rollout, Storybook completion, and follow-through cleanup

Each stage summary below is a draft and must be finalized and approved before
implementation begins for that stage.

## Test Plan

- For every stage, run the relevant frontend validation commands:
  - `npm run test -w @noxiannet/frontend`
  - `npm run build -w @noxiannet/frontend`
  - `npm run test:storybook -w @noxiannet/frontend`
  - `npm run build-storybook -w @noxiannet/frontend`
- Manually review Storybook first for any component or design work.
- Require each completed UI work item to cite the stories that should be used
  for user inspection.
- Manually verify that any route-level changes are built primarily from shared
  components already covered in Storybook.

## Assumptions

- `C:\Users\ptier\repos\manavault` is available locally and should be treated as
  the strongest nearby pattern reference for documentation, agent ergonomics,
  and frontend organization.
- The local repo should adopt `manavault` patterns selectively rather than by
  blindly mirroring unrelated product decisions.
- Storybook-first inspection is a hard requirement for meaningful UI work, not
  an optional follow-up, but standalone stories should be prioritized for shared
  and inspectable surfaces rather than every private helper.
- The repo may eventually adopt a router/data architecture closer to the
  reference repo, but the migration should be staged so the codebase remains
  reviewable and manageable by a coordinating agent with subagents.
