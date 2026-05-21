# Plan: Nav Menu Shared Components (MenuItem + Menu)

> Status: completed

## Goal

Extract the header's clickable nav items and dropdown containers into two shared
`ui-elements` components — `MenuItem` and `Menu` — so that every clickable nav
target and every dropdown popup in `AppHeader` is built from the same primitives
instead of inline Tailwind class-name constants.

---

## Context: current state

`AppHeader.tsx` manages all nav interactions internally with three distinct
class-name strings:

| Constant | Used for |
|---|---|
| `navLinkBase` | Top-level header buttons (Cards, Deck Explorer, Tools) |
| `navMenuItemBase` | Items inside Cards/Tools desktop dropdowns |
| `navDrawerLinkBase` | Items inside the compact drawer and mobile drawer |

The compact drawer and the mobile drawer are two separate JSX blocks with
duplicated structure. Both render sectioned lists (Cards / Explore / Tools)
with gold section titles. The desktop dropdowns are flat item grids with no
titles.

---

## Confirmed decisions

| # | Question | Decision |
|---|---|---|
| 1 | Component home | Both `MenuItem` and `Menu` live in `frontend/src/ui-elements/` |
| 2 | MenuItem covers all clickable items | Yes — top-level nav buttons AND dropdown/drawer items all use `MenuItem`. Two visual variants via a `variant` prop. |
| 2b | Variant naming | `variant="inline"` for solo/bar usage; `variant="menu"` for inside-a-menu usage. Evokes context rather than CSS mechanics. |
| 3 | Selected state | `variant="inline"` selected → `text-accent-warm font-bold underline underline-offset-[3px]`. `variant="menu"` selected → same. One appearance regardless of variant. |
| 4 | Hover state | Defined inside `MenuItem`. Both variants: `hover:text-text-primary hover:bg-[rgba(255,255,255,0.05)]` + `transition-colors duration-[120ms]` |
| 5 | Menu positioning | Passed via `className` from the call site. Menu owns base popup chrome (background, border, shadow, border-radius, padding, grid gap). |
| 6 | Compact + mobile drawers | Same `<Menu sections={...}>` component, different `className` (absolute vs fixed, different size). This eliminates the duplicated JSX. |
| 7 | Section detection | `Menu` accepts an optional `sections` prop (array of `{ title, items }`). When `sections` is provided, Menu renders section titles in gold and uses the spacious padding/gap for drawer mode. When omitted, Menu renders `children` directly in tight desktop-dropdown mode. |
| 8 | Visual reconciliation | `navDrawerLinkBase` currently sets `text-text-primary` and a faint base background. After refactor, drawer items use `MenuItem variant="menu"` which starts at `text-text-secondary` like desktop dropdown items. The faint base background is dropped (it was visually indistinguishable at 3% white). |
| 9 | Routing | Items with `href` render as TanStack Router `<Link>`. Items with `onClick` and no `href` render as `<button>`. `MenuItem` handles the switch internally. The `selected` prop is provided explicitly by the caller rather than auto-derived from the router so that dropdown-trigger buttons (Cards, Tools) can also be marked selected. |
| 10 | Aria | `MenuItem` with `href` continues to set `aria-current="page"` when selected. Dropdown trigger buttons (`MenuItem` with `onClick`) set `aria-expanded` passed through from the caller. |
| 11 | Storybook | `MenuItem.stories.tsx` and `Menu.stories.tsx` are created alongside the new files. |

---

## Component specs

### `MenuItem`

**File:** `frontend/src/ui-elements/MenuItem.tsx`

```ts
type MenuItemProps = {
  // Routing — provide one
  href?: string;
  onClick?: () => void;

  label: string;
  selected?: boolean;          // for onClick-only items: shows warm gold + bold + underline.
                               // ignored when href is present — selection is auto-derived from router.
  chevron?: boolean;           // renders a trailing chevron, rotated 180° when aria-expanded is true
  variant?: "inline" | "menu"; // "inline" = solo bar usage, "menu" = inside a menu/drawer (default)

  // Pass-through for dropdown trigger buttons
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "menu" | "listbox" | "tree" | "grid" | "dialog" | true | false;
};
```

**Base styles (shared across both variants):**
```
rounded-[12px] bg-transparent border-0 cursor-pointer font-semibold no-underline
text-text-secondary
hover:text-text-primary hover:bg-[rgba(255,255,255,0.05)]
transition-colors duration-[120ms]
```

**`variant="inline"` additions:**
```
inline-flex items-center justify-between gap-[0.45rem] min-h-[42px] px-[0.95rem]
```
The chevron icon renders inside the flex row, rotated via `transition-transform rotate-180` when `aria-expanded` is true. The `gap` and `justify-between` are always present so layout is stable whether or not `chevron` is set.

**`variant="menu"` additions (default):**
```
block w-full px-[0.95rem] py-[0.8rem] text-left
```

**When `selected` is true (both variants):**
```
text-accent-warm font-bold underline underline-offset-[3px]
```
Note: the warm gold token (`--color-accent-warm: #d7aa49`) is already defined in
`ui-foundation.css`. `text-accent-warm` is the Tailwind utility for it.

**Selection logic:**

When `href` is present, `MenuItem` calls `useRouterState()` and derives `isActive` using the same logic as the original `NavLink`:

```ts
const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
```

`isActive` drives both the visual gold/bold/underline highlight and `aria-current="page"`. The `selected` prop is **ignored** for link items. This keeps leaf items correct for all routes without caller burden.

When only `onClick` is present (no `href`), `selected` drives the visual highlight. `aria-current` is never set on pure button items — being in a section is not the same as being on a page.

**Rendering:**
- `href` present → `<Link to={href} ... aria-current={isActive ? "page" : undefined}>`; applies highlight when `isActive`
- No `href` → `<button type="button" ...>`; applies highlight when `selected`

---

### `Menu`

**File:** `frontend/src/ui-elements/Menu.tsx`

```ts
type MenuItemData = {
  href?: string;
  onClick?: () => void;
  label: string;
  selected?: boolean;
};

type MenuSection = {
  title?: string;       // omit or undefined → no title rendered for this section
  items: MenuItemData[];
};

type MenuProps = {
  sections: MenuSection[];
  className?: string;   // positioning + size from call site
};
```

`Menu` always takes `sections`. A single untitled section (`title` omitted) produces
the same flat layout as the current desktop dropdowns — no separate `children` path needed.

**Base popup chrome (always applied):**
```
bg-[var(--color-surface-header)]
border border-[rgba(255,255,255,0.08)]
shadow-[var(--shadow-surface-2)]
```

The popup root always receives `role="menu"`. This applies regardless of whether sections are titled or flat.

**No section has a title** (all `title` fields absent):
```
p-[0.55rem] grid gap-[0.2rem] rounded-[16px]
```
Items are rendered flat (all sections concatenated, no group wrappers):
```tsx
{sections.flatMap(s => s.items).map(item => (
  <MenuItem key={item.href ?? item.label} variant="menu" {...item} />
))}
```
Matches existing Cards and Tools dropdown appearance.

**Any section has a title** (at least one `title` present):
```
p-[0.9rem] grid gap-[0.85rem] rounded-[20px]
```
Each section renders as a `role="group"` so screen readers announce the section name before reading its items. The visible gold title is `aria-hidden` because `aria-label` on the group already carries the accessible name:
```tsx
<div
  key={section.title ?? i}
  role="group"
  aria-label={section.title}
  className="grid gap-[0.2rem]"
>
  {section.title && (
    <span
      aria-hidden="true"
      className="px-[0.95rem] pb-[0.35rem] text-accent-warm uppercase tracking-[0.08em] text-[0.75rem] font-bold"
    >
      {section.title}
    </span>
  )}
  {section.items.map(item => <MenuItem key={item.href ?? item.label} variant="menu" {...item} />)}
</div>
```

**Positioning examples (call-site `className`):**

Desktop compact drawer (absolute):
```
absolute top-[calc(100%+0.65rem)] right-0 z-[8] min-w-[min(22rem,82vw)]
```

Mobile drawer (fixed):
```
fixed top-[9.5rem] right-[var(--space-shell-x)] left-[var(--space-shell-x)] z-70
```

Desktop Cards / Tools dropdown (absolute, untitled section):
```
absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] z-10
```

---

## Migration: `AppHeader.tsx`

### Step 1 — Replace desktop dropdown menus

**Cards dropdown** (currently ~15 inline `<a>` / `<button>` elements):
```tsx
{cardsOpen && (
  <Menu
    className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] z-10"
    sections={[{
      items: [
        { href: "/cards/search", label: "Card Search", selected: activeSection === "cards" },
        { href: "/cards/learn", label: "Learn to Search" },
        { href: "/cards/query-builder", label: "Query Builder" },
      ],
    }]}
  />
)}
```

**Tools dropdown** — same pattern.

### Step 2 — Replace compact and mobile drawers

Both drawers share one `sections` array. After refactor the duplicated JSX
collapses to a single definition rendered twice with different `className`:

```tsx
const navSections: MenuSection[] = [
  {
    title: "Cards",
    items: [
      { href: "/cards/search", label: "Card Search", selected: activeSection === "cards" },
      { href: "/cards/learn", label: "Learn to Search" },
      { href: "/cards/query-builder", label: "Query Builder" },
    ],
  },
  {
    title: "Explore",
    items: [
      { href: "/deck-explorer", label: "Deck Explorer", selected: activeSection === "deck-explorer" },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/tools/tier-list", label: "Tier List", selected: activeSection === "tools-tier-list" },
      { href: "/tools/sealed-pools", label: "Sealed Simulator", selected: activeSection === "tools-sealed-pools" },
      { href: "/tools/trade-balancer", label: "Trade Balancer", selected: activeSection === "tools-trade-balancer" },
    ],
  },
];
```

Compact drawer:
```tsx
{compactMenuOpen && (
  <Menu sections={navSections} className="absolute top-[calc(100%+0.65rem)] right-0 z-[8] min-w-[min(22rem,82vw)]" />
)}
```

Mobile drawer:
```tsx
{mobileMenuOpen && (
  <Menu sections={navSections} className="fixed top-[9.5rem] right-[var(--space-shell-x)] left-[var(--space-shell-x)] z-70" />
)}
```

### Step 3 — Replace top-level nav buttons

```tsx
{/* Cards dropdown trigger */}
<MenuItem
  variant="inline"
  label="Cards"
  chevron
  onClick={toggleCardsMenu}
  selected={activeSection === "cards"}
  aria-expanded={cardsOpen}
  aria-haspopup="menu"
/>

{/* Deck Explorer link */}
<MenuItem
  variant="inline"
  href="/deck-explorer"
  label="Deck Explorer"
  selected={activeSection === "deck-explorer"}
/>

{/* Tools dropdown trigger */}
<MenuItem
  variant="inline"
  label="Tools"
  chevron
  onClick={toggleToolsMenu}
  selected={activeSection.startsWith("tools")}
  aria-expanded={toolsOpen}
  aria-haspopup="menu"
/>
```

### Step 4 — Remove dead constants

Delete `navLinkBase`, `navMenuItemBase`, and `navDrawerLinkBase` from `AppHeader.tsx`.

---

## Storybook

**`MenuItem.stories.tsx`**

| Story | What it shows |
|---|---|
| `InlineDefault` | variant="inline", default state |
| `InlineSelected` | variant="inline", selected=true — warm gold, bold, underline |
| `InlineWithChevron` | variant="inline", trailingIcon with chevron |
| `MenuDefault` | variant="menu", default state |
| `MenuSelected` | variant="menu", selected=true |
| `MenuHover` | play() simulates hover — confirm background appears |

**`Menu.stories.tsx`**

| Story | What it shows |
|---|---|
| `DesktopDropdown` | No sections, tight padding — Cards dropdown shape |
| `DrawerSectioned` | Three sections with gold titles — compact/mobile drawer shape |

---

## Files touched

| File | Change |
|---|---|
| `frontend/src/ui-elements/MenuItem.tsx` | **Create** |
| `frontend/src/ui-elements/MenuItem.stories.tsx` | **Create** |
| `frontend/src/ui-elements/Menu.tsx` | **Create** |
| `frontend/src/ui-elements/Menu.stories.tsx` | **Create** |
| `frontend/src/ui-elements/index.ts` | Add `MenuItem`, `Menu` exports |
| `frontend/src/app/AppHeader.tsx` | Replace `navLinkBase` / `navMenuItemBase` / `navDrawerLinkBase` + inline JSX with new components. Extract `navSections` array to deduplicate compact and mobile drawers. |

---

## What does not change

- `resolveDesktopHeaderStage` / `resolveHeaderShellMode` / ResizeObserver logic — untouched
- `HeaderSearchContext` and search input integration — untouched
- Header gradient, border, shadow, z-indices — untouched
- Dropdown open/close state management and outside-click / Escape handlers — untouched
- Logo button and `LogoBadge` — untouched
- `CardSearchInput` — untouched
- `--color-accent-warm` token value — already correct, no token changes needed
