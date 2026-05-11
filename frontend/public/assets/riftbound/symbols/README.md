# Riftbound Inline Symbol Asset Inventory

This folder contains publicly sourced Riftbound symbol assets organized for UI review and later inline rendering work.

## Current Symbol Set

The current site token inventory requires these symbols:

- `actions/exhaust-black.png`
- `actions/exhaust-white.png`
- `stats/might-black.png`
- `stats/might-white.png`
- `power/wild-power-inline.png`
- `runes/rune-fury-inline.png`
- `runes/rune-calm-inline.png`
- `runes/rune-mind-inline.png`
- `runes/rune-body-inline.png`
- `runes/rune-chaos-inline.png`
- `runes/rune-order-inline.png`
- `energy/energy-cost-00-badge.png`
- `energy/energy-cost-01-badge.png`
- `energy/energy-cost-02-badge.png`
- `energy/energy-cost-03-badge.png`
- `energy/energy-cost-04-badge.png`
- `energy/energy-cost-05-badge.png`
- `energy/energy-cost-06-badge.png`
- `energy/energy-cost-07-badge.png`
- `energy/energy-cost-08-badge.png`
- `energy/energy-cost-09-badge.png`
- `energy/energy-cost-10-badge.png`
- `energy/energy-cost-12-badge.png`

## Missing Public Source

- `energy/energy-cost-11-missing.txt`
  - The current local Riftbound card dataset includes energy values `0-10` and `12`, but no cost-11 card image to extract from.

## Folder Layout

- `_sources/`
  - Original downloaded public source images used for extraction.
- `_review/`
  - Labeled contact sheets for quick visual review.
- `actions/`
  - Action-cost glyphs such as Exhaust, with black and white variants.
- `energy/`
  - Numeric energy badges.
- `power/`
  - Wild Power / rainbow power glyphs.
- `runes/`
  - Domain rune glyphs used inline in rules text.
- `stats/`
  - Stat glyphs such as Might, with black and white variants.

## Public Sources Used

- `https://riftboundsymbols.com/wp-content/uploads/2026/02/In-text-symbols-6.png`
  - Used as the clean monochrome source for the Exhaust and Might shapes.
- `https://riftboundsymbols.com/wp-content/uploads/2026/02/Card-cost-symbols-2.png`
  - Used for `wild-power-inline.png`.
- `https://riftboundsymbols.com/wp-content/uploads/2026/03/Domains-symbols-combined-v2.png`
  - Used for the six domain rune glyphs.
- Official Riot-hosted card images already referenced in `card_store/data/cards.json`
  - Used for the numeric energy badge extraction files stored in `_sources/energy-*-source.png`.

## Review Note

The rune, Wild Power, Might, and Exhaust exports come from public symbol sheets. The black and white Might/Exhaust variants now share the same cleaned base shapes for closer visual consistency across card treatments.

The energy badge exports come from cropped official card faces because I did not find a public standalone sheet for every numeric energy value. Those are the assets most worth a careful visual pass.
