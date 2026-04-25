# Tier List Generator

## Summary

Add a new top-bar `Tier List Generator` tab to the frontend that reuses the existing card search query language to build a tier-list editor from a frozen card result set. The generator should feel like the canonical tier-list UI pattern: a query bar with a generate action, editable tier rows, and a bottom tray of unranked cards that can be click-dragged into rows and reordered within rows.

## Key Changes

- Add a new app-level project tab:
  - Extend the top navigation in `frontend/src/App.tsx` with a dedicated `Tier List Generator` tab.
  - Keep it separate from `Card Search` and `Sealed Simulator`, with its own local state and UI.
- Build a tier-list generation flow that reuses the existing search API:
  - Reuse `searchCards()` and the existing query syntax/normalization behavior.
  - Provide a search input and a `Generate` button in the tier-list tab hero/header.
  - On `Generate`, fetch cards for the current query and snapshot that exact query plus its matching result set into editor state.
  - Show a fixed, read-only bar above the editor with the exact query currently backing the active editor.
  - Do not mutate the active editor when the input text changes; only regenerate when `Generate` is clicked again.
- Add a canonical tier-list editor layout informed by existing tier-list-maker UX:
  - Render a vertical stack of tier rows, each with a prominent editable label cell on the left and a card drop lane on the right.
  - Start with a sensible default row set such as `S`, `A`, `B`, `C`, `D`.
  - Provide controls to add and remove rows and to edit row labels inline.
  - Keep an always-visible bottom tray of unranked cards that contains exactly the cards returned by the most recent generated query, minus any cards currently placed in rows.
- Implement click-and-drag card movement using pointer-driven interactions:
  - Support dragging cards from the unranked tray into any row.
  - Support dragging cards from one row to another.
  - Support dragging cards back to the unranked tray.
  - Show a visible floating card image that follows the pointer while dragging so the interaction reads as direct manipulation rather than invisible repositioning.
  - Support reordering within a row by inserting at the front, middle, or end based on drag position.
  - Support reordering within the unranked tray as cards are returned there.
  - Ensure a single generated card instance can exist in exactly one place at a time.
  - Prefer a pointer-based drag system over browser-native HTML drag/drop so insertion behavior is precise and testable.
- Add editor state modeling for exclusivity and deterministic ordering:
  - Track one canonical list of generated cards keyed by card id.
  - Track placement separately as ordered arrays for each tier row plus the unranked tray.
  - Enforce that moving a card removes it from its previous location before inserting into the new location.
  - Reset placements to all-unranked whenever a new query is generated.
- Style the new screen to match the repo’s current visual language while following the canonical tier-list structure:
  - Query/generate controls across the top.
  - Frozen query banner above the editor.
  - Row label column plus wide horizontal drop lanes.
  - Bottom tray for the generated card pool.
  - Clear drag affordances, insertion feedback, and mobile-safe overflow behavior.
- Expand frontend tests for:
  - Top-bar navigation to the new tab.
  - Generation using the current query input.
  - Frozen query behavior when the input changes without regeneration.
  - Exact card-pool membership for generated filters.
  - Single-location ownership for cards after moves.
  - Reordering inside a row, including front and middle insertion.
  - Returning cards to the unranked tray.
  - Representative query coverage for legends, champion units, runes, and battlefields, both set-specific and cross-set.

## Test Plan

- Run `npm.cmd run test -w @noxiannet/frontend`.
- Run `npm.cmd test`.
- Run `npm.cmd run build`.
- Manually verify:
  - The new top-bar tab opens the tier-list screen.
  - Typing a query does not change the active editor until `Generate` is clicked.
  - The frozen query banner matches the last generated query.
  - The unranked tray contains exactly the matching cards for:
    - legends
    - champion units
    - runes
    - battlefields
    - each both per-set and across all sets
  - Cards can be dragged into a row, reordered inside that row, inserted at the front of a row, inserted between cards in the middle of a row, moved across rows, and dragged back to unranked.
  - No card is duplicated across the board at any time.

## Assumptions

- Tier-list generation can stay fully client-side by reusing the existing `/api/cards` search endpoint; no backend API changes are required.
- Each search result card should appear once in the editor, keyed by its card id, even if different queries in the future might produce different result sets.
- Inline row-label editing plus add/remove-row controls is sufficient for the requested “modifiable number of rows” and “modifiable text” behavior.
- Pointer-driven drag behavior is acceptable for the requested “click-and-drag” interaction and is preferable to browser-native drag/drop for predictable insertion and automated testing.
- The drag interaction should render a floating preview of the actively dragged card image while keeping the source slot occupied only by layout space, so the user sees the card move without the card appearing in two places at once.
- Canonical tier-list UX references reviewed while shaping this plan:
  - [TierMaker example editor](https://tiermaker.com/create/tier-list-19007126)
  - [TierMaker row controls example](https://tiermaker.com/create/tier-list-rows-tier-list-697495)
