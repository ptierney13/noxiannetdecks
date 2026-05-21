# Active Work

This folder contains active initiative planning and execution docs.

## Rules

- Small one-off initiatives may use a single Markdown file in this folder.
- Larger initiatives should use a folder with stage files.
- Staged initiative files use names like `S1-<name>.md`, `S2-<name>.md`, and
  so on.
- Stages are linear for now.
- Do not split one initiative into separate spec and plan docs.

## Authorship

For how to write and structure initiative docs, use
[docs/reference/initiative-doc-authoring.md](./../reference/initiative-doc-authoring.md).

## Status Tracking

- `work-status.json` at this level tracks initiatives only.
- Each staged initiative folder must have its own `work-status.json`.
- Stage details belong in the folder-local status file, not in the top-level
  one.
- A staged initiative folder stays `in progress` if any of its stages has
  moved beyond `plan`.
- A staged initiative folder is complete only when every stage is
  `completed`, at which point the initiative should move to `docs/archive/`.

## Active Status Values

Single-file initiative statuses:

- `draft`
- `plan`
- `in progress`

Stage statuses inside staged initiative folders:

- `draft`
- `plan`
- `in progress`
- `completed`

Lightweight work-item stub statuses use this order:

- `proposed`
- `draft`
- `plan`
- `in progress`
- `completed`

For work-item stubs:

- `proposed` means a lightweight tracking item with enough human-readable
  detail to understand the big-picture work it is tracking
- no additional content-shape rules apply at `proposed` status
- status belongs in the visible status line, not in the filename or title
- `completed` items belong in archive rather than the active work surface

For draft plans:

- draft plans are working notes, not a source of truth
- finalize draft plans against the current code state before implementation
- for multi-stage work, also check completed stages before finalizing
- future-stage drafts should be updated in good faith, but precision is not the
  goal while they remain drafts
- the goal of a future-stage draft is overview plus rough execution order
