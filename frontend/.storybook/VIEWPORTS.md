# Storybook Viewport Conventions

Stories in this codebase use four canonical viewport sizes. Use these names consistently in `StorybookViewportFrame` and in story descriptions.

| Viewport | Width | Breakpoint context | What to verify |
|---|---|---|---|
| `Mobile` | 393px | Below `sm` (640px) — full-width fixed hamburger dropdown, backdrop visible | Touch targets, hamburger menu, no wordmark |
| `DesktopSmall` | 700px | `sm`–`md` (640–768px) — compact absolute hamburger dropdown, no backdrop | Dropdown positioning, no inline nav |
| `Desktop` | 900px | `md`–`lg` (768–1024px) — inline nav visible, no wordmark | Cards/Tools dropdowns, hamburger collapsed |
| `DesktopWide` | 1280px | `lg`+ (1024px+) — inline nav + wordmark | Wordmark slide-in, full expanded nav |

## Usage in stories

```tsx
import { StorybookViewportFrame } from "../lib";

export const Mobile: Story = {
  render: () => (
    <StorybookViewportFrame viewport="Mobile">
      <App />
    </StorybookViewportFrame>
  ),
};

export const DesktopWide: Story = {
  render: () => (
    <StorybookViewportFrame viewport="DesktopWide">
      <App />
    </StorybookViewportFrame>
  ),
};
```

For edge-case testing at an exact pixel boundary, pass a `width` override:

```tsx
<StorybookViewportFrame viewport="DesktopSmall" width={767}>
  <App />
</StorybookViewportFrame>
```

## Why these four sizes

The app breakpoints are `sm=640px`, `md=768px`, `lg=1024px`.

- **Mobile** sits below all breakpoints — the base starting point.
- **Desktop Small** sits between `sm` and `md` — tests the intermediate hamburger state where the dropdown switches from fixed full-width to compact absolute.
- **Desktop** sits between `md` and `lg` — tests the inline nav without the wordmark.
- **Desktop Wide** sits above `lg` — tests the full expanded nav with wordmark.

Always cover all four sizes for any shell-level component. Use intermediate widths only for specific edge-case testing (e.g. verifying nothing leaks at exactly 767px, one pixel before the `md` container breakpoint fires).

## Container queries vs. viewport queries

Shell components (`AppHeader`) use Tailwind **container queries** (`@container` on the element, then `@md:` etc. inside). This means `StorybookViewportFrame`'s CSS width constraint correctly drives responsive behavior without needing the Storybook viewport addon to resize the iframe. Container queries respond to the element's rendered width; since the header is always `w-full` in production, behavior is identical.

Do **not** use viewport media queries (`md:`) for shell components — they respond to the browser viewport width, which ignores `StorybookViewportFrame`'s CSS constraints.
