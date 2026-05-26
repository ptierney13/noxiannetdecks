# UI Components And Patterns

This document describes how to implement common UI surfaces using current repo
patterns. Prefer existing components. Extract new components only when reuse is
real or immediately likely.

## Page Shell

Purpose: provide app chrome and route content.

Use:

- `frontend/src/app/AppShell.tsx`
- `frontend/src/app/AppHeader.tsx`
- `frontend/src/app/router.tsx`

Rules:

- Routes render inside `<main><Outlet /></main>`.
- Use `--space-shell-x` for shell horizontal padding.
- Use `--site-header-height` for sticky offsets below the header.
- Keep global navigation in `AppHeader`, not page components.
- Do not add new shell CSS to `styles.css`.

Common mistakes:

- using viewport-specific hacks inside reusable content components
- adding page-specific navigation state to `AppHeader`
- using legacy `window.history` patterns

## Hero Sections

Purpose: immersive first-viewport brand/product presentation.

Reference:

- `frontend/src/pages/home.tsx`
- `frontend/src/ui-elements/CardSearchInput.tsx`
- `frontend/src/ui-elements/tiles/TileBase.tsx`

Rules:

- Use real or generated visual assets when the page is promotional or brand
  focused.
- Do not make a split text/media hero with card-on-one-side composition.
- Put hero text over the visual scene, not inside a card.
- Keep the primary CTA visible above the fold on mobile.
- Use product-specific color: crimson, warm gold, black, firelit warmth.

Common mistakes:

- abstract gradient/SVG hero replacing real subject matter
- generic SaaS marketing hero
- hiding the actual product until below the fold

## Cards

Purpose: repeated result, feature, or content items.

References:

- `frontend/src/ui-elements/ResultCard.tsx`
- `frontend/src/ui-elements/tiles/TileBase.tsx`
- `frontend/src/features/learn-to-search/GuideDetailCard.tsx`

Required states:

- default
- hover when clickable
- focus-visible when clickable
- selected/current when selectable
- empty/loading where data-backed

Token usage:

- surfaces: `surface-2`, `surface-inset`, `surface-3`
- borders: `border-default`, `border-strong`
- shadows: `shadow-surface-1`, `shadow-surface-2`
- text: `text-primary`, `text-secondary`, `text-tertiary`

Rules:

- Use a visible card surface; do not place content directly on app background.
- Clickable cards need hover elevation or border change.
- Image wells should use `surface-inset`.
- Repeated cards should keep stable aspect ratios.

Common mistakes:

- all cards and page background sharing the same darkness
- hover state changing only text color
- cards expanding or shifting because content dimensions are unstable

## Section Containers

Purpose: group major page modules, especially dense tools.

Reference:

- `frontend/src/ui-elements/ToolSection.tsx`
- `frontend/src/pages/QueryBuilderView.tsx` (`ToolSection` usage plus
  page-local `QB_TOKENS`)
- `frontend/src/features/card-search/CardSearchResultsContent.tsx`
- `frontend/src/ui-foundation.css` `.site-page-shell` transitional class

Rules:

- Use a section container with a distinct body surface for genuinely dense
  regions. Lighter sections may use spacing and surface contrast without a
  full container.
- Give major sections a separate header band.
- Use subsection wells for dense related controls — prefer surface shift over
  full-contrast border. The well recedes; the controls lead.
- Use spacing and surfaces before dividers.
- All sections at the same functional level must have the same visual weight.
  Do not invent primary/secondary emphasis among sections that are equivalent.

Required states:

- normal
- error/empty/loading if data-backed

Common mistakes:

- thin divider between sections on the same background
- long undifferentiated filter stacks
- arbitrary emphasis hierarchy applied to functionally equal sections
- subgroup container borders louder than the controls they contain

Bad -> better:

- Bad: thin divider between sections on same background.
- Better: section card with header band, padding, subtle border, and distinct
  body surface.

Bad -> better:

- Bad: Card Type section and Text Filters section styled differently despite
  being peer filter groups — different header brightness, border weight, title
  contrast.
- Better: all peer filter sections use the same section treatment.

## Section Headers

Purpose: anchor a major section and improve vertical scanning.

Reference:

- `frontend/src/pages/QueryBuilderView.tsx`
- `frontend/src/features/card-search/CardSearchResultsContent.tsx`

Rules:

- Treat headers as horizontal bands, not just text labels.
- Use uppercase, heavy type with clear contrast.
- Use a subtle crimson accent edge or line.
- Give the header enough padding to read as a distinct zone.
- Add a bottom border when the body surface is visually close.

Common mistakes:

- low-contrast labels floating inside body content
- labels and controls sharing the same visual weight
- relying on letter spacing alone for hierarchy

## Buttons

Purpose: commands and navigation actions.

References:

- `frontend/src/ui-elements/MenuItem.tsx`
- `frontend/src/ui-elements/CardSearchInput.tsx`
- `frontend/src/pages/QueryBuilderView.tsx`

Required states:

- default/inactive
- hover
- active/pressed where relevant
- selected/current where relevant
- disabled where relevant
- focus-visible

Rules:

- Buttons must look clickable before hover.
- Use visible border and surface contrast.
- Add subtle inner highlight or shadow for tactile edge definition.
- Primary CTAs may use warm gold or crimson gradients.
- Keep hover tactile: slight brightness/elevation/border change.

Common mistakes:

- inactive button same brightness as parent panel
- hover as the only clickable indication
- selected state barely different from inactive
- glow-heavy or neon selected state

## Chips And Toggles

Purpose: compact selectable filters, query syntax tokens, print variants.

References:

- `frontend/src/ui-elements/QueryChip.tsx`
- `frontend/src/ui-elements/QuerySyntaxText.tsx`
- `frontend/src/ui-elements/SyntaxQueryChip.tsx`
- `frontend/src/features/VariantSelectorRow.tsx`
- `frontend/src/pages/QueryBuilderView.tsx`
- `frontend/src/features/card-search/CardSearchResultsContent.tsx`

Required states:

- inactive
- hover
- selected via `aria-pressed`
- focus-visible
- disabled if not available

Rules:

- Inactive chips need clear edge definition.
- Inactive chips should be brighter or more defined than their parent surface.
- Selected chips need clear crimson/gold/accent treatment.
- Selected chips should feel active or lit without heavy glow.
- Use `aria-pressed` for toggle chips.
- Use monospace only for syntax tokens or compact codes.
- Render query examples from their raw query string with `QuerySyntaxText`.
  Do not rebuild query display from parsed tokens when the visible text must
  preserve spaces, parentheses, or original grouping.

Bad -> better:

- Bad: inactive chip same color as parent card.
- Better: chip has distinct surface, border, inner highlight, hover, selected,
  focus, and disabled states.

## Inputs And Search Bars

Purpose: editable data entry.

References:

- `frontend/src/ui-elements/CardSearchInput.tsx`
- `frontend/src/pages/QueryBuilderView.tsx` (`TextField`)
- `frontend/src/features/card-search/CardSearchResultsContent.tsx`

Required states:

- empty
- filled
- hover
- focus-visible/focus-within
- disabled where relevant
- error where relevant

Rules:

- Inputs should not read as black holes.
- Use visible borders and a surface distinct from both parent panel and chips.
- Search bars may use a stronger shell with icon and submit CTA.
- Placeholder text should be subdued but readable.
- Keep labels aligned and visible on dense forms.

Common mistakes:

- transparent input on a dark card with only placeholder text
- input surface identical to page background
- using chip styling for editable fields

## Selects And Dropdowns

Purpose: choose one value from a finite option set.

References:

- `frontend/src/features/card-search/CardSearchResultsContent.tsx`
  `SearchSelect`
- `frontend/src/ui-elements/Menu.tsx`
- `frontend/src/ui-elements/MenuItem.tsx`

Rules:

- Dropdown triggers need button-level edge definition.
- Option popups use elevated surface, border, and shadow.
- Selected option needs clear accent treatment.
- Close on outside pointer and Escape.
- Use ARIA roles like `combobox`, `listbox`, and `option` where custom.

Common mistakes:

- native select styled unlike the rest of the tool when a custom select is
  already in use nearby
- popups blending into the parent surface

## Filter Groups

Purpose: group related controls in dense tools.

References:

- `frontend/src/pages/QueryBuilderView.tsx`
- `frontend/src/features/card-search/CardSearchResultsContent.tsx`
- `frontend/src/features/learn-to-search/TextFieldGuide.tsx`

Rules:

- Use subsection wells for groups like `Card Type`, `Supertype`, `Stats`, and
  text filters.
- Subsection wells should use a surface shift, not a full-contrast border.
  The well groups — it does not compete with the controls inside it.
- Put labels above chip groups when the group contains multiple controls.
- Use body copy sparingly; do not force users to read instructions to parse the
  layout.
- Filters that serve equivalent roles must have equal visual weight. Do not
  apply emphasis hierarchy among peer filter sections.

Common mistakes:

- a single slab containing every chip and input
- subsection wells with borders as strong as or stronger than the section
  container around them
- arbitrary primary/secondary treatment among peer filter sections
- controls visually weaker than the container they live in
- labels too close to controls or too low contrast

## Result Grids

Purpose: display card search output.

References:

- `frontend/src/features/card-search/CardSearchResultsContent.tsx`
- `frontend/src/ui-elements/ResultCard.tsx`

Rules:

- Use fixed responsive columns as implemented:
  `grid-cols-2`, then container queries at `768px`, `1024px`, `1280px`,
  `1536px`.
- Keep cards stable with `aspect-[5/7]` or `aspect-[7/5]`.
- Use loading skeletons with `surface-inset`.
- Keep controls aligned with grid padding.

Common mistakes:

- auto-fill grids that violate expected review layout
- cards without stable aspect ratios
- loading states with different geometry than final content

## Empty, Loading, And Error States

Purpose: make data states understandable without disrupting layout.

References:

- `frontend/src/features/card-search/CardSearchResultsContent.tsx`
- `frontend/src/app/AppShell.tsx`

Rules:

- Empty states use a bordered surface with centered secondary text.
- Loading states preserve final layout geometry where possible.
- Error states use `negative-soft`, `negative-border`, and readable primary
  text.
- Do not use raw red blocks or browser-default error styling.

## Nav And Header

Purpose: global navigation and search.

References:

- `frontend/src/app/AppHeader.tsx`
- `frontend/src/ui-elements/Menu.tsx`
- `frontend/src/ui-elements/MenuItem.tsx`
- `frontend/src/ui-elements/LogoBadge.tsx`

Rules:

- Header uses viewport breakpoints, not container queries.
- Mobile nav uses hamburger plus overlay; desktop uses inline nav.
- Menus use `surface-header`, `shadow-surface-2`, and rounded elevated popup
  chrome.
- Active navigation uses warm gold and underline.
- Header search uses `CardSearchInput`.

Common mistakes:

- page components reimplementing global nav
- container queries for shell breakpoints
- menus without elevated popup surfaces

## Modals And Popups

Purpose: focused overlays and card summary details.

References:

- `frontend/src/ui-elements/ModalShell.tsx`
- `frontend/src/features/card/CardSummaryPopup.tsx`

Rules:

- Use `ModalShell` for dialogs.
- Overlay uses `bg-black/72` and light blur.
- Panel uses raised surface, strong border, and `shadow-surface-2`.
- Close button should be optional when the inner card already owns close
  affordance.
- Maintain focus trap and Escape close behavior.

Common mistakes:

- nested modal shells that create double borders and duplicate close buttons
- modals without focus restoration
- close controls that only appear on hover

## Storybook Expectations

Shared components need colocated stories. Cover:

- default
- hover/interactive where possible
- selected/current
- loading
- empty
- error

Do not extract shared UI without adding or updating Storybook coverage unless
the component is a tiny private leaf helper.

## Update Triggers

Update this document when:

- a shared UI component is added, removed, or renamed
- a component visual state contract changes
- a page-local pattern becomes the recommended implementation for future pages
- legacy pages migrate into current component patterns
- Storybook coverage expectations change
