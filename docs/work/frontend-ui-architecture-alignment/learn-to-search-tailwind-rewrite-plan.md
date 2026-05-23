# Behavioral Spec: Learn to Search Rewrite

> Status: plan
> Initiative: Stage 7 - Page-by-Page UI Rewrites

## Summary

Rework the `LearnToSearchView` route into a modern interactive teaching page
with three top-level modes:

- Visual Guide
- Text Guide
- Syntax Guide

This document is behavioral and design input for the future Stage 7 rewrite
plan. It is not an approved implementation plan yet. When planning begins,
extend this file with inventory, component decisions, implementation units,
tests, and open questions rather than creating a separate spec document.

The page should teach users how to understand and experiment with the Noxian
card search language. It should not read like static API documentation. The
Visual Guide and Text Guide continue to explain where queryable card data lives;
the Syntax Guide becomes a full interactive learning surface for operators,
matching behavior, logical composition, and mental models.

## Goals

- Preserve the current phone behavior for the Visual Guide: a well-sized card,
  side margins, and tap-to-open detail popups.
- Add a large-layout mode where selected guide details are shown inline in a
  right-side stream instead of as popups.
- Apply the same responsive interaction model to the Text Guide.
- Fully redesign the Syntax Guide around comparison-first teaching and a live
  query sandbox.
- Match the current Noxian crimson design direction: strong contrast, crimson
  accents, warm syntax chips, restrained surfaces, and smooth interactive states.
- Keep the page scannable for new users while making syntax differences fast to
  learn for experienced Scryfall-style users.

## Non-Goals

- Do not turn the Syntax Guide into a field catalog. The site already has a
  query builder, searchable field list, and clickable card anatomy image.
- Do not create a wiki-like sequence of documentation blocks.
- Do not teach backend implementation terms first. Plain-English behavior comes
  before technical detail.
- Do not implement from this document alone. The eventual plan must still read
  the current code and list concrete files, components, data hooks, CSS removal,
  Storybook stories, and validation commands.

## Breakpoint Model

User references to `lg` mean the repo's viewport-number breakpoint:

- `lg`: `1024px`

The content behavior may be implemented with container queries if the content
container is the real layout signal, but the threshold must use the explicit
numeric value `1024px`. Do not use Tailwind named container shorthand such as
`@lg:` when the intended behavior is the `1024px` viewport-equivalent threshold.

## Page Navigation

The top bar uses exactly three menu items:

- Visual Guide
- Text Guide
- Syntax Guide

Behavior:

- The items select the active Learn to Search mode without leaving the route.
- The control should use the standard header menu-item behavior and visual
  language: selected state, warm accent emphasis, underline, hover/focus surface
  glow, transition timing, and at least `44px` touch height.
- The implementation may use tab semantics (`role="tablist"` / `role="tab"`)
  because these are same-page mode switches, but the visuals and interaction
  cadence should match the header `MenuItem` pattern.
- On small viewports, the three items fit across the available width. Text must
  not wrap awkwardly or overflow its button.
- On large viewports, the bar remains compact and intentionally connected to
  the page content instead of becoming a separate landing-page hero.

## Shared Detail Interaction Model

Visual Guide and Text Guide share one responsive detail model.

Small and medium layouts below `1024px`:

- Selecting an item opens a popup/sheet with that item's details.
- The selected state is single-select.
- A new selection replaces the current popup content.
- Dismissing the popup clears the active small-layout selection.
- The popup is the only detail presentation on small layouts.

Large layouts at `1024px` and above:

- Popups are disabled for these guide modes.
- Multi-select is enabled.
- The left half contains the interactive guide surface.
- The right half contains an inline stream of selected detail blocks.
- The stream orders selected details from most recently selected to least
  recently selected.
- Selecting an unselected guide item adds it to the top of the stream.
- Selecting an already-selected item makes it most recent and keeps it selected,
  unless the final plan chooses an explicit remove affordance.
- Detail blocks should include a clear remove/dismiss control so multi-select
  does not become sticky without an escape.
- If no items are selected, the right stream shows a calm empty state that does
  not resemble a popup.

Responsive state continuity:

- When shrinking from the large layout to a smaller layout, preserve all large
  selections in state but do not open a popup automatically.
- If the viewport grows back to the large layout without any small-layout
  selection, restore the previous multi-select stream.
- If the user makes a new selection while in the smaller layout, switch to the
  expected small single-select state: one active popup, and the previous large
  multi-select state is replaced by that single selected item.
- This behavior prevents surprise popups during resize while still keeping the
  large-layout teaching workspace intact when the user returns to it.

## Visual Guide

Mobile baseline to preserve:

- The current phone sizing is correct.
- The card scales to the screen width with comfortable margins on either side.
- Tapping any card element opens a detail popup.
- The guide feels like a card-first experience, not a surrounding-document
  experience.

Scaling behavior:

- From mobile up to the `1024px` breakpoint, the card should keep scaling up
  with the available width.
- It should continue spanning the main content width until the large layout
  takes over.
- Avoid capping the card too early; the existing problem is that the card stops
  growing before the layout has enough room for a side panel.

Large layout at `1024px` and above:

- The guide becomes a two-column workspace.
- The left half contains:
  - the "Tap any element..." instructional line above the card
  - the interactive card anatomy surface
- The right half contains the inline selected-detail stream.
- The card and the text above it should be visually grouped on the left.
- The card should remain large enough that individual selectable regions are
  easy to inspect and click.

Selection behavior:

- Small layout: tap a card element -> popup.
- Large layout: click a card element -> add or promote the detail block in the
  right stream.
- Hovering a selectable region should preview/emphasize the target without
  committing selection.
- Active selected regions should be visibly distinct from hover-only regions.

## Text Guide

The Text Guide should share the same dual layout and state rules as the Visual
Guide.

Small and medium layouts:

- The field list remains the primary surface.
- Tapping a field row opens a popup/sheet for that field.
- Query examples remain clickable and should continue to append or populate
  search behavior according to the final page interaction model.

Large layout at `1024px` and above:

- The left half contains the field list.
- The right half contains the inline selected-detail stream.
- Multi-select is enabled with most-recent selection first.
- Popups are disabled.

Design direction:

- The field list should feel searchable and clickable, but not like a giant
  static table.
- Parent/child field relationships such as Cost -> Energy/Power and Type line
  -> Card type/Supertype/Tag should remain scannable.
- Rows should use the same selected, hover, focus, and warm query-chip language
  as the Visual Guide.

## Syntax Guide Redesign

The Syntax Guide should be rebuilt from the ground up as an interactive
teaching tool. It teaches query semantics, not available fields.

Target audiences:

- New users unfamiliar with query languages.
- Experienced Scryfall-style users who want to quickly learn syntax behavior
  and differences.

The design should feel like:

- a modern interactive developer tool
- a query playground
- a comparison-based learning surface
- a scannable reference users can understand by clicking and changing examples

The design should not feel like:

- API docs
- a wiki
- accordion documentation
- a giant vertical wall of prose

### Syntax Guide Hero And Sandbox

Top section content:

- Title: "Learn Query Syntax"
- Subtitle: one concise sentence explaining that this page teaches how the
  query language behaves.
- A large interactive query sandbox centered in the page.

Sandbox requirements:

- Editable query input.
- Syntax highlighting for fields, operators, strings, numbers, negation, and
  logical keywords.
- Live semantic breakdown underneath the input.
- Clicking any example elsewhere on the page updates the sandbox.
- Editing the sandbox updates the semantic breakdown live.
- The sandbox should gracefully handle unknown or partial syntax with helpful,
  non-scolding feedback.

Example sandbox state:

```text
t:unit c>=3 -tag:dragon

OK: Type is Unit
OK: Cost is 3 or greater
OK: Excluding Dragon cards
```

The explanation should be plain English first. Technical nuance can live in
tooltips, disclosure text, or secondary footnotes.

### Main Syntax Guide Structure

Organize by user intent, not implementation terminology.

1. Matching Text
2. Comparing Values
3. Combining Queries
4. Controlling Results

Each section should use comparison cards, live examples, and click-to-sandbox
behavior. Avoid long prose stacks.

### Section 1 - Matching Text

Teach:

- partial matching
- exact matching
- quotes
- wildcards

Primary comparison:

| Query | Plain-English meaning | Key difference |
|---|---|---|
| `name:jinx` | Matches cards whose name contains "jinx". | Broad match. Useful when you only know part of the name. |
| `name="Jinx"` | Matches the exact name "Jinx". | Narrow match. Use when only that exact value should match. |

Wildcard comparison:

| Query | Plain-English meaning |
|---|---|
| `name:jin*` | Matches names that start with "jin". |
| `name:*dragon*` | Matches names containing "dragon" anywhere. |

Interaction:

- Each query chip/card is clickable and pushes the query into the sandbox.
- Hovering a comparison card should visually emphasize what changes between
  the two examples.
- The explanation should highlight "contains", "exactly", "starts with", and
  "anywhere" as the mental model words.

### Section 2 - Comparing Values

Teach:

- numeric comparisons
- set semantics
- contains versus exact set behavior
- less-than/greater-than behavior for ordered values

Critical comparison:

| Query | Plain-English meaning | Visual model |
|---|---|---|
| `d:purple` | Matches cards that include Purple. | Purple is inside the card's domains. |
| `d=purple` | Matches cards that are exactly Purple. | Purple is the full domain set. |

Additional examples:

- `d<pu`
- `d>p`
- `d<=mf`
- `c>=3`
- `m<5`
- `e=2`

Design:

- Use small set-relationship diagrams or chips where possible.
- Show domains as colored chips with containment/equality visual states.
- Numeric comparisons can use compact value rails or step markers.
- Plain-English copy should say "3 or greater", "less than 5", "exactly 2",
  and similar direct phrases.

### Section 3 - Combining Queries

Teach:

- implicit AND
- explicit OR
- negation
- grouping precedence

Important comparison:

| Query | Meaning |
|---|---|
| `d:body or d:fury` | Matches Body cards or Fury cards. |
| `(d:body or d:fury) t:unit` | Matches Unit cards that are Body or Fury. |

Negation examples:

- `-tag:dragon`
- `not rarity:Common`

Design:

- Use syntax coloring heavily.
- Show grouping/parsing visually: chips, nested outlines, or a small parse
  ladder that makes precedence obvious.
- Make implicit AND visible in the explanation even when it is not typed.
- Plain-English copy should lead with the result: "Unit cards that are Body or
  Fury", not parser terminology.

### Section 4 - Controlling Results

Teach:

- unique modes
- finishes
- treatments
- variants

Examples:

- `unique:legal`
- `unique:art`
- `is:foil`
- `is:Signed`
- `is:altart`

Design:

- This section should feel more like selectable filters/chips than document
  prose.
- Group related controls into compact bands.
- Clicking a chip updates the sandbox and the semantic breakdown.
- Show how result-control terms affect displayed results rather than card
  matching content.

### Coming From Scryfall Card

Add a lightweight "Coming from Scryfall?" sidebar/card.

Purpose:

- Quickly orient experienced users.
- Highlight semantic differences without becoming a migration manual.

Topics:

- set semantics
- default uniqueness behavior
- wildcard handling
- normalized matching

Tone:

- Brief, specific, and comparative.
- Avoid deep implementation detail unless exposed through optional secondary
  text.

## Full Page Layout

### Desktop Layout

```text
+--------------------------------------------------------------------+
| Visual Guide     Text Guide     Syntax Guide                       |
+--------------------------------------------------------------------+
|                                                                    |
| Syntax Guide selected:                                             |
|                                                                    |
|                 Learn Query Syntax                                 |
|       Understand how Noxian search queries behave.                 |
|                                                                    |
|       +----------------------------------------------------+       |
|       | t:unit c>=3 -tag:dragon                            |       |
|       +----------------------------------------------------+       |
|       | OK: Type is Unit                                     |       |
|       | OK: Cost is 3 or greater                             |       |
|       | OK: Excluding Dragon cards                           |       |
|       +----------------------------------------------------+       |
|                                                                    |
| +------------------------------+ +------------------------------+ |
| | Matching Text                | | Coming from Scryfall?        | |
| | name:jinx  vs  name="Jinx"   | | Key differences, compact     | |
| | Click either example         | | notes, no giant migration    | |
| +------------------------------+ +------------------------------+ |
| +------------------------------+ +------------------------------+ |
| | Comparing Values             | | Combining Queries            | |
| | d:purple vs d=purple         | | grouping and negation        | |
| +------------------------------+ +------------------------------+ |
| +----------------------------------------------------------------+ |
| | Controlling Results: unique/is chips                            | |
| +----------------------------------------------------------------+ |
+--------------------------------------------------------------------+
```

Visual/Text Guide large layout:

```text
+--------------------------------------------------------------------+
| Visual Guide     Text Guide     Syntax Guide                       |
+--------------------------------------------------------------------+
| +------------------------------+ +------------------------------+ |
| | Tap any element...           | | Selected details             | |
| |                              | | +--------------------------+ | |
| | [large interactive card]     | | | Most recent selection    | | |
| |                              | | +--------------------------+ | |
| |                              | | +--------------------------+ | |
| |                              | | | Previous selection       | | |
| |                              | | +--------------------------+ | |
| +------------------------------+ +------------------------------+ |
+--------------------------------------------------------------------+
```

### Mobile Layout

```text
+----------------------------+
| Visual | Text | Syntax     |
+----------------------------+
| Learn Query Syntax         |
| Query sandbox              |
| Live explanation           |
|                            |
| Matching Text              |
| +------------------------+ |
| | name:jinx              | |
| | name="Jinx"            | |
| +------------------------+ |
|                            |
| Comparing Values           |
| +------------------------+ |
| | d:purple / d=purple    | |
| +------------------------+ |
+----------------------------+
```

Visual/Text Guide mobile:

```text
+----------------------------+
| Visual | Text | Syntax     |
+----------------------------+
| Tap any element...         |
|                            |
| [card scaled to phone]     |
|                            |
| tap selection              |
| v                          |
| popup/sheet with details   |
+----------------------------+
```

## Fully Expanded Section Example

Expanded "Comparing Values" section:

```text
Comparing Values
Numbers and value sets use comparison operators.

+------------------------------+  +------------------------------+
| d:purple                     |  | d=purple                     |
| Includes Purple              |  | Exactly Purple               |
|                              |  |                              |
| [Purple] inside [Purple][Calm]|  | [Purple] equals [Purple]     |
|                              |  |                              |
| Matches cards that have      |  | Matches cards whose domains  |
| Purple among their domains.  |  | are only Purple.             |
+------------------------------+  +------------------------------+

Try more comparisons:
[d<pu] [d>p] [d<=mf] [c>=3] [m<5] [e=2]

Sandbox after selecting c>=3:
OK: Cost is 3 or greater
```

Interaction notes:

- Hovering `d:purple` highlights the "includes" visual.
- Hovering `d=purple` highlights the "exactly" visual.
- Clicking either card pushes that query into the sandbox.
- The semantic panel updates immediately.

## Sandbox State Examples

```text
name:jinx
OK: Name contains "jinx"
```

```text
name="Jinx"
OK: Name is exactly "Jinx"
```

```text
d:purple
OK: Domains include Purple
```

```text
d=purple
OK: Domains are exactly Purple
```

```text
(d:body or d:fury) t:unit
OK: Domains include Body or Fury
OK: Type is Unit
OK: Grouping makes the OR apply before the Unit filter
```

```text
unique:art is:foil
OK: Show one result per artwork
OK: Only show foil printings
```

Unknown or partial syntax example:

```text
d:
- Choose a domain value to finish this filter.
```

## Hover And Click Behavior

All example queries:

- are keyboard focusable
- have hover and focus-visible states
- are visibly clickable
- update the sandbox on click
- update the semantic explanation panel
- may animate the selected query into the sandbox if the animation is subtle
  and does not block interaction

Hover previews:

- emphasize the semantic difference in comparison pairs
- may preview the explanation in the sandbox only if it is visually distinct
  from a committed click
- must not be required for touch users

Click behavior:

- commits the query into the sandbox
- updates syntax highlighting
- updates semantic explanation
- may update a "last selected example" state for visual continuity

Keyboard behavior:

- top mode items use arrow-key tablist behavior if implemented as tabs
- examples are reachable by Tab
- Enter/Space activates an example
- Escape closes small-layout popups/sheets

## Content Voice

Use plain English first:

- Good: "Matches cards whose name contains 'jinx'."
- Good: "Matches cards that include Purple."
- Good: "Matches Unit cards that are Body or Fury."

Avoid making implementation terms the main copy:

- Avoid: "normalized contains match"
- Avoid: "subset-or-equal semantics"
- Avoid: "parser precedence expression"

Technical detail may appear in:

- tooltip copy
- expandable "Why?" text
- secondary captions
- Storybook or developer docs, not primary visible copy

## Visual Style Direction

- Use the Noxian crimson system already being established in the site.
- Favor dark layered surfaces, crimson active states, warm query chips, and
  high-contrast text.
- Keep cards to restrained radii consistent with the app's current design
  direction.
- Use strong section hierarchy but avoid oversized marketing-style hero blocks.
- Syntax examples should feel alive: hoverable, focusable, clickable, and
  highlighted.
- Prefer comparison layouts over long vertical prose.
- Subtle transitions are welcome for hover, focus, active selection, detail
  stream ordering, and sandbox updates.

## Component Breakdown For Planning

Candidate components for the eventual rewrite:

| Component | Likely layer | Responsibility |
|---|---|---|
| `LearnToSearchView` | `pages/` | Route-level composition and selected mode state |
| `LearnModeBar` | `ui-elements/` or page-local | Three-item header-style tab/menu control |
| `GuideDetailCard` | `ui-elements/` or `features/` | Reusable inline/popup detail content |
| `GuideDetailStream` | `features/` | Large-layout ordered multi-select detail stream |
| `ResponsiveGuideDetails` | `features/` | Shared small-popup/large-stream behavior for Visual and Text guides |
| `VisualCardGuide` | `features/` | Interactive card anatomy surface |
| `TextFieldGuide` | `features/` | Field list with grouped rows and query chips |
| `SyntaxSandbox` | `features/` | Editable highlighted input and semantic breakdown |
| `SyntaxComparisonCard` | `features/` | Clickable comparison examples |
| `SyntaxSection` | page-local or `features/` | Section layout for syntax learning groups |
| `ScryfallComparisonCard` | page-local | Lightweight experienced-user sidebar |
| `SyntaxQueryChip` | `ui-elements/` or extend `QueryChip` | Clickable syntax-highlighted query examples |

Planning cautions:

- Reuse the existing `QueryChip` where it fits, but the Syntax Guide may need a
  richer chip/card variant that can show highlighted operators and hover
  semantics.
- The shared detail content should be one component rendered in two shells:
  popup/sheet on small layouts and inline card in the large detail stream.
- The final plan should decide whether the guide data remains local static data
  or moves through `data/queryFeatures.ts` with TanStack Query.
- If a component is only used by this route, keep it page-local unless a later
  route has a clear reuse need.

## Data And Semantics Notes

Current Learn to Search loads query feature data through `loadQueryFeatures()`.
The rewrite plan must decide how to migrate that to the current data-layer
pattern.

Required semantic inputs:

- field guide data for Text Guide
- zone/detail data for Visual Guide
- syntax examples and semantic explanations for Syntax Guide
- lightweight parser/explainer behavior for sandbox updates

The Syntax Guide explainer does not need to be a complete production parser in
the first implementation, but it must be honest and deterministic for all
examples shown on the page. If it cannot explain a user-edited query fully, it
should explain the recognized parts and identify the uncertain part calmly.

## Storybook Expectations For The Future Plan

The implementation plan should include Storybook coverage for:

- Learn to Search route default states for all three modes.
- Visual Guide small popup behavior.
- Visual Guide large inline stream behavior.
- Text Guide small popup behavior.
- Text Guide large inline stream behavior.
- Syntax Sandbox with several query states.
- Syntax comparison section hover/click states.
- Mobile and desktop viewport stories using the repo's canonical viewport keys.

## Test Plan For The Future Rewrite

The eventual implementation should validate:

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
- `npm run test:storybook -w @noxiannet/frontend`
- `npm run build-storybook -w @noxiannet/frontend`

Manual review should include:

- `/cards/learn-to-search` on phone width, preserving the current Visual Guide
  sizing and popup behavior.
- Just below `1024px`, confirming no large stream layout appears early.
- At and above `1024px`, confirming Visual/Text Guide selections render in the
  right stream and popups do not appear.
- Resize from large to small with existing selections, confirming no surprise
  popup appears.
- Make a new small-layout selection, then grow back to large, confirming the
  stream reflects the new single-selection state.
- Syntax Guide examples update the sandbox and semantic breakdown.
- Keyboard navigation and focus states across top mode items, examples, and
  popup/sheet controls.

## Open Questions

- Should clicking an already-selected item in large guide layouts remove it or
  promote it to most recent? This spec recommends promote, with an explicit
  remove control on each detail block.
- Should Syntax Guide example clicks replace the sandbox query or append to it?
  This spec assumes replace for comparison examples and append only where a
  control is explicitly framed as additive.
- Should the Syntax Guide sandbox use the same parser/diagnostics path as
  actual search diagnostics, or a lighter explainer tuned to teaching copy?
- Should the top mode selection be reflected in the URL search params so direct
  links can open Visual/Text/Syntax Guide?

## Risks

- If the large guide stream and small popup use separate content components,
  their copy and chip behavior may drift.
- If the Syntax Guide tries to explain every possible query form immediately,
  it may become parser work instead of page redesign work.
- If the `1024px` threshold is implemented with Tailwind named container
  shorthand, the layout will switch at the wrong width.
- If examples only append to search rather than updating the sandbox, the
  Syntax Guide will feel like the old field guide instead of an experimentation
  surface.

## Assumptions

- The future route remains `/cards/learn-to-search`.
- The three modes remain part of one page rather than separate routes.
- Visual Guide and Text Guide can share the same detail presentation model.
- The page rewrite happens as part of Stage 7 and must remove the corresponding
  Learn to Search legacy CSS from `frontend/src/styles.css`.

---

## Inventory

### Files being replaced

| File | Purpose | CSS classes owned |
|---|---|---|
| `pages/legacy/LearnToSearchView.tsx` | Route entry, tab state, data load | `lts-*` via `styles.css` |
| `pages/legacy/CardSearchGuide.tsx` | Interactive card anatomy surface | `csg-*` via `styles.css` |
| `pages/legacy/LtsDetailOverlay.tsx` | Small-layout popup/sheet | `lts-detail-*` via `styles.css` |
| `pages/legacy/CardSearchGuideImageOverlay.tsx` | (Check before deleting — may be dead code) | unknown |

### CSS sections to delete

| Section marker | Line range (approx) | Lines |
|---|---|---|
| `/* ── CARD SEARCH GUIDE ── */` | 863 – 1210 | ~348 |
| `/* ── LEARN TO SEARCH ── */` through `/* ── Visual Guide card hint ── */` | 1271 – 1605 | ~335 |
| **Total** | | **~683** |

### Existing shared components to reuse

| Component | Location | How used |
|---|---|---|
| `QueryChip` | `ui-elements/QueryChip.tsx` | Text Guide chips, Syntax Guide examples |
| `MenuItem` | `ui-elements/MenuItem.tsx` | Visual and interaction pattern for `LearnModeBar` |
| `ModalShell` | `ui-elements/ModalShell.tsx` | Small-layout detail popup shell (focus trap + Escape already handled) |

### Current data loading

`loadQueryFeatures()` → `/api/query/features` → `QueryFeaturesResponse { fields: QueryFieldGuide[], syntax: QuerySyntaxGuide[] }` from `@noxiannet/card-store`.

Currently loaded via `useEffect` in `LearnToSearchView`. Must be migrated to `data/queryFeatures.ts` with TanStack Query.

---

## Resolved Open Questions

| Question | Decision |
|---|---|
| Click already-selected item in large guide: promote or remove? | Promote to most-recent; each block has an explicit remove control. |
| Sandbox click: replace or append? | Replace for comparison examples. Additive chips (Controlling Results) may append where explicitly framed as additive. |
| Sandbox parser: production path or lighter explainer? | Lighter page-specific explainer. Predefined map for all shown examples; best-effort tokenizer for user edits. Must not lie — if a token is unrecognized, say so calmly. |
| Mode in URL params? | Yes. Add `?mode=visual\|text\|syntax` search param via TanStack Router. Omitted param defaults to `visual-guide`. This enables deep-linking and browser back/forward without the complexity of separate routes. |

---

## Query Builder Parallel Work Coordination

The QB rewrite (`query-builder-tailwind-rewrite-plan.md`) is a pure CSS migration
with no new shared components. Points of coordination:

**`SyntaxQueryChip` (new shared component):** Must be built and
barrel-exported from `ui-elements/` before either LTS or QB uses it. Whichever
page is implemented first must create it; the second page then imports from
`ui-elements/`. The QB plan should be updated to use `SyntaxQueryChip` for its
built query display box (see QB plan Unit 1 note).

**`QueryChip` (already shared):** Both pages use it. `SyntaxQueryChip` is a
separate component — do not modify the existing `QueryChip`.

**Domain color lookups:** QB introduces a file-local `DOMAIN_CHIP_CLASSES`
constant. LTS Syntax Guide domain chips are display-only comparison elements —
different structure from QB's interactive toggle buttons. Both reference the
same `--domain-*` CSS variables with separate file-local constants. No shared
extraction needed.

**`domainChipClass` in `lib/cardPresentation.tsx`:** Already marked `@deprecated`.
Neither page should call it. Both use their own Tailwind lookups.

**`RARITY_CHIP_CLASSES`:** QB only. LTS does not need rarity chips.

**`ModalShell`:** LTS uses it for small-layout detail popups. QB does not need
it. Already shared — no coordination needed.

**Execution order:** QB and LTS can run in parallel. The only sequencing
constraint is that `SyntaxQueryChip` must exist in `ui-elements/` before the
second page tries to import it. If both are in flight simultaneously, build
`SyntaxQueryChip` as Unit 0 of whichever lands first.

---

## Key Design Decisions

### File organization

LTS is too large for a single file. Use a subfolder under `features/`:

```
ui-elements/
  SyntaxQueryChip.tsx            (+ .stories.tsx)  ← shared; see QB coordination

features/learn-to-search/
  LearnModeBar.tsx               (+ .stories.tsx)
  GuideDetailCard.tsx            (+ .stories.tsx)
  GuideDetailStream.tsx          (+ .stories.tsx)
  ResponsiveGuideDetails.tsx     (logic component, no story needed)
  VisualCardGuide.tsx            (+ .stories.tsx)
  TextFieldGuide.tsx             (+ .stories.tsx)
  SyntaxSandbox.tsx              (+ .stories.tsx)
  SyntaxComparisonCard.tsx       (+ .stories.tsx)
  SyntaxGuide.tsx                (assembles Sections 1–4 + Scryfall card)
  index.ts                       (barrel — export only what the page needs)

pages/LearnToSearchView.tsx       (route entry, imports from features/learn-to-search)
pages/LearnToSearchView.stories.tsx
```

`SyntaxQueryChip` is in `ui-elements/` because it is used by both LTS and QB.
It must be barrel-exported from `ui-elements/index.ts`.

The remaining `features/learn-to-search/` components are not barrel-exported
from `features/index.ts` until a second page has a clear reuse need. They live
as composition files inside the subfolder per the architecture rule.

### Detail presentation model

`GuideDetailCard` is a single pure-display component. It renders in two shells:

- **Small layout:** `ModalShell` wrapping `GuideDetailCard` (replaces `LtsDetailOverlay`)
- **Large layout:** inline card block inside `GuideDetailStream`

The `LtsDetailItem` type from the legacy overlay becomes the canonical data
shape and moves to `features/learn-to-search/GuideDetailCard.tsx`.

### `LearnModeBar`

Page-local to LTS (only this page needs same-page mode switching). Visually
matches `MenuItem` — use the same Tailwind color, weight, underline, hover glow,
and transition classes. Implement with `role="tablist"` / `role="tab"` semantics
and arrow-key navigation. Do not import `MenuItem` directly — the mode bar
renders buttons, not anchor/router links.

### `SyntaxQueryChip`

A new component in `ui-elements/` (shared by LTS and QB). Wraps a clickable
button like `QueryChip` but renders syntax-highlighted content: field tokens
(e.g., `name`, `d`) in one color, operators (`=`, `:`, `>=`) in another,
values in a third, negation/logical keywords (`-`, `or`, `not`) in a fourth.

Implementation: call `parseQuery(text)` from `@noxiannet/card-store/query` to
get the AST, then walk it to assign color roles to each original text segment.
Unknown tokens render unstyled. The output is a `<button>` that renders
`<span>` elements with the appropriate color classes rather than plain text.

Must be barrel-exported from `ui-elements/index.ts`.

### URL param for active mode

Add `mode` as a TanStack Router search param. Use `z.enum(["visual-guide",
"text-guide", "syntax-guide"]).default("visual-guide")` via the router's
`validateSearch`. The page reads `useSearch()` and navigates with
`useNavigate()` on tab change. No new routing files needed if the existing
`app/router.tsx` already handles `/cards/learn-to-search`.

### Responsive state continuity

`ResponsiveGuideDetails` owns both the small-layout `activeSmall` item and the
large-layout `activeLarge: LtsDetailItem[]` array. It derives the current
breakpoint from a `useMediaQuery("(min-width: 1024px)")` hook (or equivalent
CSS approach). Rules:

- Shrink to small: do not auto-open popup; preserve `activeLarge` in state.
- New small selection: update `activeLarge` to `[newItem]`.
- Grow back to large with no small selection: restore previous `activeLarge`.
- Grow back to large after a small selection: use the updated single-item list.

### Sandbox explainer

The sandbox calls `parseQuery(queryString)` from `@noxiannet/card-store/query`
directly in the browser. This function has no Node.js dependencies, is already
used in frontend code, and returns a `ParsedQuery` with:

- `executedTokens: ExecutedQueryItem[]` — the flat token list with execution
  state and canonical field resolution
- `diagnostics: QueryDiagnostic[]` — parse errors and dropped-token messages

The semantic breakdown renders via the existing `executedTokensToDisplay()`
function from the same package (already used in `CardSearchResultsContent`).
Diagnostics surface using the same pattern as the card search result panel.

This is the same breakdown the real search page shows — no reproduction of
parsing logic, no predefined lookup table, no custom tokenizer.

### Data layer

Add `frontend/src/data/queryFeatures.ts`:

```ts
export const queryFeaturesKeys = {
  all: ["query-features"] as const,
};

export const queryFeaturesQueryOptions = queryOptions({
  queryKey: queryFeaturesKeys.all,
  queryFn: () => loadQueryFeatures(),
  staleTime: Infinity, // static reference data
});
```

`LearnToSearchView` uses `useQuery(queryFeaturesQueryOptions)`. Handle
`isPending` with a minimal skeleton state; handle `isError` with the existing
`useAppError` pattern already used by the legacy page.

---

## Implementation Units

Execute in order. Each unit ends with a passing build before the next begins.

### Unit 0 — Data layer

Create `frontend/src/data/queryFeatures.ts` with `queryFeaturesKeys`,
`queryFeaturesQueryOptions`. Export from `data/index.ts`.

### Unit 1 — `GuideDetailCard`

Create `features/learn-to-search/GuideDetailCard.tsx`.

- Props: `item: LtsDetailItem`, `onAppend: (text: string) => void`, optional `onRemove?: () => void`
- Renders: category label, title, description, syntax/shorthand chips, example chips
- `QueryChip` for all chips
- `onRemove` renders an `×` dismiss button in the top-right corner
- Tailwind only; no legacy CSS
- Storybook: default with all fields, minimal (description only), with examples

### Unit 2 — `GuideDetailStream`

Create `features/learn-to-search/GuideDetailStream.tsx`.

- Props: `items: LtsDetailItem[]`, `onRemove: (item: LtsDetailItem) => void`, `onAppend: (text: string) => void`
- Renders items most-recent-first (index 0 = most recent)
- Each item in `GuideDetailCard` with `onRemove`
- Empty state: calm placeholder text, no popup-like styling
- Storybook: empty, single item, multiple items

### Unit 3 — `ResponsiveGuideDetails`

Create `features/learn-to-search/ResponsiveGuideDetails.tsx`.

- Owns `activeLarge: LtsDetailItem[]` and `activeSmall: LtsDetailItem | null`
- Detects `>= 1024px` via `matchMedia` listener or a container query signal
- Exposes `onSelect(item)` callback for child guides to call
- Large layout: renders `GuideDetailStream`; popups disabled
- Small layout: renders `ModalShell` + `GuideDetailCard` when `activeSmall` is set
- Resize continuity per the Resolved Open Questions section above

### Unit 4 — `LearnModeBar`

Create `features/learn-to-search/LearnModeBar.tsx`.

- Props: `active: LearnTab`, `onChange: (tab: LearnTab) => void`
- Three `role="tab"` buttons matching `MenuItem` visual classes
- Arrow-key navigation (`ArrowLeft` / `ArrowRight`)
- Min touch height `44px`
- Storybook: each mode active, mobile viewport

### Unit 5 — `VisualCardGuide`

Create `features/learn-to-search/VisualCardGuide.tsx`.

- Migrated from `pages/legacy/CardSearchGuide.tsx` — same card anatomy, same
  zone data, same `ZONES` map, same interaction
- Props: `onSelect: (item: LtsDetailItem) => void`
- Remove all `csg-*` class references; replace with Tailwind
- Large-layout: selected regions visibly distinct from hover
- Storybook: default (no selection), active zone selected, mobile viewport

### Unit 6 — `TextFieldGuide`

Create `features/learn-to-search/TextFieldGuide.tsx`.

- Migrated from the inline IIFE inside `LearnToSearchView` text-guide branch
- Props: `fields: QueryFieldGuide[]`, `onSelect: (item: LtsDetailItem) => void`, `onAppend: (text: string) => void`
- Parent/child grouping preserved (`SECTION_CHILDREN` map moves here)
- `QueryChip` for field query chips
- Remove all `lts-field-*` class references; replace with Tailwind
- Storybook: populated, empty, mobile viewport

### Unit 7 — `SyntaxQueryChip`

Create `ui-elements/SyntaxQueryChip.tsx`. Barrel-export from `ui-elements/index.ts`.

- Props: `query: string`, `onClick: (query: string) => void`
- Calls `parseQuery(query)` from `@noxiannet/card-store/query` to get the AST
- Walks the AST to assign color roles to each original text segment:
  field tokens, operators, values, negation/logical keywords
- Renders each segment in a `<span>` with the appropriate color class
- Button wrapper matches `QueryChip` shape and sizing
- Unknown tokens render unstyled
- Storybook: several example queries from this spec; also a non-query-chip
  display-only variant if QB needs it for the built query box

### Unit 8 — `SyntaxComparisonCard`

Create `features/learn-to-search/SyntaxComparisonCard.tsx`.

- Props: `left: { query: string; label: string; description: string; visual?: ReactNode }`, same for `right`, `onClick: (query: string) => void`
- Renders two-column comparison layout
- Hover emphasizes the semantic difference column
- Click commits query to sandbox via `onClick`
- Mobile: stacks to single column
- Storybook: text comparison, domain comparison (with domain chip visuals)

### Unit 9 — `SyntaxSandbox`

Create `features/learn-to-search/SyntaxSandbox.tsx`.

- Props: `query: string`, `onChange: (query: string) => void`
- Editable `<textarea>` or `<input>` with overlay-rendered syntax highlighting
- Semantic breakdown panel below: calls `parseQuery(query)` from
  `@noxiannet/card-store/query` inline in the browser; renders
  `executedTokensToDisplay(parsed.executedTokens, { includeDropped: true })`
  as the plain-English breakdown (same path as `CardSearchResultsContent`)
- Renders `parsed.diagnostics` for errors/unknown filters using the same
  presentation as the card search diagnostics panel
- Storybook: several query states from spec sandbox examples, partial/unknown
  query state

### Unit 10 — `SyntaxGuide`

Create `features/learn-to-search/SyntaxGuide.tsx`.

- Assembles hero + sandbox + four sections + Scryfall card
- Owns `sandboxQuery` state; example clicks call `setSandboxQuery`
- Sections use `SyntaxComparisonCard`, `SyntaxQueryChip`, `SyntaxSandbox`
- Controlling Results section uses chip-band layout (not comparison cards)
- Storybook: default desktop, mobile

### Unit 11 — `LearnToSearchView`

Create `pages/LearnToSearchView.tsx`.

- Route entry component
- Reads `mode` search param via TanStack Router; defaults to `visual-guide`
- `useQuery(queryFeaturesQueryOptions)` for field and syntax data
- `useHeaderSearch().appendQuery` wired to all `onAppend` callbacks
- Renders `LearnModeBar` + active guide wrapped in `ResponsiveGuideDetails`
- Update `app/router.tsx` import from `pages/legacy/LearnToSearchView` to `pages/LearnToSearchView`
- Add `mode` to the route's `validateSearch`

### Unit 12 — Delete legacy files

- `pages/legacy/LearnToSearchView.tsx`
- `pages/legacy/LtsDetailOverlay.tsx`
- `pages/legacy/CardSearchGuide.tsx`
- `pages/legacy/CardSearchGuideImageOverlay.tsx` (verify no remaining imports first)

### Unit 13 — Delete legacy CSS

Remove from `frontend/src/styles.css`:

- The entire `/* ── CARD SEARCH GUIDE ── */` section (~lines 863–1210)
- From `/* ── LEARN TO SEARCH ── */` through end of `/* ── Visual Guide card hint ── */`
  (~lines 1271–1605)

Total removal: ~683 lines.

---

## styles.css Drawdown

After Unit 13:

- ~683 lines removed from `styles.css`
- No changes to `ui-foundation.css` for this page (no attribute-selector blocks
  analogous to the QB domain/rarity pip blocks)

---

## Completion Criteria

- `pages/legacy/LearnToSearchView.tsx`, `LtsDetailOverlay.tsx`,
  `CardSearchGuide.tsx`, and `CardSearchGuideImageOverlay.tsx` are deleted
- `pages/LearnToSearchView.tsx` exists with no `lts-*` or `csg-*` class names
- `features/learn-to-search/` contains all listed components with colocated
  Storybook stories
- `app/router.tsx` imports from the new path
- `data/queryFeatures.ts` exists; `useEffect` data-fetch is gone from the page
- `mode` URL search param works for deep-linking to each guide
- All three modes render correctly at mobile and desktop viewports
- Responsive detail state (small popup ↔ large stream + resize continuity) works
- `/* ── CARD SEARCH GUIDE ── */` and `/* ── LEARN TO SEARCH ── */` CSS sections
  are fully deleted from `styles.css`
- Build, Storybook build, and tests pass
- Completion note names all changed files and lists Storybook story paths
