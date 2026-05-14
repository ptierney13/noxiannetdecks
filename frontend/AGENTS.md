# Frontend Agent Notes

This file adds frontend-specific guidance on top of the repository root
`AGENTS.md`.

## Scope

These notes apply when editing files under `frontend/`.

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
