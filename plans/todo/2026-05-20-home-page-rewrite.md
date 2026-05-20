# Plan: Home Page Rewrite

**Status: APPROVED — ready for execution**

---

## Summary

Full clean-slate rewrite of `frontend/src/pages/home.tsx`. The goal is a minimal,
well-organized page that follows the mobile-first, single-implementation philosophy
established in the header simplification plan. Fixes a real container query bug,
removes marginal breakpoint noise, and redesigns the hero and feature tile layout.

Two viewport breakpoints (`md`, `lg`). All viewport queries — no container queries
on any structural layout decision.

---

## Context: what's wrong with the current page

**Container query self-reference bug** (confirmed in browser testing):
Both the feature tile grid and the promo grid have `[container-type:inline-size]`
and responsive column queries (`@md:grid-cols-2`, `@sm:grid-cols-2`) on the **same
element**. The CSS spec says an element cannot be its own container for its own
queries, but browser behavior is inconsistent — some browsers resolve the column
query against the element's own size rather than the ancestor container. This causes
the 2-column layout to appear at viewport widths far below the intended threshold,
as confirmed by the screenshot showing 2-wide tiles with the mobile hamburger open.

**Excessive breakpoint noise**: The current page has ~30 responsive class overrides
across the hero, copy zone, and tiles. The majority produce sub-2px visual
differences and were identified as not worth keeping.

**5× promo card loop**: `[0,1,2,3,4].map(...)` creates 5 identical rows of the same
two placeholder promo cards. This is placeholder scaffold, not real content.

**Three-mechanism H1 sizing**: `clamp(cqi)` → `clamp(vw)` → `fixed rem` across three
breakpoints. The intermediate mechanisms add complexity without a meaningful visual
benefit now that the layout is being simplified.

---

## What is removed

| Element | Removed |
|---|---|
| Eyebrow `<p>` ("Noxian Netdecks") | Entirely deleted |
| Tagline ("Search cards, understand price trends.") | Entirely deleted |
| `home-shell` container div wrapper | Removed — page-level layout uses viewport queries, no container needed |
| `hero-shell` container declaration | Removed — same reason |
| H1 three-mechanism sizing | Replaced with single `clamp(vw)` value — no breakpoint |
| Copy zone width cap (`lg:w-[min(100%,46rem)]`) | Dropped — text is short fixed-size, no visual benefit over w-full |
| Copy zone gap breakpoints (3 steps) | Replaced with single value |
| Copy zone `@sm` padding step | Dropped — 2.4 px, not meaningful |
| H1 "The Complete" `@md:text-[0.7em]` override | Dropped — 2% difference |
| Hero search wrapper `@lg` width cap | Dropped — never reached due to copy zone constraint |
| Feature tile row `@md:pb-[2rem]` step | Dropped — replaced with single value |
| Content section gap/pt breakpoints | Replaced with single values |
| `[0,1,2,3,4].map(...)` promo loop | Replaced with single row |
| Both `[container-type:inline-size]` on grids | Removed and column queries switched to viewport queries (bug fix) |
| Copy zone `transition-[width,padding]` | Removed — `w-full` at all sizes means the width leg never fires; dead code |
| H1 `transition-[font-size,transform]` | Removed — viewport resize font-size transitions are jarring |

---

## What is added / changed

### Hero section

**Hero card min-height**: Two values.
- Default: `min-h-[min(44rem,100svh-2rem)]` — mobile, viewport-relative
- `lg:min-h-[50rem]` — desktop minimum (moved from `@md` to `lg` to align with the
  single breakpoint at which the layout fully shifts)

The hero is allowed to grow beyond these minimums if content requires it.

**Background image**: unchanged behavior (`object-cover object-[center_bottom]`),
min-h mirrors the hero card.

**Atmospheric fade**: kept as-is.

### Copy zone

Single padding default + one desktop step. `w-full` at all sizes — no width cap.

```
default:  px-[1.2rem] py-[2rem]
lg:       p-[3rem_2.5rem]
```

**Gap between copy zone children**: single value, `gap-[1.1rem]`.

**`transition-[width,padding]`**: removed — with `w-full` at all sizes the width transition never fires.

**Contents**: H1 headline + search bar wrapper. No tagline.

### H1 headline

Single `clamp` value — no breakpoint.

```
text-[clamp(3rem,14vw,6rem)]
```

Floor (3rem) protects very narrow viewports. 14vw scales naturally through the
mid-range. Cap (6rem) is reached at ~686px, close to when the search bar begins
approaching its 40rem lock. No `lg` breakpoint needed; the cap handles the
transition. This approximates the same visual result as the previous formula
without baking in font metrics or character counts.

Leading, tracking, flex-col arrangement unchanged. `transition-[font-size,transform]` removed.

**"The Complete" span**: single value `text-[0.68em]`, `@md` override dropped. Kept.

**"Riftbound" and "Archive" spans**: unchanged (gradients, 1em).

### Hero search bar wrapper

Two values:
- Default: `w-full`
- `lg:w-[min(100%,40rem)]`

Single cap at desktop. The `@sm` and `@md` intermediate caps are dropped.

### Feature tile grid — layout

Bug fix: column queries switch from container queries (`@md:`, `@lg:`) to viewport
queries (`md:`, `lg:`). **`[container-type:inline-size]` stays on the grid.** The
self-reference bug is caused by the column rules being container queries on the same
element that declares itself a container — not by the container type existing.
Removing the container type is unnecessary and would break the internal container
queries inside `TileFeature` and `TilePromo` (`@md:gap`, `@md:inline`, `@md:text-*`,
`@xl:text-*`) which need this element as their ancestor container.

The featured card (Trade Balancer) needs `md:col-span-2 lg:col-span-1`. Since
TileFeature has no className prop, one wrapper div handles the col-span:

```tsx
<div className="grid grid-cols-1 gap-[0.85rem] md:grid-cols-2 lg:grid-cols-3 [container-type:inline-size]">
  <div className="md:col-span-2 lg:col-span-1">
    <TileFeature ... />  {/* Trade Balancer — featured */}
  </div>
  <TileFeature ... />
  <TileFeature ... />
</div>
```

At `md` (768 px): Trade Balancer spans full width, other two are half-width.
At `lg` (1024 px): all three equal columns.

Tile heights are not fixed. CSS grid `align-items: stretch` makes tiles equal height
within each row automatically.

### Feature tile at medium breakpoint

The Trade Balancer wrapper (col-span-2) is full-width. TileFeature inside uses the
same vertical layout at all sizes — no internal layout change.

### Promo section

Single row, no loop:

```tsx
<div className="grid grid-cols-1 gap-[0.85rem] md:grid-cols-2 pt-[0.85rem] px-[var(--space-shell-x)]">
  <TilePromo ... />
  <TilePromo ... />
</div>
```

Column query is `md:grid-cols-2` (viewport) on an element that retains
`[container-type:inline-size]`. Same fix pattern as the feature grid: switch `@md:`
to `md:` on the column rule; keep the container type so TilePromo's internal
`@md:text-*` and `@xl:text-*` queries keep a container ancestor to resolve against.

---

## Breakpoint summary (post-rewrite)

| Breakpoint | What changes |
|---|---|
| `md` (768 px) | Feature tiles: 1-col → 1+2 layout. Promo: 1-col → 2-col. |
| `lg` (1024 px) | Feature tiles: 1+2 → 3-col. Copy zone padding: mobile → desktop. Search bar: full-width → 40rem cap (H1 clamp also hits its 6rem cap here). Hero min-h: dynamic → 50rem. |

All breakpoints are **viewport queries** (`md:`, `lg:`), not container queries.

---

## Files touched

| File | Change |
|---|---|
| `frontend/src/pages/home.tsx` | Full rewrite |
| `frontend/src/pages/home.stories.tsx` | Update stories for new viewport breakpoints |

---

## Test plan

**Automated:**
- `npm run build -w @noxiannet/frontend` — no TypeScript errors

**Storybook viewports (per naming convention):**
- `Mobile` (375 px): 1-col tiles, large H1 (multi-line stack), no tagline
- `Desktop Small` (700 px): 1+2 tile layout, large H1, no tagline
- `Desktop` (900 px): 3-col tiles, H1 at 6rem cap
- `Desktop Wide` (1400 px): same as Desktop, wider shell padding

**Container query bug verification:**
- At 375 px: confirm 1-col tiles (regression test for the bug)
- At 700 px: confirm the 1+2 layout, not 3-col
- At 1100 px: confirm 3-col

**Hero search IntersectionObserver:**
- Scroll past search bar on home — confirm header search appears
- Scroll back up — confirm header search disappears

---

## Assumptions

- `home.stories.tsx` currently imports `heroBackgroundAsset` from `home.tsx`. That
  export stays in the rewrite.
- The IntersectionObserver logic for `headerSearchVisible` is unchanged — it watches
  `heroFormRef` regardless of layout.
- `CardSearchInput` placeholder is already "Search for Cards" from the header
  simplification plan; no further change needed here.
- Tile components (`TileBase`, `TileFeature`, `TilePromo`) are not modified. All
  layout and bug-fix changes are contained to `home.tsx`.
