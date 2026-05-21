# Deck Store

Stage 1 foundation for the deck/event dataset that will eventually power the
public metagame site.

The package is intentionally storage-conscious:

- Preserve raw source payloads so the dataset can be rebuilt without
  re-collecting public data.
- Keep the working archive in a repo-local data store that stays git ignored by
  default.
- Capture text and structured payloads only. Do not download images or other
  bulky media assets.
- Limit automated collection to approved green sources. Third-party aggregators
  are manual review references only.
- Require per-source analysis and approval before any new intake code is
  implemented for that source.

## Local Data Directory

The code in this package resolves its data root from `NOXIANNET_DECK_DATA_DIR`.
If that variable is not set, it falls back to a repo-local git-ignored store:

- `repo-root/.deck_data/`

The default Stage 1 layout is:

- `raw/`: captured source HTML/JSON/text payloads
- `canonical/`: normalized dataset files
- `exports/`: publishable snapshot artifacts
- `audit/`: source-audit records
- `archive-manifest.json`: counts and byte totals for the local archive

## Commands

- `npm run init:data-dir -w @noxiannet/deck-store`
- `npm run seed:audit-plan -w @noxiannet/deck-store`
- `npm run inspect:data-dir -w @noxiannet/deck-store`
- `npm run capture:audit-samples -w @noxiannet/deck-store -- --source topdeck --limit 1`

## Docs

- [Stage 1 source policy](./docs/source-policy.md)
- [Stage 1 source audit](./docs/source-audit.md)
- [Source intake architecture](./docs/source-intake-architecture.md)
- [Archived executed plan record](../docs/archive/work/2026-04-24-stage-1-local-deck-dataset-and-snapshot-contract.md)
- [Archived Deck Explorer routing plan](../docs/archive/work/2026-04-25-deck-explorer-routing-and-manual-event-entry.md)
- [Archived public metagame roadmap](../docs/archive/work/2026-04-24-public-metagame-site-roadmap.md)
- [Archived source intake architecture plan](../docs/archive/work/2026-04-24-source-intake-architecture.md)
- [Archived Stage 2 static hosting plan](../docs/archive/work/2026-04-24-stage-2-static-snapshot-hosting.md)
- [Archived Stage 3 ingestion plan](../docs/archive/work/2026-04-24-stage-3-ingestion-and-refresh-automation.md)
