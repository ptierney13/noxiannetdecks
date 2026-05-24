# UI Design System

This document teaches future coding agents how UI in this project should feel
and how to make page-level decisions. It is practical implementation guidance,
not a brand essay.

## Product Visual Philosophy

The product is a Noxian/Riftbound game tool. Build dark fantasy utility:
crimson, black, warm gold, firelit accents, dark stone/metal surfaces, and
premium readable controls.

Aim for:

- dark Noxian fantasy, not generic SaaS dashboard
- premium, readable, restrained surfaces
- crimson/black/gold accents with subtle warmth
- clear hierarchy, fast scanability, and obvious controls
- satisfying hover, selected, focus, and disabled states
- calm, modular composition with intentional visual rhythm

Avoid:

- neon cyberpunk
- gamer clutter
- flat dark mush
- pure grayscale dark mode
- random one-off Tailwind values
- decorative glow as a substitute for structure
- admin-panel density — overboxed, uniformly weighted slabs
- excessive nesting and framing that produces armor-plating

## Source Of Truth

Use these docs for UI decisions:

- `docs/reference/ui/DESIGN-SYSTEM.md` for product direction and hierarchy
- `docs/reference/ui/TOKENS.md` for token inventory and token use
- `docs/reference/ui/COMPONENTS.md` for component and page-pattern contracts
- `docs/reference/ui/ANTI-PATTERNS.md` for failures to avoid

Use the codebase for current implementation facts:

- tokens: `frontend/src/ui-foundation.css`
- current shared UI: `frontend/src/ui-elements/`
- reusable domain UI: `frontend/src/features/`
- app shell: `frontend/src/app/`
- migrated pages: `frontend/src/pages/`
- legacy pages: `frontend/src/pages/legacy/`

If these docs and current migrated code disagree, inspect the code, decide
which is current, and update the docs in the same change.

## Migrated Vs Legacy Pages

Migrated pages and shared components are the pattern source. Use:

- `frontend/src/pages/home.tsx`
- `frontend/src/pages/CardSearchView.tsx`
- `frontend/src/pages/LearnToSearchView.tsx`
- `frontend/src/pages/QueryBuilderView.tsx`
- `frontend/src/features/card-search/*`
- `frontend/src/features/learn-to-search/*`
- `frontend/src/ui-elements/*`

Legacy pages are not style references. Do not copy styling from:

- `frontend/src/pages/legacy/CardDetailView.tsx`
- `frontend/src/pages/legacy/DeckExplorerView.tsx`
- `frontend/src/pages/legacy/SealedSimulator.tsx`
- `frontend/src/pages/legacy/TierListView.tsx`
- `frontend/src/pages/legacy/TradeBalancerView.tsx`

When working in a legacy page, migrate toward the current system. Do not
extend `frontend/src/styles.css` or copy legacy classes like `view-tabs` and
`section-heading` unless the task is explicitly about preserving a legacy
surface temporarily.

## Page Composition Rules

Build pages as readable tool surfaces:

- Use the app background as the lowest layer.
- Put major regions on visible section/card surfaces.
- Give dense tool regions section containers with header bands and body areas.
- Give controls their own distinct surfaces so they read as clickable.
- Use spacing and surfaces before divider lines.
- Keep layout architecture stable during polish passes.
- Keep page-specific composition local until reuse is real.

Recommended page hierarchy:

1. app background: `app-bg`
2. page shell or region frame
3. section/card surface
4. section header band
5. section body
6. subsection/filter group well
7. interactive control surface
8. selected/accent state

Rhythm matters: not every region should compete for the same attention level.
Dense interactive sections need quiet breathing regions beside or between them.
A page where every section has equal visual weight produces fatigue.

## Borders Are Secondary, Not Primary

Borders support hierarchy — they do not create it. A page with more borders is
not a more structured page.

Hierarchy should come primarily from: spacing, surface value shifts, elevation,
density changes, and typography weight. Borders are refinement — they confirm
hierarchy that already exists from surface contrast.

Rules:

- A section's hierarchy level must be readable without its border. The border
  confirms it, not defines it.
- Do not add a border to solve a problem that should be solved by surface
  contrast or spacing.
- Subgroup containers inside sections should prefer surface shifts over full
  outlines.
- Secondary and supporting grouping structures should use softer or no borders.

"Dashboard armor plating" is the failure mode where every element has its own
border, producing a dense grid of rectangles regardless of content importance.
It signals overstructure, not clarity.

A premium dark-mode UI uses fewer borders than inexperienced implementations.

Anti-patterns:

- border inside border inside border inside control
- every container having a visible full outline at every nesting level
- using borders to make a flat surface feel structured when surface contrast
  would do it more quietly
- subgroup containers as visually prominent as the section container around them

## Surface Hierarchy Over Outline Hierarchy

The four surface levels are:

1. Page background — near-black, stable, lowest value
2. Section surface — slightly elevated, subtle gradient, very soft border
3. Subgroup surface — quieter than section, uses value shift not strong outline
4. Control surface — brighter and more defined than any grouping structure

Hierarchy comes from:

- subtle brightness/value shifts between layers
- restrained gradients (top-to-bottom, not flashy)
- elevation (shadows, inner highlights)
- spacing and density changes

Not from:

- increasingly dense border stacks at each nesting level
- uniform outlines at every grouping layer
- full-contrast borders on secondary structures

Bad: same surface everywhere with many outlines at each nesting level.
Better: fewer borders, clear value progression from background → section →
control, quiet subgroups that recede behind controls.

## Loud vs Quiet Regions

Pages require visual rhythm. Not every region should compete equally for
attention.

Three emphasis zones:

- **Loud**: primary content or interaction areas — high contrast, defined
  surfaces, strong controls. Query chips, active filter areas, primary CTAs.
- **Medium**: supporting filters or secondary actions — present but not dominant.
  Secondary options, helper controls, supplemental filters.
- **Quiet**: rest space, helper text, labels, low-traffic controls — recede
  behind primary content. Helper copy, infrequent controls, organizational labels.

Rules:

- Every dense page should have quiet resting regions between or beside loud
  sections. Empty space is functional — it restores visual energy.
- Helper text and primary controls must not be at equal contrast.
- Low-density regions between filter groups improve scanability and perceived
  polish.
- Sections with fewer controls should use less container weight. Do not apply
  the same heavy framing to a two-chip section as to a twelve-control section.

Common failure: "Every section having similar density and emphasis creates
fatigue."

## Avoid Admin-Panel Feel

Game tooling UI should feel modular and premium — not like enterprise
configuration software or a legacy admin dashboard.

Signs of admin-panel syndrome:

- endless stacked configuration slabs with uniform visual weight
- uniformly boxed controls in tight grids
- hyper-dense filter walls with no breathing room
- every section and subsection styled identically regardless of content density
- overcompressed utility layouts that scan like spreadsheet rows
- arbitrary primary/secondary emphasis among sections that are functionally equal

Preferred direction:

- modular composition — controls cluster into purposeful groups
- grouped interaction clusters with clear separation
- restrained framing — fewer containers, more surface contrast
- intentional visual rhythm — loud sections followed by quieter ones
- equal roles get equal styling; do not invent visual hierarchy that the
  workflow does not demand

Equal sections must have equal styling. Do not create a primary/secondary
hierarchy among sections that are functionally equivalent. Let the content
itself — control density, importance, frequency of use — guide any actual
visual weighting.

## Dark-Mode Hierarchy Rules

Dark pages need deliberate value separation. Adjacent surfaces should not blur
together.

Strict rules:

- Do not rely on thin divider lines as the primary way to separate major
  sections.
- Every major page region should use visible surface hierarchy: page
  background, section/card surface, and interactive control surface.
- Adjacent major surfaces should not be so close in brightness that they blur
  together.
- Dark-mode pages need more spacing than light-mode pages.
- Dense filter/configuration pages should use grouped modules, not long
  undifferentiated slabs.
- Section headers should anchor their sections visually.

Use thin borders and divider lines as secondary refinement only. They should
not be the only thing explaining the layout.

## Surface And Elevation Principles

Use a small number of layers consistently:

- page background: near-black, stable
- base surface: dark navy/charcoal card or panel
- raised surface: section header, subsection well, card, or popup
- inset surface: image well, input interior, loading skeleton
- selected/accent surface: restrained crimson or warm gold emphasis

Elevation should come from:

- surface brightness changes
- subtle gradients
- borders with meaningful contrast
- small shadows
- inner highlights

Do not solve hierarchy with heavy bloom, frosted glass overload, or saturated
red panels.

## Section Grouping Principles

Dense tool sections need visible structure. Lighter sections do not.

Apply heavy structure (outer container, header band, body surface, subsection
wells) only to genuinely dense regions: query builders, filter panels, card
inspectors, stats editors.

For lighter groupings, prefer spacing and surface contrast without adding a
full container. A label and `gap-4` is often enough.

When section containers are used:

- outer section container uses a soft border and subtle gradient
- separate header band anchors the section
- body surface is quieter than the header
- subsection wells use surface shift, not full-contrast outline

All sections at the same functional level must have the same visual weight.
Do not apply arbitrary emphasis hierarchy. If two filter sections serve
equivalent roles, they must look equivalent.

## Controls Must Dominate Their Containers

Controls should be visually stronger than the grouping structures around them.
If a chip or input blends into its containing surface, the container is too
loud.

Rules:

- Subgroup containers should use surface shifts quieter than the control
  surfaces they contain.
- Secondary grouping structures should visually recede so controls are the
  dominant elements.
- A filter well's job is to group — not to compete with the controls inside it.
- If removing a container's border makes the layout feel cleaner, remove it.

Selected state hierarchy:

- Selected controls must clearly stand apart from inactive ones.
- Inactive controls should be defined but quiet relative to selected.
- Hover state bridges inactive to selected without reaching selected brightness.
- All three states (inactive, hover, selected) must be distinguishable at a
  glance.

## Interaction Clarity Principles

Interactive controls must look clickable before hover.

Required states:

- inactive
- hover
- active/pressed where relevant
- selected/current
- disabled where relevant
- focus-visible

Rules:

- Inactive controls need visible edge definition.
- Inactive controls should be brighter or more defined than their parent
  surface.
- Hover states should feel tactile: slightly brighter, slightly raised, or
  slightly stronger border.
- Selected states should be unmistakable but restrained.
- Selected chips should feel lit or active without becoming neon.
- Inputs and chips must have distinct visual identities.
- Focus states must use `--color-focus-ring` or an equivalent tokenized focus
  treatment.

## Typography And Scanability

Use typography to make tools fast to parse:

- section headers: uppercase, heavy weight, small size, clear contrast
- subsection labels: uppercase, smaller, high enough contrast to scan
- primary values: larger and brighter than labels
- helper text: secondary or tertiary, never competing with controls
- query syntax: monospace, warm accent for fields/operators where appropriate

Do not use letter spacing as decoration everywhere. Use it mainly for labels,
section headers, and compact metadata.

## Token And Component Use

Prefer existing shared components and tokens over local one-off styling.

Use shared components when available:

- `CardSearchInput`
- `QueryChip`
- `SyntaxQueryChip`
- `ResultCard`
- `Menu` and `MenuItem`
- `ModalShell`
- `TileBase`, `TileFeature`, `TilePromo`

Use page-local tokens only when:

- the pattern is not yet reused
- extraction would be premature
- the local token object makes the page internally coherent

If a local pattern is repeated across pages, promote it to the design system:

- add or extend tokens in `frontend/src/ui-foundation.css`
- extract a shared component under `frontend/src/ui-elements/` or
  `frontend/src/features/`
- add Storybook coverage
- update these docs

## Polish-Pass Rules

During a polish pass:

- preserve layout architecture unless explicitly asked to change it
- do not move route/data ownership
- improve hierarchy, states, spacing, and tokenization
- keep the work scoped to the UI surface being polished
- avoid introducing new global rules unless the value is clearly reusable

## Canonical Visual References

These images live in `docs/reference/ui/images/` and are the ground truth for
UI direction on this project. Read them before making visual decisions.

### Good — QB Equal-Sections Treatment (`example_good.png`)

The current correct QB direction:

- all filter sections use equal visual weight — no primary/secondary hierarchy
- each section has a bordered container with a header band and body surface
- crimson accent bar on the left edge of each section header
- dark navy surfaces with subtle gradients, consistent across all sections
- controls (chips, inputs) read clearly against their containing surfaces
- premium dark feel without overstructure

This is the approved baseline. Peer sections must always be styled equally.

### Good — Home Page Atmospheric Standard (`example_good_home.png`)

The canonical reference for Noxian atmosphere:

- full-bleed hero with atmospheric Noxian art, crimson banners, deep dark
- feature tiles with consistent dark surface treatment and restrained accents
- clean typographic hierarchy — warm gold label, large headline, secondary body
- crimson/gold/dark color language, no neon, no flat SaaS neutrals

Preserve this atmosphere when adding or migrating any page.

### Bad — Unequal Primary/Secondary Hierarchy (`example_bad.png`)

The QB state that prompted the equal-sections fix:

- some sections (Card Type & Tags, Domain, Stats) styled brighter with
  stronger borders and accent bars — treated as "primary"
- other sections (Rarity, Set, Text Filters, Finish) styled darker and
  dimmer — treated as "secondary"
- creates arbitrary visual hierarchy among functionally equal filter sections
- the primary/secondary `emphasis` prop was the mechanism; it has been removed

### Also Bad — Flat Label Overreaction (`example_also_bad.png`)

Going too far toward minimal and losing structure entirely:

- sections reduced to bare uppercase labels with no containing surface
- thin horizontal dividers as the only separator between groups
- controls float on the page background with no section framing
- loses the premium tool feel — reads as flat minimal SaaS, not dark fantasy UI

This is the failure mode in the opposite direction. Structure is not the enemy
— arbitrary unequal structure is. Appropriate containment with equal treatment
is the goal.

### Horrible — Pre-System Admin Panel (`example_horrible.png`)

The failure this entire design system exists to prevent:

- extreme nested borders at every level of the hierarchy
- hyper-dense stacked configuration slabs with uniform visual weight
- every element — section, subsection, chip row — wrapped in its own box
- indistinguishable from enterprise configuration software
- visually exhausting with no rhythm, no rest, no premium feel

Any UI approaching this pattern must be revised before shipping.

## Update Triggers

Update this document when:

- the product visual direction changes
- a new migrated page establishes a reusable UI pattern
- a legacy page migration changes what counts as the current pattern
- token or component docs add rules that change page composition guidance
- user feedback creates a durable visual or interaction rule
