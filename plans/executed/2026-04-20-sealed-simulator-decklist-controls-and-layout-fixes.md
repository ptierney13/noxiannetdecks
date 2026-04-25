# Sealed Simulator Decklist Controls And Layout Fixes

## Summary

Update the Sealed Simulator decklist UI to remove the broken drag/drop Legend and Champion assignment scaffolding, replace those zones with explicit dropdown selectors, add a snapshot workflow for saving multiple decklist states while building sealed decks, and fix battlefield/card state rendering issues found in the pool display.

## Key Changes

- Fix battlefield rendering:
  - Treat battlefield cards as horizontal-layout cards instead of vertical cards.
  - Render battlefields in the same no-cost/special row context as runes and legends.
  - Let battlefield cards extend to the right from that row rather than forcing later energy columns beside them.
  - Document/enforce the layout invariant that no energy column may appear to the right of the battlefield lane.
  - Add or update tests for battlefield layout classification if local fixtures/card data support it.
- Update deck/pool card selected styling:
  - Keep cards greyed when the exact generated pool entry is in the decklist.
  - Remove the transparency effect so selected cards remain fully legible.
  - Preserve exact-entry behavior so duplicate playable copies from other packs are not greyed.
- Remove drag-and-drop assignment behavior from the decklist:
  - Remove draggable card props from decklist cards.
  - Remove drop handlers and drag transfer code from Legend and Champion zones.
  - Keep card hover zoom behavior on decklist and zone cards.
- Replace Legend and Champion zones with dropdown selectors:
  - Legend dropdown lists only decklist cards whose card type is `Legend`.
  - Champion dropdown lists only decklist cards identified as champion units.
  - Each dropdown includes an empty/none option.
  - Existing selected Legend/Champion values are cleared if the chosen card is removed from the decklist.
- Add decklist row actions:
  - Add a `Snapshot` button next to the `Decklist` title.
  - Add a `Clear` button on the far right of the decklist header row to clear deck cards and selected Legend/Champion values.
- Add snapshot creation:
  - Pressing `Snapshot` opens a dialog asking for a snapshot name.
  - Saving records the current decklist entries plus selected Legend and Champion ids.
  - Empty names are rejected or normalized to a sensible default only if needed.
- Add snapshot recall controls:
  - Saved snapshots appear as named buttons next to the `Snapshot` button.
  - Clicking a snapshot restores that saved decklist state and selected Legend/Champion values.
  - The snapshot list supports more than four snapshots by keeping the controls in a horizontally scrollable strip.
  - The UI should comfortably show up to four snapshot buttons at once before scrolling.
- Keep snapshots local to the active simulator session and clear them when a new sealed pool is generated, unless implementation context shows retaining them is safer.
- Update tests for:
  - Dropdown-based Legend/Champion selection.
  - Removal of drag/drop behavior from assignment tests.
  - Snapshot dialog creation and restoration.
  - Clear Deck behavior.
  - Snapshot strip rendering enough buttons to support scrolling beyond four entries.

## Test Plan

- Run `npm.cmd test -w @noxiannet/frontend`.
- Run `npm.cmd test`.
- Run `npm.cmd run build`.
- Manually verify in the running app:
  - Battlefield cards render horizontally and extend right from the rune/legend row.
  - No normal energy column is positioned to the right of a battlefield lane.
  - Greyed pool cards remain readable and non-transparent.
  - Add Legend and Champion cards to the decklist.
  - Select them via dropdowns.
  - Save a named snapshot.
  - Clear the decklist.
  - Restore the snapshot.
  - Create more than four snapshots and confirm the row scrolls without bloating the decklist header.

## Assumptions

- Snapshots do not need backend persistence yet; they can live in React state for the current generated pool/session.
- Snapshot restore should restore exact generated pool entries by id, preserving copy-specific behavior.
- Snapshot buttons can reuse the entered name without enforcing uniqueness; duplicate names are allowed unless the UI becomes confusing during testing.
- Clearing the decklist should not clear saved snapshots.

## Follow-Up Amendment: Pool Mode Control

- Default the simulator to Unleashed Pre-Rift instead of Spiritforged Standard.
- Replace the Settings disclosure with one pool-mode dropdown to the left of `New Pool`.
- Expose the mode options as full names: Origins, Spiritforged, Spiritforged Pre-Rift, Unleashed, Unleashed Pre-Rift, and Custom.
- For Pre-Rift modes, show a selector layer using the same visual language as Custom pack selection, with a seed-pack dropdown.
- For Custom, keep the six pack selectors open as a selector layer and have `New Pool` read the current values directly.
- Remove the Custom `Done` button.
- Widen and space the six pack controls so they do not visually overlap.

## Follow-Up Amendment: Legal Deck Zones

- Split selected deck state into main deck cards, battlefield slots, Legend, and Champion so legality counts match deck construction.
- Treat legal ranges as exactly 25 main deck cards, 0-3 battlefields, 0-1 Legend, and 0-1 Champion Unit.
- Show detailed count chips to the right of `Snapshot`, with green in-range counts and red out-of-range counts.
- Move saved snapshot buttons to their own row beneath the Decklist/Snapshot/counts row.
- Always render three battlefield slots near the Legend/Champion controls.
- Fill empty battlefield slots with a landscape battlefield-back placeholder when no local back image is available.
- Route clicked battlefield cards into the next battlefield slot, clicked Legends/Champion Units into their respective selector zones, and other clicked cards into the main deck.

## Follow-Up Amendment: Decklist Cost View And Type Summary

- Render the main deck area using the normal sealed sort-by-cost energy-column view instead of a horizontal strip.
- Keep decklist cards removable by clicking them from the decklist board.
- Add a secondary summary row beneath the legality count chips showing Unit, Spell, and Gear counts for the main deck.
- Update tests so the decklist verifies:
  - main-deck cards appear in energy-column order rather than insertion order
  - the Unit/Spell/Gear summary matches the current main-deck contents
