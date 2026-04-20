# Initialize Project Structure And Planning Workflow

## Summary

Create the initial repository skeleton with tracked placeholder directories and a top-level `AGENTS.md` that establishes the planning rule for future significant work. Use README files as placeholders so each directory is tracked by Git and self-describing.

## Key Changes

- Add `AGENTS.md` at the repository root requiring manually approved plans before significant feature work.
- Create `plans/todo/` for proposed or approved work that has not yet been enacted.
- Create `plans/executed/` for enacted plans.
- Record this bootstrap structure plan as an executed plan.
- Create placeholder directories for future `card_store`, `deck_store`, and `frontend` work.
- Do not add implementation code, frameworks, package manifests, schemas, or service interfaces yet.

## Test Plan

- Run `git -c core.excludesfile=.git/info/exclude status -sb` and confirm only the intended new files are pending.
- Verify the resulting tree contains exactly the requested top-level directories plus `AGENTS.md`.
- Read `AGENTS.md` and confirm it explicitly requires manually approved plans before significant feature work.
- Confirm all placeholder directories are Git-trackable through README files.

## Assumptions

- README placeholders are preferred over `.gitkeep`.
- This setup work should be recorded as an executed plan once implemented.
- The manual approval rule applies to significant work only, not every tiny repository change.

