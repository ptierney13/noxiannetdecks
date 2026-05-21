# Initiative Doc Authoring

Use this document as the compact reference for how active initiative docs in
`docs/work/` should be structured.

This is intentionally a stub. It should stay short and focus on durable author
guidance rather than restating every active-work rule inline.

## Core Rules

- Significant work should have one approved initiative doc before
  implementation begins.
- Small one-off initiatives may use a single file directly under `docs/work/`.
- Larger initiatives should use a folder under `docs/work/`.
- Do not split one initiative into separate spec and plan files.

## Required Sections

All significant initiative docs should include:

- Summary
- Key Changes
- Test Plan
- Assumptions

Multi-stage or feature-level initiative docs should also include:

- Implementation Units
- Open Questions
- Risks

## Status

- Put a visible status indicator near the top of the doc.
- Keep current progress tracking in the doc as work advances.
- Single-file initiative status values are:
  - `draft`
  - `plan`
  - `in progress`
- Stage status values inside staged initiative folders are:
  - `draft`
  - `plan`
  - `in progress`
  - `completed`
- Lightweight work-item stub statuses use this order:
  - `proposed`
  - `draft`
  - `plan`
  - `in progress`
  - `completed`
- For docs at `draft` status:
  - treat them as planning notes, not authoritative execution docs
  - finalize them against the current repository state before implementation
  - for multi-stage initiatives, reconcile them with completed stages before
    finalizing
  - keep future-stage drafts roughly updated, but do not optimize for precise
    correctness
- For lightweight work-item stubs:
  - `proposed` means a minimal tracking item with enough human-readable detail
    to understand the big-picture work it is tracking
  - no additional content-shape rules apply at `proposed` status
  - status belongs in the visible status line, not in the filename or title
  - `completed` items belong in archive rather than the active work surface
- A staged initiative folder stays active if any stage has moved beyond
  `plan`.
- A staged initiative folder is complete only when every stage is
  `completed`, after which the initiative should move to `docs/archive/`.

## Use With

- [docs/work/README.md](./../work/README.md) for active-work structure
- [docs/README.md](./../README.md) for the wider docs model

## Update Triggers

Update this doc when:

- the required section set for initiative docs changes
- the allowed active status values change
- the repo changes how single-file versus folder-based initiatives are modeled
