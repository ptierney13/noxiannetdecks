# Inline Symbol Rendering And Multi-Domain Card Chips

## Summary

Restore the approved baseline inline symbol assets, use them in the card UI for cost, might, and card text rendering, and fix quick-look card metadata so multi-domain cards render as one combined domain chip instead of one chip per domain.

## Key Changes

- Restore the current working symbol set to the approved baseline assets under `frontend/public/assets/riftbound/symbols/_baseline_pre_cleanup/` before wiring any renderer changes.
- Add a shared frontend symbol-rendering utility that:
  - maps tokenized card-text placeholders like `{F}`, `{C}`, `{M}`, `{T}`, `{P}`, `{0}` through `{12}`, and `{E}` to the correct inline asset paths
  - emits inline image elements for supported tokens instead of plain text
  - defaults Might/stat presentation to the white glyph variants unless a future caller explicitly needs the black variants
  - preserves plain text for unknown tokens rather than dropping content
- Update card text rendering so displayed rules text replaces supported token placeholders with inline symbols in both:
  - quick-look cards in list/grid views
  - full card detail pages
- Update card cost and might displays in card UI so:
  - cost displays use the correct inline cost symbols rather than raw token text
  - might displays render as `<number><might symbol>` using the white Might glyph by default
  - the same visual treatment is used consistently in quick-look card chips and card detail stat blocks where applicable
- Fix quick-look card attribute chips so multi-domain cards render one combined domain UI element with comma-separated text like `Mind, Chaos` instead of one chip per domain.
- Keep the existing card-detail domain block behavior that already renders joined domain text unless code inspection during implementation shows it should be normalized through the same helper for consistency.
- Add or update styling needed for inline symbol sizing, vertical alignment, spacing, and combined-domain chip appearance.
- Add or update tests for:
  - token replacement in card text
  - cost/might UI rendering with symbols
  - multi-domain quick-look chip rendering as one combined chip
  - baseline behavior for cards without symbols/domains

## Test Plan

- Run `npm.cmd test -w @noxiannet/frontend`.
- Run `npm.cmd run build`.
- Manually verify in the app:
  - quick-look cards show symbolized cost and might displays
  - card detail pages show symbolized cost and might displays
  - rules text renders inline symbols in places like rune add costs, exhaust, might references, and wild power
  - multi-domain cards such as Arcane Shift render a single combined domain chip in quick-look UI
  - the approved baseline assets render crisply enough at their UI sizes and are not stretched or misaligned

## Assumptions

- The approved baseline asset copies in `_baseline_pre_cleanup` are the source of truth for implementation unless you later request another asset cleanup pass.
- Supported numeric energy symbols only need to cover the currently prepared `0-12` asset set.
- White symbol variants are the correct default for the UI surfaces being changed in this pass.
