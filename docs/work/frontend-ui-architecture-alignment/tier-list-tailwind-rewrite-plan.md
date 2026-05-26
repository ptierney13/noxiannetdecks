# Plan: Tier List Tailwind Rewrite

> Status: plan
> Initiative: Stage 7 — Page-by-Page UI Rewrites

## Summary

Migrate `TierListView` out of `pages/legacy/` by rewriting all `tier-*`,
`search-panel`, `section-heading`, and related CSS class usage to Tailwind utility
classes. The page's data-fetching logic is migrated to TanStack Query at the same
time. Visual layout and spacing may improve during the rewrite; no mockup is
required for this pass.

The drag-and-drop logic (pointer capture, slot resolution, placement state) is
architecturally correct and must be preserved exactly. This rewrite is a CSS
migration, not a behavioral redesign.

## Current State

| Aspect | Current |
|---|---|
| File | `frontend/src/pages/legacy/TierListView.tsx` (733 lines) |
| Router import | `app/router.tsx` |
| CSS | `tier-*`, `search-panel`, `section-heading`, `diagnostics` in `styles.css` (~lines 984–1415, ~431 lines) |
| Data fetching | One `useEffect`-style async call (`generateTierList` handler) via `searchCards` |
| TanStack Query | Not wired for background card loading |
| External imports | `searchCards` from `../../api`; `useAppError` from `../../app/ErrorContext`; no `cardFormat` imports |

### What the page currently does

- Search panel with query input; user submits to generate a card pool
- Drag-and-drop tier editor: pointer-capture-based dragging, `resolveDropTarget`
  slot resolution, `TierLaneView` for each tier row and the unranked pool
- Tier rows have editable labels, per-row accent colors via inline CSS vars
  (`--tier-accent`, `--tier-accent-soft`), and a remove button
- Empty state (before first generate) and an ongoing drag preview
- `Diagnostics` sub-component for search warnings

### What needs to change

- Every `className="tier-*"`, `search-panel`, `search-copy`, `search-form`,
  `search-row`, `section-heading`, `diagnostics`, `eyebrow` attribute in JSX
- All private sub-components (`TierCardButton`, `TierDropSlot`, `TierLaneView`,
  `TierDragPreview`, `Diagnostics`) get Tailwind classes; no extraction needed —
  they stay file-local
- ~431 lines of CSS to delete from `styles.css`

### What must NOT change

- Drag state machine and pointer event logic
- `resolveDropTarget` / `resolveTargetFromPoint` / `resolveTargetFromEventTarget`
- `moveCard`, `clonePlacements`, `laneCards`, `lanesMatch`, `laneKey`
- `data-tier-*` data attributes used by drag resolution — these are DOM coordination
  attributes, not styling handles; keep them exactly as-is
- Inline `style={{ "--tier-accent": ..., "--tier-accent-soft": ... }}` per-row
  CSS variable injection — these are runtime values and must stay as inline styles

## Key Design Decisions

### Search panel

The current `search-panel tier-generator-panel` section reuses the shared
`search-panel` class. Since QB (the other previous user of `search-panel`) is
already migrated, check whether `search-panel` has any remaining callers after
this rewrite. If Tier List is the last user, delete the `/* ── SEARCH PANEL ── */`
section from `styles.css` too.

In Tailwind, the panel is a contained surface block above the tier editor:
`bg-surface-1 border border-border-subtle rounded-[var(--radius-md)] p-5 sm:p-7 mb-6`
(or similar). Match the compact `ToolSection` visual language already used in
Query Builder.

### Tier row accent colors

Per-row accent colors are injected as `--tier-accent` and `--tier-accent-soft`
CSS custom properties via inline `style`. The CSS file currently defines selectors
that use `var(--tier-accent)` and `var(--tier-accent-soft)`. After migration,
these custom properties are consumed directly by Tailwind arbitrary-value classes:

```tsx
// Label panel left border
<div
  className="border-l-4"
  style={{ borderColor: "var(--tier-accent)" } as CSSProperties}
>
```

Or keep them as inline style targets and use `[--tier-accent:...]` Tailwind
custom-property syntax if appropriate. The key rule: no new `styles.css` selectors.
The per-row accent values remain runtime-computed (hardcoded `tierAccentPairs` array)
and must stay as inline style assignments.

### `diagnostics` class

The `diagnostics` class is used locally in `TierListView`. After this rewrite, check
whether any other legacy page still uses it. If not, delete the `/* ── ERROR / DIAGNOSTICS ── */`
section from `styles.css`. If another page still uses it, leave the section until
that page is also migrated.

### `eyebrow` component class

`TierListView` uses `<p className="eyebrow">`. The `.eyebrow` class is defined in
`ui-foundation.css` (a shared component class). Do not remove it — it may still
be used by other pages. Replace only the `tier-*` and `search-panel`-family usage.

### TanStack Query

The `generateTierList` function is a user-triggered action (not a background load),
so it maps to a TanStack Query **mutation** or stays as an imperative async handler.
For this tool-generating pattern, keeping it as a `useCallback`-wrapped async
handler with local `isGenerating` state is acceptable and cleaner than a mutation.

The card-search fetch inside `generateTierList` calls `searchCards(draftQuery)`.
This is a one-shot user-triggered search, not a cached background fetch. Keep it
as an imperative call for now. No `useQuery` migration is needed here because there
is no background loading to replace — data loads only when the user submits the
form.

Record this decision: **TanStack Query is not wired for Tier List in this pass**
because there is no background `useEffect` data fetch to replace. The only data
operation is the user-triggered `generateTierList` call.

### `missing-image` class

Used in `TierCardButton` and `TierDragPreview` as a fallback for cards without
`image_url`. After this rewrite, check whether `missing-image` is still used by
any other legacy page. If not, delete the selector from `styles.css`.

## Implementation Units

### Unit 1 — Create `pages/TierListView.tsx`

Write the new file as a Tailwind rewrite of the legacy version:

- All `tier-*`, `search-panel`, `search-copy`, `search-form`, `search-row`,
  `section-heading`, `diagnostics`, `eyebrow` class references → Tailwind
- Keep `data-tier-*` data attributes exactly as-is
- Keep inline `style={{ "--tier-accent": ..., "--tier-accent-soft": ... }}`
  exactly as-is
- Preserve all drag state, slot resolution, and placement logic unchanged
- File-local sub-components stay file-local

CSS token mapping reference:

| Legacy class / concept | Tailwind approach |
|---|---|
| `search-panel` container | `bg-surface-1 border border-border-subtle rounded-md p-5 mb-6` |
| `eyebrow` | keep `.eyebrow` class from `ui-foundation.css` |
| `search-form` / `search-row` | Flex row, same pattern as QB text filter rows |
| `tier-builder` | Full-width section with top padding |
| `tier-query-banner` | Flex row with accent-soft background, padded |
| `tier-toolbar` | Flex row, `items-center justify-between`, border-bottom |
| `section-heading compact` | Compact `h2` with Tailwind text classes |
| `tier-editor` | Stack of tier rows with gap |
| `tier-row` | Flex row with left accent border; border color via `var(--tier-accent)` inline |
| `tier-row-label-panel` | Narrow fixed-width flex column with label input |
| `tier-row-label-input` | Compact input, transparent bg, text centered |
| `tier-row-remove-button` | Icon-style close button |
| `tier-lane-surface` | Flex-grow surface area for card track |
| `tier-card-track` | Flex row, `flex-wrap`, `gap-1`, `min-h-[...]` |
| `tier-card-shell` | Relative positioned wrapper for card + drop slot |
| `tier-card-button` | Fixed-width card image button; portrait/landscape via `data-layout` |
| `tier-drop-slot` | Thin vertical gap that expands when active |
| `tier-drag-preview` | Fixed-position floating card image with `pointer-events-none` |
| `tier-empty-target` | Centered placeholder text in the card track |
| `tier-empty-state` | Centered page-level empty state |
| `tier-unranked-panel` | Section with header + card track |
| `diagnostics` | Alert surface with `role="alert"` |
| `missing-image` | Fallback div with card name text |

### Unit 2 — Update router

In `frontend/src/app/router.tsx`: change the `TierListView` import path from
`../pages/legacy/TierListView` to `../pages/TierListView`.

### Unit 3 — Delete legacy CSS

Remove from `frontend/src/styles.css`:
- The entire `/* ── TIER LIST ── */` section (lines ~984–~1415, ~431 lines)
- If `search-panel` has no remaining callers: the `/* ── SEARCH PANEL ── */`
  section (lines ~27–~110, ~83 lines)
- If `diagnostics` has no remaining callers: the `/* ── ERROR / DIAGNOSTICS ── */`
  section (lines ~811–~827, ~16 lines)
- If `missing-image` has no remaining callers in legacy pages: its selector

Verify before deleting each section by grepping for the class name across all
remaining legacy page files.

### Unit 4 — Delete legacy file

Delete `frontend/src/pages/legacy/TierListView.tsx`.

### Unit 5 — Storybook story

Create `frontend/src/pages/TierListView.stories.tsx` colocated with the new file.

Required stories:

| Story | What it shows |
|---|---|
| `Default` | Empty state (before any generation) |
| `WithCardPool` | Generated card pool in the unranked lane |
| `WithTierRankings` | Some cards placed in tier rows; some unranked |

Story notes:
- The drag-and-drop behavior does not need to be exercised in Storybook; the
  stories cover the static visual states
- Use mocked `CardRecord` data; do not make real API calls in stories
- Render inside `PageShell` (or equivalent) to see the full page layout

## Visual Region → Approach Table

| Visual region | Approach | Rationale |
|---|---|---|
| Search panel | Tailwind surface block | Matches `ToolSection` visual language |
| Query input + Generate button | Tailwind flex row | Same pattern as QB text filter rows |
| Diagnostics | Tailwind alert surface | Page-local; not extracted |
| Query banner | Tailwind flex row with accent-soft bg | |
| Tier toolbar | Tailwind flex row with section heading | |
| Tier rows | Flex rows with left accent border (runtime color) | Keep inline style for accent |
| Tier row label | Compact editable label with caption | |
| Card track | `flex flex-wrap gap-1 min-h-[...]` | |
| Card buttons | Fixed-size image buttons (portrait/landscape) | |
| Drop slots | Thin expanding gap | Use `data-*` for drag resolution; style with Tailwind |
| Drag preview | `fixed pointer-events-none` | Keep `left`/`top`/`width` as inline style (runtime geometry) |
| Unranked panel | Surface section with header | |
| Empty state | Centered icon + heading + description | |

## New Shared Components

No new shared components are proposed. The drag-and-drop sub-components
(`TierCardButton`, `TierDropSlot`, `TierLaneView`, `TierDragPreview`) are
too Tier List-specific to extract. They remain file-local unexported functions.

## styles.css Drawdown

After Unit 3:
- ~431 lines removed for `/* ── TIER LIST ── */`
- Up to ~83 additional lines if `/* ── SEARCH PANEL ── */` has no remaining callers
- Up to ~16 additional lines if `/* ── ERROR / DIAGNOSTICS ── */` has no remaining callers

## Test Plan

1. `npm run build -w @noxiannet/frontend` — must pass
2. `npm run build-storybook -w @noxiannet/frontend` — must pass
3. `npm run test -w @noxiannet/frontend` — pre-existing failures acceptable; no new failures
4. Browser smoke test: navigate to `/cards/tier-list`; enter a query; click Generate;
   confirm card pool appears; drag a card into a tier row; confirm it moves; confirm
   tier row label is editable; confirm Add Row and Remove Row work; confirm Reset
   Rankings works

## Completion Criteria

- `pages/legacy/TierListView.tsx` deleted
- `pages/TierListView.tsx` exists with no `tier-*` class names
- `app/router.tsx` imports from the new path
- `/* ── TIER LIST ── */` section is gone from `styles.css`
- Orphaned `search-panel` and `diagnostics` sections removed if no remaining callers
- Storybook has stories at `pages/TierListView.stories.tsx`
- Build and Storybook build pass
- Completion note names all changed files, cites Storybook story paths, and records
  which additional CSS sections were removed

## Assumptions

- The drag-and-drop pointer logic is correct and complete; only CSS is changing.
- `data-tier-*` data attributes must not be renamed or removed — they are load-bearing
  for drag slot resolution.
- Inline `style` for `--tier-accent` / `--tier-accent-soft` and for drag preview
  geometry (`left`, `top`, `width`) is the correct approach (runtime-computed values).
- No mockup is needed; visual improvements happen naturally during the Tailwind
  translation pass.
