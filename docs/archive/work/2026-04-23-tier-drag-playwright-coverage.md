# Tier Drag Validation And Playwright Coverage

## Summary

Fix the tier-list drag-and-drop interaction so it works reliably in the real browser, add Playwright end-to-end coverage for the tier-list drag flows, and refine the editor layout to match the intended tier-list presentation.

## Key Changes

- Repair tier-list dragging in the browser:
  - Rework the current custom pointer-drag implementation so it uses a reliable drag lifecycle in real browser input, not just synthetic unit-test events.
  - Preserve the visible floating card preview while dragging.
  - Keep the page rendered during click-and-hold on a card by suppressing native image drag/callout behavior on the card surface.
  - Ensure row insertion works when dragging over card faces and empty row space, not only narrow insertion gaps.
  - Ensure drop targeting works consistently from the unranked tray into rows, between rows, and back to unranked.
  - Keep single-location ownership so a card appears in only one lane at a time.
- Add browser-level Playwright coverage:
  - Add Playwright as a frontend/end-to-end test dependency and script set.
  - Add a Playwright config that can run against the local Vite/frontend and API stack for this repo.
  - Create tests that validate real pointer drag behavior for the tier list, including:
    - pressing and holding a card without the page blanking or navigating away
    - dragging from unranked into a tier row
    - reordering within a row
    - inserting at the front of a row
    - moving a ranked card back to unranked
    - verifying the floating drag preview appears during drag
  - Keep the existing Vitest coverage for state-model logic and add Playwright for true browser interaction coverage.
- Refine the tier-list editor presentation:
  - Render the tier rows inside one continuous bordered list with row dividers instead of separated card-like blocks.
  - Change the sticky banner copy to `Tier List for <normalized query>`.
  - Increase the size of placed cards so they fill the full row height up to the dividers.
  - Replace the visible `Remove` action with a hover-revealed top-right `X` row control.
  - Keep row height fixed by sizing cards to the rows instead of allowing placed cards to resize the row.
  - Match the bottom tray card size to the fitted in-row card size.
  - Simplify tier-list helper copy by removing the extra reminder text from the query panel, tier editor header, and unmatched-card header.
  - Rename `Matching Cards` to `Unmatched Cards`.
  - Rename `Tier Editor` to `Tier List Editor`.
  - Increase the unmatched-card tray bottom padding so the full bottom row remains visible instead of crowding the panel edge.
  - Expand active between-card insertion gaps so the targeted slot visually opens while hovering between two cards.
  - Treat the blank space to the right of the last card in a row as a drop target for appending to that row.
  - Treat any point inside an empty row as a drop target for inserting into that row, with the existing highlight reflecting the target.
  - Add a `Reset Rankings` action to the unmatched-card header that restores the current generated filter back to its fully unranked base state.
- Expand automated coverage:
  - Keep Vitest coverage for the tier-list state-model and narrow browser interaction assertions to Playwright where they are more trustworthy.

## Test Plan

- Run `npm.cmd run test -w @noxiannet/frontend`.
- Run the new Playwright suite for the tier-list drag flow.
- Run `npm.cmd test`.
- Run `npm.cmd run build`.
- Manually verify in the browser:
  - clicking and holding a bottom-tray card keeps the app visible and shows the floating drag card
  - the tier rows render as a continuous framed list with dividers and no gaps
  - the sticky banner reads `Tier List for <normalized query>`
  - in-row cards fill the row height
  - adding cards to a row does not change row height
  - bottom-tray cards match the in-row card size
  - `Unmatched Cards` replaces `Matching Cards`
  - `Tier List Editor` replaces `Tier Editor`
  - the unmatched tray leaves enough bottom space to fully show the last wrapped card row
  - no extra helper text appears under the query field, tier editor heading, or unmatched-card heading
  - the `X` row remove button only appears on hover on desktop
  - active insertion slots between cards expand horizontally while highlighted
  - dropping anywhere to the right of the last card appends into that row
  - dropping anywhere inside an empty row inserts into that row and shows the row target highlight before drop
  - `Reset Rankings` returns all cards to the unmatched tray in the generated order for the current filter
  - tier-list cards can actually be dragged with the mouse from the bottom tray into rows
  - row insertion works at the front, middle, and end
  - dragging back to unranked works
  - the floating drag image follows the pointer throughout the interaction

## Assumptions

- Adding Playwright and its browser runtime is acceptable for this repo even though it introduces new test tooling and may require dependency installation.
- No persistence work is required for this change; the scope is limited to interaction reliability and browser-level validation.
