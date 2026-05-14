# Agent Instructions

This repository uses plan-first development for significant project work.

## Planning Requirement

Significant feature work requires a manually approved plan before implementation.

Significant work includes:

- New features or user-facing capabilities
- Service architecture changes
- Data model or storage changes
- Migrations
- External integrations
- Broad refactors

Trivial typo fixes, small documentation edits, and narrow cleanup may proceed without a plan.

Once a plan has been manually approved, later edits to that existing plan do not require a second approval before implementation. Keep the plan updated so it reflects the work actually being done, and ask for approval again only when the change is better represented as a separate new plan.

For large self-contained initiatives that are split into multiple stages,
expect the workflow to be:

- one initiative-level plan that explains the overall sequence
- one draft summary plan per planned stage so a later worker can start from a
  bounded context
- one finalized, approved plan for the current stage before implementation
  begins for that stage
- a requirement that completing a stage also updates the remaining future-stage
  draft summaries with any newly relevant decisions, constraints, or changed
  assumptions

## Plan Locations

Plans live under `plans/`:

- `plans/todo/` contains proposed or approved plans that have not yet been enacted.
- `plans/executed/` contains plans that have been enacted.
- One-off or isolated work may use a single plan file directly under `plans/todo/`
  or `plans/executed/`.
- Large self-contained initiatives that are expected to need multiple related
  plans should get matching feature folders under both `plans/todo/` and
  `plans/executed/`.
- Feature-folder plans should stay grouped under
  `plans/todo/<feature-slug>/` while pending and under
  `plans/executed/<feature-slug>/` once enacted.
- For multi-stage initiatives, keep draft summary plans for future stages in
  the feature folder so new context windows can read prior completed stages plus
  the current stage draft before producing the finalized stage plan.

When significant work is completed, move or record the plan in `plans/executed/`.

## Plan Contents

Plan documents should include:

- Summary
- Key changes
- Test plan
- Assumptions

## Frontend UI Guidance

When editing files under `frontend/`, read `frontend/AGENTS.md` first.

Treat that file as the frontend-specific source of truth for:

- semantic UI token usage
- shared UI foundation expectations
- when inline styles are acceptable
- how to keep future UI overhaul work organized

Draft summary plans for future stages should also state clearly that:

- they are drafts
- they must be finalized and approved before implementation begins
- completing the current stage requires refreshing future-stage draft summaries
  with any newly pertinent information
## GitHub Workflow

The `gh` CLI is **not installed** on this machine. All GitHub operations use plain `git`.

`main` is permanently checked out in a dedicated worktree at:

```
C:\Users\ptier\repos\Deck Archive Project-main-merge
```

To merge a finished branch to main and deploy:

```bash
git -C "C:\Users\ptier\repos\Deck Archive Project-main-merge" merge --ff-only <branch-name>
git -C "C:\Users\ptier\repos\Deck Archive Project-main-merge" push origin main
```

Use `--ff-only` to keep history linear. Cloudflare Pages deploys automatically when `main` is pushed - there is no separate deploy step.

## Release Commands

Use the checked-in release helper to keep conversational release behavior
consistent:

```bash
npm run release:ship
npm run release:publish
```

- `ship it` or similar means:
  - push the current branch to `origin`
  - treat the resulting Cloudflare Pages branch preview as the default
    verification target
  - include the preview URL as the last item in the final response
- `publish it` or similar means:
  - merge the current branch into the dedicated `main` worktree with
    `--ff-only`
  - push `origin main`
  - treat that push as the live publish step
- When significant feature work is completed and the result is reasonably
  verifiable on a branch deploy, the default close-out path is to ship the
  branch preview even if the user does not explicitly ask for the preview URL.
- Never publish directly to `main` without an explicit publish instruction.
- If the fast-forward merge fails, stop and ask the user before proceeding.
