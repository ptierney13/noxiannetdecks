# Source Intake Architecture

This document records the intended organization for future public-source intake
work. It is intentionally process-first: new source code should not be added
until the source analysis for that specific source has been written and
approved.

## Goals

- Keep source-specific acquisition logic isolated and reviewable.
- Require a written legality/reasonableness analysis before implementing pull
  code for any public source.
- Normalize every approved source into one shared event input format before the
  data reaches canonical storage.
- Keep source-to-storage processing auditable and replaceable.

## Planned Layout

- `deck_store/src/intake/sources/`
  - one folder per public source
- `deck_store/src/intake/shared/`
  - shared event input format definitions and validators
- `deck_store/src/intake/process/`
  - processors that convert shared event input documents into canonical storage

## Required Source Folder Structure

Each source folder should contain:

- `analysis.md`
  - written first
  - explains what the source publishes publicly
  - explains whether collecting from it is reasonably green under project policy
  - explains what fields are available and what gaps remain
  - must be reviewed and approved before any source pull code is added
- `README.md`
  - explains how to use the tools in that source folder
  - documents the source-specific workflow end to end
- `pull/`
  - source-specific pull/capture tools
  - only added after the source analysis is approved
  - must preserve text-only/raw source payloads without downloading bulky media
- `transform/`
  - source-specific tools that turn raw captures into the shared event input
    format

## Required Processing Separation

Source folders should stop at the shared event input format. They should not
write directly into canonical storage.

The next step should be a separate processing layer:

- `deck_store/src/intake/process/`
  - takes shared event input documents
  - validates them
  - merges them into canonical dataset storage
  - records provenance and review state consistently

## Approval Rule

For every new public source:

1. write `analysis.md`
2. review and approve that analysis
3. only then implement `pull/` tools
4. implement `transform/` into the shared event input format
5. process the shared format into canonical storage

This rule applies even when a source looks obviously useful. The analysis step
exists to keep the project on fully green acquisition paths.
