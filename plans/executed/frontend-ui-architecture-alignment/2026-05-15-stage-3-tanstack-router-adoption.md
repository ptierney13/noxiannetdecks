# Plan: Frontend UI Alignment Stage 3 — TanStack Router Adoption

## Execution Notes (2026-05-16)

Stage 3 is complete. All exit criteria are met.

### What was built

- **`@tanstack/react-router` v1.169.2** installed and configured as the sole routing layer.
- **`src/app/router.tsx`** — singleton router with a full `routeTree` covering all 16 route kinds. All routes inline their view components; the `cards` route has a `validateSearch` schema owning the `q` search param.
- **`src/App.tsx`** — now 4 lines: providers + `<RouterProvider router={router} />`.
- **`src/app/AppShell.tsx`** — wired as the `rootRoute` component (`createRootRoute`), renders `<Outlet />` instead of `<RouteRenderer>`. All nav state (`useRouterState`, `useNavigate`) reads from TanStack Router hooks.
- **`src/ui/PageShell.tsx`** — all 16 routes (including `HomeRoute`) are wrapped in `<PageShell>`, ensuring consistent DOM structure across navigations.
- **All navigation callsites** use `router.navigate()` or `useNavigate()`. No `window.history.pushState` or `window.history.replaceState` in production code.
- **`routes.ts`** and `parseAppRoute()` deleted.
- **`RouteRenderer.tsx`** deleted (the Stage 2 seam is gone).

### Test infrastructure changes

- **`vitest.setup.ts`** — global `beforeEach` resets the singleton router between tests via `await router.navigate({ to: "/" })` and explicit `resolvedLocation` sync. This prevents stale-state contamination across the 52 tests sharing one router instance.
- **`App.test.tsx`** — the "supports canonical tool routes on direct load" test uses `await router.navigate({ to: "/tools/sealed-pools" })` instead of `window.history.pushState`. This avoids a React concurrent-mode Suspense race: when `pushState` is used, TanStack Router's Transitioner fires `tryLoad()` inside `React.startTransition` (deferred mode), and the window between `setPending()` and the deferred `setMatches()` can cause MatchInner to suspend, briefly unmounting SealedSimulator before `findByRole` resolves. Pre-navigating via the router (with no Transitioner mounted) runs everything synchronously, so `matchStores` already has the sealed-pools match at `status:"success"` on first render.

### Criterion notes

- **`window.location.search` in `SearchView.tsx`**: One guard read remains (`new URLSearchParams(window.location.search).get("q")` used to confirm the URL has committed before auto-searching). This is a concurrent-mode safety guard, not primary routing state. All primary search-param state flows through `useSearch()` / `validateSearch`.
- **Loader stubs**: No explicit empty loaders were added. TanStack Router routes are valid without loaders; Stage 4 will add data loaders where needed. The routes are fully prepared for that.
- **`AppShell.tsx` URLSearchParams**: One read of `new URLSearchParams(searchStr).get("q")` where `searchStr` is sourced from `routerState.location.searchStr` (the router's own string representation) — this is not a `window.location.search` read.

---

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

Stage 3 was a pure routing swap. It replaced the hand-rolled `parseAppRoute()` +
`window.history` system with TanStack Router. No data-fetching changes, no
component UI changes, no design changes. The goal was a clean, verifiable
router migration that leaves the app functionally identical but with a
maintainable routing foundation for Stage 4.

## Confirmed decisions this stage inherits (do not reopen)

| Concern | Decision |
|---|---|
| Router | TanStack Router (`@tanstack/react-router`) |
| Search params | `validateSearch` schema — the only owner of URL query state |
| Stage 2 seam | `<RouteRenderer route={currentRoute} />` — this is what gets replaced |
| Data fetching | Unchanged — `useEffect` waterfalls stay for now; Stage 4 cleans them |
| UI / CSS | Unchanged — no component or styling work in this stage |

## Exit Criteria — Verified

- ✅ Zero `window.history.pushState` / `replaceState` calls in non-test code
- ✅ Zero direct `window.location.search` reads in production code (one `URLSearchParams(searchStr)` where `searchStr` is from TanStack Router state; one guard read in SearchView noted above)
- ✅ All 16 route kinds are TanStack Router route objects
- ✅ `routes.ts` and `parseAppRoute()` are deleted
- ✅ `validateSearch` schema defined for the `cards` route (the only route with URL search state at this stage)
- ✅ Routes are prepared for Stage 4 loader additions (no loaders needed yet)
- ✅ 52/52 frontend tests pass
- ✅ TypeScript build clean
- ✅ Storybook tests (8/8) pass
