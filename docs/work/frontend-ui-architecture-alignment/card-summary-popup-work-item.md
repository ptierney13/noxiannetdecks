# Work Item: Card Summary Popup

> Status: in progress

## Summary

Plan and build the reusable popup surface that the new card-search results path
opens when a user clicks a result card. This work item creates
`CardSummaryPopup` as the future-facing implementation for the Card Summary
Popup surface, while keeping the current behavior
close enough to the existing `CardQuickLookModal` that later page rewrites can
adopt it without surprise.

This is a prerequisite for the new search-results pane plan. That later plan
assumes `CardSearchResultsPane` can own selected-preview state internally and
render a popup when a repeated result card is clicked. The popup work should
therefore stabilize the popup API, ownership boundary, generic shell behavior,
and Storybook review surface before pane implementation begins.
The existing Card Summary Popup behavior currently lives inside
`frontend/src/cardFormat.tsx` as `CardQuickLookModal`, where popup layout,
card-summary presentation, variant switching, actions, and price-aware behavior
are still bundled together. This work item creates the reusable popup boundary
the new search-results path needs so that work does not duplicate popup
logic inside the pane or deepen the new dependency on the legacy
`cardFormat.tsx` ownership model.

## Implementation Note 2026-05-21

Initial implementation exists in:

- `frontend/src/ui-elements/ModalShell.tsx`
- `frontend/src/features/card/CardSummaryPopup.tsx`
- `frontend/src/features/VariantSelectorRow.tsx`

The new popup path is Storybook-covered and is used by the new
`CardSearchResultsPane`. Legacy `CardQuickLookModal` callers remain in place.
Do not treat the work item as complete until the remaining frontend validation
gap is resolved or explicitly accepted.

## Key Changes

### 1. Create the canonical popup component for search-result preview

Create `CardSummaryPopup` as the reusable popup surface for the new results
path.

The component should:

- render a modal dialog with backdrop dismissal and `Escape` dismissal
- show a compact card summary for the active card
- show variant-selection controls when multiple printings/finishes are present
- expose the same core actions users already have:
  - buy on TCGPlayer
  - view full details
- accept prepared props from a parent rather than owning route state itself
- own no routing concerns

Use `Card Summary Popup` in user-facing copy and active documentation. Older
`quick-look` identifiers remain legacy implementation names only.

### 2. Define a clear split between popup shell and domain content

The popup work should not become another monolith. Split it into:

- a reusable popup shell in `ui-elements/` for backdrop/dialog framing, focus,
  close button treatment, and responsive sizing
- a domain-aware card summary composition in `features/`

Minimum target ownership:

- `ui-elements/`
  - dialog frame, backdrop, generic close affordance, generic modal layout
- `features/`
  - card summary details, variant selection, card-specific actions, price-aware
    summary assembly
- `lib/`
  - pure helpers already used for typeline, cost, tokenized text, or variant
    labels, as appropriate during Stage 6 placement

This work item does not need to settle every final filename in advance, but it
must keep these layer boundaries intact.

### 3. Preserve the current Card Summary Popup behavior contract

The first implementation should preserve the important user-facing behavior of
`CardQuickLookModal`:

- clicking outside the dialog closes it
- pressing `Escape` closes it
- switching variants updates the active card/finish shown in the popup
- the visible card summary includes:
  - art
  - name
  - typeline
  - cost / might / domain chips
  - rules text preview when present
- action links remain available from inside the popup

This work item is not the moment to redesign the popup into a larger card
detail panel or add unrelated feature creep.

### 4. Make the popup compatible with pane-owned selection state

`CardSearchResultsPane` should be able to own popup open/close state itself.
That means `CardSummaryPopup` should use a parent-controlled contract rather
than keeping the selected result in internal route state.

The first-pass prop shape should be close to:

```ts
type CardSummaryPopupProps = {
  group: CardRecord[];
  initialCard: CardRecord;
  initialFinish: "foil" | "nonfoil";
  onClose: () => void;
};
```

Notes:

- `group` stays in the API because variant switching needs access to sibling
  printings
- `View full details` should remain fixed behavior for this surface: it links to
  the card's summary/detail page
- that fixed behavior belongs to the card-summary composition, not the generic
  popup shell
- price loading should remain as-is for this work item and can be revisited in
  later dedicated work

### 5. Keep legacy callers out of scope

The popup plan should explicitly treat `CardQuickLookModal` as legacy
ownership. This work item does not migrate legacy callers.

For this work item:

1. Build `CardSummaryPopup` with Storybook coverage.
2. Validate it through stories only.
3. Leave `CardSearchResultsPane` and all legacy callers for later work.

### 6. Add Storybook-first inspection coverage

The popup work item needs inspectable stories before downstream integrations
rely on it.

Stories should cover:

- default single-card popup
- multi-variant popup with switching behavior
- long rules text
- missing image fallback
- action row present

If the shell and card content are split into separate exported components,
each exported inspectable surface should get its own colocated story.

## Implementation Units

### Unit 1: Contract definition

Write down the intended prop contract and ownership split before wiring the new
component into any page.

This unit should decide:

- what the parent owns
- what the popup owns
- how fixed `View full details` behavior is implemented without leaking routing
  concerns into the generic popup shell
- how active variant state is modeled

### Unit 2: Generic popup shell extraction

Create the reusable dialog/backdrop structure with:

- modal semantics
- backdrop click handling
- `Escape` handling
- close button treatment
- responsive width and spacing rules

The shell must be generic and reusable by future overlays without containing
card-specific UI.

### Unit 3: Card summary composition

Build the domain-aware summary content that renders:

- card image
- name
- typeline
- attribute chips
- rules text excerpt
- actions row

This unit should reuse existing formatting helpers where possible rather than
reimplementing text-token or typeline logic.

### Unit 4: Variant switching

Build or adapt the variant-row behavior so the popup can switch between
printings/finishes inside the same result group.

This unit should preserve:

- clear active-state styling
- price display when available
- click behavior that does not accidentally dismiss the popup

### Unit 5: Storybook coverage

Add colocated stories for the popup and any exported popup shell/content pieces
so later work can validate the experience in isolation before route-level
integration.

### Unit 6: Story-only verification integration

Wire `CardSummaryPopup` into stories only for this work item.

This unit should:

- create a controlled story harness for popup open/close and variant switching
- exercise the generic shell and card-summary composition together
- avoid wiring the popup into `CardSearchResultsPane`
- avoid touching legacy callers

## Open Questions

- None currently. `View full details` is fixed behavior for this surface, price
  loading stays as-is for this work item, and the popup shell should be generic now.

## Risks

- If generic shell behavior and card-specific summary composition are not split
  cleanly now, the next overlay work will have to undo this extraction before
  it can reuse the shell.
- If summary-page navigation leaks into the generic popup shell instead of
  staying in the card-summary composition, later consumers will inherit an
  avoidable coupling.

## Test Plan

Before this work item is considered complete:

- add Storybook coverage for the popup and any exported supporting surface
- run `npm run test -w @noxiannet/frontend`
- run `npm run build -w @noxiannet/frontend`
- run `npm run test:storybook -w @noxiannet/frontend`
- run `npm run build-storybook -w @noxiannet/frontend`
- manually verify:
  - backdrop dismissal
  - `Escape` dismissal
  - variant switching
  - buy/details action affordances
  - long-text overflow behavior
  - narrow and wide popup layouts

## Assumptions

- The existing `CardQuickLookModal` is the behavior baseline, not the permanent
  architectural home.
- `CardSearchResultsPane` comes later and is out of scope for this work item.
- User-facing terminology should say `Card Summary Popup`.
- Reusing existing text/typeline/cost formatting helpers is preferable to
  creating duplicate popup-specific renderers.
