# AI Reliability Uplift — Initiative Plan

## Summary

A structured, four-stage improvement to how AI agents operate in this repo. The
goal is to close the gap identified by comparing this codebase against a more
mature AI-first workflow (manavault). The six specific patterns being addressed
are: per-package AI guidance, richer plan format, ESLint/Prettier baseline,
GitHub Actions CI, repo-local custom skills, and product-level smoke tests with
an agent-friendly dev entrypoint.

Each stage is independently shippable. Stages 1 and 2 should be done in order
because CI (Stage 2) validates the tooling that Stage 1 installs. Stages 3 and
4 are independent of each other and can be done in either order after Stage 2.

## Motivation

Without these patterns, AI-generated work in this repo has the following failure
modes:

- **Silent scope drift**: an agent working in `card_store/` or `price_store/`
  has no local invariants to read, so it guesses at constraints rather than
  following stated rules.
- **Undetected type errors and lint violations**: there is no CI gate and no
  lint script, so broken TypeScript introduced in a session only surfaces if the
  user manually runs `tsc`.
- **Reinvented workflows**: recurring multi-step agent tasks (UI preflight, card
  import validation, query engine regression) are re-invented from scratch every
  session instead of encoded as repeatable skills.
- **Undifferentiated plans**: thin plan format means agents start implementation
  with unresolved questions, unclear scope boundaries, and no unit-by-unit
  acceptance criteria, leading to overrun or drift.
- **No product-level gate**: unit tests pass while product flows break, with no
  smoke test to catch it.

## Stage Sequence

| Stage | Name | Dependencies |
|---|---|---|
| 1 | Per-package guidance + plan format | None |
| 2 | ESLint, Prettier, GitHub Actions CI | Stage 1 complete |
| 3 | Custom skills (`.agents/skills/`) | Stage 2 recommended |
| 4 | Smoke tests + agent dev entrypoint | Stage 2 recommended |

## Scope Boundaries

**In scope:**
- AGENTS.md files for each workspace that lacks one (`card_store`, `price_store`,
  `deck_store`)
- Plan format requirements in AGENTS.md and plans/todo/README.md
- ESLint flat config + Prettier across all workspaces
- GitHub Actions workflow (format check, lint, typecheck, build)
- `.agents/skills/` directory with 3–4 initial skills
- `npm run smoke:*` scripts for API and search validation
- `npm run dev:ci` entrypoint for agents

**Out of scope:**
- Drastic test coverage expansion (that is a separate initiative)
- Storybook automation improvements (handled in the frontend-ui-architecture
  alignment initiative)
- Dependency upgrades unrelated to the new tooling

## Key Decisions (pre-approved)

- ESLint flat config (`eslint.config.js`) rather than legacy `.eslintrc` — all
  workspaces are already ES2022+ and this is the current standard.
- Prettier as the formatter, integrated with ESLint via
  `eslint-config-prettier` to avoid rule conflicts.
- GitHub Actions with basic Blacksmith-style caching is not available; use
  standard `actions/cache` with pnpm store path.
- Custom skills live in `.agents/skills/<skill-slug>/SKILL.md` (mirrors
  manavault convention).
- Smoke tests are plain Node scripts invoked via `npm run smoke:*`; they are
  not Vitest tests and do not run in the unit test suite.

## Open Questions

- Should the CI workflow gate merges to `main` via branch protection rules, or
  is it advisory-only for now? (Default: advisory — no branch protection without
  `gh` CLI to configure it.)
- Which skills are highest priority for Stage 3? Candidates are: `ui-preflight`,
  `query-regression`, `plan-scaffold`, `card-import-validate`. Order TBD at
  Stage 3 finalization.
- Should `dev:ci` start both API and frontend, or API only? (Most agent
  verification tasks only need the API.)

## Assumptions

- All workspaces can adopt a shared ESLint config at root with workspace-level
  overrides; this is standard for npm workspaces.
- The existing TypeScript code will have some existing lint violations that need
  to be fixed as part of Stage 2 before CI can go green.
- GitHub Actions can be added to this repo even though `gh` CLI is not
  installed; the workflow file is a plain committed YAML file.
- Smoke tests will target the dev server at `127.0.0.1:4545` (API) and
  `127.0.0.1:5173` (frontend); they require the dev server to already be
  running.
