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

