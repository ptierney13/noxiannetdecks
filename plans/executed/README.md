# Executed Plans

This folder contains plans that have been enacted.

Executed plans provide a durable record of project decisions, implementation intent, and the checks expected for completed work.

## Organization

Use a flat plan file directly under `plans/executed/` for one-off or isolated
work.

When a large self-contained initiative uses a feature folder under
`plans/todo/<feature-slug>/`, keep the enacted records mirrored under
`plans/executed/<feature-slug>/`.

Move or record enacted stage plans inside the matching executed feature folder
instead of flattening them back into the root of `plans/executed/`.

## Multi-Stage Workflow

For large staged initiatives, the executed folder should preserve the history
needed by later stage workers:

- move or record each completed stage plan under the matching executed feature
  folder
- keep the enacted plan detailed enough that later workers can understand the
  decisions already made
- when a stage is completed, the corresponding work should also refresh the
  remaining future-stage draft plans under `plans/todo/<feature-slug>/` so they
  reflect the newest pertinent context
