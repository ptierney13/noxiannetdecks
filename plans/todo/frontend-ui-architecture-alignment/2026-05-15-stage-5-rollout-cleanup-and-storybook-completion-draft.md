# Draft Plan: Frontend UI Alignment Stage 5 — Rollout, Cleanup, and Storybook Completion

## Summary

This is a draft summary plan and must be finalized and approved before
implementation begins.

Stage 5 completes the rollout by moving any remaining route surfaces onto the
approved shared component, routing, and data patterns; closing Storybook
coverage gaps; and removing all temporary compatibility code and legacy
structural leftovers that earlier stages intentionally left behind.

This stage should end with a frontend that is substantially easier for a
managing agent and subagents to extend safely. All architectural decisions are
settled in Stages 0–4 — this stage applies and finalizes them.

## Confirmed decisions this stage inherits (do not reopen)

| Concern | Decision |
|---|---|
| CSS | Tailwind only; `styles.css` must be empty or deleted by end of this stage |
| Routing | TanStack Router — fully adopted in Stage 3 |
| Server state | TanStack Query — fully adopted in Stage 4 |
| Tests | Co-located; `App.test.tsx` monolith disbanded by end of this stage |
| Module public API | Barrel `index.ts` per layer |

## Key Changes

### 1. Finish route-by-route adoption of shared patterns

- Rework remaining route surfaces so they consume the approved shared shell,
  shared component, TanStack Router navigation, and TanStack Query data patterns.
- Remove route-local UI implementations that are no longer justified.
- Move any remaining cross-route domain UI to `features/` per the Stage 1 rule.

### 2. Complete Storybook coverage

- Ensure all meaningful shared components and nested inspectable components have
  Storybook stories/tests covering default, loading, empty, and error states.
- Add route assembly stories where needed to show how the shared pieces combine
  in real application surfaces.
- Do not treat tiny private helpers as coverage gaps unless they expose a
  meaningful inspectable state the user should review directly.

### 3. Remove all legacy structural leftovers

- Delete `styles.css` (must be empty by this point if CSS migration proceeded
  correctly in earlier stages).
- Disband `App.test.tsx` — tests must be co-located with their source files.
- Delete any remaining hand-rolled routing or `useEffect` data-fetching code.
- Remove compatibility shims only after their replacement patterns are verified.

### 4. Tighten documentation around the final architecture

- Refresh `frontend/UI_ARCHITECTURE.md` and nested `AGENTS.md` files so they
  describe the architecture as it actually exists after rollout.
- Verify that the "where does X go?" quick reference is accurate and complete.
- Call out any intentionally retained exceptions so they remain visible instead
  of silently becoming new drift.

### 5. Standardize completion communication

Final handoff expectations:
- Changed components named directly
- New functionality called out explicitly
- Storybook stories/tests listed so the user can inspect them

### 6. Confirm the manageable steady state

- Validate the final structure matches the Stage 1 ownership contract.
- Confirm future work can be placed in the correct layer without reinterpreting
  the architecture.
- Record any justified exceptions explicitly in the docs.

## Test Plan

- Run:
  - `npm run test -w @noxiannet/frontend`
  - `npm run build -w @noxiannet/frontend`
  - `npm run test:storybook -w @noxiannet/frontend`
  - `npm run build-storybook -w @noxiannet/frontend`
- Manually inspect shared and route-level Storybook surfaces for the final
  migrated areas.
- Confirm `styles.css` is empty or deleted.
- Confirm `App.test.tsx` is disbanded and tests are co-located.
- Confirm documentation and folder boundaries match the final implementation.
- Confirm any remaining exceptions are explicitly documented and justified.

## Exit Criteria (initiative completion)

These are the initiative-level done criteria; all must be true:

- `App.tsx` owns only provider wrappers and TanStack Router's `<RouterProvider>`
- All route entrypoints live under `routes/` as TanStack Router route objects
- Zero `window.history` calls in any non-test code
- Shared UI is discoverable under `ui/` with barrel exports and Storybook coverage
- Shared domain UI is discoverable under `features/` with Storybook coverage
- Shared data helpers are discoverable under `data/` with barrel exports
- `styles.css` is empty or deleted
- `App.test.tsx` is disbanded; tests are co-located
- Docs reflect the final boundaries and tell future agents where new work goes

## Assumptions

- Earlier stages leave behind transitional structure that this stage removes.
- By the end of this stage, Storybook coverage is broad enough that all UI
  design work can reliably be reviewed there first before touching the live app.
- No new architectural decisions are made in this stage.
