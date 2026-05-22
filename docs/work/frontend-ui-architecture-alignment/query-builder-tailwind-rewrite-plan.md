# Plan: Query Builder Tailwind Rewrite

> Status: plan
> Initiative: Stage 7 — Page-by-Page UI Rewrites

## Summary

Migrate `QueryBuilderView` out of `pages/legacy/` by rewriting all
`qb-*` CSS class usage to Tailwind utility classes. The component's
logic, layout, and `CardSearchResultsPane` integration are already
correct — this is a pure styling migration. No mockup is needed because
the visual target is identical to the current output; the only change is
the implementation mechanism (CSS → Tailwind).

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

### What exists and is correct (keep as-is)

- The two-column outer grid wrapper (`lg:grid-cols-[…]`) — already Tailwind
- The `<aside>` sticky positioning — already Tailwind
- The `CardSearchResultsPane` integration with `debouncedBuiltQuery`
- All `useMemo` query-building logic
- `useDebounce`, `toggle`, `quoteValue`, `orGroup` — logic is fine
- `StatRow` and `TextField` private helpers — keep file-local (too QB-specific to extract)

### What needs to change

- Every `className="qb-*"` attribute in the builder panel JSX
- The domain chip `--domain-color` / `--domain-bg` / `--domain-bg-hover` injection
- The rarity chip `--rarity-color` / `--rarity-bg` injection
- ~362 lines of CSS to delete from `styles.css`
- ~75 lines of attribute selectors to delete from `ui-foundation.css`

## Key Design Decisions

### Domain chips

The current approach injects `--domain-color` etc. via `data-domain` attribute
selectors in `ui-foundation.css`. The migrated approach follows
`CardMetaChips.tsx` exactly:

1. Define a top-of-file `DOMAIN_CHIP_CLASSES` lookup keyed by domain name:
   ```ts
   const DOMAIN_CHIP_CLASSES: Record<string, { chip: string; pip: string }> = {
     Fury:  { chip: "border-[color:var(--domain-fury)] bg-[var(--domain-fury-soft)] hover:bg-[var(--domain-fury-soft-hover)]", pip: "var(--domain-fury)" },
     Calm:  { chip: "border-[color:var(--domain-calm)] bg-[var(--domain-calm-soft)] hover:bg-[var(--domain-calm-soft-hover)]", pip: "var(--domain-calm)" },
     Mind:  { chip: "border-[color:var(--domain-mind)] bg-[var(--domain-mind-soft)] hover:bg-[var(--domain-mind-soft-hover)]", pip: "var(--domain-mind)" },
     Body:  { chip: "border-[color:var(--domain-body)] bg-[var(--domain-body-soft)] hover:bg-[var(--domain-body-soft-hover)]", pip: "var(--domain-body)" },
     Chaos: { chip: "border-[color:var(--domain-chaos)] bg-[var(--domain-chaos-soft)] hover:bg-[var(--domain-chaos-soft-hover)]", pip: "var(--domain-chaos)" },
     Order: { chip: "border-[color:var(--domain-order)] bg-[var(--domain-order-soft)] hover:bg-[var(--domain-order-soft-hover)]", pip: "var(--domain-order)" },
   };
   ```
2. The pip `<span>` uses `style={{ background: colors.pip }}` — a
   per-instance computed value, which is acceptable per `AGENTS.md`.
3. Delete the `data-domain` attribute selector block from `ui-foundation.css`.

### Rarity chips

Same approach as domain chips:

```ts
const RARITY_CHIP_CLASSES: Record<string, { chip: string; pip: string }> = {
  Common:    { chip: "border-[color:var(--rarity-common)] bg-[var(--rarity-common-soft)]",    pip: "var(--rarity-common)" },
  Uncommon:  { chip: "border-[color:var(--rarity-uncommon)] bg-[var(--rarity-uncommon-soft)]", pip: "var(--rarity-uncommon)" },
  Rare:      { chip: "border-[color:var(--rarity-rare)] bg-[var(--rarity-rare-soft)]",         pip: "var(--rarity-rare)" },
  Epic:      { chip: "border-[color:var(--rarity-epic)] bg-[var(--rarity-epic-soft)]",         pip: "var(--rarity-epic)" },
  Showcase:  { chip: "border-[color:var(--rarity-showcase)] bg-[var(--rarity-showcase-soft)]", pip: "var(--rarity-showcase)" },
  Promo:     { chip: "border-[color:var(--rarity-promo)] bg-[var(--rarity-promo-soft)]",       pip: "var(--rarity-promo)" },
};
```

Delete the `data-rarity` attribute selector block from `ui-foundation.css`.

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

Write the new file as a direct Tailwind replacement of the legacy version:

- All `qb-*` class references → Tailwind utility classes
- `DOMAIN_CHIP_CLASSES` and `RARITY_CHIP_CLASSES` lookups at top of file
- Pip spans use `style={{ background: … }}` for the per-domain/rarity color
- `StatRow` and `TextField` helper components stay file-local (private, not exported)
- `SearchIcon` stays file-local (private inline SVG, not exported)
- No logic changes — identical behavior to legacy version

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
| Outer two-column grid wrapper | Keep existing Tailwind — no change | Already migrated |
| Builder panel container (`qb-panel`) | `flex flex-col gap-8 pb-14 max-w-[820px]` | Direct translation |
| Page header (eyebrow, h1, description) | Keep `.eyebrow` class; h1/description use Tailwind | eyebrow is a shared component class |
| Built query box | Tailwind surface + border tokens | Static layout, straightforward |
| Section dividers (`qb-section`) | `flex flex-col gap-2.5 pt-1 border-t border-border-subtle` | Direct translation |
| Section title (`qb-section-title`) | Flex row, uppercase, tiny font, `text-text-tertiary` | Direct translation |
| Hint badge (`qb-hint`) | `px-2 py-0.5 rounded bg-accent-warm-soft border border-accent-warm/25 text-accent-warm text-[0.72rem]` | Matches current visual |
| Generic chips | Tailwind pill button with toggled state classes | Base chip → conditional `qb-chip--on` classes |
| Domain chips | `DOMAIN_CHIP_CLASSES` lookup + pip `style` | Follows `CardMetaChips` pattern |
| Rarity chips | `RARITY_CHIP_CLASSES` lookup + pip `style` | Follows `CardMetaChips` pattern |
| Set code badge | `font-mono text-[0.68rem] font-bold px-1.5 bg-surface-1 rounded text-text-tertiary` | Direct translation |
| Stats grid | `grid grid-cols-2 max-[700px]:grid-cols-1 gap-2.5` | Keeps 700px threshold |
| Stat row | Flex row inside a surface card | Direct translation |
| Text filter rows | `grid grid-cols-[110px_1fr_auto] max-[700px]:grid-cols-1` | Keeps 700px threshold |
| Search button | `bg-accent hover:bg-accent-hover` with `text-white` | Direct translation |
| Live preview aside | No change — already Tailwind | Already migrated |

## New Shared Components

None. All internal helpers (`StatRow`, `TextField`, `SearchIcon`) are too
QB-specific to extract. They remain file-local unexported functions.

## styles.css Drawdown

After Unit 3:
- ~362 lines removed from `styles.css`
- ~75 lines removed from `ui-foundation.css`

## Test Plan

1. `npm run build -w @noxiannet/frontend` — must pass
2. `npm run build-storybook -w @noxiannet/frontend` — must pass
3. `npm run test -w @noxiannet/frontend` — pre-existing failures are acceptable; no new failures
4. Browser smoke test: navigate to `/query-builder`, confirm all chips toggle
   correctly, domain/rarity pip colors render, built-query box updates live,
   live preview pane shows results, "Search with this query" navigates to `/cards`

## Completion Criteria

- `pages/legacy/QueryBuilderView.tsx` is deleted
- `pages/QueryBuilderView.tsx` exists with no `qb-*` class names
- `app/router.tsx` imports from the new path
- The entire `/* ── QUERY BUILDER ── */` section is gone from `styles.css`
- The `qb-domain-chip` and `qb-rarity-chip` attribute selector blocks are gone from `ui-foundation.css`
- Storybook has stories at `pages/QueryBuilderView.stories.tsx`
- Build and Storybook build pass
- Completion note names all changed files and cites Storybook story paths
