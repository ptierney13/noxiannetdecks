# Docs

This folder holds shared repository documentation outside package-local
READMEs.

## Layout

- `reference/`: evergreen behavior, architecture, and policy docs
  - `reference/ui/`: UI design system, tokens, component patterns, and
    anti-patterns for frontend implementation
- `runbooks/`: repeatable operational procedures
- `work/`: active initiative planning and execution docs
- `archive/`: completed or superseded historical docs

## Naming And Grouping

Keep related docs easy to scan in directory listings.

- Prefer names that keep semantic groups alphabetically aligned, such as
  `price-pipeline.md` and `price-published-data.md`.
- If a doc family would become awkward or too large as flat files, move that
  family into a dedicated subfolder with its own `README.md`.

## Active Work

Use `work/work-status.json` as the top-level map of active initiatives.

- Single-file initiatives may live directly under `work/`.
- Larger initiatives should use a folder under `work/`.
  - staged larger initiatives keep their own folder-local `work-status.json`
  - stage files inside those folders use names like `S1-...`, `S2-...`, and
    so on
