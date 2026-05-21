# Stage 4: Documentation Refresh and Tailwind Declaration

## Summary

Stage 4 is documentation and planning only — no code changes. It updates the
umbrella initiative plan to reflect the completed scaffolding, records the
current state of all pages, locks in Tailwind as the styling standard, and
produces per-page draft plans that will guide the individual rewrites in
later stages.

Stages 0–3 are complete. The structural scaffold is in place:
- TanStack Router wired; all routes defined in `app/router.tsx`
- `AppShell` + `<Outlet />` in place
- `PageShell` wrapping every route
- `app/`, `ui/`, `lib/` layer boundaries established
- Storybook set up with coverage for shell, icons, and Home stories

No code change begins until Stage 5.

## Confirmed decisions this stage locks in (do not reopen in later stages)

| Concern | Decision |
|---|---|
| CSS / styling | **Tailwind utility classes only.** All new component work uses Tailwind. CSS class names in `styles.css` are legacy and must be removed as each page is rewritten. `styles.css` should reach zero non-reset rules by the end of Stage 7. |
| TanStack Query | Adopted per-page during rewrites (Stages 5–7), not as a separate pass. Each page rewrite wires its own data fetching. |
| TanStack Router | Fully adopted in Stage 3. Not touched in later stages unless a specific page rewrite requires a route schema fix. |
| Shared components | New components go to `ui/` (presentational, no domain knowledge) or `features/` (domain UI shared across routes). Route-specific layout and behavior stays in the route file. |
| Design reference | Home page visuals are the target aesthetic. Home code structure after Stage 5 is the target code pattern. |

## Page Status

### Rewritten (correct visuals, correct code)
*None yet.*

### Correct visuals, incorrect code (needs Tailwind + component extraction)
- **Home** (`siteSystem.tsx` + `/` route) — CSS-class based, needs full Tailwind rewrite with same visuals

### Fully legacy (needs full UI overhaul: visuals and code)
- **Card Search** (`SearchView.tsx`) — search input, results grid, sort controls, diagnostics panel, guide panel
- **Learn to Search** (`LearnToSearchView.tsx`) — tabbed guide, query chip examples, feature tables
- **Query Builder** (`QueryBuilderView.tsx`) — form-driven query construction UI
- **Card Detail** (`CardDetailView.tsx`) — single card display, attributes, pricing
- **Deck Explorer** (`DeckExplorerView.tsx`) — multi-section view (home, events, legends, deck detail)
- **Tier List** (`TierListView.tsx`) — drag-and-drop tier placement, card search panel
- **Sealed Simulator** (`SealedSimulator.tsx`) — pack opening, pool display, decklist controls
- **Trade Balancer** (`TradeBalancerView.tsx`) — card trade value matching

All legacy pages require a full visual redesign, not a translation of existing
styles. Each will be driven by a user-provided mockup before a concrete plan
is written.

## Per-Page Draft Plans

These are planning stubs only. Each must be converted into a full approved
stage plan before execution begins. The order below is the intended execution
order, but may be adjusted by the user.

---

### Home (`siteSystem.tsx` + `src/app/router.tsx` index route)

**Goal:** Same visuals, correct code. Tailwind throughout. Extract any
element that could reasonably appear on another page into `ui/`.

**Current state:** Working page with correct visual design, but implemented
with CSS class names resolving to `styles.css`. Contains inline SVG glyphs,
hero section, feature cards, promo cards, and an artwork showcase section.
Also contains `StorybookViewport` and `RouteSurfacePreview` components used
only in Storybook stories.

**Rewrite approach:**
1. Audit every element in `siteSystem.tsx` and classify:
   - **Extract to `ui/`**: presentational components with no Home-specific
     content (e.g. section heading, eyebrow label, arrow link card, empty
     state, loading state)
   - **Keep in `siteSystem.tsx`**: Home-specific layout, hero content, feature
     card data, promo card data
2. Rewrite each component in Tailwind; remove corresponding selectors from
   `styles.css` as they are replaced
3. Update Storybook stories to use the new component imports
4. Produce a written manifest of what is now in `ui/` and what remains
   Home-specific — this manifest is the component library starting point for
   all subsequent pages

**Iteration:** Visual comparison of before/after in Storybook and browser.
No mockup needed — match existing visuals exactly.

**Storybook requirement:** All extracted `ui/` components must have stories.
Home route assembly story must still render correctly.

---

### Card Search (`SearchView.tsx`)

**Goal:** Full visual redesign via mockup iteration, Tailwind throughout,
TanStack Query for data loading, shared components for card grid and results
controls.

**Current state:** Legacy CSS classes, `useEffect` data fetching for query
features. Renders a search form, diagnostic output, feature guide panel,
and a card grid with sort controls. Imports from `cardFormat.tsx`.

**Rewrite approach (to be finalized after mockup):**
- User provides a mockup image before the plan is written
- Agent reads current code and available `ui/` components (post-Stage 5)
- Draft plan identifies each visual region: new component, existing component,
  or justified page-specific element
- TanStack Query replaces the `loadQueryFeatures` `useEffect`
- Card grid and sort controls are strong candidates for shared `ui/` components
  if not already extracted during Home

**Iteration:** Mockup drives layout targets; visuals iterated with user before
plan is approved.

---

### Learn to Search (`LearnToSearchView.tsx`)

**Goal:** Full visual redesign, Tailwind, TanStack Query.

**Current state:** Tab navigation between Visual/Text/Syntax guide views,
query chip examples, collapsible feature tables. `useEffect` fetches query
feature data. Imports from `cardFormat.tsx` and `QueryChip`.

**Rewrite approach (to be finalized after mockup):**
- User provides mockup
- Tab pattern and collapsible table are candidates for `ui/` components
- `QueryChip` already lives in `ui/` — confirm it is Tailwind-based post-Stage 5

---

### Query Builder (`QueryBuilderView.tsx`)

**Goal:** Full visual redesign, Tailwind.

**Current state:** Form-driven query construction. 412 lines. Minimal data
fetching.

**Rewrite approach (to be finalized after mockup):**
- User provides mockup
- Form controls and chip outputs likely reuse components from Learn to Search
  rewrite

---

### Card Detail (`CardDetailView.tsx`)

**Goal:** Full visual redesign, Tailwind, TanStack Query for card fetch.

**Current state:** Fetches a single card by ID via `useEffect`. Renders card
image, attributes, and pricing. 372 lines. Imports from `cardFormat.tsx`.

**Rewrite approach (to be finalized after mockup):**
- User provides mockup
- Card attribute display is likely a `ui/` or `features/` component
- TanStack Query replaces the card fetch `useEffect`

---

### Deck Explorer (`DeckExplorerView.tsx`)

**Goal:** Full visual redesign, Tailwind.

**Current state:** 631 lines. Single component switching on a `section` prop
across home, events, legends, deck, and event-deck sub-views. Data is mostly
static from `manualData.ts`, one `useEffect` for card fetching.

**Rewrite approach (to be finalized after mockup):**
- User provides mockup for at least the home and event sub-views
- Consider whether the section-switch pattern should become separate route
  components or stay as a single component
- Navigation within deck explorer uses TanStack Router already

---

### Tier List (`TierListView.tsx`)

**Goal:** Full visual redesign, Tailwind. Drag-and-drop logic is retained as-is.

**Current state:** 733 lines. Complex drag-and-drop with pointer event
management via `useEffect`. One `useEffect` for card search data. The
interaction logic is correct and should not be rewritten, only re-skinned.

**Rewrite approach (to be finalized after mockup):**
- User provides mockup
- Drag-and-drop `useEffect` blocks are preserved intact; only the JSX and
  class names are replaced
- Tier lane and card slot components are candidates for extraction

---

### Sealed Simulator (`SealedSimulator.tsx`)

**Goal:** Full visual redesign, Tailwind.

**Current state:** 1185 lines, the largest page. Pack opening simulation,
pool display, decklist controls. Multiple `useEffect` blocks for DOM side
effects (pointer capture, cursor). One data-fetching `useEffect`.

**Rewrite approach (to be finalized after mockup):**
- User provides mockup — likely multiple mockup passes for different simulator states
- DOM side-effect `useEffect` blocks are preserved intact
- Pack card and pool grid components are strong extraction candidates
- Plan for this page should call out a scope boundary explicitly (what is NOT
  being changed) to protect the simulation logic

---

### Trade Balancer (`TradeBalancerView.tsx`)

**Goal:** Full visual redesign, Tailwind.

**Current state:** 787 lines. Card trade value matching with a two-panel layout.
One data-fetching `useEffect`.

**Rewrite approach (to be finalized after mockup):**
- User provides mockup
- Two-panel layout may reuse a `ui/` split-panel component if one is extracted
  earlier

---

## Key Changes in This Stage

### 1. Update the umbrella initiative plan

Historical file at the time:
`plans/todo/frontend-ui-architecture-alignment/2026-05-15-frontend-ui-architecture-alignment-initiative.md`

- Mark Stages 0–3 as complete in the Stage Overview section
- Update the Stage Overview to reflect the new Stage 4–7 structure
- Record Tailwind as the locked styling decision
- Remove the standalone TanStack Query stage (now folded into per-page rewrites)
- Add the following explicit note to the Target Architecture Contract section:

  > **`routes/` directory:** The architecture contract lists `routes/` as a
  > target layer, but route definitions live in `app/router.tsx` and will remain
  > there. The `routes/` directory will not be created. Agents must not move
  > route definitions out of `app/router.tsx`.

### 2. Replace old stage plan files

The old Stage 4 (TanStack Query) and Stage 5 (Rollout) draft files have been
replaced by this file and the new Stage 5, 6, and 7 files. No further action
needed here.

### 3. Install TanStack Query and wire the provider

This is the only code change in Stage 4. It is small and must be done before
Stage 5 begins so that every subsequent page-rewrite subagent can use
`useQuery` without also touching `App.tsx` or `package.json`.

- Install `@tanstack/react-query` as a production dependency
- Install `@tanstack/react-query-devtools` as a dev dependency
- Create `src/data/queryClient.ts` — instantiates and exports a `QueryClient`
  with sensible defaults (stale time, retry policy)
- Wrap `App.tsx` with `<QueryClientProvider client={queryClient}>` and mount
  `<ReactQueryDevtools />` inside it (dev only)
- Create `src/data/index.ts` as an empty barrel — this is the placeholder for
  query key factories and `queryOptions` that page rewrites will populate
- Run `npm run build` and `npm run test` to confirm nothing is broken

No query keys, no `useQuery` calls, no route loaders. Just the provider and
the skeleton `data/` directory.

### 4. Open question: Tailwind v4 token strategy

**Do not resolve this in code during Stage 4.** Present it to the user and
get a decision before Stage 5 begins.

**Background:** This project uses Tailwind v4 (`@tailwindcss/vite`). Tailwind
v4 does not use `tailwind.config.js`. Custom design tokens are defined via a
`@theme {}` block in CSS. The current `--color-*` custom properties in
`styles.css` are plain CSS variables defined in `:root` — they are NOT
Tailwind theme tokens. This means a component cannot reference them as
`text-primary`; it must use the arbitrary-value syntax `text-[var(--color-text-primary)]`.

**The two options:**

**Option A — Arbitrary values (no config change needed)**
Components write `text-[var(--color-text-primary)]`, `bg-[var(--color-surface-1)]`,
etc. directly. Works today with zero setup. Verbose, but explicit.

**Option B — `@theme` block (requires a CSS change)**
Add a `@theme {}` block to `styles.css` (or a new `theme.css` entry) that
maps the existing `--color-*` variables to Tailwind semantic names. Components
then write `text-primary`, `bg-surface-1`, etc. Cleaner, but requires
agreeing on the naming convention and verifying Storybook picks up the config.

The user must choose between these before Stage 5 writes any components.
Record the decision in the "Confirmed Stack Decisions" table of the umbrella
initiative plan and in Stage 5's "Confirmed decisions" table before Stage 5
execution begins.

## Exit Criteria

- Umbrella initiative plan updated: stages 0–3 marked complete, new stage
  structure recorded, `routes/` clarification added
- `@tanstack/react-query` installed; `QueryClientProvider` wired in `App.tsx`
- `src/data/queryClient.ts` and `src/data/index.ts` (empty barrel) created
- Build and tests pass
- Tailwind v4 token strategy presented to user; decision recorded before
  Stage 5 begins
- Per-page draft stubs present for all 8 legacy pages and Home (this file)

## Test Plan

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
