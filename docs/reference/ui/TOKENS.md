# UI Tokens

The current token source is `frontend/src/ui-foundation.css`. Tokens live in
Tailwind v4 `@theme`, which generates utility classes and CSS custom
properties. Prefer token-backed utilities over raw colors and shadows.

## Token Rules

- Use existing tokens before inventing values.
- Promote a value to `ui-foundation.css` when it is reused across components
  or represents a durable design decision.
- Keep `ui-foundation.css` to token declarations and temporary migrated
  component classes. Do not add arbitrary utility selectors.
- Page-local token objects are acceptable for page-specific polish, but promote
  repeated patterns.

## Existing Colors

### App And Surfaces

| Token | Value | Use |
| --- | --- | --- |
| `--color-app-bg` | `#05060a` | page/app background |
| `--color-surface-header` | `#3a0c15` | app header and menu chrome |
| `--color-surface-1` | `rgba(13, 16, 24, 0.9)` | low card/panel surface |
| `--color-surface-2` | `rgba(16, 20, 30, 0.94)` | primary card/panel surface |
| `--color-surface-3` | `rgba(25, 30, 42, 0.96)` | raised surface |
| `--color-surface-inset` | `rgba(8, 11, 18, 0.82)` | inset wells, image wells, input interiors |
| `--color-surface-glass` | `rgba(10, 13, 20, 0.76)` | overlays and translucent controls |

Use `surface-1`, `surface-2`, and `surface-3` in a visible hierarchy. Do not
put every page element on the same surface.

### Text

| Token | Value | Use |
| --- | --- | --- |
| `--color-text-primary` | `#f8f4f1` | main text, active labels, values |
| `--color-text-secondary` | `rgba(240, 232, 227, 0.82)` | normal labels and supporting copy |
| `--color-text-tertiary` | `rgba(219, 203, 195, 0.58)` | metadata, hints, subdued labels |
| `--color-text-dim` | `rgba(190, 171, 160, 0.38)` | low-priority helper text |

Dark UI needs larger contrast steps than light UI. Labels and values must not
share the same weight and brightness.

### Borders

| Token | Value | Use |
| --- | --- | --- |
| `--color-border-subtle` | `rgba(255, 255, 255, 0.08)` | secondary borders, internal divisions |
| `--color-border-default` | `rgba(255, 255, 255, 0.12)` | normal card/control borders |
| `--color-border-strong` | `rgba(255, 255, 255, 0.2)` | hover, elevated, modal borders |
| `--color-border-accent` | `rgba(203, 62, 77, 0.42)` | selected/accent outlines |

Use borders to sharpen surfaces, not as the only section separator.

### Accents

| Token | Value | Use |
| --- | --- | --- |
| `--color-accent` | `#c53247` | primary crimson accent |
| `--color-accent-hover` | `#d74255` | hover crimson |
| `--color-accent-soft` | `rgba(203, 62, 77, 0.13)` | subtle crimson selected/hover surfaces |
| `--color-accent-soft-hover` | `rgba(203, 62, 77, 0.2)` | stronger crimson hover |
| `--color-accent-soft-strong` | `rgba(203, 62, 77, 0.28)` | stronger selected surface |
| `--color-accent-warm` | `#d7aa49` | gold syntax, selected nav text, warm metadata |
| `--color-accent-warm-soft` | `rgba(215, 170, 73, 0.16)` | gold chip/metadata backgrounds |
| `--color-focus-ring` | `rgba(211, 78, 92, 0.32)` | focus-visible rings |

Use crimson for active/selected state and danger-adjacent emphasis. Use warm
gold for syntax, card metadata, premium warmth, and select navigation accents.

### Semantic Status

| Token | Value | Use |
| --- | --- | --- |
| `--color-warning` | `#f0aa5b` | warnings |
| `--color-price` | `#f0aa5b` | prices |
| `--color-info` | `#9ab4e8` | informational emphasis |
| `--color-info-soft` | `rgba(154, 180, 232, 0.08)` | info backgrounds |
| `--color-info-border` | `rgba(154, 180, 232, 0.3)` | info borders |
| `--color-positive` | `#6dba8a` | positive text |
| `--color-positive-strong` | `#7de8a0` | strong positive text |
| `--color-positive-emphasis` | `rgba(42, 143, 82, 0.15)` | positive backgrounds |
| `--color-negative` | `#e88888` | negative text |
| `--color-negative-soft` | `rgba(181, 32, 56, 0.12)` | error backgrounds |
| `--color-negative-border` | `rgba(181, 32, 56, 0.3)` | error borders |
| `--color-negative-emphasis` | `rgba(181, 32, 56, 0.15)` | stronger negative backgrounds |

### Domain Colors

| Token | Value |
| --- | --- |
| `--domain-fury` | `#e53935` |
| `--domain-fury-soft` | `rgba(229, 57, 53, 0.15)` |
| `--domain-fury-soft-hover` | `rgba(229, 57, 53, 0.24)` |
| `--domain-calm` | `#43a047` |
| `--domain-calm-soft` | `rgba(67, 160, 71, 0.15)` |
| `--domain-calm-soft-hover` | `rgba(67, 160, 71, 0.24)` |
| `--domain-mind` | `#1e88e5` |
| `--domain-mind-soft` | `rgba(30, 136, 229, 0.15)` |
| `--domain-mind-soft-hover` | `rgba(30, 136, 229, 0.24)` |
| `--domain-body` | `#fb8c00` |
| `--domain-body-soft` | `rgba(251, 140, 0, 0.15)` |
| `--domain-body-soft-hover` | `rgba(251, 140, 0, 0.24)` |
| `--domain-chaos` | `#8e24aa` |
| `--domain-chaos-soft` | `rgba(142, 36, 170, 0.15)` |
| `--domain-chaos-soft-hover` | `rgba(142, 36, 170, 0.24)` |
| `--domain-order` | `#e6c100` |
| `--domain-order-soft` | `rgba(230, 193, 0, 0.15)` |
| `--domain-order-soft-hover` | `rgba(230, 193, 0, 0.24)` |

Use domain colors for domain pips, chips, and card metadata. Keep them
secondary to the Noxian crimson/gold product frame.

### Rarity Colors

| Token | Value |
| --- | --- |
| `--rarity-common` | `#9e9e9e` |
| `--rarity-common-soft` | `rgba(158, 158, 158, 0.15)` |
| `--rarity-uncommon` | `#78909c` |
| `--rarity-uncommon-soft` | `rgba(120, 144, 156, 0.15)` |
| `--rarity-rare` | `#42a5f5` |
| `--rarity-rare-soft` | `rgba(66, 165, 245, 0.15)` |
| `--rarity-epic` | `#ab47bc` |
| `--rarity-epic-soft` | `rgba(171, 71, 188, 0.15)` |
| `--rarity-showcase` | `#ffb300` |
| `--rarity-showcase-soft` | `rgba(255, 179, 0, 0.15)` |
| `--rarity-promo` | `#ef5350` |
| `--rarity-promo-soft` | `rgba(239, 83, 80, 0.15)` |

Use rarity tokens for card attributes and filtering. Do not let rarity colors
overpower the product shell.

### Chart Colors

| Token | Value |
| --- | --- |
| `--chart-series-1` | `#f59e0b` |
| `--chart-series-2` | `#ef4444` |
| `--chart-series-3` | `#38bdf8` |
| `--chart-series-4` | `#a78bfa` |
| `--chart-series-5` | `#34d399` |
| `--chart-series-6` | `#f472b6` |

Use chart tokens for data visualization. Do not reuse chart colors as generic
page decoration; they are intentionally more varied than the Noxian shell.

## Existing Gradients

| Token | Value | Use |
| --- | --- | --- |
| `--gradient-accent-hero` | `linear-gradient(135deg, #3A3A3F 0%, #1C1C20 100%)` | legacy/accent hero gradient |
| `--gradient-accent-button` | `linear-gradient(180deg, #F2C15A 0%, #E26A2C 100%)` | warm gold/orange search CTA |

The homepage also uses local image-backed hero gradients in
`frontend/src/pages/home.tsx`. Do not replace real visual assets with abstract
gradient art.

## Shadows And Elevation

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-surface-1` | `0 16px 42px rgba(0, 0, 0, 0.32)` | cards and normal raised surfaces |
| `--shadow-surface-2` | `0 22px 60px rgba(0, 0, 0, 0.42)` | modals, menus, prominent cards |
| `--shadow-focus` | `0 0 0 3px var(--color-focus-ring)` | composed focus shadow |

Keep elevation restrained. Use brightness, border, and spacing before adding
large shadow stacks.

## Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `12px` | small controls and compact cards |
| `--radius-md` | `18px` | cards and result surfaces |

Current implementation also uses local radii:

- `rounded-xl` / `12px` for chips, inputs, select controls
- `rounded-2xl` / `16px` for page cards and preview frames
- `rounded-[18px]` for `ResultCard`
- `rounded-[20px]` for titled `Menu`
- `rounded-[22px]` for tiles and legacy page shell cards
- `rounded-[28px]` for `ModalShell`

## Spacing And Layout Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--space-shell-x` | `clamp(1rem, 2vw, 1.75rem)` | app shell horizontal padding |
| `--content-max-width` | `1240px` | standard max content width |
| `--site-header-height` | `60px` | sticky offsets below the header |

Common current spacing patterns:

- page padding: `px-4`, `pb-10`/`pb-12`, `pt-3`/`pt-4`
- section/card padding: `p-4`, `px-4 py-4`, `p-5`, `p-8` for empty states
- dense controls: `gap-2`, `gap-2.5`, `gap-3`
- page modules: `gap-5`, `gap-6`, `gap-7`
- search pane content: `p-3 @[640px]:p-4 @[1024px]:p-5`

Dark pages need more spacing than light pages. Do not compress dense filters
into a continuous stack.

## Motion

Existing motion:

- `search-grow-in`: header search reveal
- `lts-detail-enter`: learn-to-search panel enter, fade plus slight upward
  settle
- common control transitions: `duration-[120ms]`, `duration-150`,
  `duration-[180ms]`, `duration-[220ms]`
- tactile hover: `hover:-translate-y-px` or `hover:-translate-y-0.5`

Use short, intentional motion. Avoid bounce, dramatic glow pulses, or slow
animations in tools.

## Z-Index

No shared z-index tokens currently exist.

Current notable values:

- `z-60`: sticky `AppHeader`
- `z-[69]`: mobile nav backdrop
- `z-70`: mobile nav menu
- `z-50`: dropdowns and modal backdrop
- `z-10`: close buttons and nested menus

Recommended addition: add named z-index tokens if more overlay layers appear.
Until then, keep z-index local and document why the layer exists.

## Recommended Additions

These do not currently exist as shared tokens. Add them only when a second
surface needs the same value.

- `--color-surface-section`: standard section/card body surface
- `--color-surface-section-header`: section header band surface
- `--color-surface-subsection`: filter/configuration subsection well
- `--color-surface-control`: inactive clickable control surface
- `--color-surface-control-hover`: hovered clickable control surface
- `--color-surface-control-selected`: selected crimson control surface
- `--shadow-control`: subtle tactile control shadow
- `--shadow-control-selected`: restrained selected control emphasis
- `--radius-control`: shared chip/input/select radius
- `--space-section-gap`: standard vertical gap between major page modules
- `--space-section-padding`: standard internal padding for section cards

These recommendations come from repeated page-local needs in
`QueryBuilderView.tsx` and card-search controls. Promote them before copying
large page-local token strings into another page.

## Update Triggers

Update this document when:

- `frontend/src/ui-foundation.css` changes
- a page-local token becomes reused and is promoted
- component state styling changes for controls, cards, menus, modals, or inputs
- new domain, rarity, semantic, spacing, motion, or elevation tokens are added
