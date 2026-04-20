# Canonical Card Schema

This document describes the canonical Riftbound card JSON owned by `card_store`.
It is intended to be readable by humans and by AI agents doing future schema,
importer, query, or API work.

Source of truth:

- Runtime validator: `card_store/src/data/schema.ts`
- Canonical data: `card_store/data/cards.json`
- Runtime card source/repository boundary: `card_store/src/data/repository.ts`
- Current importer: `card_store/scripts/import-riftcodex.ts`
- Legal identity helper: `card_store/src/data/decklist-id.ts`

## Record Meaning

A `CardRecord` represents one source card record / printed card version:
base, alternate art, overnumbered, and signature records are separate records
when they have distinct source records, collector numbers, artwork, marketplace
products, or presentation.

Foil and nonfoil are not separate `CardRecord`s. They are finish availability
for the same record and are represented by `finishes`. The `variant` object is
reserved for printed treatment flags such as alternate art, overnumbered, and
signed.

## Machine-Readable Summary

```yaml
CardRecord:
  id: string
  riot_name: string
  clean_name: string | null
  riftbound_id: string | null
  tcgplayer_id: string | null
  collector_number: string | null
  language: string
  rarity: string | null
  variant:
    alternate_art: boolean
    overnumbered: boolean
    signed: boolean
  finishes: Array<"nonfoil" | "foil">
  attributes:
    cost: number | null
    energy: number | null
    might: number | null
    power: number | null
    domain: string[]
  type:
    cardtype: string | null
    supertype: string | null
    tags: string[]
    typeline: string
  text:
    rich: string
    plain: string
    flavour: string | null
    keywords: string[]
  set:
    set_id: string
    label: string
  media:
    image_url: string | null
    artist: string | null
    accessibility_text: string | null
    layout: string
```

## Identity Fields

| Field | Type | Meaning | Invariants | Why It Exists |
|---|---|---|---|---|
| `id` | `string` | Unique identifier for this JSON card record / printed version. Currently sourced from the card data source. | Required, non-empty, unique across `cards.json`. Foil/nonfoil must not create derived `id` values such as `-foil`. | Stable API lookup key for a specific card record, including print treatment and media. |
| `riot_name` | `string` | Source/display name for this specific card record. Keep this as close to the official/source name as possible. | Required, non-empty. May include presentation suffixes such as `(Alternate Art)`, `(Overnumbered)`, or `(Signature)`. | Human display, source fidelity, and distinguishing printed versions in results. |
| `clean_name` | `string \| null` | Human-readable legal-card identity name. Records that are the same legal card share this value. | Must not include presentation suffixes such as `Alternate Art`, `Overnumbered`, `Signed`, or `Signature`. All records with the same `clean_name` must share one `riftbound_id`. | Searchable and reviewable legal identity. This is the human-friendly analogue of `riftbound_id`. |
| `riftbound_id` | `string \| null` | Internal decklist/legal-card identity GUID. All records that slot into a decklist as the same legal card share this value. | Derived from the normalized legal `clean_name` for now. All records with the same `clean_name` must have the same `riftbound_id`, and each `riftbound_id` must map to exactly one `clean_name`. | Opaque machine key for decklists, joins, and future storage that should not depend on display text. |
| `tcgplayer_id` | `string \| null` | External TCGplayer product ID for this card record in TCGplayer's system. | Preserve as provided by source/TCGplayer. Do not reinterpret as decklist identity or SKU identity. May be absent. | Marketplace product linking and price integrations. This field must remain a top-level external ID. |

## Print, Finish, And Treatment Fields

| Field | Type | Meaning | Invariants | Why It Exists |
|---|---|---|---|---|
| `collector_number` | `string \| null` | Printed collector number. Supports suffixes such as `57a` for alternate art. | Store as string, even when source provides a number. Preserve suffixes. Sort numerically with suffix tie-breakers. | Card list ordering, set browsing, and display. |
| `language` | `string` | Language code for this record. Currently `en`. | Required, at least two characters. | Future-proofs multilingual data while keeping current data explicit. |
| `rarity` | `string \| null` | Printed rarity/category. Examples: `Common`, `Uncommon`, `Rare`, `Epic`, `Showcase`, `Promo`. | Preserve source/source-normalized value. | Search, filtering, finish rules, and display. |
| `variant.alternate_art` | `boolean` | Whether this record is an alternate-art printed version. | Independent of foil/nonfoil finish. | Querying `is:AA` / `is:altart` and distinguishing presentation records. |
| `variant.overnumbered` | `boolean` | Whether this record is overnumbered. | Signed cards are also overnumbered. | Querying `is:ON` / `is:overnumbered`; identifying collector treatments. |
| `variant.signed` | `boolean` | Whether this record is a signature version. | If `true`, `variant.overnumbered` must also be `true`. | Querying `is:Signed` / `is:Signature`; distinguishing signed products. |
| `finishes` | `Array<"nonfoil" \| "foil">` | Finish availability for this card record. | Required, non-empty, no duplicates. Current import rule: base-set Common/Uncommon records can be `["nonfoil", "foil"]`; higher rarities and special treatments are `["foil"]`. | Scryfall-style finish availability without duplicating records by foil state. Keeps finish availability separate from treatment flags and marketplace product IDs. |

## Attribute Fields

| Field | Type | Meaning | Invariants | Why It Exists |
|---|---|---|---|---|
| `attributes.cost` | `number \| null` | Printed/resource cost. | Integer or null. Currently mapped from available source stats; should align to official `stats.cost` when official data is used. | Numeric query `cost>=3` and rules/display parity with official schema. |
| `attributes.energy` | `number \| null` | Energy value. | Integer or null. | Numeric query `energy` / `e`; card rules and display. |
| `attributes.might` | `number \| null` | Might value. | Integer or null. | Numeric query `might` / `m`; combat stats. |
| `attributes.power` | `number \| null` | Power value. | Integer or null. | Numeric query `power` / `p`; point/scoring stat where applicable. |
| `attributes.domain` | `string[]` | Domain/rune/domain identity values. | Array, empty if source has none. | Querying and filtering by domain with `domain:` / `d:`. |

## Type Fields

| Field | Type | Meaning | Invariants | Why It Exists |
|---|---|---|---|---|
| `type.cardtype` | `string \| null` | Main card type, such as `Unit`, `Spell`, `Gear`, `Legend`, `Rune`, or `Battlefield`. | Preserve source-normalized value. | Type filtering and display. |
| `type.supertype` | `string \| null` | Supertype, such as `Champion`, if present. | Null when absent. | Supertype filtering and display. |
| `type.tags` | `string[]` | Printed tags after cardtype/supertype. | Array, empty when none. | Tag search, deckbuilding filters, and typeline reconstruction. |
| `type.typeline` | `string` | Full printed/source type line. | Required. Should equal the displayed sequence of `cardtype`, `supertype`, and `tags` as represented by the source. | Human display, exact typeline search, and debugging source shape shifts. |

## Text Fields

| Field | Type | Meaning | Invariants | Why It Exists |
|---|---|---|---|---|
| `text.rich` | `string` | Rich/markup rules text from source. | Required string; may be empty. | UI rendering and preserving source formatting. |
| `text.plain` | `string` | Plain rules text. | Required string; may be empty. | Search, parsing, and fallback display. |
| `text.flavour` | `string \| null` | Flavor text. | Null when absent. British spelling follows source shape. | Search/display without mixing flavor into rules-specific behavior unless intentionally queried. |
| `text.keywords` | `string[]` | Extracted or source-provided keyword list. | Array, empty when none. | Keyword filtering and query help. |

## Set And Media Fields

| Field | Type | Meaning | Invariants | Why It Exists |
|---|---|---|---|---|
| `set.set_id` | `string` | Set code, such as `OGN`, `SFD`, `UNL`, `OPP`, `PR`, or `JDG`. | Required, non-empty. | Set filtering, sorting, and deck-code adapters. |
| `set.label` | `string` | Human-readable set name. | Required, non-empty. | Display and search. |
| `media.image_url` | `string \| null` | Source image URL. | Null when unavailable. | Card gallery display. |
| `media.artist` | `string \| null` | Illustrator/artist credit. | Null when unavailable. | Display and artist search. |
| `media.accessibility_text` | `string \| null` | Alt/accessibility description from source. | Null when unavailable. | Accessible UI image text. |
| `media.layout` | `string` | Media/card layout/orientation, currently values such as `portrait` or `landscape`. | Required, non-empty. Battlefield records must use a landscape layout. | Rendering decisions and layout/orientation search. |

## Core Invariants

These invariants should be enforced by tests and preserved by importers:

1. `id` is unique across all records.
2. Foil/nonfoil must not create extra records or derived `id` values.
3. `finishes` must be non-empty, deduplicated, and contain only `nonfoil` and/or `foil`.
4. `variant.signed === true` implies `variant.overnumbered === true`.
5. `clean_name` means legal-card identity and must not include presentation suffixes.
6. Records with the same `clean_name` must share one `riftbound_id`.
7. A `riftbound_id` must map to exactly one `clean_name`.
8. `riot_name` stays source/display-specific and may include presentation suffixes.
9. `tcgplayer_id` is an external TCGplayer identifier and must not be used as internal identity.
10. Landscape battlefield cards render in the same no-cost lane as runes and legends, and that lane must remain the rightmost card-layout lane so no energy column appears to the right of a battlefield.
11. Parser/search code should consume this schema through accessors/evaluator logic, not by coupling to storage/import source quirks.

## Source And API Boundaries

- `CardSource` is the storage/network boundary. Implementations load canonical
  `CardDatabase` JSON, and `CardRepository` handles caching plus cross-record
  invariants such as unique `id`.
- `JsonFileCardSource` is the local committed JSON provider.
- `RestCardSource` is the intended shape for a future public REST provider:
  fetch canonical card JSON, validate it with `cardDatabaseSchema`, and hand it
  to the same repository and parser layers.
- Query parsing and evaluation must depend on `CardRecord`, not on Riftcodex
  source payloads, file paths, REST endpoints, or import-time metadata.
- Frontend DTO types should be imported from `@noxiannet/card-store` rather
  than hand-copied. Runtime frontend code should still use HTTP responses from
  the API, but the TypeScript contract is owned by the backend package.

## Importer Boundary

- The Riftcodex importer validates fetched source pages before normalization.
- Source payload validation should fail fast on missing or drifted upstream
  fields, then canonical output validation should fail if normalized records do
  not match this schema.
- `attributes.cost` prefers source `stats.cost` or `attributes.cost` if present;
  current Riftcodex data falls back to `attributes.energy`.

## Search Semantics

- Free-text search includes `riot_name`, `clean_name`, rules text, flavor text, keywords, and tags.
- `t:` searches the full type line. Multiword `t:` values match type-line terms in any order, so `t:"Champion Unit"` finds cards whose type line includes both `Champion` and `Unit`.
- `is:foil`, `is:nonfoil`, `finish:foil`, and `finish:nonfoil` search finish availability in `finishes`.
- `variant:` remains a query alias for `finish:` for backwards compatibility, but JSON uses `variant` only for treatment flags.
- `is:AA`, `is:altart`, and `is:alternateart` search `variant.alternate_art`.
- `is:ON` and `is:overnumbered` search `variant.overnumbered`.
- `is:Signed`, `is:Signature`, and `is:sig` search `variant.signed`.
- `riftbound_id:` searches legal/decklist identity, not the old source string ID.
- `tcgplayer_id:` searches external TCGplayer product IDs.
- Search results default to `unique:legal`, returning one representative record per
  `riftbound_id`. `unique:id` returns every matched source record, matching the
  previous behavior. `unique:art` returns one record per legal-card artwork/image
  URL, and `unique:cn` returns one record per set collector number.
- Legal-card rollup chooses the most standard representative available after
  filtering: normal treatments before alternate art, overnumbered, or signed
  records; non-promotional records before promo/showcase records; and nonfoil
  availability before foil-only records when other factors are equal.

## Current Design Rationale

- Keep `riot_name` because source/display names matter and may distinguish print treatments.
- Keep `clean_name` because humans and AI agents need a readable legal-card identity.
- Keep `riftbound_id` because decks, collection rows, joins, and future APIs need a stable opaque legal-card key.
- Keep top-level `tcgplayer_id` because it is an external marketplace identifier, not an internal identity.
- Keep finish availability separate from print treatments because foil/nonfoil does not change legal deck identity or justify duplicate records.
- Do not store finish-specific TCGplayer IDs in card records today. Current evidence shows TCGplayer uses product IDs at `tcgplayer_id` and differentiates finish below that with SKU/printing metadata; SKU-level marketplace data belongs in a future pricing/inventory adapter, not core card identity.
