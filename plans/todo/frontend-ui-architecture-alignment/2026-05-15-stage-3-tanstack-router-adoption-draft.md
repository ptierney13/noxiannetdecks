# Draft Plan: Frontend UI Alignment Stage 3 — TanStack Router Adoption

## Stage 2 Completion Notes (2026-05-15)

Stage 2 is complete. Key findings and state for Stage 3:

- **App.tsx reduced to 4 lines**: providers + `<AppShell />` — exit criteria met.
- **`src/app/AppShell.tsx`**: owns all nav state + header/nav JSX; renders `<RouteRenderer>`.
- **`src/app/RouteRenderer.tsx`**: flat dispatch of route.kind → view component; this is the Stage 3 seam.
- **`src/app/index.ts`**: barrel (AppShell, RouteRenderer exports).
- **`src/cardFormat.tsx`**: shared card display utilities + `PriceHistoryChart` + `CardQuickLookModal`.
- **`src/SearchView.tsx`**, **`src/LearnToSearchView.tsx`**, **`src/CardDetailView.tsx`**, **`src/SealedSimulator.tsx`**: extracted view files.
- **`src/ui/`**: QueryChip (Tailwind), Icon (SearchIcon/CardsIcon/MenuIcon/ChevronIcon), barrel index.
- **`src/lib/`**: useDebounce, priceData, headerLayout, barrel index.
- **`src/features/`**: placeholder barrel (no contents yet).
- **Deleted** root-level legacy: `QueryChip.tsx`, `useDebounce.ts`, `headerLayout.ts`, `priceData.ts`.
- **Deleted CSS**: `.query-chip` and `.menu-icon` selectors from `styles.css`.
- **Storybook**: added `ui/QueryChip.stories.tsx` and `ui/Icon.stories.tsx`.
- **52 tests pass**; TypeScript clean.
- **`parseAppRoute()`** and `routes.ts` untouched — ready for Stage 3.

---

## Summary

This is a draft summary plan and must be finalized and approved before
implementation begins.

Stage 3 is a pure routing swap. It replaces the hand-rolled `parseAppRoute()` +
`window.history` system with TanStack Router. No data-fetching changes, no
component UI changes, no design changes. The goal is a clean, verifiable
router migration that leaves the app functionally identical but with a
maintainable routing foundation for Stage 4.
It inherits Stage 0's aligned frontend instructions and Stage 2's extracted
shell seam.

## Confirmed decisions this stage inherits (do not reopen)

| Concern | Decision |
|---|---|
| Router | TanStack Router (`@tanstack/react-router`) |
| Search params | `validateSearch` schema — the only owner of URL query state |
| Stage 2 seam | `<RouteRenderer route={currentRoute} />` — this is what gets replaced |
| Data fetching | Unchanged — `useEffect` waterfalls stay for now; Stage 4 cleans them |
| UI / CSS | Unchanged — no component or styling work in this stage |

## Key Changes

### 1. Install and configure TanStack Router

- Add `@tanstack/react-router` and `@tanstack/router-devtools` as dependencies.
- Create a `QueryClient` setup stub in `app/` (needed by Stage 4; created now so
  the provider shape is correct from the start).
- Configure the router with a `routeTree` built from the existing 16 route kinds
  already defined in `routes.ts`.

### 2. Define the TanStack Router route tree

- Create a `routes/` directory with one file per route kind.
- Each route file defines:
  - the route path
  - a `validateSearch` schema for any URL search params owned by that route
  - a loader stub (empty for now — Stage 4 fills these in)
  - a component that delegates to the existing view component unchanged
- The 16 existing route kinds in `routes.ts` become the 16 TanStack Router
  route objects. `routes.ts` is deleted after the migration is complete.

### 3. Replace `RouteRenderer` with TanStack Router's outlet

- The `<RouteRenderer route={currentRoute} />` seam from Stage 2 is removed.
- `App.tsx` replaces it with TanStack Router's `<RouterProvider router={router} />`.
- `AppShell` is wired as a layout route that wraps all child routes.
- `parseAppRoute()` is deleted.

### 4. Migrate all navigation callsites

- Replace every `window.history.pushState` / `window.history.replaceState` call
  with TanStack Router's `navigate()` function or `<Link>` component.
- Replace every direct `window.location.search` / `URLSearchParams` read in
  route or feature code with TanStack Router's `useSearch()` hook.
- Zero direct `window.history` or `window.location.search` calls should remain
  in `routes/`, `features/`, `ui/`, or `app/` after this stage.

### 5. Search param schema definitions

- For each route that owns URL search state (search query, sort, filters, tabs,
  view mode, pagination), define a `validateSearch` schema in that route file.
- This is the single source of truth for what params a route accepts and their
  default values. No other file should parse these params directly.
- Components that previously read `URLSearchParams` directly now use
  `useSearch()` with the typed route context.

### 6. Storybook — keep coverage intact, add navigation states

- Verify all existing Storybook stories still compile and pass after the routing
  swap.
- If any story depended on the hand-rolled router or `parseAppRoute()`, update
  it to use TanStack Router's test utilities or a stub router.
- Add stories for any new navigable states (active link, current route indicator)
  if they represent meaningful inspectable UI.

### 7. Keep scope narrow

- Do not touch data-fetching or `useEffect` logic. Loaders are stubs.
- Do not make UI or CSS changes.
- Do not reopen Stage 2 component extractions unless the router swap exposes a
  direct breakage — if it does, document the delta before fixing it.

## Test Plan

- Run:
  - `npm run test -w @noxiannet/frontend`
  - `npm run build -w @noxiannet/frontend`
  - `npm run test:storybook -w @noxiannet/frontend`
  - `npm run build-storybook -w @noxiannet/frontend`
- Verify navigation works for all 16 route kinds.
- Verify URL search params round-trip correctly through `validateSearch`.
- Verify zero `window.history` or raw `URLSearchParams` calls remain.
- Verify all existing Storybook stories pass unchanged (or with documented
  router-stub updates only).
- Co-locate any new tests next to their source files.

## Exit Criteria

- Zero `window.history.pushState` / `replaceState` calls in non-test code
- Zero direct `window.location.search` / `URLSearchParams` reads in route,
  feature, or app code
- All 16 route kinds are TanStack Router route objects
- `routes.ts` and `parseAppRoute()` are deleted
- All search param schemas are defined via `validateSearch`
- Route loader stubs are in place and ready for Stage 4 to fill

## Assumptions

- The Stage 2 seam (`RouteRenderer`) makes this a clean swap with no shell or
  shared UI changes required.
- This stage does not introduce SSR. TanStack Router is used in SPA mode.
- Loader stubs are intentionally empty — data loading is Stage 4's responsibility.
