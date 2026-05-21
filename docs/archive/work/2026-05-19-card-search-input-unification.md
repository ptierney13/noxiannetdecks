# Plan: CardSearchInput Unification

## Goal

Replace the three inline search form blocks (header desktop, header mobile, hero) with a
single shared `<CardSearchInput />` component. Eliminate visual drift, consolidate the
submit button placement, and make responsive placeholder behaviour self-contained.

---

## Confirmed decisions

| # | Question | Decision |
|---|---|---|
| 1 | Component boundary | Owns the full `<form>`: icon, input, clear button, submit button |
| 2 | Visual style | Hero style is canonical. Header adopts it. One look, no variant prop. |
| 2b | Button placement | Submit button lives **inside** the visual container, flush right/top/bottom. Left gap only. |
| 3 | IntersectionObserver ref | Stays in `home.tsx`. Component does **not** use `forwardRef`. Hero wraps `<CardSearchInput />` in a `<div ref={heroFormRef}>`. |
| 4 | Responsive placeholder | Component self-manages via ResizeObserver on its own form element. Below threshold → "Search". Above → "Search for Riftbound Cards". No prop needed. |
| 5 | Input type / clear button | `type="search"`. Native cancel button hidden via CSS. Custom clear ✕ button shown when `value !== ""`, styled Noxian red. |

---

## Component spec

### File
`frontend/src/ui-elements/CardSearchInput.tsx`

### Props
```ts
type CardSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  className?: string; // applied to the <form> — for header grow-in animation
};
```

`className` on the form is the only escape hatch. No variant, no style props beyond that.

### JSX structure
```
<form className={`...baseFormStyles... ${className}`} onSubmit={...} role="search">
  <div className="...visualContainer...">   ← the styled pill
    <span aria-hidden>                       ← icon wrapper, left-padded
      <SearchIcon />
    </span>
    <input
      type="search"
      className="[&::-webkit-search-cancel-button]:hidden ..."
      value={value}
      onChange={...}
      placeholder={isNarrow ? "Search" : "Search for Riftbound Cards"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Search cards"
    />
    {value !== "" && (
      <button type="button" aria-label="Clear search" onClick={handleClear}>
        ✕   ← Noxian red, small, appears only when input has content
      </button>
    )}
    <button type="submit" className="...submitButton...">
      Search
    </button>
  </div>
</form>
```

### Visual container rules
- `flex items-stretch overflow-hidden` — button corners clipped by container radius
- `rounded-[16px]` matches current hero label radius
- Gold border + backdrop-blur from hero: `bg-[rgba(11,14,22,0.48)] border border-[rgba(255,219,155,0.18)] backdrop-blur-[12px]`
- Focus state from hero: `focus-within:border-[rgba(247,198,91,0.72)] focus-within:shadow-[0_0_0_3px_rgba(215,170,73,0.2)]`
- Container has **zero padding on right, top, bottom**. Left padding (`pl-[0.85rem]` or similar) applies to the icon/input area, not the container.
- Submit button: `self-stretch`, `mr-0 mt-0 mb-0`, fills the container height naturally. Its right corners are clipped by `overflow-hidden`.

### Responsive placeholder (ResizeObserver)
- `useRef` on the form element, `useEffect` sets up a `ResizeObserver`
- When `contentRect.width < ~300` (exact value to be calibrated during implementation so the full string fits before the swap): `setIsNarrow(true)`
- Cleanup on unmount

### Custom clear button
- Visible only when `value !== ""`
- `onClick`: calls `onChange("")`, then `inputRef.current?.focus()`
- Styled: small, Noxian red text or icon, vertically centered, `type="button"` to avoid accidental submit

---

## Migration: `home.tsx`

### Before
```tsx
<form ref={heroFormRef} className="grid [grid-template-columns:...] gap-[0.7rem] ..." onSubmit={handleSearchSubmit}>
  <label className="flex items-center gap-[0.7rem] min-h-[58px] px-4 rounded-[16px] ...">
    <span><SearchIcon /></span>
    <input ... value={query} onChange={...} />
  </label>
  <button type="submit" className="...">Search</button>
</form>
```

### After
```tsx
<div ref={heroFormRef} className="mt-[0.3rem] w-full ...responsiveWidths...">
  <CardSearchInput
    value={query}
    onChange={setQuery}
    onSubmit={handleSearchSubmit}
  />
</div>
```

- The `heroFormRef` moves to a wrapper `<div>` — the IntersectionObserver targets this div instead of the form.
- Responsive width classes (`@[640px]:w-[min(100%,34rem)]` etc.) move to the wrapper div.
- `handleSearchSubmit` in `home.tsx` currently receives a `FormEvent`. Change its signature to accept `(value: string) => void` to match the component's `onSubmit` contract. The navigation call stays the same.

---

## Migration: `AppHeader.tsx`

### Desktop form (currently lines ~196–222)
Replace the inline `<form>` block with:
```tsx
{headerSearchVisible ? (
  <CardSearchInput
    value={headerSearchQuery}
    onChange={setHeaderSearchQuery}
    onSubmit={handleHeaderSearchSubmit}
    className={`animate-[search-grow-in_280ms_cubic-bezier(0.22,1,0.36,1)_forwards] min-w-0 ${isCompact ? "w-full max-w-none self-stretch" : ""}`}
  />
) : null}
```

- The grow-in animation and compact layout overrides pass through `className`.
- `handleHeaderSearchSubmit` currently takes a `FormEvent`. Change to `(value: string) => void`, same as home.tsx.
- `isCompact` layout classes (`w-full`, `self-stretch`) remain as call-site concerns — they affect how the form sits in the header grid, not the form internals.

### Mobile form (currently lines ~332–358)
Same replacement pattern — identical to desktop but inside the mobile nav block.

### Cleanup
- Remove the `import { SearchIcon }` from `AppHeader.tsx` if it's no longer used directly (it will be used inside `CardSearchInput` instead).

---

## Storybook: `CardSearchInput.stories.tsx`

File: `frontend/src/ui-elements/CardSearchInput.stories.tsx`

Stories:
| Name | What it shows |
|---|---|
| `Empty` | Component with empty value — no clear button visible |
| `WithValue` | Component with a non-empty value — clear button visible |
| `NarrowViewport` | Container forced to ~250px width — "Search" placeholder |
| `WideViewport` | Container at ~600px width — "Search for Riftbound Cards" placeholder |

Use `parameters: { layout: "padded" }` so the dark background renders correctly.

---

## Files touched

| File | Change |
|---|---|
| `frontend/src/ui-elements/CardSearchInput.tsx` | **Create** |
| `frontend/src/ui-elements/CardSearchInput.stories.tsx` | **Create** |
| `frontend/src/ui-elements/index.ts` | Add `CardSearchInput` export |
| `frontend/src/pages/home.tsx` | Replace form block, wrap in div ref, update onSubmit signature |
| `frontend/src/app/AppHeader.tsx` | Replace desktop + mobile form blocks, update onSubmit signature |

---

## What does not change

- IntersectionObserver logic in `home.tsx` — stays exactly as-is, ref target changes from `<form>` to wrapper `<div>`
- `HeaderSearchContext` and `headerSearchVisible` state — untouched
- Header grid layout and `headerSearchVisible` conditional — untouched
- All animation keyframe definitions in CSS — untouched
- `isCompact` derivation logic in `AppHeader.tsx` — untouched
