# TCGplayer Source Analysis

## Review Date

- Reviewed on 2026-05-06 for Stage 2 planning and implementation.

## Current Approval Outcome

TCGplayer remains the first approved source for `price_store`, but the approved
implementation path is constrained:

- Existing official API documentation is still publicly documented at
  `docs.tcgplayer.com`, including authentication, catalog, and pricing
  endpoints.
- TCGplayer's public help documentation currently states that new API access is
  no longer being granted.
- Because this repository does not currently include known partner credentials,
  Stage 2 should not assume live authenticated pulls are available in every
  environment.

That means the maintainable Stage 2 path is:

- document the official interface and current constraint clearly
- preserve representative payload examples using approved operator input
- avoid brittle scraping or pseudo-automation that bypasses the access model

## Source Decision

TCGplayer is still acceptable as the first schema-driving source because:

- its API contract is concrete enough to inspect product and pricing payload
  shapes
- its product records expose stable product URLs that later stages can preserve
- its pricing endpoints expose the core price metrics Stage 3 and Stage 4 need

TCGplayer is not yet approved here for unattended production collection in a
fresh environment without credentials. That question stays open for later
operational stages and depends on whether valid partner access is available.

## Access Path

Preferred path:

1. official TCGplayer API access with operator-managed credentials
2. bounded import of operator-exported payloads or docs-derived examples into
   `.price_data/raw/`

Not approved:

- scraping marketplace HTML as a primary integration path
- undocumented access workarounds
- assuming anonymous production-grade pricing access exists

## Auth And Secrets

- The documented API uses bearer-token authentication.
- Stage 2 does not add secret handling because no live authenticated pull path
  is being implemented yet.
- If valid credentials become available later, operator docs and command
  surfaces should be extended rather than replaced.

## Sample Set Used In Stage 2

The bundled Stage 2 sample set intentionally uses public docs-derived example
payloads so the repository can preserve a stable baseline without requiring
credentials in every environment.

Current bundled examples:

- catalog product example for product identity, group linkage, extended fields,
  and stable product URLs
- pricing group example for low/mid/high/market price metrics and subtype
  coverage

These are sufficient to drive Stage 3 discussion around:

- product identity versus group identity
- URL preservation
- extended source-native fields
- pricing metric naming and optionality
- subtype distinctions such as normal versus foil

## Stage 3 Contract Questions

Stage 3 should decide, using the captured samples:

- whether normalized records are keyed primarily by product ID, by a
  card-printing match, or by a hybrid source-to-canonical mapping layer
- how `groupId`, `productId`, and source `url` should be preserved
- how source-native subtype distinctions map onto later finish or variant fields
- which price metrics are required versus optional
- how missing or unmatched source records should be represented

## Commercial Constraints

- Commercialization constraints should continue to be documented as the source
  evolves.
- Affiliate-link setup is intentionally deferred to the final project stage.
- Earlier stages should only preserve the stable source-link fields and any
  attribution constraints that a later affiliate stage may need.

## Operator Notes

- Use the bundled import command for baseline schema work.
- If an operator has existing TCGplayer credentials or approved exported
  payloads, preserve additional captures through the same manifest-driven import
  path so raw artifacts keep the shared Stage 1 layout and metadata shape.

## Sources

- TCGplayer API docs: <https://docs.tcgplayer.com/docs/getting-started>
- TCGplayer API catalog reference: <https://docs.tcgplayer.com/reference/catalog_getproducts-1>
- TCGplayer API pricing reference: <https://docs.tcgplayer.com/reference/pricing_getgroupprices>
- TCGplayer help article on pricing-data access:
  <https://help.tcgplayer.com/hc/en-us/articles/201577976-How-can-I-get-access-to-your-card-pricing-data>
