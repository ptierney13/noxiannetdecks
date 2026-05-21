# Trade Balancer — Implementation Plan

> Archived note: this is a historical proposal record, not active work.

**Status:** Proposed  
**Date:** 2026-05-07

## Goal

A `/trade` route that lets you build two card lists (Mine / Yours), tracks quantities, condition, and finish per card, computes price totals, and shows the difference. Search is debounced real-time (not form-submit).

## Files to create

| File | Purpose |
|---|---|
| `frontend/src/TradeBalancerView.tsx` | Main view component |
| `frontend/src/useDebounce.ts` | Generic debounce hook (reusable) |

## Files to modify

| File | Change |
|---|---|
| `frontend/src/App.tsx` | Add `/trade` route + "Trade Balancer" nav link |
| `frontend/src/App.css` | Trade Balancer styles |

## State shape

```ts
type TradeItem = {
  id: string;           // card.id + finish (unique per slot)
  card: CardRecord;
  qty: number;
  condition: string;    // "near mint" | "lightly played" | ...
  finish: "foil" | "nonfoil";
};

type TradeSide = "mine" | "yours";
```

`mine` and `yours` are each `TradeItem[]` in component state.

## Price resolution

For each `TradeItem`, look up price via:
```
getPublishedRowsForCard(index, card.tcgplayer_id)
  .find(r => r.printing matches finish && r.condition matches condition)
  ?.currentPrice.amount ?? null
```
Total = sum of `(price ?? 0) * qty` per side.

## Search

- `useDebounce(query, 150)` — fires `searchCards()` 150 ms after last keystroke
- Minimum 2 characters before firing (avoids thrashing on single chars)
- Shows a loading indicator (spinner or dimmed results) during fetch
- Empty state: prompt text "Type to search"
- No-results state: "No cards found for '…'"

## Desktop layout

Three-column grid (`1fr 280px 1fr`):
- **Left (Mine):** green header, card bars with drag handle / name+tags / condition select / finish select (omitted if card has only one finish) / qty stepper / price / remove button
- **Center (Add):** sticky search column; results list; "Select a card, then add to:" + two buttons ("+ Mine" / "+ Yours")
- **Right (Yours):** red header, same card bar structure
- **Delta bar** below the grid

## Mobile layout

Single-column, no tabs:
- Mine section header + scrollable list
- Search bar pill (center, always visible)
- Yours section header + scrollable list
- Bottom delta strip

**Search expanded** (input focused):
- Both card lists hidden; replaced by compact total strip (Mine $X · −$Y · Yours $Z)
- Search results fill remaining space above simulated keyboard
- Each result has "**+ Mine**" / "**+ Yours**" buttons inline

**Card expanded** (tapped in list):
- In-place expansion; art thumbnail left + 2×2 grid of Condition / Finish / Qty / Price controls
- "Move to Yours →" / "Move to Mine →" button + Remove button

## Drag-and-drop

- HTML5 drag-and-drop on desktop
- `draggable="true"` on each card bar; `onDragStart` stores `{ id, fromSide }`
- Drop zones on each side body; `onDrop` moves item between arrays
- Visual feedback: `drop-target` class on the receiving side during `onDragOver`
- Mobile: "Move to Yours/Mine" button in expanded card view (no drag needed)

## Finish dropdown visibility

Only shown when `card.finishes.length > 1`. If a card is foil-only or nonfoil-only, the finish select is omitted and the finish is fixed.

## Conditions list

`["near mint", "lightly played", "moderately played", "heavily played", "damaged"]` — same order as price data.

## Out of scope

- Persistence / save/load (future)
- Deck-based import (future)
- Currency other than USD

## Open questions (resolved)

- Labels: "Mine" / "Yours" (not customizable)
- Layout: full route at `/trade`
- Mobile card edit: expand in-place, art on left
- Finish + condition: separate dropdowns
