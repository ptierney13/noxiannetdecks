# Frontend Agent Notes

This file adds frontend-specific guidance on top of the repository root
`AGENTS.md`. Read this file before editing anything under `frontend/`.

## Scope

These notes apply when editing files under `frontend/`.

Before significant UI work, also read:

- `frontend/UI_ARCHITECTURE.md`
- `docs/reference/ui/README.md`
- `docs/reference/ui/DESIGN-SYSTEM.md`
- `docs/reference/ui/TOKENS.md`
- `docs/reference/ui/COMPONENTS.md`
- `docs/reference/ui/ANTI-PATTERNS.md`

Treat `frontend/UI_ARCHITECTURE.md` as the detailed frontend architecture and
responsive-architecture companion to this one. Treat `docs/reference/ui/` as
the source of truth for visual design decisions, token usage, component
patterns, and UI anti-patterns.

## Execution Defaults

For meaningful frontend work, completion defaults to:

1. commit the intended changes
2. ship the branch
3. return the branch preview URL as the last item in the response

Use the repo-local preview skill at
`.agents/skills/noxiannet-preview-url/SKILL.md` for preview URL handling.

## Task Routing

| If you are doing...                             | Read this first                                        |
| ----------------------------------------------- | ------------------------------------------------------ |
| Any frontend UI design, visual polish, or styling decision | `docs/reference/ui/README.md`, then the in-scope UI reference subdoc |
| Any new component or shared UI work             | `frontend/AGENTS.md` (here), then `src/ui-elements/index.ts` |
| Feature-level UI used by multiple routes        | `src/features/` barrel + Storybook coverage rule below |
| Routing or navigation changes                   | `src/routes/` — TanStack Router owns all navigation    |
| Data fetching or API calls                      | `src/data/` — TanStack Query keys and queryOptions     |
| Non-domain hooks or utilities                   | `src/lib/`                                             |
| CSS migration of an existing component          | Migration Era Contract section below                   |
| Any Storybook story addition or update          | Storybook Requirement section below — stories are always colocated with their source file |
| Stage-level architectural decisions             | `docs/work/frontend-ui-architecture-alignment/`        |

## Migration Era Contract (active during this initiative)

The frontend is mid-migration toward a layered architecture with Tailwind
styling and TanStack Router/Query. The full initiative plan lives in
`docs/work/frontend-ui-architecture-alignment/`.

**Active rules for all new and migrated work:**

- No new rules in `styles.css`. This file is shrinking toward zero.
- All new and migrated component styles use Tailwind utility classes directly
  on the component.
- When migrating a component: write Tailwind on the component first, then
  delete the corresponding `styles.css` selector after confirming the component
  renders correctly. Never leave both active simultaneously.
- `ui-foundation.css` may stay as a CSS custom property declaration file
  (token definitions only). Do not add utility selectors there.
- Storybook verification is required for every extracted shared component and
  every exported UI surface. See Storybook Requirement below.
- New shared presentational UI goes under `src/ui-elements/` (barrel-exported via `ui-elements/index.ts`) unless an approved initiative explicitly changes that layer name.
- New domain-shared UI goes under `src/features/`.
- New API/query helpers go under `src/data/`.
- New non-domain utilities go under `src/lib/`.
- New pages (migrated) go under `src/pages/`.
- Unmigrated pages belong in `src/pages/legacy/` — see that folder's `AGENTS.md`.
- Shared extraction should be conservative. Prefer route-local or feature-local
  composition until reuse is real or immediately imminent.
- Feature-only composition files may live inside `src/features/` without being
  barrel-exported yet. Export only the reusable feature API surface.
- When building a shared feature for the first time, keep parent ownership
  minimal: pass the primary input in, and let the feature own fetch, selection,
  popup, and other interaction state unless proven reuse requires lifting it.
- Shared/frontend component names should describe their actual UI role. Avoid
  vague umbrella names unless the boundary is already established in docs.

**Legacy patterns you will encounter — do not extend:**

- `styles.css` — large legacy CSS file; do not add to it
- Raw CSS module files or inline style objects in pre-migration components
- Direct `window.history` calls — being replaced by TanStack Router in Stage 3
- `useEffect` data-fetching waterfalls — being replaced by TanStack Query in Stage 4

## Target Architecture Layers

| Layer      | Location        | What belongs here                                                     |
| ---------- | --------------- | --------------------------------------------------------------------- |
| `app/`     | `src/app/`      | App shell, header, router, providers — no page-level content          |
| `pages/`   | `src/pages/`    | Migrated page components using the current UI paradigm                |
| `pages/legacy/` | `src/pages/legacy/` | Unmigrated page components — **do not use as style or pattern reference** (see `src/pages/legacy/AGENTS.md`) |
| `features/`| `src/features/` | Domain UI shared by more than one route                               |
| `ui/`      | `src/ui/`       | Product-agnostic primitives — Tailwind, no API calls, no domain logic |
| `data/`    | `src/data/`     | TanStack Query keys, queryOptions, API client                         |
| `lib/`     | `src/lib/`      | Shared React utilities (`useDebounce`, formatters, etc.)              |

Note: `src/routes/` is the eventual target layer for route definitions and loaders
(TanStack Router convention). `src/pages/` is the current pragmatic location while
the migration is in progress.

Import direction (strictly one-way):

```
app → routes / features / ui / data / lib
routes → features / ui / data / lib
features → ui / data / lib
ui → lib
data → lib
lib → (nothing in this repo)
```

Each layer exposes a barrel `index.ts`. Import from the barrel, not from
internal files.

**Where does X go? — quick reference:**

- New button or input primitive → `ui/`
- New card-domain component used by multiple routes → `features/`
- New card-domain component used only by one route → keep in the route file
- New API call or query definition → `data/`
- New non-domain hook or utility → `lib/`
- New page route → `routes/`

## Semantic Tokens

CSS custom properties defined in `ui-foundation.css` (e.g., `--color-accent`,
`--color-surface-1`) remain valid. Prefer semantic token references over
hardcoded palette values inside Tailwind classes (use `var(--token-name)`).

If a visual value is used in more than one component and represents a reusable
design decision, promote it to a CSS custom property in `ui-foundation.css`
before using it.

Repeated layout thresholds, column switches, and spacing invariants should come
from one named source of truth. Use either a shared token in
`ui-foundation.css` when the invariant applies across multiple surfaces, or
local named constants with plain-English comments describing what part of the
UI they affect.

## Component Styling

- Style components with Tailwind utility classes.
- Inline styles are acceptable only for truly runtime-specific values: geometry,
  measured positioning, dynamic coordinates, or per-instance computed values
  that are awkward to express as a class.
- Do not use inline styles for static spacing, colors, opacity, cursors, or
  hover states.

## Responsive Architecture

Build frontend UI mobile-first. Base styles target narrow screens first and add
larger-screen behavior progressively.

Standard expansion breakpoints:

- `640px`
- `768px`
- `1024px`
- `1280px`

Unless the user explicitly says otherwise, conversational references to
`sm`/`md`/`lg`/`xl` should be interpreted as viewport-number semantics.

Use `@container` queries for component-level layout adaptation (cards, tiles,
hero blocks, panels). Reserve viewport media queries (`sm:`, `lg:`, `xl:`) for
true shell-level changes: switching mobile/desktop nav, showing/hiding
desktop-only chrome, responding to actual browser window width.

**Shell components (header, nav) use viewport breakpoints**, not container
queries. Storybook shell stories use `parameters.viewport.defaultViewport` to
resize the iframe, which makes viewport queries behave correctly at the intended
width. Do not use container queries on shell/nav elements.

**Tailwind v4 container query scale warning:** Named container breakpoints
(`@sm:`, `@lg:`) are NOT equivalent to viewport breakpoints of the same name.
`@lg:` fires at ~512px, not 1024px. Use explicit pixel values for container
queries when a specific threshold matters: `@[420px]:`, `@[1024px]:`, etc.

When a component-level design uses viewport-number language but must be
implemented with container queries, translate those values into explicit
numeric container thresholds. Do not use named container breakpoints as
shorthand for viewport-equivalent behavior.

Do not make cards, heroes, or shared surfaces depend on browser viewport width
when container width is the actual layout signal. Storybook stories must render
correctly when the canvas is resized.

After meaningful CSS architecture changes, restart Storybook fresh rather than
relying on hot reload. Always stop the existing instance before starting a new
one — Storybook runs on port 6006 and never emits a ready signal, so do not
wait for startup confirmation; check console logs for errors instead.

Navigation is authored mobile-first and scaled upward. There is no separate
"mobile version" of any component — a single implementation scales up via CSS
breakpoints. See `.storybook/VIEWPORTS.md` for canonical viewport keys and
the shell breakpoint reference.

## Mobile Interaction Rules

- Touch targets at least `44px` tall on mobile.
- No hover-only critical behavior; provide tap/click equivalents.
- Above-the-fold primary CTA must remain visible without scrolling.

## Storybook Requirement

Storybook is the primary UI review harness. It is required, not optional.

**Stories are always colocated with the file they test.** A story for
`src/ui-elements/FeatureCard.tsx` lives at `src/ui-elements/FeatureCard.stories.tsx`. A story
for `src/home.tsx` lives at `src/home.stories.tsx`. There is no `src/storybook/`
folder — that directory was removed. Do not recreate it.

| Surface | Story required? |
| ------- | --------------- |
| Exported `ui/` component | Yes — colocated in `ui/ComponentName.stories.tsx` |
| Exported `features/` component | Yes — colocated in `features/ComponentName.stories.tsx` |
| Route-shell or feature state the user should inspect | Yes — colocated with the source file |
| Tiny private leaf helper with no meaningful inspectable state | No |

Stories must cover: default, loading, empty, and error states where applicable.
Use `@storybook/test` play functions for meaningful interaction states.

**Completion notes must name changed components and list the Storybook story
paths to open for inspection. If you cannot name the Storybook path for a
shared component you changed, you have not finished the job.**

## When Adding UI

Before adding a new UI pattern:

1. Search `src/ui/` first. If an existing primitive covers the need, import
   from `ui/index.ts` (the barrel) — not from the internal file.
2. If the pattern is shared across routes, it belongs in `ui/` or `features/`.
3. If the pattern is route-local, keep it in the route file and style it with
   Tailwind.
4. Do not clone styles. Use the barrel import.
5. If typed user input live-updates nearby UI, use the repo's canonical
   debounce/live-update pattern rather than introducing ad hoc timers. The
   canonical example lives in `src/lib/useDebounce.ts`.

## Verification

For meaningful frontend changes, run:

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
- `npm run test:storybook -w @noxiannet/frontend`
- `npm run build-storybook -w @noxiannet/frontend`

Manual spot checks should include:

- homepage
- card search
- query builder
- deck explorer
- tier list
- trade balancer

## Discoverability Requirement

If you update future UI guidance, keep both of these files aligned:

- `frontend/AGENTS.md`
- `frontend/UI_ARCHITECTURE.md`
