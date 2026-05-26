# Stage 6: cardFormat.tsx Analysis and Placement

> Status: in progress

## Summary

Stage 6 reads `cardFormat.tsx`, classifies each export, moves each piece to
the correct layer (`ui/`, `features/`, or `lib/`), and updates all import
sites. No visual changes, no behavioral changes. The goal is that
`cardFormat.tsx` no longer exists as a top-level file — its contents are
owned by the appropriate layer before any legacy page rewrite touches them.

This stage is analysis-first. The implementing agent must read and understand
the full file before moving anything, then present the classification to the
user for approval before executing the moves.

## Why this stage exists before page rewrites

Three of the heaviest legacy pages (`SearchView`, `CardDetailView`,
`DeckExplorerView`) import from `cardFormat.tsx`. If those pages are rewritten
while `cardFormat.tsx` is still a top-level file, each rewrite subagent will
make different assumptions about where that code should land — creating
conflicts. Resolving ownership once here prevents that drift.

## Implementation Note 2026-05-26

Most of `cardFormat.tsx` has already been dissolved:

- Card presentation functions (`renderTokenizedText`, `normalizeCardText`,
  `formatCostText`, `formatTypeline`, `domainChipClass`, `cardEnergy`, and
  helpers) moved to `src/lib/cardPresentation.tsx`.
- `CardQuickLookModal` was superseded by `features/card/CardSummaryPopup.tsx`.
  Legacy callers still exist; they are being retired as each page is rewritten
  in Stage 7.

What remains in `src/cardFormat.tsx` as of this note:

| Export | Type | Proposed destination | Reason |
|---|---|---|---|
| `PRICE_SERIES_COLORS` | const | `lib/priceData.ts` | Price palette constant; same module as other price data utilities |
| `PricePrintingGroup` | type | `lib/priceData.ts` | Natural sibling of `PublishedPriceRow` |
| `formatHeadlinePrice` | pure fn | `lib/priceData.ts` | Price formatting; same family as `formatUsdPrice` |
| `formatPriceOnly` | pure fn | `lib/priceData.ts` | Price formatting pure helper |
| `formatSeriesToggleLabel` | pure fn | `lib/priceData.ts` | Price series label helper |
| `formatSeriesLegendLabel` | pure fn | `lib/priceData.ts` | Price series label helper |
| `groupRowsByPrinting` | pure fn | `lib/priceData.ts` | Groups `PublishedPriceRow` arrays; sibling of `sortPriceRows` |
| `PriceHistoryChart` | React component | `features/card/PriceHistoryChart.tsx` | Price domain visualization; only used by `CardDetailView`; has internal `useState` |

Completion steps:

1. Add pure functions and types to `lib/priceData.ts`; export from `lib/index.ts`.
2. Create `features/card/PriceHistoryChart.tsx`; keep legacy CSS class references
   (`price-chart-*`) in place for now — these are removed when Card Detail is
   rewritten in Stage 7.
3. Update `CardDetailView` imports to use the new paths.
4. Delete `src/cardFormat.tsx`.

This cleanup should happen before or alongside the Card Detail Stage 7 rewrite.
`PriceHistoryChart` does not need a Storybook story at this stage; it gets one
as part of the Card Detail rewrite.

## What `cardFormat.tsx` currently contains (as of Stage 3)

Known exports (to be verified by the agent reading the file):
- `CardQuickLookModal` — modal overlay for a card quick-look
- `cardEnergy` — utility that reads energy from a card record
- `domainChipClass` — maps a domain string to a CSS class name
- `formatCostText` — formats a cost value for display
- `renderTokenizedText` — renders card text with inline symbols

One `useEffect` is present for modal behavior.

## Classification Guide

Use these rules to classify each export:

| If the export... | Place it in... |
|---|---|
| Is a React component with no domain knowledge (could appear in any product) | `ui/` |
| Is a React component with card/game domain knowledge, used by 2+ pages | `features/` |
| Is a React component only ever used by one page | Move it to that page's file or a co-located file |
| Is a pure function with no React/DOM dependencies | `lib/` |
| Is a pure function with card domain knowledge | `lib/` (domain knowledge is fine in lib for pure functions) or `features/` if it needs card types |

The agent must produce a classification table before moving anything:

```
Export         | Type     | Proposed location | Reason
---------------|----------|-------------------|-------
CardQuickLookModal | component | features/card/   | domain knowledge, used by 2+ pages
cardEnergy     | pure fn  | lib/              | no React, pure card record accessor
...
```

Present this table to the user and receive approval before executing moves.

## Key Changes

### 1. Read and classify

- Read `cardFormat.tsx` in full
- Classify every export using the guide above
- Note which pages import each export (check all import sites)
- Note the `useEffect` and any other side effects — these travel with the component that owns them
- Present the classification table; do not proceed until approved

### 2. Create destination files

- For `features/` destinations: create `features/<domain>/` directory with
  an `index.ts` barrel if it does not exist
- For `ui/` destinations: add to existing `ui/` structure with barrel export
- For `lib/` destinations: add to existing `lib/` structure with barrel export

### 3. Move each export

- Copy each export to its destination file
- Remove it from `cardFormat.tsx`
- Update all import sites across the codebase
- Do not change any logic, types, or behavior during the move

### 4. Delete `cardFormat.tsx`

Once empty (or containing only re-exports that have been updated), delete it.
If any imports remain after the move, the build will fail — use the build to
verify completeness.

### 5. Add Storybook coverage

- For any moved component that does not already have a story, add one covering
  its default and meaningful states
- Pure function moves do not need stories

### 6. Remove `styles.css` selectors

- `domainChipClass` currently maps domain names to CSS class names in
  `styles.css`. When this function is moved, evaluate whether it should be
  converted to return Tailwind classes instead, or whether the CSS selectors
  it references should be kept until the page rewrites remove them.
- Record the decision explicitly — do not silently leave orphaned selectors.

## Scope Guardrails

- Do not change the behavior or output of any moved function or component
- Do not rename exports (importing pages must not need to change their usage,
  only their import path)
- Do not touch any legacy page's JSX or styling — only update their import paths
- Do not add new functionality

## Test Plan

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend` — must pass with zero import errors
- `npm run build-storybook -w @noxiannet/frontend`
- Confirm `cardFormat.tsx` no longer exists (or is empty) after the stage
- Confirm all import sites reference the new locations

## Exit Criteria

- `cardFormat.tsx` deleted or empty
- Every former export lives in `ui/`, `features/`, or `lib/` with a barrel export
- All import sites updated to the new paths
- Build passes with zero errors
- Classification decision recorded in the completion message for reference
  by later page-rewrite stages
