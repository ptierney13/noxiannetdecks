# Plan: Card Detail Tailwind Rewrite

> Status: plan
> Initiative: Stage 7 — Page-by-Page UI Rewrites

## Summary

Migrate `CardDetailView` out of `pages/legacy/` by rewriting all `card-detail-*`,
`card-attr-*`, `price-*`, and `price-chart-*` CSS class usage to Tailwind utility
classes. The page's data-loading logic is migrated to TanStack Query at the same
time. Visual layout and spacing may improve during the rewrite; no mockup is
required for this pass.

This plan also completes Stage 6 (`cardFormat.tsx` dissolution) as Unit 0, since
`CardDetailView` is the sole remaining importer of `cardFormat.tsx` and the cleanup
is a prerequisite for clean imports in the new page file.

## Current State

| Aspect | Current |
|---|---|
| File | `frontend/src/pages/legacy/CardDetailView.tsx` (372 lines) |
| Router import | `app/router.tsx` |
| CSS | `card-detail-*`, `card-attr-*`, `price-toggle-*`, `price-panel-*`, `price-chart-*` in `styles.css` (lines 2179–~2733, ~555 lines) |
| Data fetching | Two `useEffect` calls: card lookup + printings lookup |
| TanStack Query | Not wired |
| PriceHistoryChart | Imported from `../../cardFormat` |

### What the page currently does

- Loads a single card by `cardId` route param and its sibling printings
- Displays: card image, printings selector, name + headline price, typeline,
  attributes (Cost/Might/Domain), rich text, flavour text, facts table,
  JSON + TCGPlayer buy links, and a pricing panel with toggle buttons and
  an SVG price-history chart
- `usePublishedPriceIndex` (lib hook) provides the price index; this hook is
  **not** being migrated to TanStack Query in this pass — it is a lib-level
  hook that manages static JSON loading and is shared across pages
- The `PriceHistoryChart` component renders an SVG chart driven by
  `selectedPriceRowIds` state

### What needs to change

- Every `className="card-detail-*"`, `card-attr-*`, `price-*` attribute in JSX
- Remove `cardFormat.tsx` import; use new destination paths (from Unit 0)
- Replace `useEffect` card-loading with `useQuery(cardDetailQueryOptions(cardId))`
- Replace `useEffect` printings-loading with `useQuery(cardPrintingsQueryOptions(...))`
- ~555 lines of CSS to delete from `styles.css`

## Key Design Decisions

### Two-column layout

The current `card-detail-layout` splits image column from info column. Migrated
layout uses `grid grid-cols-1 lg:grid-cols-[minmax(0,_1fr)_minmax(0,_1.5fr)]` (or
similar) — responsive single-column on mobile, side-by-side at `1024px` and above.
Exact column ratio can be tuned during the rewrite.

### Printings list

The current `card-detail-version-bar` rows are a simple list of linked/active
printing variants. In Tailwind: a stacked border-separated list with a highlighted
active entry. Keep the set ID, label, and price columns as-is.

### Attributes section

The current `card-attr-block` + `card-attr-label` + `card-attr-value` pattern maps
directly to a label/value pair. Use `dl`/`dt`/`dd` or a flex-row grid. Symbols and
cost rendering (`renderTokenizedText`) stay unchanged.

### Facts table

The current `card-fact-row` pattern is a two-column label/value row inside
`card-detail-facts`. In Tailwind: a `divide-y` list or `dl` grid.

### Price toggle buttons

The current `price-toggle-button` / `price-toggle-button--selected` pattern maps
to the same generic accent highlight pattern used for QB chips:

```tsx
const isSelected = selectedPriceRowIds.includes(row.rowId);
<button
  className={[
    "inline-flex items-center gap-1 px-2.5 py-1 rounded border text-sm transition-colors",
    isSelected
      ? "bg-accent-soft border-accent text-text-primary"
      : "bg-surface-2 border-border-subtle text-text-secondary hover:bg-surface-3",
  ].join(" ")}
>
```

### `PriceHistoryChart` Tailwind migration

`PriceHistoryChart` uses legacy CSS classes for its SVG frame, legend, gridlines,
axis labels, and tooltip. During this rewrite, migrate those classes to Tailwind
(where inline SVG supports it) or to inline styles for the SVG geometry. The SVG
`<rect>`, `<polyline>`, `<circle>`, and `<text>` elements can use `className` with
Tailwind color/fill utilities or explicit inline `fill`/`stroke` for colors that
must be dynamic (the chart series colors are runtime values from `PRICE_SERIES_COLORS`
and remain inline styles).

Migrate `price-chart-legend`, `price-chart-legend-item`, `price-chart-legend-swatch`
to Tailwind flex classes. Migrate `price-chart-empty` to a Tailwind text/surface
treatment. SVG element classes (`price-chart-frame`, `price-chart-gridline`,
`price-chart-axis-label`, `price-chart-tooltip-bg`, `price-chart-tooltip-text`) use
Tailwind stroke/fill utilities where possible; static colors may use `var(--color-*)` tokens.

### TanStack Query

Add two `queryOptions` to `data/cards.ts`:

```ts
// card by ID
export const cardKeys = {
  ...existing keys,
  detail: (cardId: string) => ["cards", "detail", cardId] as const,
  printings: (query: string) => ["cards", "printings", query] as const,
};

export const cardDetailQueryOptions = (cardId: string) => queryOptions({
  queryKey: cardKeys.detail(cardId),
  queryFn: () => getCard(cardId),
});

export const cardPrintingsQueryOptions = (query: string) => queryOptions({
  queryKey: cardKeys.printings(query),
  queryFn: () => searchCards(query),
  enabled: Boolean(query),
});
```

The new page uses `useQuery(cardDetailQueryOptions(cardId))`. Handle `isPending`
with a loading state and `isError` with `useAppError` (existing pattern).

The printings query is derived from the loaded card: once `cardDetailQueryOptions`
resolves, derive the printings query string and pass to `cardPrintingsQueryOptions`.
Use `useQuery` with `enabled: Boolean(printingsQuery)`.

### `usePublishedPriceIndex` stays as lib hook

`usePublishedPriceIndex` uses an internal `useEffect` for static JSON loading. It
is shared across multiple pages and is **not** being migrated to TanStack Query in
this pass. Its usage in `CardDetailView` remains unchanged.

## Implementation Units

### Unit 0 — Stage 6 completion: dissolve `cardFormat.tsx`

Complete the Stage 6 cleanup before writing the new page file so imports are clean.

1. Add to `lib/priceData.ts`:
   - `PRICE_SERIES_COLORS` const
   - `PricePrintingGroup` type
   - `formatHeadlinePrice`, `formatPriceOnly`, `formatSeriesToggleLabel`,
     `formatSeriesLegendLabel`, `groupRowsByPrinting` functions
2. Export the new additions from `lib/index.ts`.
3. Create `features/card/PriceHistoryChart.tsx`:
   - Move `PriceHistoryChart` component verbatim from `cardFormat.tsx`
   - Keep legacy CSS class references intact for now (removed in Unit 3)
   - No Storybook story yet (added in Unit 5)
4. Delete `src/cardFormat.tsx`.

Verify with `npm run build -w @noxiannet/frontend` before proceeding to Unit 1.

### Unit 1 — TanStack Query wiring in `data/cards.ts`

Add `cardDetailQueryOptions` and `cardPrintingsQueryOptions` (and their key
factory entries) to `frontend/src/data/cards.ts`. Export from `data/index.ts`.

### Unit 2 — Create `pages/CardDetailView.tsx`

Write the new file as a Tailwind rewrite of the legacy version:

- All `card-detail-*`, `card-attr-*`, `price-*` class references → Tailwind
- Import `PriceHistoryChart` from `../../features/card/PriceHistoryChart`
- Import price helpers (`PRICE_SERIES_COLORS`, `formatHeadlinePrice`, etc.) from `../../lib`
- `useQuery(cardDetailQueryOptions(cardId))` replaces the card `useEffect`
- `useQuery(cardPrintingsQueryOptions(printingsQuery))` replaces the printings `useEffect`
- Preserve all existing behavior: printings selector, attribute chips, buy links,
  pricing panel toggle, chart rendering

CSS token mapping reference:

| Legacy CSS var | Tailwind token / class |
|---|---|
| `var(--surface)` | `bg-surface-1` |
| `var(--surface-2)` | `bg-surface-2` |
| `var(--border-strong)` | `border-border-strong` |
| `var(--border)` | `border-border-subtle` |
| `var(--text)` | `text-text-secondary` |
| `var(--text-strong)` | `text-text-primary` |
| `var(--text-muted)` | `text-text-tertiary` |
| `var(--amber)` | `text-accent-warm` |
| `var(--red)` | `text-accent` / `bg-accent` |
| `var(--color-accent-soft)` | `bg-accent-soft` |
| `var(--color-accent)` | `border-accent` |

### Unit 3 — Migrate `PriceHistoryChart` to Tailwind

Update `features/card/PriceHistoryChart.tsx` to replace all `price-chart-*` CSS
classes with Tailwind utility classes. Keep runtime series colors (`entry.color`,
`PRICE_SERIES_COLORS`) as inline styles — they are computed at runtime and must
stay as `style` attributes.

### Unit 4 — Update router

In `frontend/src/app/router.tsx`: change the `CardDetailView` import path from
`../pages/legacy/CardDetailView` to `../pages/CardDetailView`.

### Unit 5 — Delete legacy CSS

Remove from `frontend/src/styles.css`:
- The entire `/* ── CARD DETAIL PAGE ── */` section (lines ~2179–~2733, ~555 lines)
  including all `card-detail-*`, `card-attr-*`, `price-toggle-*`, `price-panel-*`,
  `price-chart-*` selectors

### Unit 6 — Delete legacy file

Delete `frontend/src/pages/legacy/CardDetailView.tsx`.

### Unit 7 — Storybook story

Create `frontend/src/pages/CardDetailView.stories.tsx` and
`frontend/src/features/card/PriceHistoryChart.stories.tsx`.

Required `CardDetailView` stories:

| Story | What it shows |
|---|---|
| `Loading` | Loading state before card resolves |
| `Default` | Loaded card with no price data |
| `WithPriceData` | Card with pricing panel visible and toggleable rows |
| `WithPrintings` | Card with multiple printings in the sidebar list |

Required `PriceHistoryChart` stories:

| Story | What it shows |
|---|---|
| `Default` | Chart with two series over several dates |
| `Empty` | No data / empty state message |
| `SinglePoint` | One data point (verify no polyline rendered) |

### Unit 8 — Remove orphaned Deck Explorer CSS

While in `styles.css`: remove the `/* ── DECK EXPLORER ── */` section
(lines ~1415–~1706, ~291 lines). `DeckExplorerView.tsx` is already Tailwind and
no longer references these selectors.

## Visual Region → Approach Table

| Visual region | Approach | Rationale |
|---|---|---|
| Page container | Tailwind page shell | `PageShell` already wraps via router; inner spacing uses Tailwind |
| Breadcrumb nav | Tailwind flex row | Simple `← Card Search` text button |
| Two-column layout | `grid grid-cols-1 lg:grid-cols-[...]` | Responsive single→two column at `1024px` |
| Card image | Tailwind img classes; `missing-image` fallback inlined | |
| Printings list | Border-divided stack; active item uses accent highlight | |
| Name + price headline | Flex row with wrapping | |
| Typeline | `text-text-secondary text-sm` | |
| Attribute block (Cost/Might/Domain) | Flex label/value pairs | `renderTokenizedText` symbols unchanged |
| Rich text / flavour text | Tailwind prose treatment | `renderTokenizedText` unchanged |
| Facts table | `dl`/`dt`/`dd` or flex grid with dividers | |
| Links section | Flex row of `text-button`-style links | |
| Pricing panel heading | Compact `h2` with Tailwind | |
| Price toggle buttons | Generic accent chip pattern (same as QB chips) | |
| `PriceHistoryChart` | SVG stays; legend and tooltip use Tailwind; series colors stay inline | |

## New Shared Components

No new shared components are proposed for this rewrite. `PriceHistoryChart` moves
to `features/card/` but is not barrel-exported for now — it is page-specific until
a second page has a clear reuse need.

## styles.css Drawdown

After Unit 5 and Unit 8:
- ~555 lines removed for `/* ── CARD DETAIL PAGE ── */`
- ~291 lines removed for `/* ── DECK EXPLORER ── */`
- **~846 lines total** removed from `styles.css`

## Test Plan

1. `npm run build -w @noxiannet/frontend` — must pass after Unit 0 and after Unit 4
2. `npm run build-storybook -w @noxiannet/frontend` — must pass
3. `npm run test -w @noxiannet/frontend` — pre-existing failures acceptable; no new failures
4. Browser smoke test: navigate to a card detail page; confirm image, attributes,
   facts, pricing panel, chart, and TCGPlayer links all render; confirm printings
   selector switches the active card; confirm chart series toggle works

## Completion Criteria

- `src/cardFormat.tsx` deleted
- `pages/legacy/CardDetailView.tsx` deleted
- `pages/CardDetailView.tsx` exists with no `card-detail-*`, `card-attr-*`, or `price-*` class names
- `features/card/PriceHistoryChart.tsx` exists with no `price-chart-*` class names
- `app/router.tsx` imports from the new path
- `data/cards.ts` has `cardDetailQueryOptions` and `cardPrintingsQueryOptions`
- `lib/priceData.ts` exports `PRICE_SERIES_COLORS`, `PricePrintingGroup`, `formatHeadlinePrice`, `formatPriceOnly`, `formatSeriesToggleLabel`, `formatSeriesLegendLabel`, `groupRowsByPrinting`
- The `/* ── CARD DETAIL PAGE ── */` and `/* ── DECK EXPLORER ── */` sections are gone from `styles.css`
- Storybook stories exist for `CardDetailView` and `PriceHistoryChart`
- Build and Storybook build pass
- Completion note names all changed files and cites Storybook story paths

## Assumptions

- `usePublishedPriceIndex` remains a lib hook; its internal `useEffect` is not
  converted to TanStack Query in this pass.
- The existing `features/card/CardSummaryPopup.tsx` pattern (barrel-exported) is
  the model for placing `PriceHistoryChart` in `features/card/`.
- The two-column layout ratio can be tuned visually during the rewrite without
  requiring a separate mockup review.
