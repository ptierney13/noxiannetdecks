# Draft Plan: Frontend UI Alignment Stage 0 — Documentation Alignment and Instruction Handoff

## Summary

This is a draft summary plan and must be finalized and approved before
implementation begins.

Stage 0 resolves conflicting frontend guidance before any structural UI work
begins. Its goal is to leave the repository with one clear transitional source
of truth so later subagents do not have to reconcile legacy CSS-first guidance
with the initiative's locked Tailwind, Storybook-first, and layered-architecture
decisions while they are also changing code.

This stage is intentionally narrow. It updates instructions and architecture
guidance only. It does not move components, change app behavior, or start the
route/query migration.

## Confirmed decisions this stage inherits (do not reopen)

| Concern | Decision |
|---|---|
| CSS | Tailwind on components for all new migration work; no new rules in `styles.css` |
| Routing | TanStack Router is the target routing architecture |
| Server state | TanStack Query is the target server-state architecture |
| UI review | Storybook-first verification is required for meaningful UI work |
| Staging | Stage 0 updates instructions only; later stages implement the code changes |

## Key Changes

### 1. Replace contradictory frontend guidance with a transitional contract

- Update `frontend/AGENTS.md` and `frontend/UI_ARCHITECTURE.md` so they no
  longer present the old CSS-first organization as the default direction for
  future work.
- Mark legacy guidance as superseded where needed instead of leaving both the
  old and new guidance active at the same time.
- Make the migration-era rule set explicit:
  - no new `styles.css` selectors
  - new or migrated component styling goes on the component
  - Storybook-first verification is required
  - the target folder boundaries are `app/`, `routes/`, `features/`, `ui/`,
    `data/`, and `lib/`

### 2. Preserve useful local context while removing ambiguity

- Keep repo-specific responsive, navigation, and Storybook-review preferences
  that still apply during the migration.
- Remove or rewrite any wording that would lead a later agent to extend the
  legacy styling architecture as though it were still the preferred model.
- Add a short "during migration" section that distinguishes:
  - legacy patterns that still exist and may be encountered
  - patterns that may remain temporarily but must not be expanded
  - target patterns that new work must follow

### 3. Establish the instruction handoff for Stage 1 and later

- Document that Stage 1 inherits aligned instructions and should focus on
  inventory, boundary definition, and Storybook policy refinement instead of
  first debating which docs are authoritative.
- Ensure the frontend docs point future workers at the initiative plan folder so
  they understand the staged sequence and do not treat the current codebase
  layout as the desired end state.

## Test Plan

- Review `frontend/AGENTS.md` and `frontend/UI_ARCHITECTURE.md` after editing
  to confirm they no longer give conflicting implementation direction.
- Verify the updated docs clearly distinguish legacy constraints from the target
  migration architecture.
- Confirm later-stage agents can answer these questions unambiguously from the
  docs alone:
  - where should new shared UI go?
  - can new `styles.css` rules be added?
  - what is the required UI review path?
  - what are the target frontend layers?

## Assumptions

- The repository's current frontend docs contain useful local guidance but also
  conflicting architectural defaults that would confuse later subagents.
- A narrow documentation-only stage is safer than starting Stage 1 while the
  instructions still disagree with the initiative's locked decisions.
- The right outcome for this stage is not deletion for its own sake; it is a
  single clear transitional contract for the migration period.
