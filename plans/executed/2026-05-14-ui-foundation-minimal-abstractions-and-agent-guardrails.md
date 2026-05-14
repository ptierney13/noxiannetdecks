# UI Foundation: Minimal Abstractions And Agent Guardrails

## Summary

Prepare the frontend for a larger visual overhaul by extracting only the
smallest shared UI foundation that materially improves maintainability:
semantic design tokens, a few shared UI primitives, and clear contributor
rules for future agent-driven UI work. This is intentionally not a full design
system project. The goal is to make future "vibe" changes cheaper without
slowing the current redesign effort behind a broad architecture rewrite.

## Key Changes

### 1. Introduce a minimal semantic token layer

- Keep the existing visual direction working, but add a semantic layer on top
  of the raw palette values in `frontend/src/styles.css`.
- Define a small set of shared tokens for categories that are currently mixed
  between raw palette names and one-off hardcoded values, such as:
  - app background and surfaces
  - primary and secondary text
  - primary accent and accent hover/focus states
  - positive, negative, warning, and info states
  - borders, shadows, and interactive focus rings
- Normalize obvious token inconsistencies discovered during the extraction,
  including any references to undefined variables.

### 2. Pull the most reused primitives into a cleaner shared foundation

- Refactor the CSS and component structure around the primitives that show up
  repeatedly across routes, rather than trying to componentize everything.
- Target only the shared building blocks that future UI work will keep touching:
  - buttons
  - inputs/selects
  - card/panel surfaces
  - section headings / route panels
  - simple status treatments
- Keep this lightweight: use shared class patterns and small React helpers only
  where they reduce duplication clearly.

### 3. Remove the highest-value hardcoded visual logic from TSX

- Move the most important styling constants out of feature files and into the
  shared UI foundation where practical.
- Prioritize:
  - query-builder domain and rarity styling constants
  - shared status and accent colors used in feature views
  - chart / comparison colors that should follow the app theme rather than
    living as isolated literals
- Leave purely data-driven or layout-specific inline styles alone unless they
  interfere with the new shared foundation.

### 4. Add explicit UI contributor guardrails for future agent work

- Add a repository-level UI guidance document for future coding agents and
  humans working on the frontend.
- Document the intended rules for:
  - using semantic tokens instead of new hardcoded colors
  - preferring shared primitives for common controls and surfaces
  - avoiding feature-specific one-off styling when a shared pattern exists
  - where new UI code should live
  - when inline styles are acceptable versus when they should become tokens or
    classes
  - how to approach future visual overhauls without regressing the structure
- Wire this guidance into `AGENTS.md` so future sessions are pointed at the UI
  conventions before editing frontend code.

### 5. Keep the work bounded to "foundation for redesign"

- Do not redesign the whole app in this change.
- Do not introduce a heavyweight component library.
- Do not split every screen into design-system components.
- Focus on reducing future friction while preserving current behavior and
  existing routes.

## Test Plan

- Run `npm test` in `frontend/`.
- Run `npm run build` in `frontend/`.
- Manually verify the core routes still render and behave correctly:
  - homepage
  - card search
  - query builder
  - deck explorer
  - tier list
  - trade balancer
- Spot check that the extracted tokens and primitives are actually used by the
  updated views rather than sitting unused beside older styling.
- Confirm the new UI guidance is discoverable from `AGENTS.md` and clearly
  points future contributors toward the shared foundation.

## Assumptions

- A small semantic token layer and a few shared primitives will provide most of
  the value needed before a full visual overhaul.
- The existing current theme should remain visually close to today's app after
  this refactor; large appearance changes belong to the later redesign pass.
- Repository-level agent instructions can be extended safely to include frontend
  organization guidance as long as they stay practical and specific.
- It is acceptable to improve the frontend structure without adding Storybook or
  a larger visual regression tool in this same change.
