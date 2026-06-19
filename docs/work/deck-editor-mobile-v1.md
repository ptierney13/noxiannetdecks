# Deck Editor — Mobile v1

**Status:** plan

## Summary

Build a mobile-first deck editor at `/decks/create` that lets a user build and edit a single Riftbound deck locally. The editor stores decks as a single flat JSON blob in `localStorage`. The UI is mobile-only for this initiative; desktop layout is deferred.

No backend, no user accounts, no cloud sync. One deck at a time, fully client-side.

---

## Key Changes

### Storage Format

A deck is a single JSON object persisted to `localStorage` under a fixed key (e.g. `noxiannet:deck:draft`). Shape:

```ts
type DraftDeck = {
  version: 1;
  updatedAt: string; // ISO timestamp
  legendCardId: string | null;
  legendCardName: string | null;
  championCardId: string | null;
  championCardName: string | null;
  runeLeft: { domain: string; count: number } | null;   // null until legend chosen
  runeRight: { domain: string; count: number } | null;
  battlefields: Array<{ cardId: string; cardName: string; order: "game1" | "play" | "draw"; enabled: boolean } | null>; // length 3, nulls for empty slots
  maindeck: Array<{ cardId: string; cardName: string; quantity: number }>;
  sideboard: Array<{ cardId: string; cardName: string; quantity: number }>;
};
```

No card images stored — card IDs resolve to art URLs at render time via the existing card API.

### New Files

- `frontend/src/pages/DeckEditorPage.tsx` — route page component
- `frontend/src/features/deck-editor/DeckEditorShell.tsx` — main editor layout
- `frontend/src/features/deck-editor/useDraftDeck.ts` — localStorage read/write hook
- `frontend/src/features/deck-editor/DeckEditorTypes.ts` — `DraftDeck` type
- `frontend/src/features/deck-editor/CardPickerModal.tsx` — shared card-search popup used by all clickable slots
- `frontend/src/features/deck-editor/LegendSlot.tsx`
- `frontend/src/features/deck-editor/ChampionSlot.tsx`
- `frontend/src/features/deck-editor/RuneRow.tsx`
- `frontend/src/features/deck-editor/BattlefieldRow.tsx`
- `frontend/src/features/deck-editor/CardListSection.tsx` — shared for maindeck and sideboard
- Storybook stories colocated with each exported component

### Router Change

Add `decks/create` route to `frontend/src/app/router.tsx` pointing to `DeckEditorPage`.

---

## UI Layout (Mobile-Only)

The page is a single scrollable column inside the app shell. No fixed side panels. Sections stack vertically with consistent `gap-5` between them. The shell uses `surface-1` background, section containers use `surface-2`.

**Section order (top to bottom):**

1. **Header row** — deck title (editable inline) + save indicator
2. **Legend + Champion row** — two equal-width slots side by side
3. **Rune row** — `[+ fury] [rune icon 6] [rune icon 6] [order +]` style layout
4. **Battlefield row** — three equal-width slots
5. **Maindeck section** — card list with Add Cards button
6. **Sideboard section** — card list with Add Cards button

### Section counts (title badge)

| Section | Cap |
|---|---|
| Legend | 1 |
| Champion | 1 |
| Battlefields | 3 |
| Maindeck | 39 |
| Sideboard | 8 |

Runes show no count badge — they show domain-colored pip counts on the slot instead.

---

## Component Behavior Details

### Legend + Champion Slots

- Side by side in a row, equal width (`w-1/2` each with small gap)
- Empty: a clickable dashed-border tile with section label and a `+` icon centered
- Filled: card art showing top ~30% of the card image, card name displayed below the art crop
- Same physical height whether empty or filled — approximately `120px` tall on mobile
- Clicking either slot (empty or filled) opens `CardPickerModal` filtered to that slot's legal card pool
- Legend slot: only Legend-type cards
- Champion slot: only Champion cards that match the selected legend's domain (disabled/grayed if no legend)
- Removing is done via reselection — no separate remove button

### Rune Row

- Locked (visually dimmed, not clickable) until a legend is selected
- Two rune slots, each showing a colored domain rune icon and a count badge
- Rune domains are determined by the selected legend (two domains)
- Default split: 6 / 6 (total must always equal 12)
- Left slot: domain-color `+` button to its left; right slot: domain-color `+` to its right
- Tapping `+` moves 1 rune from the other side to this side (min 1 per side, max 11 per side)
- Domain colors come from `--domain-{name}` tokens

### Battlefield Row

- Three equal slots in a row
- Empty: clickable dashed-border tile
- Filled: same top-30% art crop + name as Legend/Champion
- Each slot has a small label underneath the slot ("Game 1", "Play", "Draw") with a checkbox that disables the preference (unchecked = not used in ordering)
- Clicking a slot opens `CardPickerModal` filtered to Battlefield cards (no legend restriction)

### Maindeck and Sideboard

- Section header: `MAINDECK  N / 39` and `SIDEBOARD  N / 8`
- Each populated row: `[card name]  [cost]  [– qty +]`
  - `-` and `+` stacked vertically on the right edge (top/bottom button style)
  - Card mana cost shown just left of the quantity control
  - Tapping card name opens `CardPickerModal` in replace mode (same slot)
- "Add Cards" button in green (`--color-positive`) below the last row (or at top if empty)
- Rows are draggable between maindeck and sideboard — drag moves 1 copy of that card
- Reducing quantity to 0 removes the row
- Maindeck filtered to: legend's domain + significant spells for that legend
- Sideboard same filter rules as maindeck

### CardPickerModal

- Uses existing `ModalShell`
- `CardSearchInput` at top for text filtering
- Scrollable card list below
- Cards shown as compact rows: art thumbnail, name, cost
- Tapping a card selects it and closes the modal
- Filters passed as props: `allowedCardTypes`, `legendId` (optional), `domain` (optional)
- Uses existing card search API (`/api/cards` query) — same endpoint the card search page uses

---

## Confirmed API Facts

### Card Search

`searchCards(query: string)` in `card_store/src/query/evaluator.ts`, called via `frontend/src/api.ts`.

Relevant query strings for the editor:
- `t:legend` — legend cards
- `supertype:Champion` — champion cards
- `ct:Battlefield` — battlefield cards
- `d:fury` (or any domain name) — domain filter
- `ct:Spell` — spells (for maindeck)

Queries can be combined: `d:fury ct:Spell` for fury spells.

### Card Art

`card.media.image_url` (nullable string, absolute CDN URL). Fallback to card name text when null. Domain is at `card.attributes.domain` (array of strings). Card type at `card.type.cardtype`, supertype at `card.type.supertype`.

### Drag-and-Drop

Use native Pointer Events — same pattern as `TierListView.tsx`. No library needed:
- `pointerdown` → start drag, store offset, call `setPointerCapture`
- `pointermove` on `window` → update position, resolve drop target via `document.elementsFromPoint`
- `pointerup`/`pointercancel` on `window` → commit move, release pointer capture
- Drop targets identified by `data-*` attributes (`data-deck-drop-slot`, `data-deck-section`)
- Fixed-position drag preview floats at `(x - offsetX, y - offsetY)` at `z-50`

---

## Assumptions

- `localStorage` is sufficient for v1 — no IndexedDB, no server.
- One draft at a time — no deck library in this initiative (Library route is future work).
- Two domains per legend for v1 rune row; revisit if a mono-domain legend exists.
- Maindeck filter = legend's domains + `ct:Spell`; archetype-specific filtering is future work.

---

## Implementation Units

1. `DraftDeck` type + `useDraftDeck` hook (localStorage read/write, typed mutations)
2. Route registration (`decks/create` → `DeckEditorPage`)
3. `DeckEditorShell` — layout skeleton, section stubs, scroll container
4. `CardPickerModal` — shared picker using `ModalShell` + card API query
5. `LegendSlot` + `ChampionSlot` (shared slot component with art crop + empty state)
6. `RuneRow` — domain-colored `+` buttons, count badges, locked state
7. `BattlefieldRow` — three slots with Game1/Play/Draw labels + checkboxes
8. `CardListSection` — maindeck + sideboard list with qty controls and drag-to-move
9. Storybook stories for all exported feature components
10. Build + test pass

---

## Test Plan

- `useDraftDeck` — unit tests: init with no localStorage, load from existing, update mutations, cap enforcement
- `CardPickerModal` — story: empty query, results, loading, filter props
- Slot components — story: empty state, filled state
- `RuneRow` — story: locked (no legend), unlocked various splits
- `BattlefieldRow` — story: all empty, partially filled, checkboxes
- `CardListSection` — story: empty (Add Cards visible), populated, quantity controls
- Full page Storybook story at mobile viewport
- Manual: add legend → champion unlocks, rune row unlocks, add main cards, drag between sections, localStorage persists on reload

---

## Risks

- `ModalShell` scroll lock on mobile — check existing implementation before building `CardPickerModal`.
- `card.media.image_url` may be null for some cards — art crop slots need a name-only fallback state.
