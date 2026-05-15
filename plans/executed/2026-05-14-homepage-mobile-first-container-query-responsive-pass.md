# Plan: Homepage Mobile-First Container-Query Responsive Pass

## Summary

Refactor the homepage responsive architecture so it is mobile-first by default,
container-query driven at the component level, and reliable inside Storybook
resizable canvases as well as the real app shell. This pass should keep the
existing top-level design direction, but replace viewport-dependent homepage
component behavior with container-aware patterns and a clearer separation
between mobile-specific navigation and desktop navigation.

This work is a follow-up to the executed top-level design system overhaul. The
goal here is not to add more one-off styling, but to correct the responsive
architecture so homepage sections behave consistently regardless of whether
they are rendered in the app, in Storybook, or inside other constrained
containers. It should also leave behind explicit frontend agent guidance so
future route-by-route rework follows the same mobile-first, container-query
best practices instead of regressing to viewport-coupled component styling.

## Key Changes

### 1. Rebuild homepage responsiveness around mobile-first defaults

- Make homepage base styles target mobile layouts first.
- Treat the homepage as a stacked single-column experience by default, with the
  primary hero and CTA visible above the fold on typical mobile browser sizes.
- Add larger-screen behavior progressively with min-width breakpoints at:
  - `640px`
  - `768px`
  - `1024px`
  - `1280px`
- Remove reliance on desktop-first assumptions that currently force mobile
  layouts to override overly large spacing, widths, or heading compositions.

### 2. Convert component-level layout changes to container queries

- Use `@container` rules for homepage component layout shifts such as:
  - hero composition
  - search surface sizing
  - feature card arrangement
  - promo card arrangement
  - shared homepage card density
- Ensure shared homepage stories render correctly when their Storybook canvas is
  resized, without depending on global viewport width.
- Keep viewport media queries only for true page-level shell behavior, such as:
  - switching between mobile navigation and desktop navigation
  - showing or hiding desktop-only decorative shell treatments

### 3. Split mobile and desktop navigation into distinct implementations

- Replace the current “same structure scaled down” approach with:
  - a dedicated mobile hamburger/drawer navigation flow
  - a dedicated desktop navigation bar
- Keep both implementations aligned to the same design tokens and information
  architecture, but do not force them to share the same layout structure.
- Ensure all mobile controls have touch targets at least `44px` tall.
- Preserve tap equivalents for any interaction that currently depends on hover.

### 4. Re-prioritize homepage content for mobile

- Keep only the hero content above the fold on mobile, with the primary CTA
  visible without scrolling.
- Move lower-priority feature shelves and promo content below the initial hero
  viewport area.
- Hide desktop-only decorative or secondary UI on mobile where it competes with
  the primary search action or headline clarity.
- Simplify mobile feature cards so content remains legible and on-screen within
  narrow containers.

### 5. Align Storybook structure and responsive behavior with the new model

- Update stories so homepage and shared stories remain valid under
  container-query-driven rendering.
- Verify that story canvases can be resized without breaking component layout
  assumptions.
- Keep Storybook as the primary review surface for responsive iteration, but
  ensure fresh Storybook restarts are used after meaningful CSS architecture
  changes when hot reload is unreliable.

### 6. Document the responsive architecture for future frontend work

- Update `frontend/AGENTS.md` so future frontend workers follow the same
  responsive rules by default.
- Document that:
  - mobile-first base styles are the default
  - component-level layout changes should use container queries
  - viewport media queries are reserved for true page or shell-level changes
  - shared breakpoints are `640px`, `768px`, `1024px`, and `1280px`
  - Storybook components must work when their canvas width changes
  - Storybook should be restarted fresh after meaningful CSS architecture
    changes when live refresh is unreliable

## Test Plan

- Run `npm run test -w @noxiannet/frontend`.
- Run `npm run build -w @noxiannet/frontend`.
- Run `npm run test:storybook -w @noxiannet/frontend`.
- Run `npm run build-storybook -w @noxiannet/frontend`.
- Review the updated frontend guidance in `frontend/AGENTS.md` for accuracy
  against the implemented responsive architecture.
- Restart Storybook fresh and manually verify:
  - `Design System/Home/Desktop`
  - `Design System/Home/Mobile`
  - shared homepage stories under `Design System/Shared/...`
- Manually resize Storybook canvases to confirm component responsiveness does
  not depend on global viewport width.
- Manually verify in the app that:
  - the hero and primary CTA are visible above the fold on mobile
  - desktop navigation and mobile navigation are distinct implementations
  - hover-dependent affordances have an accessible tap equivalent

## Assumptions

- This is significant frontend architecture work and requires approval before
  implementation begins.
- The user wants structural responsive correctness prioritized over preserving
  the current homepage implementation details.
- Container queries are acceptable as the default mechanism for component-level
  responsiveness across the homepage and related shared stories.
- Existing routing and feature behavior should remain intact; this pass is
  primarily about responsive layout architecture and navigation structure.
- The user's mobile content-priority rule means the hero stack above the fold
  consists only of the eyebrow/brand line, the homepage headline, and the
  visible search CTA.
- The work can proceed on the current approved design-system branch context
  unless the user explicitly wants a separate fresh branch for this follow-up.
