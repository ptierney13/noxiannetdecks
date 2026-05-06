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
- One-off or isolated work may use a single plan file directly under `plans/todo/`
  or `plans/executed/`.
- Large self-contained initiatives that are expected to need multiple related
  plans should get matching feature folders under both `plans/todo/` and
  `plans/executed/`.
- Feature-folder plans should stay grouped under
  `plans/todo/<feature-slug>/` while pending and under
  `plans/executed/<feature-slug>/` once enacted.

When significant work is completed, move or record the plan in `plans/executed/`.

## Plan Contents

Plan documents should include:

- Summary
- Key changes
- Test plan
- Assumptions
