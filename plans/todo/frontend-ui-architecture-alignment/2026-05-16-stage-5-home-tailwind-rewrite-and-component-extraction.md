# Stage 5: Home Tailwind Rewrite and Component Extraction

## Summary

Stage 5 rewrites the Home page in Tailwind, preserving its current visuals
exactly, and extracts any element that belongs in `ui/` into a proper shared
component. The output is a correct Home implementation and a populated `ui/`
component library that later page rewrites can build on.

This stage does not touch any other page. It does not add new features to Home.
It does not change any routing, data loading, or `cardFormat.tsx`.

## Confirmed decisions this stage inherits

| Concern | Decision |
|---|---|
| Styling | Tailwind utility classes. No new `styles.css` selectors. Remove replaced selectors from `styles.css` as components are rewritten. |
| Component placement | Extracted presentational components → `ui/`. Home-specific layout, content, and behavior → `siteSystem.tsx`. |
| Visuals | Must match current Home visuals. Not a redesign. |
| Storybook | Required for all extracted `ui/` components. Existing Home stories must still pass. |

## What "correct code structure" means for Home

After this stage, the Home implementation should follow this pattern:

- `siteSystem.tsx` owns: Home-specific page layout, hero section markup and
  content, feature card data, promo card data, artwork showcase, and any
  logic or state that is only meaningful on Home
- `ui/` owns: any presentational component that is product-agnostic and could
  appear on another page — section headings, eyebrow labels, arrow link cards,
  icon tiles, empty/loading states, and similar
- All class names in `siteSystem.tsx` are Tailwind utilities or `var(--color-*)`
  arbitrary values — no named CSS selectors
- All class names in extracted `ui/` components follow the same rule

## Key Changes

### 1. Audit `siteSystem.tsx`

Before writing any code, classify every element:

| Element | Classification | Reason |
|---|---|---|
| `SearchGlyph`, `ChevronGlyph`, `MenuGlyph`, etc. (inline SVGs) | Evaluate — likely already in `ui/Icon.tsx` or should be | |
| `FeatureCard` | `ui/` candidate — presentational link card with icon, title, description | |
| `PromoCard`, `PromoCardButton` | `ui/` candidate — labeled arrow-link surface | |
| `ArtworkShowcase` | Home-specific — content and image asset are Home-only | |
| `RouteSurfacePreview` | Storybook-only utility — keep in `siteSystem.tsx` or move to storybook helpers | |
| `StorybookViewport` | Storybook-only utility — same | |
| `HomePage` section layout | Home-specific — page-level layout composition stays | |

Finalize the classification table before writing any code. Update this plan
with the resolved column before submitting to the user for approval.

### 2. Extract components to `ui/`

For each component classified as a `ui/` candidate:
- Write the component in Tailwind
- Export it from `ui/index.ts`
- Add a Storybook story covering the default state and any meaningful variants
- Remove the corresponding selectors from `styles.css`

### 3. Rewrite Home in Tailwind

For each element remaining in `siteSystem.tsx` (Home-specific):
- Replace all CSS class name strings with Tailwind utility classes or
  `var(--color-*)` arbitrary values
- Remove the corresponding selectors from `styles.css`
- Do not alter layout, spacing, or visual appearance — match the current
  output as closely as possible

### 4. Update Storybook stories

- Confirm all existing Home stories (`home.stories.tsx`,
  `home-shared-feature-cards.stories.tsx`, etc.) still render correctly
- Add stories for any newly extracted `ui/` components
- If `StorybookViewport` or `RouteSurfacePreview` move, update imports in all
  story files

### 5. Produce a component manifest

The stage completion message must include a written manifest:

```
ui/ components after Stage 5:
- ComponentName — description, story file
- ...

Remaining in siteSystem.tsx (Home-specific):
- Element — reason it is Home-specific
- ...

styles.css selectors removed in this stage:
- .selector-name
- ...
```

This manifest is the starting inventory for every subsequent page rewrite.

### 6. Rename `siteSystem.tsx`

After the rewrite and extraction are complete and tests pass, rename
`siteSystem.tsx` to `home.tsx`. The file will contain only Home-specific
content by this point; the `siteSystem` name is a legacy artifact that will
mislead future agents. Update the import in `app/router.tsx` accordingly.

### 7. Rewrite `AppShell.tsx` in Tailwind

`AppShell.tsx` is the site-wide navigation shell. It currently uses CSS class
names (`site-header`, `site-nav`, `site-nav--desktop`, etc.) that resolve to
`styles.css` selectors. Stage 5 is the natural home for this work because:
- It shares the CSS migration concern with the Home rewrite
- The AppShell selectors are the largest remaining block in `styles.css` after
  Home is done
- Completing it here means no CSS class names remain in `app/` after Stage 5

Approach:
- Replace all CSS class name strings in `AppShell.tsx` with Tailwind utility
  classes, matching the current visual output exactly
- Remove the corresponding selectors from `styles.css`
- Do not change any AppShell behavior, state, or navigation logic
- Update the `appshell.stories.tsx` Storybook story to confirm it still renders

AppShell does not extract shared components — its structure is shell-specific.
The Tailwind rewrite is purely a class-name replacement.

## Scope Guardrails

- Do not touch `SearchView.tsx`, `cardFormat.tsx`, or any other page file
- Do not add new visual elements or layout sections to Home or AppShell
- Do not change routing or data loading
- Do not change `PageShell`
- Do not add new `styles.css` selectors under any circumstances

## Test Plan

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
- `npm run build-storybook -w @noxiannet/frontend`
- `npm run test:storybook -w @noxiannet/frontend`
- Visual review: Home page in browser must match pre-stage appearance
- Visual review: AppShell (header, nav, menus) must match pre-stage appearance across desktop, compact, and mobile breakpoints
- Visual review: all Home and AppShell stories in Storybook must render correctly
- Confirm all replaced `styles.css` selectors have been removed

## Exit Criteria

- `siteSystem.tsx` has been renamed to `home.tsx`; import in `app/router.tsx` updated
- `home.tsx` uses only Tailwind utilities — no named CSS class strings referencing `styles.css`
- `AppShell.tsx` uses only Tailwind utilities — no named CSS class strings referencing `styles.css`
- All extracted `ui/` components have barrel exports and Storybook stories
- All removed `styles.css` selectors are confirmed gone from both Home and AppShell passes
- Home visuals are unchanged from pre-stage appearance
- AppShell visuals are unchanged from pre-stage appearance
- All existing tests and Storybook stories pass
- Component manifest is recorded in the completion message
