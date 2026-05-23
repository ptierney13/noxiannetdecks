# Plan: Query Builder Tailwind Rewrite

> Status: plan
> Initiative: Stage 7 — Page-by-Page UI Rewrites

## Summary

Migrate `QueryBuilderView` out of `pages/legacy/` by rewriting all
`qb-*` CSS class usage to Tailwind utility classes. The component's query
construction logic and `CardSearchResultsPane` integration are already
architecturally correct. The rewrite may improve the visual design while it is
being moved into the current component system; no mockup is required for this
pass. Prioritize a sound, maintainable implementation now, and expect final
visual tuning after the search/backend behavior has settled.

## Current State

| Aspect | Current |
|---|---|
| File | `frontend/src/pages/legacy/QueryBuilderView.tsx` |
| Router import | `app/router.tsx` line 7 |
| CSS | `qb-*` classes in `styles.css` (lines 2648–3010, ~362 lines) |
| Domain/rarity pip | `data-attribute` selectors in `ui-foundation.css` (lines 260–335) |
| Data fetching | None — `CardSearchResultsPane` owns all fetching |
| TanStack Router | Already uses `useNavigate` |
| TanStack Query | N/A — no page-level queries |

### What exists and is correct architecturally

- The two-column builder + live-preview page shape
- The right-side live-preview affordance; sticky positioning may be tuned as
  part of the visual rewrite
- The `CardSearchResultsPane` integration with `debouncedBuiltQuery`
- All `useMemo` query-building logic
- `useDebounce`, `toggle`, `quoteValue`, `orGroup` — logic is fine
- `StatRow` and `TextField` private helpers — keep file-local (too QB-specific to extract)

### What needs to change

- Every `className="qb-*"` attribute in the builder panel JSX
- The domain chip `--domain-color` / `--domain-bg` / `--domain-bg-hover` CSS injection → replaced by rune symbol images via `renderTokenizedText`
- The rarity chip `--rarity-color` / `--rarity-bg` CSS injection → replaced by gem pip images via `raritySymbolSrc`
- ~362 lines of CSS to delete from `styles.css`
- ~75 lines of attribute selectors to delete from `ui-foundation.css`

## Key Design Decisions

### Domain chips

The current approach injects `--domain-color` etc. via `data-domain` attribute
selectors in `ui-foundation.css`. The migrated approach replaces the colored
dot pip with an inline rune symbol image, reusing the existing
`renderTokenizedText` infrastructure from `lib/cardPresentation.tsx`.

Domain → rune token mapping (file-local constant):

```ts
const DOMAIN_RUNE_TOKEN: Record<string, string> = {
  Fury:  "{F}",
  Calm:  "{C}",
  Mind:  "{M}",
  Body:  "{B}",
  Chaos: "{H}",
  Order: "{O}",
};
```

Each domain chip renders its pip via:

```tsx
<span className="w-4 h-4 inline-flex items-center justify-center shrink-0">
  {renderTokenizedText(DOMAIN_RUNE_TOKEN[domain] ?? "", { size: "chip" })}
</span>
```

- No CSS color injection. No `style={{ background: … }}`.
- The rune image is the existing symbol from `inlineSymbolSrc()` — the same
  images already used in card body text and `formatCostText`.
- Delete the `data-domain` attribute selector block from `ui-foundation.css`.

### Rarity chips

Rarity chips use actual extracted gem pip images via `raritySymbolSrc()` from
`lib/cardPresentation.tsx`. These are real card assets (40–52px PNGs) placed in
`public/assets/riftbound/symbols/rarity/`.

Each rarity chip renders its pip via:

```tsx
const pipSrc = raritySymbolSrc(rarity);
// inside the chip button:
{pipSrc && (
  <img
    src={pipSrc}
    alt=""
    aria-hidden="true"
    className="w-4 h-4 object-contain shrink-0"
  />
)}
```

- No CSS color injection. No `RARITY_CHIP_CLASSES` with `--rarity-*` vars.
- `raritySymbolSrc` is already exported from `lib/index.ts`.
- Available rarities: `common`, `uncommon`, `rare`, `epic`, `showcase`, `promo`.
- Delete the `data-rarity` attribute selector block from `ui-foundation.css`.

### Selected ("on") state for all filter chips

All filter chips — domain, rarity, card type, set, finish, supertype, operator,
and generic — use the same generic accent highlight when selected. No chip type
gets domain-specific or rarity-specific highlight colors.

```tsx
const isOn = selectedValues.includes(value);
<button
  className={[
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm transition-colors",
    isOn
      ? "bg-accent-soft border-accent text-text-primary"
      : "bg-surface-2 border-border-subtle text-text-secondary hover:bg-surface-3 hover:border-border-default",
  ].join(" ")}
>
```

The accent tokens (`bg-accent-soft`, `border-accent`) come from
`ui-foundation.css` and are the same ones used by other selected-state patterns
in the app. Domain and rarity pips appear on both selected and unselected chips
(they identify the option, not the selection state).

### Focus rings on inputs / selects

Current: `border-color: var(--red)` and `box-shadow: 0 0 0 2px var(--red-glow)`.

Migrated: use `focus:outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-focus-ring)]`
on each `<input>` and `<select>`. This uses the canonical focus token.

### The eyebrow class

The `<p className="eyebrow">Cards</p>` in the QB header uses the `.eyebrow`
component class defined in `ui-foundation.css`. That class stays — it is a
shared component class still used by other legacy pages. Do not remove it.

### Responsive breakpoint for stats and text filter rows

Current: `@media (max-width: 700px)` shifts stats grid to 1 column and text
rows to stacked. Migrated: use `max-[700px]:grid-cols-1` (Tailwind max
breakpoint modifier) to match the same threshold without adding to `styles.css`.

## Implementation Units

### Unit 1 — Create `pages/QueryBuilderView.tsx`

Write the new file as a Tailwind page rewrite of the legacy version:

- All `qb-*` class references → Tailwind utility classes
- `DOMAIN_RUNE_TOKEN` lookup at top of file; domain pips rendered via `renderTokenizedText`
- Rarity pips rendered via `raritySymbolSrc(rarity)` → `<img>`
- All chips use generic accent highlight for selected state (no domain/rarity-specific colors)
- `StatRow` and `TextField` helper components stay file-local (private, not exported)
- `SearchIcon` stays file-local (private inline SVG, not exported)
- Preserve query-building behavior, navigation behavior, and live-preview data
  flow; visual layout and spacing may improve during the rewrite

CSS token mapping reference:

| Legacy CSS var | Tailwind token / class |
|---|---|
| `var(--surface)` | `bg-surface-1` |
| `var(--surface-2)` | `bg-surface-2` |
| `var(--border-strong)` | `border-border-strong` |
| `var(--border-mid)` | `border-border-default` |
| `var(--border)` | `border-border-subtle` |
| `var(--text)` | `text-text-secondary` |
| `var(--text-strong)` | `text-text-primary` |
| `var(--text-muted)` | `text-text-tertiary` |
| `var(--amber)` | `text-accent-warm` |
| `var(--red)` | `bg-accent` / `text-accent` |
| `var(--red-dim)` | `hover:bg-accent-hover` |
| `var(--color-accent-soft)` | `bg-accent-soft` |
| `var(--color-accent-soft-strong)` | `bg-accent-soft-strong` |
| `var(--color-accent)` | `border-accent` |
| `var(--color-text-primary)` | `text-text-primary` |
| `var(--color-surface-1)` | `bg-surface-1` |
| `var(--color-text-tertiary)` | `text-text-tertiary` |

### Unit 2 — Update router

In `frontend/src/app/router.tsx`:
- Change the `QueryBuilderView` import path from `../pages/legacy/QueryBuilderView`
  to `../pages/QueryBuilderView`

### Unit 3 — Delete legacy CSS

Remove from `frontend/src/styles.css`:
- The entire `/* ── QUERY BUILDER ── */` section (lines 2648–3010, ~362 lines)

Remove from `frontend/src/ui-foundation.css`:
- Lines 260–335: the `.qb-domain-chip` and `.qb-rarity-chip` custom-property
  injection blocks (attribute selectors)

### Unit 4 — Delete legacy file

Delete `frontend/src/pages/legacy/QueryBuilderView.tsx`.

### Unit 5 — Storybook story

Create `frontend/src/pages/QueryBuilderView.stories.tsx` colocated with the
new page file.

Required stories:

| Story | What it shows |
|---|---|
| `Default` | All filters unselected, no built query |
| `WithSelections` | Several filters toggled on; built query string visible |
| `WithQueryPanelMocked` | Same as WithSelections but `CardSearchResultsPane` mocked to avoid real fetches |

Story notes:
- The Storybook canvas is rendered inside `PageShell` (or a `div` that mimics
  the route shell) to see the two-column layout.
- `CardSearchResultsPane` should be mocked in Storybook so no real API calls
  are made. This can be done with a simple wrapper that renders a
  placeholder in the story context.

## Visual Region → Approach Table

| Visual region | Approach | Rationale |
|---|---|---|
| Outer two-column grid wrapper | Keep the builder + live-preview split, but tune columns if the new visual pass needs it | Current shape is architecturally right |
| Builder panel container (`qb-panel`) | Tailwind surface/layout classes owned by `pages/QueryBuilderView.tsx` | Page-local composition |
| Page header (eyebrow, h1, description) | Keep `.eyebrow` class; h1/description use Tailwind | eyebrow is a shared component class |
| Built query box | Tailwind surface + border tokens | Static layout, straightforward |
| Section dividers (`qb-section`) | Tailwind stack/separator treatment | May visually improve from the legacy layout |
| Section title (`qb-section-title`) | Compact Tailwind heading treatment | Keep scannable control groups |
| Hint badge (`qb-hint`) | Tailwind token-backed hint treatment | May visually improve from the legacy layout |
| Generic chips | Tailwind pill button with toggled state classes | Base chip → conditional `qb-chip--on` classes |
| Domain chips | `DOMAIN_RUNE_TOKEN` lookup + `renderTokenizedText` pip | Reuses existing rune symbol images; no CSS color injection |
| Rarity chips | `raritySymbolSrc(rarity)` → `<img>` pip | Extracted gem assets; no CSS color injection |
| Set code badge | `font-mono text-[0.68rem] font-bold px-1.5 bg-surface-1 rounded text-text-tertiary` | Direct translation |
| Stats grid | `grid grid-cols-2 max-[700px]:grid-cols-1 gap-2.5` | Keeps 700px threshold |
| Stat row | Flex row inside a surface card | Page-local helper |
| Text filter rows | `grid grid-cols-[110px_1fr_auto] max-[700px]:grid-cols-1` | Keeps 700px threshold |
| Search button | Token-backed primary action treatment | Preserve action behavior |
| Live preview aside | Keep `CardSearchResultsPane`; page framing may be tuned | Shared feature owns results behavior |

## New Shared Components

### `SyntaxQueryChip` (from `ui-elements/`)

The built query display box should use `SyntaxQueryChip` from `ui-elements/`
to render the live query string with syntax highlighting (fields, operators,
values, negation). This component is also used by the LTS Syntax Guide.

`SyntaxQueryChip` is built as part of whichever page (QB or LTS) is
implemented first and then imported by the other. If QB is implemented first,
build `SyntaxQueryChip` as a pre-step (Unit 0) before Unit 1. See the LTS plan
for the full component spec.

All other internal helpers (`StatRow`, `TextField`, `SearchIcon`) are too
QB-specific to extract. They remain file-local unexported functions.

## styles.css Drawdown

After Unit 3:
- ~362 lines removed from `styles.css`
- ~75 lines removed from `ui-foundation.css`

## Test Plan

1. `npm run build -w @noxiannet/frontend` — must pass
2. `npm run build-storybook -w @noxiannet/frontend` — must pass
3. `npm run test -w @noxiannet/frontend` — pre-existing failures are acceptable; no new failures
4. Browser smoke test: navigate to `/cards/query-builder`, confirm all chips toggle
   correctly, domain rune symbols and rarity gem pips render, chips show generic
   accent highlight when selected, built-query box updates live, live preview
   pane shows results, "Search with this query" navigates to `/cards`

## Completion Criteria

- `pages/legacy/QueryBuilderView.tsx` is deleted
- `pages/QueryBuilderView.tsx` exists with no `qb-*` class names
- `app/router.tsx` imports from the new path
- The entire `/* ── QUERY BUILDER ── */` section is gone from `styles.css`
- The `qb-domain-chip` and `qb-rarity-chip` attribute selector blocks are gone from `ui-foundation.css`
- Storybook has stories at `pages/QueryBuilderView.stories.tsx`
- Build and Storybook build pass
- Completion note names all changed files and cites Storybook story paths
