# Frontend UI Architecture Preferences

This document captures the preferred design and implementation model for future
UI work in `frontend/`. It is motivated by the homepage and navigation redesign
work already completed in this repository.

Use this file as the durable source of truth for responsive UI architecture,
especially when reworking shared shells, homepage sections, navigation, and
Storybook-driven component review.

## Core Philosophy

- Design mobile-first.
- Scale up from the smallest useful layout instead of shrinking a desktop
  layout down.
- Build shared systems before page-specific polish.
- Prefer reusable semantic tokens and shared surface primitives over one-off
  page styles.
- Treat Storybook as a first-class review environment, not an afterthought.

## Responsive Model

### Mobile First

- Base styles should target narrow screens by default.
- Larger-screen behavior should be layered on progressively.
- The standard expansion breakpoints are:
  - `640px`
  - `768px`
  - `1024px`
  - `1280px`

### Container Queries First

Use `@container` for component-level adaptation:

- cards
- hero content blocks
- search panels
- shared promotional surfaces
- modular layout groups

Components should respond to the width of the surface they live in, not assume
the full browser viewport is the only layout signal.

This is required so components behave correctly in:

- Storybook canvases
- embedded layouts
- future split-pane or dashboard contexts
- page shells with constrained widths

### Viewport Queries Only For Shell-Level Changes

Reserve viewport media queries for true app-shell behavior such as:

- switching between separate desktop and mobile navigation implementations
- showing or hiding desktop-only chrome
- changing global page framing that depends on the actual device/browser window

Do not use viewport media queries for component internals when container width
is the real signal.

## Navigation Architecture

Navigation should be written mobile-first and expanded upward.

### Separate Mobile And Desktop Nav

Do not treat desktop nav as the base component and shrink it into mobile.
Implement:

- a dedicated mobile navigation experience
- a dedicated desktop navigation experience

The mobile version should be:

- hamburger or drawer based
- tap friendly
- organized around clear grouped actions
- capable of handling nested actions with explicit expandable controls

The desktop version should be:

- full-width
- directly scannable
- optimized for pointer and keyboard use

They may share tokens, iconography, labels, and navigation data, but they
should not be the same UI mechanically scaled down.

### Mobile Interaction Requirements

- minimum `44px` touch target height
- no hover-only critical behavior
- tap equivalents for anything desktop exposes on hover
- enough spacing for imprecise/fat-finger input

## Homepage And Hero Rules

For homepage work, the primary CTA is the hero search area and the content
stack immediately above it.

On mobile, above the fold should prioritize only:

- the hero headline/brand stack
- the primary search CTA

Everything else should come after that block.

Additional guidance:

- hero layouts should start centered on small screens unless there is a strong
  reason not to
- scaling between breakpoints should be continuous and mathematically close on
  either side of a transition
- when transitions cannot be fully continuous, add small eased transitions to
  reduce perceived snapping
- lower content such as feature cards may remain left-aligned even when hero
  copy is centered

## Shared Design System Expectations

Shared visual decisions belong in the foundation first.

Use:

- `frontend/src/ui-foundation.css` for semantic tokens and shared primitives
- `frontend/src/styles.css` for route and feature composition built on those
  tokens

Promote decisions into tokens when they represent shared meaning, such as:

- accent gradients
- button treatments
- border strengths
- hover emphasis
- surface hierarchy
- text color roles

Avoid introducing reusable colors or shadows directly inside feature-local CSS
when they really belong to the system.

## Storybook Expectations

Storybook is the primary UI review harness for iterative design work.

### Story Structure

- group stories by system area, not by arbitrary catch-all demo pages
- shared patterns should live in shared folders, not be buried inside a page
  story
- prefer focused stories for individual reusable primitives instead of one
  oversized sandbox story

### Responsive Behavior In Storybook

- components must render correctly when the Storybook canvas is resized
- component responsiveness should not depend on global window size unless the
  behavior is truly shell-level
- if a story represents a device frame, keep that frame explicit and stable
- if Storybook hot reload appears stale after major CSS changes, restart the
  Storybook server fresh before judging the result

### Storybook-Only Mocking

When a story includes navigation or controls that would leave Storybook:

- mock the interaction in Storybook
- keep the user inside the story
- preserve visual and behavioral review value without requiring real routing

## Component Design Preferences

- Single-column and stacked on mobile first.
- Expand to two-column and three-column patterns only when the container has
  enough room.
- Do not remove important explanatory content at intermediate widths unless
  that simplification is deliberate and still reads well.
- If a card becomes stacked vertically and has room again, restore its richer
  content rather than leaving it in a collapsed desktop-derived state.
- Decorative UI that is not essential should be hidden or reduced on mobile.

## Implementation Workflow

When doing future UI overhaul work:

1. Update the design tokens and shared primitives first.
2. Build or revise the shared shell and foundational responsive patterns.
3. Rework one flagship route using the new system.
4. Extract stable reusable patterns into shared stories.
5. Roll the system out across the rest of the site incrementally.

Avoid mixing broad visual architecture work with unrelated product logic unless
the user explicitly wants both in the same pass.

## Verification Checklist

For meaningful UI changes, verify:

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
- `npm run test:storybook -w @noxiannet/frontend`
- `npm run build-storybook -w @noxiannet/frontend`

Manual review should confirm:

- mobile-first rendering looks intentional at narrow widths
- component layouts respond correctly to Storybook canvas resizing
- primary CTAs remain visible without scrolling where required
- desktop and mobile navigation both feel purpose-built
- tap targets remain large enough on mobile
