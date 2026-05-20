# Plan: Header Layout Simplification

## Summary

Replace the JS-driven `HeaderShellMode` / `DesktopHeaderStage` state machine with a
single unified nav template whose elements show, animate, or change behavior via
Tailwind viewport breakpoints. Remove `headerLayout.ts` entirely. Simplify
`CardSearchInput` to one placeholder string and remove the `isCompact` prop. Update
`frontend/AGENTS.md` and `frontend/UI_ARCHITECTURE.md` to reflect the mobile-first,
no-separate-implementations nav philosophy.

---

## Context: current state

`AppHeader.tsx` renders two completely separate JSX trees based on a JS-evaluated
`headerShellMode` state:

- `headerShellMode === "desktop"` → one `<nav>` grid template with 4 sub-stages
  (`compact`, `search`, `nav`, `full`) tracking element visibility
- `headerShellMode === "mobile"` → a separate `<div>` flex template with its own
  hamburger and search slot

The stages are driven by a `ResizeObserver` attached to the header element, evaluated
through `resolveHeaderShellMode()` and `resolveDesktopHeaderStage()` with ±24 px
hysteresis. The result is four menu states (`showCardsMenu`, `showToolsMenu`,
`showCompactMenu`, `showMobileMenu`), two refs for the hamburger targets, and a
`useLayoutEffect` block purely to run the observer.

`CardSearchInput` receives an `isCompact` prop that controls only the placeholder
text (`"Search"` vs `"Search for Riftbound Cards"`). With the JS stage removed the
parent can no longer compute this value — and a single good placeholder renders
acceptably at all widths.

---

## Confirmed decisions

| # | Question | Decision |
|---|---|---|
| 1 | Single vs dual template | Single unified `<header>` template. CSS viewport breakpoints drive all element visibility and layout changes. No JS layout switch. |
| 2 | Breakpoint mechanism | Tailwind **viewport** breakpoints (`md:`, `lg:`) — not container queries. Header is always `w-full`; viewport equals container here. |
| 3 | Hamburger / nav items switch | `md` (768 px) is the single structural switch. Below `md`: hamburger visible, inline nav hidden. At `md`+: hamburger hidden, inline nav visible. |
| 4 | Wordmark | Appears at `lg` (1024 px). Uses `max-w-0 opacity-0 lg:max-w-[12rem] lg:opacity-100 overflow-hidden transition-[max-width,opacity]` — the span has no absolute children so `overflow-hidden` is safe and the slide-in animates across the breakpoint. |
| 5 | Hamburger ↔ nav items animation | Both live in a shared right-side container. Each has its own wrapper with `max-w`/`opacity` transitions. **Neither wrapper uses `overflow-hidden`** — `max-w-0` collapses layout width to zero while `opacity-0 pointer-events-none` hides content and disables interaction. Avoiding `overflow-hidden` keeps absolutely-positioned dropdowns from being clipped during the transition. CSS transitions fire on both wrappers as the `md:` media query triggers, producing a smooth crossfade-expand between the two. |
| 6 | Hamburger wrapper | `max-w-[3rem] opacity-100 pointer-events-auto` → `md:max-w-0 md:opacity-0 md:pointer-events-none` with `transition-[max-width,opacity] duration-[220ms,180ms]`. |
| 7 | Nav items wrapper | `max-w-0 opacity-0 pointer-events-none` → `md:max-w-[34rem] md:opacity-100 md:pointer-events-auto` with same transition. Value `34rem` is a safe upper bound; the wrapper is `inline-flex` so it never forces that width, it only caps it. |
| 8 | Search slot | Always rendered as `flex-1 min-w-0`. When `headerSearchVisible` is false the div is empty — it acts as a spacer keeping logo left and actions right. |
| 9 | Search input layout | Full layout always used (no `isCompact` layout modes). The old compact layout (`self-stretch`, `minmax(0,1fr)`, `gap-x-3`) is removed — it was the bug. |
| 10 | `isCompact` prop | Removed from `CardSearchInput`. Single placeholder: `"Search for Cards"`. |
| 11 | Hamburger dropdown: three CSS modes | The hamburger dropdown has three states across the breakpoints, all driven by responsive classes on the `<Menu>` `className` and a sibling backdrop element — no JS branch per mode. **Mode 1 (<sm, 640 px):** `fixed`, full-width (left/right inset by `--space-shell-x`), with a `fixed inset-0` backdrop sibling that is `sm:hidden`. **Mode 2 (sm–md, 640–768 px):** `sm:absolute` overrides `fixed`; `sm:left-auto sm:right-0` overrides the full-width inset; `sm:w-[min(22rem,82vw)]` sets compact width; backdrop hidden via `sm:hidden`. **Mode 3 (md+):** hamburger wrapper is collapsed to zero — the dropdown never renders. |
| 12 | Backdrop | Rendered as a `<button>` sibling of `<Menu>` inside the hamburger wrapper when `showMenu` is true. Has `sm:hidden` so it only appears in mode 1. Click closes the menu. |
| 13 | Menu state | `showCompactMenu` + `showMobileMenu` collapse into a single `showMenu` + `menuRef`. `showCardsMenu` and `showToolsMenu` stay — they are distinct inline-nav dropdowns at md+. |
| 14 | ResizeObserver | Removed entirely along with the `useLayoutEffect` that owned it. `headerShellRef` also removed. |
| 15 | `headerLayout.ts` | Deleted. `DesktopHeaderStage`, `HeaderShellMode`, `resolveHeaderShellMode`, `resolveDesktopHeaderStage`, `DESKTOP_HEADER_STAGE_BREAKPOINTS` all go with it. |
| 16 | `navShellBase` constant | Replaced with direct Tailwind classes on the `<nav>` element. |
| 17 | Outside-click / Escape handler | Simplified from four ref checks to three: `cardsMenuRef`, `toolsMenuRef`, `menuRef`. |
| 18 | AGENTS.md + UI_ARCHITECTURE.md | Updated to replace the "prefer separate mobile/desktop implementations" guidance with the mobile-first, single-implementation, scale-upward philosophy. See exact wording in the AGENTS.md section below. |

---

## Key changes

### Deleted

- `frontend/src/lib/headerLayout.ts` — entire file

### Modified: `frontend/src/lib/index.ts`

Remove re-exports of:
- `resolveDesktopHeaderStage`
- `resolveHeaderShellMode`
- `DesktopHeaderStage`
- `HeaderShellMode`

`LayoutModeBreakpoints` and `constants.ts` are untouched — used by the home page.

### Modified: `frontend/src/ui-elements/CardSearchInput.tsx`

- Remove `isCompact?: boolean` from `CardSearchInputProps`
- Change `placeholder` to the single string `"Search for Cards"`
- No layout changes — internal structure is unchanged

### Modified: `frontend/src/ui-elements/CardSearchInput.stories.tsx`

- Remove any story that passes `isCompact` or demonstrates the two placeholder variants

### Modified: `frontend/src/app/AppHeader.tsx`

**State removed:**
- `headerShellMode` + setter
- `desktopHeaderStage` + setter
- `headerShellRef`
- `showCompactMenu` + setter + `compactMenuRef`
- `showMobileMenu` + setter + `mobileMenuRef`
- `isCompact` and `isFullNav` derived booleans
- `useLayoutEffect` (entire ResizeObserver block)

**State added:**
- `showMenu` + setter (unified hamburger)
- `menuRef` (unified hamburger outside-click ref)

**Template — new structure:**

```tsx
<header className="sticky top-0 z-60 [background:linear-gradient(180deg,#5c1623_0%,#3a0c15_100%)] border-b border-[rgba(255,160,160,0.16)] shadow-[0_4px_30px_rgba(255,50,50,0.16)]">
  <nav
    className="flex items-center gap-4 min-h-[60px] w-full px-[var(--space-shell-x)] py-[0.6rem]"
    aria-label="Primary navigation"
  >

    {/* Logo + wordmark */}
    <button
      type="button"
      className="inline-flex items-center gap-[0.8rem] shrink-0 border-0 p-0 bg-transparent text-text-primary cursor-pointer"
      onClick={() => void navigate({ to: "/" })}
      aria-label="Noxian Netdecks home"
    >
      <LogoBadge />
      <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap lg:max-w-[12rem] lg:opacity-100 transition-[max-width,opacity] duration-[220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),ease] text-[1.1rem] font-bold tracking-[-0.02em]">
        Noxian Netdecks
      </span>
    </button>

    {/* Search slot — always flex-1; empty when headerSearchVisible is false */}
    <div className="flex-1 min-w-0">
      {headerSearchVisible ? (
        <CardSearchInput
          value={headerSearchQuery}
          onChange={setHeaderSearchQuery}
          onSubmit={handleHeaderSearchSubmit}
          className="animate-[search-grow-in_280ms_cubic-bezier(0.22,1,0.36,1)_forwards] w-full"
        />
      ) : null}
    </div>

    {/* Right-side actions: hamburger and inline nav share one container,
        cross-animating at md via max-w/opacity. No overflow-hidden on either
        wrapper so absolutely-positioned dropdowns are never clipped. */}
    <div className="flex items-center justify-end shrink-0">

      {/* Hamburger wrapper — collapses away at md+ */}
      <div
        className="max-w-[3rem] opacity-100 pointer-events-auto transition-[max-width,opacity] duration-[220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),ease] md:max-w-0 md:opacity-0 md:pointer-events-none"
        ref={menuRef}
      >
        <button
          type="button"
          className="inline-flex items-center justify-center w-12 h-12 border border-[rgba(255,255,255,0.08)] rounded-[0.95rem] bg-[rgba(255,255,255,0.03)] text-text-primary cursor-pointer"
          aria-expanded={showMenu}
          aria-haspopup="menu"
          aria-label={showMenu ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => { setShowMenu(c => !c); setShowCardsMenu(false); setShowToolsMenu(false); }}
        >
          <MenuIcon open={showMenu} />
        </button>
        {showMenu ? (
          <>
            {/* Backdrop — mobile only, hidden at sm+ */}
            <button
              type="button"
              className="fixed inset-0 border-0 p-0 bg-[rgba(2,3,7,0.48)] z-[69] sm:hidden"
              aria-label="Close navigation menu"
              onClick={() => setShowMenu(false)}
            />
            {/* Dropdown — fixed full-width below sm, absolute compact at sm–md */}
            <Menu
              sections={navSections}
              aria-label="Navigation"
              className="fixed left-[var(--space-shell-x)] right-[var(--space-shell-x)] top-[4.5rem] z-70 sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.65rem)] sm:w-[min(22rem,82vw)]"
            />
          </>
        ) : null}
      </div>

      {/* Nav items wrapper — expands in at md+ */}
      <div className="inline-flex items-center gap-[0.4rem] max-w-0 opacity-0 pointer-events-none transition-[max-width,opacity] duration-[220ms,180ms] ease-[cubic-bezier(0.22,1,0.36,1),ease] md:max-w-[34rem] md:opacity-100 md:pointer-events-auto">
        <div className="relative" ref={cardsMenuRef}>
          <MenuItem
            variant="inline"
            label="Cards"
            chevron
            onClick={() => { setShowCardsMenu(c => !c); setShowToolsMenu(false); setShowMenu(false); }}
            selected={activeSection === "cards"}
            aria-expanded={showCardsMenu}
            aria-haspopup="menu"
          />
          {showCardsMenu ? (
            <Menu
              sections={[{ items: [
                { href: "/cards", label: "Card Search" },
                { href: "/cards/learn-to-search", label: "Learn to Search" },
                { href: "/cards/query-builder", label: "Query Builder" },
              ]}]}
              aria-label="Cards"
              className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] z-10"
            />
          ) : null}
        </div>
        <MenuItem variant="inline" href="/deck-explorer" label="Deck Explorer" />
        <div className="relative" ref={toolsMenuRef}>
          <MenuItem
            variant="inline"
            label="Tools"
            chevron
            onClick={() => { setShowToolsMenu(c => !c); setShowCardsMenu(false); setShowMenu(false); }}
            selected={activeSection === "tools-tier-list" || activeSection === "tools-sealed-pools" || activeSection === "tools-trade-balancer"}
            aria-expanded={showToolsMenu}
            aria-haspopup="menu"
          />
          {showToolsMenu ? (
            <Menu
              sections={[{ items: [
                { href: "/tools/tier-list", label: "Tier List Generator" },
                { href: "/tools/sealed-pools", label: "Sealed Simulator" },
                { href: "/tools/trade-balancer", label: "Trade Balancer" },
              ]}]}
              aria-label="Tools"
              className="absolute right-0 top-[calc(100%+0.65rem)] min-w-[14rem] z-10"
            />
          ) : null}
        </div>
      </div>

    </div>
  </nav>
</header>
```

### Modified: `frontend/src/app/AppHeader.stories.tsx`

Remove stories that rely on `headerShellMode` / `desktopHeaderStage` props or
demonstrate the dual-template behavior. Add viewport-based stories:

| Story | Viewport | What to verify |
|---|---|---|
| `Mobile` | 375 px | Logo + hamburger; no search (home page context) |
| `MobileWithSearch` | 375 px | Logo + search + hamburger (cards page context) |
| `MobileMenuOpen` | 375 px | Hamburger open — full-width fixed dropdown + backdrop |
| `Tablet` | 700 px | Logo + hamburger (below md); dropdown is compact absolute |
| `TabletMenuOpen` | 700 px | Compact absolute dropdown, no backdrop |
| `Desktop` | 900 px | Inline nav visible; no hamburger |
| `Wide` | 1200 px | Inline nav + wordmark visible |

### Modified: `frontend/AGENTS.md`

Replace the navigation guidance paragraph:

**Before:**
> Navigation should be authored mobile-first and scaled upward. Prefer separate
> mobile and desktop navigation implementations that share tokens and data but
> are purpose-built for their interaction model.

**After:**
> Navigation should be authored mobile-first and scaled upward. The small/narrow
> starting point should be designed with mobile interaction in mind, but there
> should be no separate "mobile version" of any component. Elements should
> naturally appear, grow, or change behavior at progressively larger breakpoints
> — a single implementation that scales up. Avoid code duplication between
> viewport sizes; use CSS breakpoints to change behavior rather than
> conditionally rendering separate trees.

### Modified: `frontend/UI_ARCHITECTURE.md`

Apply the same navigation philosophy update in the responsive architecture section,
keeping alignment with the AGENTS.md wording.

---

## Files touched

| File | Change |
|---|---|
| `frontend/src/lib/headerLayout.ts` | **Delete** |
| `frontend/src/lib/index.ts` | Remove headerLayout re-exports |
| `frontend/src/app/AppHeader.tsx` | Rewrite — single template, remove state machine |
| `frontend/src/app/AppHeader.stories.tsx` | Update stories for new viewport-based coverage |
| `frontend/src/ui-elements/CardSearchInput.tsx` | Remove `isCompact` prop, single placeholder |
| `frontend/src/ui-elements/CardSearchInput.stories.tsx` | Remove `isCompact`-dependent stories |
| `frontend/AGENTS.md` | Update nav philosophy guidance |
| `frontend/UI_ARCHITECTURE.md` | Mirror nav philosophy update |

---

## Test plan

**Automated:**
- `npm run build -w @noxiannet/frontend` — no TypeScript errors
- `npm run test -w @noxiannet/frontend` — all existing tests pass

**Storybook:**
- Open `AppHeader` stories at each defined viewport; confirm correct element visibility
- At `MobileMenuOpen` (375 px): full-width dropdown, backdrop visible
- At `TabletMenuOpen` (700 px): compact absolute dropdown, no backdrop
- Confirm `CardSearchInput` story shows `"Search for Cards"` placeholder

**Manual resize sweep (dev server):**
- Start at 320 px, drag to 1400 px
- Cross ~640 px: hamburger dropdown switches from fixed full-width to compact absolute (discrete — no dropdown open during resize)
- Cross ~768 px: hamburger and nav items cross-animate (hamburger collapses, nav items expand, ~220 ms)
- Cross ~1024 px: wordmark slides in (animated, ~220 ms)
- Drag back down — all transitions reverse

**Interaction checks at each mode:**
- Hamburger (mobile, <640 px): dropdown opens full-width with backdrop; backdrop click closes; Escape closes
- Hamburger (compact, 640–768 px): dropdown opens as compact absolute; no backdrop; outside-click closes; Escape closes
- Inline nav (≥768 px): Cards and Tools dropdowns open/close; outside-click and Escape close them
- Route navigation closes all open menus

**Header search lifecycle:**
- Home page: search slot empty on load; input appears after hero search scrolls below header
- `/cards` page: search always visible in the flex-1 slot
- Placeholder reads `"Search for Cards"` in both contexts

---

## Assumptions

- `LayoutModeBreakpoints` (sm=640, md=768, lg=1024, xl=1280) in `constants.ts` is
  unchanged and continues to be used by the home page container queries.
- The `top-[4.5rem]` value for the mobile fixed dropdown positions the menu below the
  header (60 px min-height + padding). If the header height ever changes this value
  needs updating; a CSS custom property (`--site-header-height`) already exists for
  this purpose.
- `CardSearchInput` is used in two places: `AppHeader` and the home page hero. The
  home hero never passed `isCompact`, so removing the prop has no effect there.
- No other file imports from `headerLayout.ts` directly; all consumers go through
  `lib/index.ts`.
- The `sm:absolute` override of `fixed` on the hamburger dropdown relies on Tailwind
  generating `sm:` as a higher-specificity rule than the base. This is standard
  Tailwind v4 behavior but should be confirmed in Storybook at exactly 640 px.
