# Plan: Homepage Foundation Legacy UI Removal And Shared Shell Hardening

## Summary

Use the current branch's in-progress design-system rework as the starting
point, then aggressively simplify the frontend UI architecture so the homepage
and shared shell become the authoritative foundation for future route-by-route
cleanup. This pass is explicitly allowed to break non-home frontend pages as a
temporary consequence, as long as backend behavior and data integrations remain
untouched.

The goal is to remove or isolate legacy UI code that still leaks old viewport-
driven behavior, broad shared selectors, and mixed design-language patterns
into the new architecture. After this pass, the homepage and top-level shell
should be maintainable as a clean shared system that future AI workers can
reuse and extend safely.

## Key Changes

### 1. Establish the homepage and shell as the only current source of truth

- Treat the current branch's new shared shell and homepage direction as the
  canonical frontend foundation.
- Keep `frontend/src/siteSystem.tsx`, `frontend/src/ui-foundation.css`, and the
  shared-shell portion of `frontend/src/styles.css` as the primary surfaces for
  the redesign.
- Prefer a small set of durable shared UI primitives over repeated route-local
  styling patterns.

### 2. Aggressively remove or quarantine legacy UI selectors

- Remove, rename, or isolate old nav/home/shared-surface selectors that still
  overlap with the new shell architecture.
- Eliminate legacy viewport-coupled UI behavior where the new system should be
  container-query or shell-query driven instead.
- Stop sharing generic selector names between the old UI system and the new
  design-system layer.
- It is acceptable in this pass if some non-home routes temporarily lose visual
  polish or layout correctness after legacy CSS removal.

### 3. Harden component and styling boundaries for future reuse

- Keep React files focused on structure, route wiring, and state, with shared
  presentational decisions moved into CSS and tokenized primitives.
- Reduce inline styling except where runtime-driven geometry genuinely requires
  it.
- Clarify which shared styles belong to:
  - global foundation tokens and primitives
  - shared shell/navigation/home structures
  - route-local follow-up work for later stages

### 4. Make responsive behavior architecture-correct, not just visually patched

- Ensure homepage and shared shell responsiveness follows the documented model:
  - mobile-first base styles
  - component responsiveness driven by container queries
  - viewport queries reserved for true shell-level switches only
- Remove behaviors where components react to outer browser window changes when
  their own containing surface is the actual layout signal.
- Keep the mobile and desktop navigation implementations purpose-built and
  isolated from legacy desktop-first assumptions.

### 5. Align Storybook with the cleaned shared architecture

- Keep Storybook stories centered on shared system review, especially:
  - shell/header states
  - homepage hero and feature sections
  - narrow-container review surfaces
- Update or remove stories that preserve legacy architectural assumptions.
- Use Storybook as the main proof that shared UI responds to container width
  rather than depending on full browser viewport width.

### 6. Defer route-by-route rehabilitation intentionally

- Do not spend this pass restoring every route to full visual correctness.
- If legacy UI removal causes regressions on cards, deck explorer, or tools,
  allow that to stand unless the regression blocks the shared shell/home
  foundation work itself.
- Document the resulting boundaries clearly so later route passes can rebuild
  on the new shared system instead of reviving old CSS.

## Test Plan

- Run `npm run test -w @noxiannet/frontend`.
- Run `npm run build -w @noxiannet/frontend`.
- Run `npm run test:storybook -w @noxiannet/frontend`.
- Run `npm run build-storybook -w @noxiannet/frontend`.
- Restart Storybook fresh and manually verify:
  - homepage at desktop and mobile sizes
  - compact desktop shell/header behavior
  - narrow mobile frame behavior
  - shared stories under `Design System/...` while resizing their containers
- Manually confirm the homepage remains the most correct page after the cleanup,
  even if non-home routes temporarily regress.

## Assumptions

- This is significant frontend-only architecture work and requires approval
  before implementation begins.
- The user explicitly prefers maintainability, componentization, and future AI
  friendliness over preserving short-term visual stability on every page.
- Backend code, data flow, workers, and APIs must remain untouched.
- It is acceptable to remove legacy frontend code aggressively when it conflicts
  with the new design-system direction, even if some route-specific UI will
  need follow-up passes later.
- The current branch context is the correct place to continue this work rather
  than restarting from a new branch off `origin/main`.
