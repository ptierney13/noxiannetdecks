# UI Anti-Patterns

This file is intentionally blunt. If a UI change matches one of these patterns,
revise it before shipping.

## Dark-Mode Failures

- Flat dark slab UI.
- Everything on one near-black background.
- Pure black surfaces everywhere.
- Adjacent cards, sections, and controls so close in brightness that they blur
  together.
- Inputs that read as black holes.
- Dark panels with text and controls floating without structure.
- Random transparency that makes surfaces muddy.

Bad → better:

- Bad: entire page on `#05060a` with labels and controls directly on top.
- Better: app background, section surface, subsection well, and interactive
  control surface each have distinct values.

## Dashboard Armor Plating

Every element having its own border, producing a dense grid of rectangles
regardless of content importance.

Signs:

- border inside border inside border inside control
- every container having a visible full outline at every nesting level
- subgroup containers as visually prominent as the section containers around them
- using borders to make a flat surface feel structured when surface contrast
  would be quieter and more premium

Bad → better:

- Bad: section container, subsection well, and chip row each have full visible
  outlines at similar contrast — the page reads as a grid of boxes.
- Better: section container has a soft border, subsection well uses a surface
  shift with no outline, chips have distinct control surfaces that lead visually.

A premium dark-mode UI uses fewer borders than inexperienced implementations.

## Admin-Panel Syndrome

Game tooling UI that looks like enterprise configuration software.

Signs:

- endless stacked configuration slabs with uniform visual weight
- uniformly boxed controls in tight grids
- hyper-dense filter walls with no breathing room between groups
- every section and subsection styled identically regardless of density
- overcompressed utility layouts that scan like spreadsheet rows
- arbitrary primary/secondary emphasis among sections that are functionally equal

Bad → better:

- Bad: eight filter sections, all with identical heavy containers, borders, and
  header weight — equal visual pressure throughout, no rhythm or rest.
- Better: all peer sections use equal styling; heavy framing reserved for
  genuinely dense regions; quieter sections use spacing and surface contrast
  without full container weight.

## Controls Weaker Than Their Containers

When grouping structures are louder than the controls inside them, visual
priority is inverted.

Signs:

- chips or inputs blending into subsection wells
- subgroup containers with heavier borders than the buttons they contain
- filter wells with strong outlines and low-contrast controls inside

Bad → better:

- Bad: subsection well uses `border-border-default`, chip inside uses
  `border-border-subtle` — the container reads louder than the control.
- Better: subsection well uses a surface shift with no or very soft border;
  chip has clear edge definition and strong hover/selected states.

## Arbitrary Emphasis Hierarchy

Inventing a primary/secondary tier among sections or elements that are
functionally equal.

Signs:

- some filter sections with brighter headers and stronger borders, others with
  dimmer headers and softer borders, with no workflow reason for the difference
- applying `emphasis="primary"` to certain sections to make them "feel important"
  when the content does not warrant it
- visual hierarchy that is not derived from content density, usage frequency,
  or workflow priority

Bad → better:

- Bad: Card Type & Tags section uses bright header, strong border, accent
  accent bar; Text Filters uses dim header, soft border, muted bar — but
  both are peer filter sections with no priority difference.
- Better: all peer filter sections use the same section treatment; emphasis
  comes from content itself, not applied class distinctions.

## Visual Fatigue — Uniformly Dense Pages

Every section having similar density, emphasis, and framing creates fatigue and
reduces scanability.

Signs:

- no quiet resting regions between dense filter blocks
- helper text and primary controls at equal contrast
- no visual rhythm — equally loud from top to bottom
- supporting structures as visually heavy as primary ones

Bad → better:

- Bad: twelve filter sections stacked, each with identical weight, no
  breathing room, no quiet zones.
- Better: dense sections are followed or flanked by quieter ones; empty space
  is used intentionally; low-traffic controls use less container weight.

## Hierarchy Failures

- Sections separated only by thin lines.
- Section headers that look like body labels.
- Long undifferentiated slabs of controls.
- All sections having equal visual weight with no rhythm or breathing room.
- Dense filter/configuration pages without grouped modules.
- Helper text competing visually with primary controls.

Bad → better:

- Bad: thin divider between sections on same background.
- Better: section card with header band, padding, subtle border, and distinct
  body surface.

## Button And Control Failures

- Buttons blending into card backgrounds.
- Inactive chips same color as parent panel.
- Selected state that is only barely different from inactive state.
- Hover state as the only indication something is clickable.
- Clickable text with no edge, surface, cursor, focus, or selected treatment.
- Focus state missing or relying on browser defaults.
- Disabled state indistinguishable from inactive state.
- Controls that look like labels.
- Inactive, hover, and selected states not distinguishable at a glance.

Bad → better:

- Bad: inactive chip same color as parent card.
- Better: chip has distinct surface, border, inner highlight, hover, selected,
  focus, and disabled states.

Bad → better:

- Bad: selected chip only changes border opacity.
- Better: selected chip uses restrained crimson surface, stronger border, and
  subtle selected shadow.

## Spacing Failures

- Cramped vertical rhythm.
- Labels, hints, and controls packed into one row when wrapping would be
  clearer.
- Dark-mode sections spaced like light-mode forms.
- Touch targets under `44px` on mobile.
- Controls shifting layout on hover.
- Text overflowing buttons, chips, cards, or nav items.

Bad → better:

- Bad: dense filters stacked with `gap-1` and only divider lines.
- Better: `gap-4` sections, `p-4` bodies, `gap-2` or `gap-2.5` chip rows, and
  subsection wells.

## Component-System Failures

- Random ad-hoc Tailwind values copied across files.
- One-off local components duplicating shared components.
- Adding rules to `frontend/src/styles.css`.
- Promoting a component before reuse is real.
- Refusing to promote a repeated local pattern after a second use appears.
- Static colors, spacing, and shadows inline when semantic tokens exist.
- Local page tokens copied into another page instead of promoted.

Bad → better:

- Bad: paste a 12-class chip treatment into three pages.
- Better: extract a shared chip/toggle component or add shared control tokens
  in `ui-foundation.css`.

## Visual Identity Failures

- Making the site look like generic enterprise SaaS.
- Making the site look like neon cyberpunk.
- Overusing glow, blur, or transparency.
- Bright saturated panels that overpower card art and data.
- Beige/cream/brown palettes that erase the Noxian crimson/black direction.
- One-note purple-blue dark mode.
- Decorative gradients replacing real page structure.

Bad → better:

- Bad: blue-gray dashboard cards with generic purple glow.
- Better: dark navy/charcoal surfaces, crimson active states, gold syntax or
  premium warmth, restrained elevation.

## Agent And Codebase Failures

- Ignoring `frontend/AGENTS.md`, `frontend/UI_ARCHITECTURE.md`, and these UI
  docs before UI work.
- Copying from `frontend/src/pages/legacy/` as if it represents the current
  system.
- Changing layout architecture during a polish pass unless explicitly
  requested.
- Mixing migration work with unrelated visual redesign.
- Moving route/data ownership while doing styling polish.
- Adding shared components without Storybook coverage.
- Leaving docs stale after establishing a durable UI rule.
- Treating old `.claude/` snapshots or legacy CSS as authoritative.
- Inventing emphasis hierarchy (e.g. primary/secondary sections) not grounded
  in workflow priority or content density.

Bad → better:

- Bad: "This legacy page uses `section-heading`, so new pages should too."
- Better: "Legacy pages are migration targets. New work uses Tailwind,
  `ui-foundation.css` tokens, shared `ui-elements`, and the UI reference docs."

## Update Triggers

Update this document when:

- a repeated UI review correction becomes durable guidance
- a new failure mode appears in implementation
- legacy code is removed and an anti-pattern can be retired
- component/token docs introduce a new preferred pattern
