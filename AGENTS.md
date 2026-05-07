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

## Plan Locations

Plans live under `plans/`:

- `plans/todo/` contains proposed or approved plans that have not yet been enacted.
- `plans/executed/` contains plans that have been enacted.

When significant work is completed, move or record the plan in `plans/executed/`.

## Plan Contents

Plan documents should include:

- Summary
- Key changes
- Test plan
- Assumptions

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

Use `--ff-only` to keep history linear. Cloudflare Pages deploys automatically when `main` is pushed — there is no separate deploy step.
