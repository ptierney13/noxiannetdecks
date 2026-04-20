# Card Source And Schema Followups

## Summary

Enact follow-up improvements after finalizing the card schema: separate card
loading from storage, validate raw Riftcodex import payloads, and remove the
frontend's hand-copied card DTO definitions.

## Key Changes

- Added a `CardSource` / `CardRepository` boundary for loading canonical card
  data, with local JSON and REST source implementations.
- Kept parser and evaluator code dependent only on canonical `CardRecord`
  objects, not file paths, import payloads, or REST details.
- Added Zod validation for raw Riftcodex pages before normalization.
- Exported API contract types from `@noxiannet/card-store` and made the frontend
  import those types instead of maintaining a duplicate DTO shape.
- Updated schema documentation and README notes around source boundaries and
  import validation.

## Test Plan

- Run `npm.cmd test`.
- Run `npm.cmd run build`.
- Type-check `card_store/scripts/import-riftcodex.ts` with `tsc --noEmit`.

## Assumptions

- `tcgplayer_id` remains a top-level TCGplayer product ID.
- Future REST card sources should return canonical `CardRecord` JSON.
- SKU-level marketplace data should live outside core card identity unless a
  dedicated pricing or inventory adapter is added later.
