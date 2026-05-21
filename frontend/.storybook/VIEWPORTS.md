# Storybook Viewport Conventions

Stories that test responsive or shell-level components set the Storybook iframe
viewport using `parameters.viewport.defaultViewport`. This resizes the actual
iframe, making viewport media queries (`sm:`, `lg:`, `xl:`) behave correctly.

The canonical viewports are defined in `.storybook/preview.ts` and cover the
meaningful breakpoint zones for the current nav/shell design:

| Viewport key | Width | Breakpoint zone | What to verify |
|---|---|---|---|
| `mobile` | 393px | Below `sm` (640px) — full-width fixed hamburger dropdown, backdrop visible | Touch targets, hamburger menu, no wordmark |
| `desktop-small` | 700px | `sm`–`md` (640–768px) — compact absolute hamburger dropdown, no backdrop | Dropdown positioning, no inline nav |
| `nav-items-edge` | 767px | Just below `md` (768px) — edge case only | Confirm nav items are zero-width, no bleed |
| `desktop` | 900px | `md`–`lg` (768–1024px) — inline nav visible, hamburger collapsed | No wordmark yet |
| `desktop-wide` | 1280px | `lg`+ (1024px+) — inline nav + wordmark | Wordmark slide-in, full expanded nav |

## Usage in stories

```tsx
export const DesktopSmall: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop-small" },
  },
};
```

No wrapper component is needed. The viewport parameter resizes the Storybook
iframe directly, so any responsive code in the story renders exactly as it
would in a real browser at that width.

For ad-hoc edge-case testing, use the viewport picker in the Storybook toolbar
or add a custom key to the `VIEWPORTS` object in `preview.ts`.

## Why viewport queries (not container queries) for shell stories

Shell components (`AppHeader`) use Tailwind **viewport** breakpoints (`sm:`,
`md:`, `lg:`) rather than container queries (`@sm:`, `@lg:`). The `parameters.viewport`
approach resizes the iframe, so viewport queries reflect the story's intended
width correctly.

**Important Tailwind v4 gotcha — container query breakpoints use a different scale:**

| Tailwind class | Type | Fires at |
|---|---|---|
| `lg:` | Viewport media query | **1024px** |
| `@lg:` | Container query | **512px** (32rem) |

Container query named breakpoints (`@sm`, `@md`, `@lg`, `@xl`) in Tailwind v4
use a compact scale designed for component-level containers (cards, panels,
sidebars). They are **not** equivalent to the viewport breakpoints of the same
name. If you need a container query to fire at a specific pixel value, use an
explicit arbitrary value: `@[1024px]:`, `@[640px]:`, etc.

Unless explicitly stated otherwise, conversational references to
`sm`/`md`/`lg`/`xl` should be interpreted as viewport-number semantics. If a
component uses container queries instead of viewport queries, translate those
values into explicit numeric container thresholds rather than named Tailwind
container breakpoints.

## When to use container queries vs. viewport queries

| Pattern | Use | Why |
|---|---|---|
| Shell nav / header | Viewport queries (`md:`, `lg:`) | Header is always full viewport width; Storybook viewport parameter sets iframe width |
| Cards, tiles, panels | Container queries (`@[Xpx]:` preferred when matching viewport-number semantics; Tailwind `@sm:`/`@lg:` only when the compact scale is intentionally desired) | Component responds to its own containing surface, not the viewport |
| Hero content blocks | Container queries on the hero shell element | Ensures correct layout in any embedding context |

## Always cover these four zones for shell-level components

- **Mobile** (393px) — below all breakpoints, base state
- **Desktop Small** (700px) — after `sm`, before `md`, tests compact hamburger
- **Desktop** (900px) — after `md`, before `lg`, confirms inline nav visible and hamburger collapsed, no wordmark
- **Desktop Wide** (1280px) — at `lg`+, tests full expanded state with wordmark
