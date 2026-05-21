# Plan: Frontend UI Architecture Alignment Initiative

> Status: in progress

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
     `docs/archive/work/frontend-ui-architecture-alignment/` folder
   - refresh the remaining future-stage draft summaries with newly relevant
     constraints, discoveries, and architectural decisions

## Confirmed Stack Decisions

These decisions are locked. Stage plans must not reopen them.

| Concern | Decision |
|---|---|
| CSS / styling | Tailwind CSS — utility classes on components; no new raw CSS selectors. Token strategy: **Option B** — `@theme` block in `ui-foundation.css` so tokens are available as named Tailwind utilities (e.g. `bg-app-bg`, `text-primary`, `border-accent`). See Stage 5 Step 0 for setup instructions. |
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

- `app -> features/ui/data/lib` (routes live in `app/router.tsx`, not a separate `routes/` layer)
- `features -> ui/data/lib`
- `ui -> lib`
- `data -> lib`
- `lib -> (nothing in this repo)`

**`routes/` directory:** The original architecture contract listed `routes/`
as a target layer. This has been superseded. Route definitions live in
`app/router.tsx` and will remain there. Do not create a `routes/` directory.

If a later stage proposes import boundary exceptions, that stage plan must call
them out explicitly and explain why the default boundary is not sufficient.

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

**Completed stages (0–3) — do not reopen:**
- Routing: TanStack Router is the router. `app/router.tsx` owns all route
  definitions. The `routes/` directory will not be created — routes stay in
  `app/router.tsx` permanently.
- Shell: `AppShell` uses `<Outlet />`. `PageShell` wraps every route component.
  These are settled.
- Layer boundaries: `app/`, `ui/`, `lib/`, `features/` are established.
  Import rules in the Target Architecture Contract apply.

**Completed stages (4–5) — do not reopen:**
- Stage 4 installed TanStack Query and created the `data/` skeleton.
  No UI changes. No page rewrites.
- Stage 5 rewrote Home and AppShell in Tailwind — same visuals, correct code.
  Extracted `FeatureCard` and `PromoCard` to `ui/`. `siteSystem.tsx` deleted.
  `@theme` token block added to `ui-foundation.css`. AppShell uses pure Tailwind
  with stage-based state (no CSS class modifiers).

**Out-of-band shell work (post Stage 5) — do not reopen:**
- `AppHeader` was rewritten to a single Tailwind template driven by CSS container
  queries (`@container` on `<header>`, then `@sm:`/`@md:`/`@lg:` inside). The
  JS ResizeObserver state machine (`headerLayout.ts`) and dual mobile/desktop JSX
  trees were removed. `site-nav-*` legacy CSS selectors are fully gone. The only
  remaining `site-header` token in `styles.css` is a `var(--site-header-height)`
  reference — a CSS custom property, not a legacy selector.
- Navigation philosophy updated: single template, mobile-first, no separate
  mobile implementation. Shell components must use container queries, not viewport
  queries. See `frontend/AGENTS.md` and `frontend/.storybook/VIEWPORTS.md`.

**Active and upcoming stages (6–7):**
- Stage 6 moves `cardFormat.tsx` exports to the correct layers.
  No visual or behavioral changes.
- Stage 7 rewrites legacy pages one at a time, each driven by a user-provided
  mockup. TanStack Query is wired per page during each rewrite.

## Done Criteria For The Initiative

The initiative should not be considered complete until all of the following are
true:

**Already satisfied by Stages 0–3:**
- ✅ `App.tsx` owns only providers and `<RouterProvider>` — no route switching or shell rendering
- ✅ All route definitions live in `app/router.tsx` as TanStack Router route objects
- ✅ Zero `window.history` calls remain in non-test code
- ✅ Layer boundaries (`app/`, `ui/`, `lib/`, `features/`, `data/`) are established

**Remaining (Stages 4–7):**
- All 8 legacy pages rewritten in Tailwind with user-approved visual designs
- All pages use TanStack Query for data loading; zero `useEffect` data fetches remain
- `cardFormat.tsx` dissolved — all exports live in `ui/`, `features/`, or `lib/`
- `styles.css` reduced to CSS variable declarations, resets, and nothing else
- Shared UI components in `ui/` with barrel exports and Storybook coverage
- `App.test.tsx` disbanded; all tests co-located with their source files
- Documentation reflects the final architecture and tells future agents where new work goes

### 6. Finish the transition from mixed legacy styling to a disciplined design system

- Continue migrating from mixed raw tokens and legacy selectors toward semantic
  tokens and canonical shared surface/control patterns.
- Break up overly broad CSS ownership so shared foundation, shell composition,
  and route-specific styling are easier to reason about and test.

## Stage Overview

**Stages 0–3 are complete.** The scaffold is in place: TanStack Router is
wired, `AppShell` uses `<Outlet />`, all routes are defined in
`app/router.tsx`, `PageShell` wraps every route, and the `app/`, `ui/`,
`lib/`, and `features/` layer boundaries are established.

**Stages 6–7 are the active work.** Each must be finalized and approved before
implementation begins.

| Stage | Status | Summary |
|---|---|---|
| 0 | ✅ Complete | Documentation alignment and instruction handoff |
| 1 | ✅ Complete | Component inventory, Storybook policy, boundary definitions |
| 2 | ✅ Complete | Shared shell/component extraction; `App.tsx` reduced to providers + router |
| 3 | ✅ Complete | TanStack Router adoption; zero `window.history` calls remain |
| 4 | ✅ Complete | Documentation refresh, TanStack Query install, `data/` skeleton |
| 5 | ✅ Complete | Home Tailwind rewrite + component extraction; AppShell Tailwind rewrite |
| 6 | 📋 Planned | `cardFormat.tsx` analysis and placement into correct layers |
| 7 | 📋 Planned | Page-by-page UI rewrites with mockup-driven iteration |

Active stage plans live in `docs/work/frontend-ui-architecture-alignment/`.
Completed stage plans move to `docs/archive/work/frontend-ui-architecture-alignment/`.

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
