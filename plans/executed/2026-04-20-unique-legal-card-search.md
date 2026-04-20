# Unique Legal Card Search

## Summary

Make card search return one representative record per tournament-legal card by default, while adding a `unique:*` query option for callers who need alternate rollup modes or the previous all-record behavior.

## Key changes

- Treat `unique:<mode>` as a query option instead of a card predicate.
- Default search results to one card per legal `riftbound_id`.
- Add simple unique modes for legal card identity, artwork, record ID, and collector number.
- Pick the most standard representative in each group, preferring normal non-promo records with nonfoil availability before special treatments.
- Document the new query option in the query-language helper data.

## Test plan

- Add parser tests for accepted and invalid `unique:*` values.
- Add evaluator tests covering default legal rollup, `unique:id`, `unique:art`, and `unique:cn`.
- Include cases for runes, alternate art, overnumbered, signed, and duplicate image records.
- Run the card store and frontend test suites.

## Assumptions

- `riftbound_id` is the canonical tournament/legal identity when present.
- Current `media.image_url` is the best available artwork identity proxy.
- `unique:id` preserves the prior behavior of returning every source card record.
