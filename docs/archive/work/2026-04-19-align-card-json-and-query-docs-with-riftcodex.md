# Align Card JSON And Query Docs With Riftcodex

## Summary

Align local card records with Riftcodex's card JSON shape, rename the card-level searchable `keywords` concept to `tags`, remove compatibility aliases, and revise the frontend query documentation around searchable fields first and syntax operations second.

## Key Changes

- Store `card_store/data/cards.json` as an array of Riftcodex-shaped card objects.
- Remove app-invented card fields such as `keywords`, `energyCost`, `rulesText`, `imageUrls`, `sourceUrls`, and `lastVerifiedAt`.
- Search source-shaped fields directly, including `attributes`, `classification`, `text`, `set`, `media`, `tags`, and `metadata`.
- Make `t:` search type or tag.
- Keep `type:`, `supertype:`, and `tag:` aligned to their matching Riftcodex source fields, with `u:` as the shorthand for `supertype:`.
- Remove the optional `public_code` surface because it is not present in the current Riftcodex card payload.
- Replace the old query-language feature table with separate Searchable Fields and Query Syntax tables.

## Test Plan

- Regenerate card data with `npm.cmd run import:riftcodex -w @noxiannet/card-store`.
- Run `npm.cmd test`.
- Run `npm.cmd run build`.
- Smoke test the API and frontend query flow locally.

## Assumptions

- Backwards compatibility is not required.
- `tag:` is the explicit tags-only query field.
- `type:` is the explicit type-only query field.
- `t:` is intentionally broad and searches type and tags.
- The local card record should not include fields absent from the Riftcodex card shape.
