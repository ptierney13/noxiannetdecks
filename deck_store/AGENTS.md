# Deck Store Agent Notes

Read this file before editing anything under `deck_store/`.

## Scope

These notes apply to archive, audit, source-intake, and export work for the
deck/event dataset.

## Next Initiative Verification Start

The next initiative that does implementation work under `deck_store/` should
begin by verifying the contents of:

- `deck_store/AGENTS.md`
- `deck_store/CLAUDE.md`
- `deck_store/README.md`
- `deck_store/docs/source-policy.md`
- `deck_store/docs/source-audit.md`
- `deck_store/docs/source-intake-architecture.md`

## Key Invariants

- The workspace is implemented and active; do not treat it as a placeholder.
- Source policy and audit findings drive what intake code is allowed.
- Repo-local archive storage is part of the package contract.
- `riftbound_id` is the card-level identifier to align deck data with
  `card_store`, but deck-store schemas still own their own archive and audit
  structures.

## Task Routing

| If you are doing... | Read this first |
| --- | --- |
| Source policy or approval work | `docs/source-policy.md`, `docs/source-audit.md` |
| Source-intake planning | `docs/source-intake-architecture.md` |
| Archive manifest or filesystem helpers | `src/archive/` |
| Audit plan or repository logic | `src/audit/` |
| Data or export layer changes | `src/data/`, `src/export/` |
| Local storage/bootstrap behavior | `src/bootstrap.ts`, `src/config.ts`, `README.md` |
| Related active initiative docs | `../docs/work/2026-04-24-source-intake-architecture.md`, `../docs/work/2026-04-24-stage-2-static-snapshot-hosting.md`, `../docs/work/2026-04-24-stage-3-ingestion-and-refresh-automation.md` |

## Verification

- Archive or audit changes should keep tests under `test/` aligned with the
  changed module.
- Run `npm run test -w @noxiannet/deck-store` after meaningful changes here.
