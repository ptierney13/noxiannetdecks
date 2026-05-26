# Plan: Card Search Results Pane

> Status: complete

## Summary

Build and evolve a shared `CardSearchResultsPane` path for surfaced card-search
results. The pane is the canonical owner of result fetching, result-local
controls, responsive grid composition, and card summary popup selection. Parents
own only the query source of truth.

The first live host was Query Builder, where the pane renders against the
builder's generated query. The `/cards` route now adopts the same pane directly
through `CardSearchView`, so future work should keep both hosts on the same
feature path instead of reintroducing a second search-results implementation.

## Implementation Note 2026-05-21

The first Query Builder integration pass exists. The `/cards` route now adopts
the same `CardSearchResultsPane` through `frontend/src/pages/CardSearchView.tsx`.

Implemented surfaces:

- `frontend/src/data/cards.ts`
- `frontend/src/lib/cardSearchResults.ts`
- `frontend/src/ui-elements/ResultCard.tsx`
- `frontend/src/pages/CardSearchView.tsx`
- `frontend/src/features/card-search/CardSearchResultsPane.tsx`
- `frontend/src/features/card-search/CardSearchResultsContent.tsx`
- `frontend/src/features/VariantSelectorRow.tsx`
- `frontend/src/features/card/CardSummaryPopup.tsx`

Container sizing values are centralized as top-of-file constants in
`CardSearchResultsContent.tsx`. The implementation uses explicit numeric
container-query thresholds (`640px`, `768px`, `1024px`, `1280px`, `1536px`)
rather than Tailwind named container breakpoints.

Validation status:

- `npm run build -w @noxiannet/frontend` passes.
- `npm run build-storybook -w @noxiannet/frontend` passes.
- Browser smoke test of the built `Features/CardSearchResultsPane` Storybook
  story passed, including opening the Card Summary Popup.
- `npm run test -w @noxiannet/frontend` still fails in legacy/stale areas not
  introduced by this implementation.
- `npm run test:storybook -w @noxiannet/frontend` still exits because its
  configured test include points at removed `src/storybook/` coverage.

## Key Changes

### 1. Build a query-driven feature component

Create `CardSearchResultsPane` as a `features/` component with this ownership:

- accepts a `query` prop from its parent
- owns fetching for that query through TanStack Query
- owns result-pane local interaction state such as sort, uniqueness mode,
  checkbox toggles, and selected preview state
- renders a presentational `ui/` composition below it

The parent owns only the query source of truth:

- `/cards` passes the route search param through `CardSearchView`
- Query Builder will pass the generated query string

The pane should not require pre-fetched result data from parents. That would
duplicate fetch, normalization, and loading/error-state logic in multiple
callers.

For now, selected preview state stays entirely inside `CardSearchResultsPane`.
No parent should own preview-selection state in this first pass. Clicking a
repeated result card should cause the pane to render `CardSummaryPopup`.

### 2. Establish the first canonical card-search data module

Create `frontend/src/data/cards.ts` as the canonical owner of card-search query
loading concerns.

It should contain:

- query-key definitions for card search
- query normalization helpers needed by card search
- API-query construction helpers such as `unique:id` normalization
- `queryOptions` or an equivalent shared query factory for card search
- the exported hook used by `CardSearchResultsPane`

The pane should consume a shared data-layer API such as
`useCardSearchResults(query)` rather than calling `searchCards()` directly.

### 3. Define the shared component boundaries

The new search-results implementation should use these layers:

**Feature components**

- `features/card-search/CardSearchResultsPane.tsx`
  - smart component
  - query-driven
  - local pane state
  - no route ownership
  - establishes the `@container` context on its root element; all
    container-query thresholds in child components respond to this pane's
    allocated width
  - barrel-exported from `features/index.ts`
- `features/card-search/CardSearchResultsContent.tsx`
  - internal composition for the card-search feature only
  - not exported from a barrel yet
  - owns the assembled controls + summary + diagnostics + grid layout inside
    the feature
  - requires a colocated Storybook story despite not being barrel-exported
- `features/VariantSelectorRow.tsx`
  - reusable product-aware variant-selection component
  - intentionally not nested under `card-search/`
  - owns construction of selectable variant options
  - exports a single row-level API
  - may keep a private `VariantOptionButton` helper in the same file initially
  - barrel-exported from `features/index.ts`

**UI components**

- `ui-elements/ResultCard.tsx`
  - one clickable repeated result card rendered in the grid
  - barrel-exported from `ui-elements/index.ts`

**Lib helpers**

- pure sorting helpers
- pure grouping helpers
- pure card-text/token rendering helpers that remain non-visual
- no React state
- no fetch logic

This split is intentional:

- `features/` owns domain-aware orchestration and selection behavior
- `ui-elements/` owns reusable presentation
- `data/` owns fetch/query concerns
- `lib/` owns pure helpers only

`ResultCard` does not need the phrase "presentational only" as a separate
policy line here. Its boundary is already defined by placement:

- `ui-elements/ResultCard.tsx` should not fetch
- it should not own route state
- it should receive prepared values and callbacks from its parent

### 4. Keep both live hosts on the same pane

The first pass used Query Builder as the low-risk host for inspecting the new
pane while the search-results boundaries settled. `/cards` has since adopted
the same `CardSearchResultsPane` directly through `CardSearchView`.

Future work should preserve this single feature path:

- Query Builder passes its debounced generated query string
- `/cards` passes its route search param
- `CardSearchResultsPane` owns the fetching, controls, grouping, selection, and
  popup behavior for both contexts

If the full-page `/cards` route needs extra framing later, add a thin page-level
wrapper above the pane rather than forking pane behavior.

### 5. Use explicit container-query values when mirroring viewport terminology

This plan must not conflate viewport breakpoints with Tailwind v4 named
container-query breakpoints.

The source-of-truth viewport values currently documented in Storybook are:

- `sm` zone boundary: `640px`
- `md` zone boundary: `768px`
- `lg` zone boundary: `1024px`
- `xl` zone boundary: `1280px`

These values are reflected in:

- `frontend/.storybook/preview.ts`
- `frontend/.storybook/VIEWPORTS.md`
- `frontend/AGENTS.md`
- `frontend/UI_ARCHITECTURE.md`

All user references in this Card Search work should be interpreted as
**viewport-value language**, not Tailwind named container-query scale language.
This feature must not use viewport queries at all. Its responsive behavior must
be driven entirely by container queries.

If the pane uses container queries, any threshold intended to match viewport
concepts such as "swap at medium" must use explicit pixel values like:

- `@[640px]:`
- `@[768px]:`
- `@[1024px]:`
- `@[1280px]:`

Do not use named container classes like `@md:` or `@lg:` when the intended
behavior references viewport-medium or viewport-large semantics. In Tailwind v4
those named container thresholds are numerically smaller and would be wrong for
this work.

Decide this now:

- the feature will use **explicit numeric container-query thresholds**
- those thresholds will correspond to the numeric values of the repo's viewport
  breakpoints
- the implementation should avoid sprinkling raw inline values throughout JSX

The preferred sources of truth are:

- global values added to `frontend/src/ui-foundation.css` only if they are
  genuinely shared design-system invariants beyond Card Search, or
- local top-of-file constants with human-readable comments that say what part
  of the UI each value controls

Do not use named container breakpoints as a semantic shorthand for these values.

### 6. Organize layout values as named constants, not scattered literals

Responsive thresholds and pane layout values should come from named constants
rather than duplicated inline numbers.

The implementation should define and centralize:

- the control-layout collapse threshold
- the card-grid column thresholds
- the pane horizontal padding values
- any card-summary-popup width or spacing values that are reused across
  components

These values should come from one of these two places only:

- global values added to `frontend/src/ui-foundation.css` if they are truly
  shared invariants across multiple frontend surfaces, or
- local top-of-file constants with non-technical-person readable comments that
  explain what in the UI each value affects

Do not repeat the same threshold literals across multiple files.

### 7. Match the agreed first-pass layout behavior

The new pane should support these UI decisions:

- controls are organized into two sections on the first row:
  - `SORT`
  - `VARIANTS`
- checkbox controls live on the next row by default
- when the pane is wide enough, the control area may collapse to a single row
- the card grid starts at a minimum of 2 columns
- the card grid scales up to 6 columns at very large widths
- the card grid should switch explicitly at the numeric equivalents of the
  viewport breakpoints:
  - 3 columns at `768px` (`md` equivalent)
  - 4 columns at `1024px` (`lg` equivalent)
  - 5 columns at `1280px` (`xl` equivalent)
  - 6 columns at `1536px` (`2xl` equivalent)
- the grid uses fixed `grid-cols-N` columns, not `auto-fill`; partial last
  rows are expected and intentional
- left and right padding must keep cards from touching the pane edge

In this plan, "xl-equivalent width" means the explicit numeric container width
that matches the viewport `xl` number (`1280px`), not a viewport media query
and not Tailwind's named `@xl:` container shorthand.

## Implementation Units

### Unit 1: Data ownership

Create the first card-search data module with:

- query-key factory
- query normalization/build helpers
- `useCardSearchResults(query)`

This unit establishes the "query in, data out" contract used by the pane.

### Unit 2: Feature shell

Create `CardSearchResultsPane` with a minimal initial prop contract such as:

```ts
type CardSearchResultsPaneProps = {
  query: string;
};
```

The pane should:

- call the shared data hook
- own sort / uniqueness / checkbox state
- own selected preview state
- transform raw query results into display-ready props for the UI layer
- open `CardSummaryPopup` when a `ResultCard` is clicked

`CardSummaryPopup` is implemented by the prerequisite popup work item
(`card-summary-popup-work-item.md`). That work item must be complete before
this unit can be finished.

### Unit 3: Card presentation

The `cardPresentation` extraction prerequisite for this unit is already
complete. `renderTokenizedText`, `normalizeCardText`, `formatCostText`,
`formatTypeline`, `domainChipClass`, `cardEnergy`, and their supporting
helpers and types have been migrated from `src/cardFormat.tsx` to
`src/lib/cardPresentation.tsx` and are available through the `lib/` barrel.

If a component in this unit requires something from `src/cardFormat.tsx` that
is not in `src/lib/` or another lib module, stop immediately and ask why it is
needed and whether it should be migrated or a different approach taken.

Create:

- `ResultCard`

These should be reusable within the new search-results path and future card
summary surfaces.

`renderTokenizedText` remains the main mechanism for card-text rendering rather
than introducing a separate text-preview UI abstraction.

### Unit 4: Variant selection

`VariantButtonRow` in `src/cardFormat.tsx` is the existing component this unit
replaces. Remove it from `cardFormat.tsx` and update any remaining call sites
to use `VariantSelectorRow` instead. This is a clean rewrite — do not carry
forward patterns from the legacy implementation.

Create `VariantSelectorRow` as a feature component with:

- option construction from cards + finishes
- active selection handling
- a row-level callback contract that returns the selected card/finish payload
- support for horizontal and vertical visual arrangements

If needed, keep a private `VariantOptionButton` helper in the same file so:

- row-level product logic stays centralized
- per-button rendering stays isolated
- no parent has to rebuild variant option data manually

### Unit 5: Presentational composition

Create `CardSearchResultsContent` inside `features/card-search/` to render:

- controls
- summary text
- diagnostics
- results grid
- empty/loading/error/success states as needed

This component should be free of fetch logic and route knowledge and should not
be exported for general reuse yet. It requires a colocated Storybook story
despite not being barrel-exported.

### Unit 6: Query Builder integration

Update Query Builder to render the shared pane on its right side while
preserving the existing builder behavior.

This integration should:

- pass a debounced form of `builtQuery` into `CardSearchResultsPane`
- preserve current builder controls
- keep Query Builder on the same results-pane feature path as `/cards`
- reuse the existing shared debounce utility in
  `frontend/src/lib/useDebounce.ts`
- use the current frontend typing-delay pattern rather than inventing a new
  ad-hoc timeout in Query Builder

## Open Questions

- Should the pane own its selected preview state internally for all contexts,
  or should later full-page adoption allow that state to be optionally lifted?

## Risks

- If data normalization remains partially in parents and partially in the pane,
  the two integrations will drift quickly.
- If variant-option construction is not centralized in `VariantSelectorRow`,
  parents will duplicate label/price/finish logic.
- If named container breakpoints are used where viewport-value language was
  intended, the pane will collapse or expand far too early in split layouts.
- If exact layout numbers are scattered across files, later tuning will become
  slow and error-prone.

## Test Plan

Before implementation is considered complete for this plan's first execution:

- add Storybook coverage for each new component that has inspectable state,
  including `CardSearchResultsContent` even though it is not barrel-exported
- run `npm run test -w @noxiannet/frontend`
- run `npm run build -w @noxiannet/frontend`
- run `npm run test:storybook -w @noxiannet/frontend`
- run `npm run build-storybook -w @noxiannet/frontend`
- manually inspect Query Builder with the pane rendered on the right side
- manually inspect `/cards` and confirm it uses the same pane behavior
- include a detailed completion note describing exactly how container sizing
  values were sourced, centralized, and applied in the implementation

Storybook review should explicitly verify:

- control layout at narrow and wide pane widths
- card-grid column progression from 2 upward
- horizontal padding at the pane edges
- variant-row behavior in each supported orientation
- clicking a `ResultCard` opens `CardSummaryPopup`

## Assumptions

- `CardSearchResultsPane` is the canonical owner of surfaced card-search
  results behavior for both `/cards` and Query Builder.
- Query Builder remains a useful host for inspecting generated-query behavior
  beside live results, while `/cards` is the full-page host.
- The current viewport values documented in Storybook remain the source of
  truth for user-facing breakpoint language during this work.
- `renderTokenizedText` remains the durable text-rendering mechanism for card
  summary surfaces.

## Completion Follow-Through

Completion of this initiative should include durable documentation updates that
clearly explain how container sizing values are handled going forward:

- how viewport-language breakpoint references are interpreted
- when explicit numeric container-query thresholds are required
- where shared versus local sizing invariants should live
