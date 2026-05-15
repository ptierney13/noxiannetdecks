# Plan: Top-Level Design System Overhaul And Storybook

## Summary

Overhaul the frontend visual system from the top down instead of restyling
individual routes in isolation. The implementation should establish a more
deliberate shared design architecture across `frontend/src/ui-foundation.css`,
`frontend/src/styles.css`, and the app shell so the homepage, navigation, and
core route surfaces all inherit the new direction from a common system.

The redesign should stay organized around reusable tokens, shared layout
patterns, and route-level composition. It should also add Storybook plus
baseline visual tests so future UI iteration can happen through isolated
component and page-shell review rather than ad hoc full-app edits.

## Key Changes

### 1. Expand the shared visual foundation into a real top-level system

- Replace the current minimal token layer with a more complete semantic system
  for:
  - background strata and atmosphere
  - surfaces and elevated surfaces
  - text hierarchy
  - accent, highlight, and focus treatments
  - borders, shadows, radii, and spacing
  - shared decorative assets such as the primary background art treatment
- Keep raw palette values centralized and map route-visible styling through
  semantic aliases in `frontend/src/ui-foundation.css`.
- Add a small set of reusable foundation primitives and utility patterns for:
  - page shells
  - section headers
  - feature cards / spotlight cards
  - search surfaces
  - navigation menus
  - shared content rails / grids
- Move any obvious repeated route-level visual decisions out of feature markup
  and into shared CSS classes where they describe the product’s design language
  rather than local behavior.

### 2. Rebuild the global shell around shared layout architecture

- Refactor the app shell in `frontend/src/App.tsx` so top-level layout concerns
  are owned by shared structures rather than embedded in specific routes.
- Introduce a clearer separation between:
  - site chrome
  - home landing composition
  - standard inner-page shells
  - route content regions
- Update the global navigation, search framing, and menu presentation so the
  design language is defined once and inherited consistently.
- Rework the homepage to match the provided references as closely as practical
  using shared hero, feature-grid, and promo/surface patterns that can be
  reused elsewhere.
- Where current page-specific styling duplicates patterns that belong at the
  shell or shared-surface level, promote them upward into the shared design
  architecture.

### 3. Integrate the provided background art as a system asset

- Add the provided background image into the frontend in a way that supports:
  - desktop and mobile responsive positioning
  - reuse across the homepage and potentially the shared shell
  - layered overlays or masks driven by the design system instead of page-local
    inline styling
- Treat the art as a top-level design asset, not a one-off page background.
- If the linked reference asset is not directly retrievable from the repo
  environment, use a temporary fallback only for implementation scaffolding and
  keep the final integration point ready for the real asset swap.

### 4. Add Storybook and visual iteration coverage

- Install and configure Storybook for the frontend workspace.
- Add stories for the top-level shared design architecture, prioritizing:
  - global page shell / navigation states
  - homepage hero and feature sections
  - shared cards, panels, and search surfaces
  - representative route shells for cards, deck explorer, and tools
- Add Storybook test coverage suitable for future UI passes, such as:
  - smoke coverage that stories render
  - interaction coverage where useful for menus/search affordances
  - visual snapshot coverage for core system states if supported cleanly by the
    chosen setup
- Add package scripts and documentation so future redesign work can use
  Storybook as the primary isolated review surface.

### 5. Keep the work intentionally top-level

- Do not spend this pass optimizing every page independently.
- Prefer swapping shared tokens, shell structures, and primitives even if that
  means some downstream views change broadly.
- Preserve existing route behavior and data flow unless a small structural
  change is needed to support the new top-level design system.
- Avoid introducing a heavyweight component abstraction layer unless it clearly
  reduces duplication at the shared-shell/design-system level.

## Test Plan

- Run `npm run test -w @noxiannet/frontend`.
- Run `npm run build -w @noxiannet/frontend`.
- Run Storybook test coverage for the added stories.
- Manually verify the redesigned shared shell and responsive behavior on:
  - homepage
  - card search
  - query builder
  - deck explorer
  - tier list
  - trade balancer
- Manually check desktop and mobile layouts against the provided reference
  direction, especially:
  - navigation hierarchy
  - hero composition
  - background art placement
  - shared surface/card treatment
- Confirm the new shared tokens and layout primitives are actually consumed by
  the updated routes rather than sitting beside older page-specific styling.

## Assumptions

- This counts as significant project work and requires approval before
  implementation begins.
- The user wants a broad top-level visual replacement, even if some secondary
  routes shift noticeably as a side effect.
- Existing app behavior, routing, and data integrations should remain intact;
  the primary change is presentation architecture.
- The linked ChatGPT reference pages may not be directly fetchable from this
  environment, so exact visual matching may require either locally supplied
  assets or a later pass once the references are accessible in-repo.
- Before implementation starts, work should move onto a fresh `codex/*` branch
  created from an updated `origin/main`, per repository workflow.
