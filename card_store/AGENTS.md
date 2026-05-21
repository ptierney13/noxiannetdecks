# Card Store Agent Notes

Read this file before editing anything under `card_store/`.

## Scope

These notes apply to the card API, card schema, import flow, and query engine.

## Next Initiative Verification Start

The next initiative that does implementation work under `card_store/` should
begin by verifying the contents of:

- `card_store/AGENTS.md`
- `card_store/CLAUDE.md`
- `card_store/README.md`
- `card_store/docs/card-schema.md`

## Key Invariants

- `src/data/schema.ts` is the source of truth for card-record validation.
- `finishes` is the canonical foil/nonfoil representation.
- `variant.signed` requires `variant.overnumbered`.
- Legal card identity collapses through `clean_name` and `riftbound_id`.
- Query field aliases belong in `src/query/fields.ts`.
- Parser grammar changes require parser-test coverage.
- New AST node types must be handled in `src/query/evaluator.ts`.

## Task Routing

| If you are doing... | Read this first |
| --- | --- |
| Schema or record-shape changes | `src/data/schema.ts`, `src/data/repository.ts`, `docs/card-schema.md` |
| Query fields or evaluator changes | `src/query/fields.ts`, `src/query/evaluator.ts` |
| Parser or grammar changes | `src/query/parser.ts`, `test/parser.test.ts` |
| API route work | `src/api/app.ts`, `src/api/service.ts` |
| Card import or identity refresh | `scripts/import-riftcodex.ts`, `scripts/refresh-derived-identities.ts` |
| Pack generation | `src/pack_generator/` |

## Verification

- Query behavior changes should update tests in `test/evaluator.test.ts` or
  `test/parser.test.ts`.
- Schema changes should update `test/schema.test.ts`.
- Run `npm run test -w @noxiannet/card-store` after meaningful backend changes.
