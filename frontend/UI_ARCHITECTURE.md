# Frontend UI Architecture

This document is the durable source of truth for frontend architecture,
responsive design, and UI patterns. It is the detailed companion to
`frontend/AGENTS.md`.

## Migration Era Contract

The frontend is mid-migration toward a layered architecture with Tailwind
styling, TanStack Router, and TanStack Query. The full initiative plan lives in
`docs/work/frontend-ui-architecture-alignment/`.

During the migration, two sets of patterns coexist:

| Category | Pattern | Status |
| -------- | ------- | ------ |
| Styling | Tailwind utility classes on components | **Target — use for all new/migrated work** |
| Styling | `styles.css` selectors | Legacy — do not add; remove after migrating the matching component |
| Styling | `ui-foundation.css` | Stays as CSS custom property token declarations only |
| Routing | TanStack Router (`@tanstack/react-router`) | **Target — Stage 3+** |
| Routing | `parseAppRoute()` + `window.history` | Legacy — replaced in Stage 3 |
| Data | TanStack Query (`@tanstack/react-query`) | **Target — Stage 4+** |
| Data | `useEffect` waterfalls + `useState` | Legacy — replaced in Stage 4 |
| Structure | `app/`, `routes/`, `features/`, `ui/`, `data/`, `lib/` layers | **Target** |
| Structure | `App.tsx` monolith | Transitional — being reduced to providers + `<RouterProvider>` |

CSS migration protocol: write Tailwind on the component, confirm it renders
correctly, then delete the corresponding `styles.css` selector. Never leave
both active at the same time. Never add new `styles.css` rules.

## Core Philosophy

- Design mobile-first.
- Scale up from the smallest useful layout instead of shrinking a desktop layout down.
- Build shared systems before page-specific polish.
- Style with Tailwind utility classes; semantic CSS tokens (`ui-foundation.css`)
  supplement where values are shared across components.
- Treat Storybook as a first-class review environment, not an afterthought.

## Target Layer Structure

```
frontend/src/
  app/        — providers, app shell, top-level route mounting
  routes/     — TanStack Router route definitions, loaders, validateSearch schemas
  features/   — domain UI shared by more than one route
  ui/         — product-agnostic primitives (Tailwind, no API calls, no domain logic)
  data/       — TanStack Query keys, queryOptions definitions, API client
  lib/        — shared non-domain React utilities (useDebounce, formatters, etc.)
```

Import direction (one-way):

```
app → routes / features / ui / data / lib
routes → features / ui / data / lib
features → ui / data / lib
ui → lib
data → lib
lib → (nothing in this repo)
```

Each layer exposes a barrel `index.ts`. Consumers import from the barrel, not
from internal files.

**Where does X go?**

- New button or input primitive → `ui/`
- New card-domain component used by multiple routes → `features/`
- New card-domain component used only by one route → keep in the route file
- New API call or query definition → `data/`
- New non-domain hook or utility → `lib/`
- New page route → `routes/`

## Shared Design System

Semantic tokens are defined as CSS custom properties in `ui-foundation.css`.
They represent shared visual decisions and should be referenced in Tailwind
classes via `var(--token-name)` where needed.

Examples of token-backed decisions:

- accent gradients
- button treatments
- border strengths
- hover emphasis
- surface hierarchy
- text color roles

Promote a value to a CSS custom property in `ui-foundation.css` if it
represents a shared design decision used in more than one component.

Do not introduce new raw colors or shadows directly in feature files if the
value is reusable. Do not add utility selectors to `ui-foundation.css`.
`styles.css` must not receive any new rules.

## Responsive Model

### Mobile First

Base styles target narrow screens. Larger-screen behavior is layered on
progressively using the standard expansion breakpoints:

- `640px`
- `768px`
- `1024px`
- `1280px`

### Container Queries For Component-Level Adaptation

Use `@container` for components that respond to their own containing surface:

- cards
- hero content blocks
- search panels
- shared promotional surfaces
- modular layout groups

Components should respond to the width of their containing surface, not assume
the full browser viewport is the layout signal. This ensures correct behavior in
Storybook canvases, embedded layouts, and future split-pane or dashboard contexts.

**Tailwind v4 container query scale gotcha:** Named container breakpoints
(`@sm:`, `@md:`, `@lg:`, `@xl:`) use a compact scale designed for component
containers — they are **not** equivalent to viewport breakpoints of the same
name:

| Class | Type | Fires at |
|---|---|---|
| `lg:` | Viewport media query | 1024px |
| `@lg:` | Container query | ~512px (32rem) |

Use explicit pixel values when you need a container query to fire at a specific
threshold: `@[420px]:`, `@[640px]:`, `@[1024px]:`. Reserve named container
breakpoints (`@sm:`, `@lg:`) only when the compact scale is intentionally
appropriate (e.g. a card that adapts at ~512px wide).

### Viewport Queries For Shell-Level Changes

Reserve viewport media queries (`sm:`, `lg:`, `xl:`) for true app-shell
behavior that depends on actual browser window width:

- showing or hiding the inline nav vs. hamburger
- revealing or hiding the wordmark
- changing global page framing

**Shell components (header, nav) use viewport breakpoints**, not container
queries. Storybook shell stories use `parameters.viewport.defaultViewport` to
resize the iframe, which makes viewport queries reflect the intended width
accurately. See `.storybook/VIEWPORTS.md` for canonical viewport keys and the
full rationale.

Do not use container queries for shell nav breakpoints. If you are unsure which
to use, ask: is this component always full-viewport-width? If yes, use viewport
queries and set `parameters.viewport` in the story.

## Navigation Architecture

Navigation is authored mobile-first and expanded upward. There is **no separate
mobile implementation** — a single template scales from the narrowest screen to
the widest using viewport breakpoints. Elements appear, animate, or change
behavior at `sm` (640px), `lg` (1024px), and `xl` (1280px).

The reference implementation is `AppHeader.tsx`:
- Below `sm` (640px): full-width fixed hamburger dropdown with backdrop overlay.
- At `sm`–`lg` (640–1024px): hamburger dropdown switches to compact absolute, backdrop hidden.
- At `lg`+ (1024px+): inline nav expands, hamburger collapses (crossfade via `max-w`/`opacity`).
- At `xl`+ (1280px+): wordmark slides in.

### Navigation Interaction Requirements

- minimum `44px` touch target height on mobile
- no hover-only critical behavior; provide tap/click equivalents
- enough spacing for imprecise input

## Homepage And Hero Rules

Primary CTA is the hero search area and the content stack immediately above it.

On mobile, above the fold must prioritize only:
- the hero headline/brand stack
- the primary search CTA

Additional guidance:
- hero layouts start centered on small screens
- scaling between breakpoints should be continuous and mathematically close on
  either side of a transition
- lower content such as feature cards may remain left-aligned even when hero
  copy is centered

## Storybook Expectations

Storybook is the primary UI review harness.

| Surface | Coverage required |
| ------- | ----------------- |
| Exported `ui/` component | Yes |
| Exported `features/` component | Yes |
| Route-shell and feature states the user should inspect | Yes |
| Tiny private leaf helper with no meaningful inspectable state | No |

Stories must cover: default, loading, empty, and error states where applicable.
Use `@storybook/test` play functions for meaningful interaction states.

**Completion notes must list the Storybook story paths to open for inspection.**

### Story Structure

**Stories are colocated with the file they test.** A story for
`src/ui/FeatureCard.tsx` lives at `src/ui/FeatureCard.stories.tsx`. A story
for `src/home.tsx` lives at `src/home.stories.tsx`. There is no `src/storybook/`
directory — do not create one.

- Prefer focused stories for individual reusable primitives.
- Build route-level stories from shared components so Storybook supports both
  isolated and assembled review.

### Responsive Behavior In Storybook

- Components must render correctly when the Storybook canvas is resized.
- Component responsiveness must not depend on global window size unless the
  behavior is truly shell-level.
- After major CSS architecture changes, restart the Storybook server fresh
  instead of assuming hot reload applied correctly.

### Storybook-Only Mocking

When a story includes navigation or controls that would leave Storybook:
- mock the interaction in Storybook
- keep the user inside the story
- preserve visual and behavioral review value without requiring real routing

## Component Design Preferences

- Single-column and stacked on mobile first.
- Expand to two-column and three-column patterns only when the container has
  enough room.
- Do not remove important explanatory content at intermediate widths unless
  that simplification is deliberate and still reads well.
- Decorative UI that is not essential should be hidden or reduced on mobile.

## Implementation Workflow

When doing UI overhaul work:

1. Update the design tokens and shared primitives first.
2. Build or revise the shared shell and foundational responsive patterns.
3. Rework one flagship route using the new system.
4. Extract stable reusable patterns into shared stories.
5. Roll the system out across the rest of the site incrementally.

Avoid mixing broad visual architecture work with unrelated product logic unless
explicitly requested.

## Verification Checklist

For meaningful UI changes, run:

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
- `npm run test:storybook -w @noxiannet/frontend`
- `npm run build-storybook -w @noxiannet/frontend`

Manual review should confirm:

- mobile-first rendering looks intentional at narrow widths
- component layouts respond correctly to Storybook canvas resizing
- primary CTAs remain visible without scrolling where required
- desktop and mobile navigation both feel purpose-built
- tap targets remain large enough on mobile

---

## Architecture Inventory (as of 2026-05-15)

This section documents the current state of the frontend for use by Stage 2+
agents. Update it as migrations complete.

### Current File Map

| File | Lines | Status | Stage 2+ destination |
| ---- | ----- | ------ | -------------------- |
| `App.tsx` | 3,116 | Monolith — routing, nav state, all views | Reduce to providers + `<AppShell>` + `<RouteRenderer>` in Stage 2; `<RouterProvider>` in Stage 3 |
| `routes.ts` | 180 | Hand-rolled router + URL builders | Replaced by TanStack Router route files in Stage 3; delete after |
| `api.ts` | — | Raw fetch API client | Move to `data/api.ts` in Stage 4 |
| `useDebounce.ts` | — | Debounce hook | Move to `lib/useDebounce.ts` in Stage 2 |
| ~~`headerLayout.ts`~~ | — | Deleted — replaced by container-query CSS | — |
| `priceData.ts` | — | Price formatting utilities | Move to `lib/priceData.ts` in Stage 2 |
| `types.ts` | — | Type re-exports from card-store | Stays or distributes per consuming layer |
| `QueryChip.tsx` | — | Query syntax chip/button — shared | Move to `ui/QueryChip.tsx` in Stage 2 |
| `LtsDetailOverlay.tsx` | — | Learn-to-search detail overlay | Move to `ui/` or `features/` in Stage 2 |
| `siteSystem.tsx` | — | Homepage components | Route module in Stage 3; shared parts to `features/` |
| `CardSearchGuide.tsx` | — | Visual card search guide | Move to `features/` (used only by search route) |
| `CardSearchGuideImageOverlay.tsx` | — | Search guide image overlay | Move to `features/` with CardSearchGuide |
| `DeckExplorerView.tsx` | — | Deck explorer page | Move to `routes/` in Stage 3 |
| `QueryBuilderView.tsx` | — | Query builder page | Move to `routes/` in Stage 3 |
| `TierListView.tsx` | — | Tier list tool | Move to `routes/` in Stage 3 |
| `TradeBalancerView.tsx` | — | Trade balancer tool | Move to `routes/` in Stage 3 |
| `deck-explorer/manualData.ts` | — | Static deck data | Move to `data/` in Stage 4 |
| `styles.css` | 5,931 | Legacy CSS — shrinking to zero | Delete selectors as components migrate to Tailwind |
| `ui-foundation.css` | 184 | CSS custom property tokens | Keep as token file; no utility selectors |

### Monolith Hotspots

**`App.tsx` (3,116 lines)** owns too much:

- Route parsing and navigation dispatch (`parseAppRoute`, `navigate`, popstate listener)
- 25+ `useState` hooks covering nav menus, header shell mode, search state, sealed pool tool state, quick-look state
- Desktop header (full/compact/search stages), mobile header, all nav menus
- Inline SVG icon components
- Direct rendering of all 17 route kinds

Stage 2's primary job is to reduce this to: providers + `<AppShell>` + `<RouteRenderer route={currentRoute} />`.

**`styles.css` (5,931 lines)** covers every route and shared pattern. During
migration, it shrinks as each component adopts Tailwind. Never add rules to it.

**`App.test.tsx`** is a monolith test. It uses `window.history.pushState` for
route navigation testing and will need to be split into co-located test files
once components are extracted. Stage 5 disbands it.

### CSS Selector → Component Map (Stage 2 migration guide)

These are the primary CSS sections in `styles.css` and the components that own them.
When a component is migrated to Tailwind, delete its corresponding section.

| styles.css section | Owning component | Stage |
| ------------------ | ---------------- | ----- |
| `.site-header`, `.site-nav`, header stages | AppShell header (to be extracted) | 2 |
| `.view-tabs`, `.view-tabs button` | Tab controls (to be extracted to `ui/`) | 2 |
| `.search-panel`, card search inputs | SearchView inner components | 2–5 |
| `.learn-to-search-view`, LTS tabs/fields | LearnToSearchView, CardSearchGuide | 2–5 |
| `.card-grid`, card layout | CardGrid (currently inline in App.tsx) | 2–5 |
| `.card-quick-look`, modal overlay | CardQuickLookModal (inline in App.tsx) | 2–5 |
| `.price-chart`, tooltip | Price chart component (inline in App.tsx) | 4–5 |
| `.card-detail`, printings, attributes | CardDetailView (inline in App.tsx) | 2–5 |
| Deck explorer selectors | DeckExplorerView | 3–5 |
| Sealed pool selectors | SealedPoolView (inline in App.tsx) | 2–5 |
| Tier list selectors | TierListView | 3–5 |
| Trade balancer selectors | TradeBalancerView | 3–5 |
| Domain color variants | Shared Tailwind tokens / `ui-foundation.css` | 2–5 |
| Rarity color variants | Shared Tailwind tokens / `ui-foundation.css` | 2–5 |

### Storybook Coverage Gaps

Current stories (colocated with their source files):

| Story file | What it covers |
| ---------- | -------------- |
| `src/app/AppHeader.stories.tsx` | Header — Mobile, DesktopSmall, NavItemsEdge, Desktop, DesktopWide |
| `src/pages/home.stories.tsx` | Home page — Mobile, Desktop |
| `src/App.stories.tsx` | Full app shell |
| `src/ui-elements/MenuItem.stories.tsx` | MenuItem — inline and menu variants |
| `src/ui-elements/Menu.stories.tsx` | Menu component |
| `src/ui-elements/CardSearchInput.stories.tsx` | CardSearchInput — empty, filled, narrow, wide |

See `.storybook/VIEWPORTS.md` for the canonical viewport keys, width values,
and guidance on viewport vs. container query usage in stories.

Missing coverage (required before stage completion):

- `QueryChip` — default, disabled, interactive states
- `LtsDetailOverlay` — open/closed, content variants
- `CardSearchGuide` — default, expanded states
- AppShell and header — desktop/mobile, shell modes
- Navigation menus — open/closed states
- Shared empty, loading, error states
- Route-level assemblies for each of the 17 route kinds (at minimum the
  primary routes: cards, deck-explorer-home, tools-tier-list, etc.)
- All data states (loading, empty, error, success) once TanStack Query is wired

### Stage-by-Stage Exit Criteria

**Stage 2 exit (shell + shared UI extraction):**

- `App.tsx` owns only: provider wrappers, `<AppShell>`, and `<RouteRenderer route={currentRoute} />`
- Shell, header, and navigation are extracted into `app/` and `ui/`
- `QueryChip`, `LtsDetailOverlay`, `useDebounce`, `headerLayout`, `priceData` are extracted to their target layers
- Every extracted shared component has Storybook stories covering default, loading, empty, and error states
- No new rules added to `styles.css`; header and shell selectors are migrated to Tailwind and deleted from `styles.css`
- Tests for extracted components are co-located

**Stage 3 exit (TanStack Router):**

- Zero `window.history.pushState` / `replaceState` calls in non-test code
- Zero direct `window.location.search` / `URLSearchParams` reads in route, feature, or app code
- All 17 route kinds are TanStack Router route objects under `routes/`
- `routes.ts` and `parseAppRoute()` are deleted
- All search param schemas use `validateSearch`
- Route loader stubs are in place

**Stage 4 exit (TanStack Query):**

- Zero bare `useEffect` data-fetching patterns in route, feature, or app code
- Route loaders call `queryClient.ensureQueryData()` for each route's primary data
- All components that previously fetched via `useEffect` now use `useQuery()`
- Query key factories and `queryOptions` live under `data/` and are barrel-exported
- Loading, empty, and error states use shared `ui/` components consistently

**Stage 5 exit (rollout + cleanup — initiative done):**

- `App.tsx` owns only provider wrappers and `<RouterProvider>`
- All route entrypoints are TanStack Router route objects under `routes/`
- `styles.css` is empty or deleted
- `App.test.tsx` is disbanded; tests are co-located
- Shared UI discoverable under `ui/` with barrel exports and Storybook coverage
- Shared domain UI discoverable under `features/` with Storybook coverage
- Shared data helpers discoverable under `data/` with barrel exports
- Docs reflect the final boundaries

### Known Router/Fetching Seams (for Stage 3 and Stage 4)

**window.history seams (Stage 3 targets):**

- `App.tsx:2786` — `window.history.pushState({}, "", fullPath)` inside `navigate()`
- `App.tsx:2710` — `window.addEventListener("popstate", handlePopState)`

**useEffect data-fetching seams (Stage 4 targets):**

- `App.tsx` — `searchCards()` query (search view), `loadQueryFeatures()` (learn-to-search)
- `DeckExplorerView.tsx` — data loading
- `TierListView.tsx` — data loading
- `TradeBalancerView.tsx` — data loading
