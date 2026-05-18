# Legacy Pages

This folder contains page-level view components that have not yet been migrated
to the current UI paradigm (Tailwind, PageShell, TileBase/TileFeature/TilePromo,
TanStack Query).

**Do not reference these files for style, patterns, or architecture guidance.**
They are in the middle of a refactor and intentionally do not reflect current
conventions.

Legacy patterns you will find here — do not replicate:

- Styles pulled from `src/styles.css` rather than Tailwind utility classes
- Inline style objects for static values (colors, spacing, hover states)
- Direct `fetch`/`useEffect` data-fetching (pre-TanStack Query)
- `window.history` navigation (pre-TanStack Router)

When migrating a page out of this folder:

1. Rewrite it following `frontend/AGENTS.md` and `frontend/UI_ARCHITECTURE.md`.
2. Move it to `src/pages/`.
3. Delete it from this folder.
