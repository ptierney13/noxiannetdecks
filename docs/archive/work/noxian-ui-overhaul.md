# Plan: Noxian UI Overhaul

## Summary
Replace the current light-mode teal UI with the Noxian dark theme established in `mockup-bg-a-armory.html`. The homepage becomes a proper landing page with a hero section, crossed-swords watermark, and feature cards. The sticky centered nav with wordmark carries across all pages. All existing functionality (card search, deck explorer, tier list, sealed pools) is preserved — only the visual layer changes.

## Key Changes

### 1. `frontend/index.html`
- Add Google Fonts preconnect + stylesheet for **Outfit** (wght 400–900)

### 2. `frontend/src/styles.css` — full replacement
- New CSS custom properties (Noxian palette):
  - `--bg: #0a0b10`, `--surface: #14151e`, `--surface-2: #1c1e2a`
  - `--border`, `--border-mid`, `--border-strong` (warm parchment tint at low opacity)
  - `--red: #b52038`, `--red-dim`, `--red-glow`, `--amber: #c9813a`
  - `--text: #b8bccf`, `--text-strong: #e8eaf2`, `--text-muted: #44485e`
- Base: dark body, Outfit font
- **Nav**: sticky, `grid 1fr auto 1fr`, 62px height, blur backdrop, wordmark + logo
- **Homepage**: `.hero`, `.hero-bg-wrap` (masked SVG watermark), `.hero-content`, `.hero-heading` gradient, `.search-box` styled
- **Feature cards**: `.feature-card`, `.feature-icon-tile` (red→amber gradient bg, white line-art SVG), `.feature-arrow`
- **Promo cards**: `.promo-card`, `.promo-label`
- **All existing views** (card search panel, sealed simulator, deck explorer, tier list): convert from light palette to dark — swap background/surface colors, borders, text colors, button styles. Keep all layout/grid logic intact.
- **Shared components**: error banner, collapsible tables, view-tabs, query language guide — all darkened

### 3. `frontend/src/App.tsx`
- Add `HomePage` component: hero with crossed-swords SVG, search box (wired to navigate to `/cards?q=`), three feature cards (Card Search / Deck Explorer / Sealed Pools with gradient icon tiles + line-art SVGs), two promo cards (Tier List / Tournament Results)
- Add `/` and `/home` routes → `HomePage`
- Rework header JSX:
  - Replace `.app-header` / `.project-tabs` with new `.nav` structure
  - Add wordmark (`NoxianNet Decks`) + red logo square
  - Center nav links using grid layout
  - Tools dropdown retained
- Remove `.app-shell` padding from homepage (hero is full-width); keep it for inner pages

## Assumptions
- No new routes, pages, or API changes — purely visual
- Sealed pools, tier list, deck explorer keep their existing component structure; only CSS class styling changes
- Google Fonts Outfit loaded from CDN (same as mockups); acceptable for production
- The `/cards` route stays as the card search view; the homepage search box navigates there with the query pre-filled

## Test Plan
- [ ] Homepage renders with hero, watermark, feature cards, promo cards
- [ ] Clicking each feature card navigates to the correct route
- [ ] Search box on homepage submits and navigates to `/cards?q=<query>`
- [ ] Nav wordmark visible, links centered, Tools dropdown works on all pages
- [ ] Card search view renders correctly with dark theme
- [ ] Deck explorer view renders correctly with dark theme
- [ ] Tier list view renders correctly with dark theme
- [ ] Sealed pools view renders correctly with dark theme
- [ ] No regressions in existing functionality (search, pool generation, deck snapshots)
- [ ] `npm run build` passes with no TypeScript errors
