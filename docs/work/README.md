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
