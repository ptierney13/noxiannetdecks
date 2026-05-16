# Draft Plan: Frontend UI Alignment Stage 4 — TanStack Query Data Loading

## Summary

This is a draft summary plan and must be finalized and approved before
implementation begins.

Stage 4 replaces scattered `useEffect` data-fetching with TanStack Query. Route
loader stubs (placed in Stage 3) are filled in to call
`queryClient.ensureQueryData()` so data is prefetched before a route renders.
Components read from the query cache instead of managing local loading state.
No routing changes, no UI or CSS changes.
It inherits Stage 0's aligned frontend instructions, Stage 1's boundary
definitions, and Stage 3's router foundation.

## Confirmed decisions this stage inherits (do not reopen)

| Concern | Decision |
|---|---|
| Server state | TanStack Query (`@tanstack/react-query`) |
| Routing | TanStack Router with loader stubs in place from Stage 3 |
| Query key ownership | `data/` — query keys and query/mutation definitions live there |
| Component fetching rule | Components consume route-owned cache data; they do not initiate bare fetches |
| UI / CSS | Unchanged — no component or styling work in this stage |

## Key Changes

### 1. Install and configure TanStack Query

- Add `@tanstack/react-query` and `@tanstack/react-query-devtools`.
- The `QueryClient` provider stub from Stage 3 is filled in with real
  configuration (stale time, retry policy, devtools).
- `QueryClient` is instantiated once in `app/` and passed to both
  `QueryClientProvider` and the TanStack Router context.

### 2. Establish the `data/` layer

- Create `src/data/` with a barrel `index.ts`.
- Move `api.ts` here as the raw API client.
- Create query key factories and `queryOptions` definitions for each resource
  (cards, metadata, price data, etc.).
- Structure:
  ```
  data/
    api.ts          — raw fetch helpers
    cards.ts        — card query keys and queryOptions
    metadata.ts     — metadata query keys and queryOptions
    index.ts        — barrel export
  ```

### 3. Fill in route loaders

- For each route that loads data, fill in its TanStack Router `loader` to call
  `queryClient.ensureQueryData(queryOptions)`.
- This ensures data is in the cache before the route component renders —
  eliminating the initial loading flash for navigated routes.
- Loaders should not do anything else: no UI logic, no side effects.

### 4. Replace `useEffect` data fetches with `useQuery`

- In every route and feature component that currently fetches via `useEffect` +
  `useState`:
  - Remove the `useEffect` + `useState` pair
  - Replace with `useQuery(queryOptions)` from the `data/` layer
  - Handle `isLoading`, `isError`, and `data` states from the query result
- Components must not call `fetch` or `api.ts` functions directly — they consume
  query results only.

### 5. Standardize loading, empty, and error states

- Use consistent loading, empty, and error treatments from the `ui/` layer
  (established in Stage 2) in every route and feature component touched here.
- Do not invent new one-off loading spinners or error messages.

### 6. Storybook — add query state stories

- For every component touched in this stage, add or update Storybook stories
  that cover: loading state, empty state, error state, and success state.
- Use MSW (Mock Service Worker) or TanStack Query's test utilities to simulate
  these states in Storybook without a live API.
- Route-level stories should show the assembled component in each data state.

### 7. Keep scope narrow

- Do not change routing, navigation, or search param schemas.
- Do not make UI or CSS changes beyond what is needed to wire loading/error
  states to `ui/` shared components.
- Do not add new features or new queries beyond what existing components already
  fetch.

## Test Plan

- Run:
  - `npm run test -w @noxiannet/frontend`
  - `npm run build -w @noxiannet/frontend`
  - `npm run test:storybook -w @noxiannet/frontend`
  - `npm run build-storybook -w @noxiannet/frontend`
- Verify zero bare `useEffect` data-fetching patterns remain.
- Verify route loaders call `ensureQueryData` for each route's primary data
  dependency.
- Verify Storybook stories cover loading, empty, error, and success states for
  all touched components.
- Co-locate new test files next to their source files.

## Exit Criteria

- Zero `useEffect` data-fetching patterns remain in route, feature, or app code
- All route loaders call `queryClient.ensureQueryData()` for their primary data
- All components that previously fetched via `useEffect` now use `useQuery()`
- Query key factories and `queryOptions` live under `data/` and are exported
  via barrel
- Loading, empty, and error states use `ui/` shared components consistently
- Storybook covers all four data states for every touched component

## Assumptions

- TanStack Router's loader context provides the `QueryClient` instance to loader
  functions — this is the standard TanStack Router + Query integration pattern.
- MSW or query test utilities are already available or will be installed as a
  dev dependency for Storybook story mocking.
- This stage does not add new API endpoints or new data requirements — it
  migrates existing fetches only.
