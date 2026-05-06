# Todo Plans

This folder contains proposed or manually approved plans that have not yet been enacted.

Use this area to track future project work, compare next-step options, and preserve decisions before implementation begins.

## Organization

Use a flat plan file directly under `plans/todo/` for one-off or isolated work.

When a large self-contained initiative is expected to require multiple related
plans, create a dedicated feature folder under `plans/todo/<feature-slug>/`.
Keep the initiative-level plan plus all pending stage-specific or follow-on
plans grouped inside that folder.

Large initiatives should mirror the same feature folder under
`plans/executed/<feature-slug>/` so enacted stage plans can move or be recorded
there without losing the grouping.

## Multi-Stage Workflow

When a large initiative is expected to be implemented stage by stage across
separate work sessions or context windows:

- keep one initiative-level plan in the feature folder
- add one draft summary plan per planned future stage
- mark each draft clearly as a draft that must be finalized and approved before
  implementation begins
- when a stage is completed, update the remaining future-stage draft plans with
  any newly pertinent architectural decisions, constraints, or changed
  assumptions

This lets a later worker read the completed earlier stages plus the current
stage draft, then write the finalized plan for the stage they are about to
implement.
