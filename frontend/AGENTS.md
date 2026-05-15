# Frontend Agent Notes

This file adds frontend-specific guidance on top of the repository root
`AGENTS.md`.

## Scope

These notes apply when editing files under `frontend/`.

Before significant UI work, read:

- `frontend/UI_ARCHITECTURE.md`

Treat that file as the detailed design and responsive-architecture companion to
this one.

## UI Foundation

Shared UI foundation lives in:

- `frontend/src/ui-foundation.css`
- `frontend/src/styles.css`

Use them with this intent:

- `ui-foundation.css` is for semantic tokens and small shared UI primitives.
- `styles.css` is for route- and feature-level styling that consumes the shared
  foundation.

Do not add a new raw color, shadow, or surface treatment directly into a
feature file if the value represents a reusable design decision. Put it in the
foundation first.

## Token Rules

- Prefer semantic tokens such as `--color-accent`, `--color-surface-1`, and
  `--color-positive` over raw palette values.
- Keep the raw palette in one place and map shared decisions through semantic
  aliases.
- If a visual value is used in more than one feature or describes a reusable UI
  meaning, promote it to a token instead of duplicating it.
- Domain- and rarity-specific styling should be expressed through shared token
  mappings and CSS selectors, not hardcoded inline style objects in TSX.

## Component And CSS Organization

- Prefer shared class patterns for common controls and surfaces before creating
  a new one-off variant.
- Keep React components focused on structure, state, and data flow. Push
  reusable visual decisions into CSS.
- Inline styles are acceptable only when the value is truly runtime-specific:
  geometry, measured positioning, dynamic chart coordinates, or per-instance
  computed values that would be awkward in CSS alone.
- Do not use inline styles for static spacing, colors, opacity, cursors, or
  hover-state presentation.

## Responsive Architecture

- Build frontend UI mobile-first by default. Base styles should target narrow
  screens first, then add larger-screen behavior progressively.
- Shared responsive breakpoints for expansion work are:
  - `640px`
  - `768px`
  - `1024px`
  - `1280px`
- Use `@container` queries for component-level layout changes whenever the
  component should adapt to the width of its containing surface, Storybook
  canvas, or embedded context.
- Reserve viewport media queries for true page- or shell-level changes, such
  as switching between mobile and desktop navigation implementations or showing
  desktop-only chrome/decorative shell layers.
- Do not make homepage cards, heroes, or other shared surfaces depend on the
  browser viewport width when container width is the actual layout signal.
- Storybook stories must render correctly when their canvas width changes. Do
  not rely on global viewport state for component responsiveness.
- After meaningful CSS architecture changes, prefer restarting Storybook fresh
  instead of assuming hot reload updated the active browser tab correctly.
- Navigation should be authored mobile-first and scale upward. Do not build the
  desktop nav first and merely shrink it down.
- Prefer separate mobile and desktop navigation implementations that share
  tokens/data but are purpose-built for their interaction model.

## Mobile Interaction Rules

- Touch targets should be at least `44px` tall on mobile.
- Do not rely on hover-only interactions. Anything behaviorally important on
  hover must have a tap/click equivalent.
- On mobile homepage work, protect above-the-fold real estate so the primary
  CTA remains visible without scrolling.

## When Adding UI

Before adding a new UI pattern:

1. Check whether an existing button, input, panel, tab, chip, or status style
   already covers it.
2. If the pattern is shared, extend the foundation instead of cloning styles.
3. If the pattern is feature-local, keep the styling near that feature but make
   it consume existing semantic tokens.

## Overhaul Workflow

For future redesign work:

- change tokens and shared primitives first
- update one flagship route or flow next
- reuse the resulting patterns across the remaining views
- avoid mixing a broad visual overhaul with unrelated product behavior changes

## Discoverability Requirement

If you update future UI guidance, keep both of these files aligned:

- `frontend/AGENTS.md`
- `frontend/UI_ARCHITECTURE.md`

## Verification

For meaningful frontend changes, run:

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`

Manual spot checks should include:

- homepage
- card search
- query builder
- deck explorer
- tier list
- trade balancer
