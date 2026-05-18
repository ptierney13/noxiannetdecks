# Plan: Frontend Folder Reorganization — Pages + Legacy + Header Extraction

## Context

The frontend `src/` root has grown flat and mixed: page-level view components sit alongside
utility files, the app shell contains hundreds of lines of navigation code, and `NotFoundView`
is misplaced inside `ui/`. This refactor introduces a clear `pages/` layer, quarantines
unmigrated pages under `pages/legacy/`, extracts the header into `features/`, and updates
`frontend/AGENTS.md` to reflect the new layout.

No behavior changes. This is a pure structural move.

---

## Target Structure

```
frontend/src/
  app/               ← unchanged: AppShell (thinned), router, ErrorContext, HeaderSearchContext
  app/
    AppShell.tsx     ← thinned: just mounts AppHeader + error banner + Outlet
    AppHeader.tsx    ← extracted from AppShell; all nav logic lives here
    AppHeader.stories.tsx
    router.tsx
    ErrorContext.tsx
    HeaderSearchContext.tsx
    index.ts         ← updated to export AppHeader
  pages/
    home.tsx         ← moved from src/home.tsx (new-paradigm page)
    home.stories.tsx
    legacy/
      AGENTS.md      ← legacy warning doc (new)
      SearchView.tsx
      CardDetailView.tsx
      DeckExplorerView.tsx
      TierListView.tsx
      SealedSimulator.tsx
      TradeBalancerView.tsx
      QueryBuilderView.tsx
      LearnToSearchView.tsx
      LearnToSearchView.stories.tsx  (if it exists)
      CardSearchGuide.tsx
      CardSearchGuideImageOverlay.tsx
      LtsDetailOverlay.tsx
      NotFoundView.tsx               ← moved from src/ui/
      NotFoundView.stories.tsx       ← moved from src/ui/
  ui/                ← unchanged except NotFoundView removed
  lib/               ← unchanged
  data/              ← unchanged
  deck-explorer/     ← unchanged (domain data, not a page)
```

---

## Steps

### 1. Extract AppHeader from AppShell

**Create** `frontend/src/features/AppHeader.tsx`:
- Move all header/nav JSX and logic out of `AppShell.tsx`: `NavLink`, `resolveActiveSection`,
  nav Tailwind constants, all state (`showToolsMenu`, etc.), all `useEffect`/`useLayoutEffect`
  blocks, and the full `<header>` JSX subtree.
- AppHeader receives no props — it reads router state and context internally, same as today.

**Thin `AppShell.tsx`** to roughly:
```tsx
export default function AppShell() {
  const error = useAppErrorState();
  return (
    <>
      <AppHeader />
      {error ? <div className="...error banner...">{error}</div> : null}
      <Outlet />
    </>
  );
}
```

**Move** `frontend/src/header.stories.tsx` → `frontend/src/app/AppHeader.stories.tsx`.
Update its import to `./AppHeader`.

**Update** `frontend/src/app/index.ts` to export `AppHeader`.

---

### 2. Create pages/ folder and move home

**Move** `frontend/src/home.tsx` → `frontend/src/pages/home.tsx`.
**Move** `frontend/src/home.stories.tsx` → `frontend/src/pages/home.stories.tsx`.

Update the import inside `home.stories.tsx` to `./home`.

---

### 3. Create pages/legacy/ and move legacy pages

**Move** the following files from `frontend/src/` → `frontend/src/pages/legacy/`:

| From `src/`                        | To `src/pages/legacy/`                |
|------------------------------------|---------------------------------------|
| `SearchView.tsx`                   | `SearchView.tsx`                      |
| `CardDetailView.tsx`               | `CardDetailView.tsx`                  |
| `DeckExplorerView.tsx`             | `DeckExplorerView.tsx`                |
| `TierListView.tsx`                 | `TierListView.tsx`                    |
| `SealedSimulator.tsx`              | `SealedSimulator.tsx`                 |
| `TradeBalancerView.tsx`            | `TradeBalancerView.tsx`               |
| `QueryBuilderView.tsx`             | `QueryBuilderView.tsx`                |
| `LearnToSearchView.tsx`            | `LearnToSearchView.tsx`               |
| `CardSearchGuide.tsx`              | `CardSearchGuide.tsx`                 |
| `CardSearchGuideImageOverlay.tsx`  | `CardSearchGuideImageOverlay.tsx`     |
| `LtsDetailOverlay.tsx`             | `LtsDetailOverlay.tsx`                |

**Move from `src/ui/`** → `src/pages/legacy/`:
- `NotFoundView.tsx`
- `NotFoundView.stories.tsx`

Update the story import in `NotFoundView.stories.tsx` to `./NotFoundView`.

**Remove** `NotFoundView` from `frontend/src/ui/index.ts`.

---

### 4. Write pages/legacy/AGENTS.md

**Create** `frontend/src/pages/legacy/AGENTS.md`:

```markdown
# Legacy Pages

This folder contains page-level view components that have not yet been migrated
to the current UI paradigm (Tailwind, PageShell, TileBase/TileFeature/TilePromo,
TanStack Query).

**Do not reference these files for style, patterns, or architecture guidance.**
They are in the middle of a refactor and intentionally do not reflect current
conventions.

Legacy patterns you will find here (do not replicate):
- Styles pulled from `src/styles.css` rather than Tailwind utility classes
- Inline style objects for static values
- Direct `fetch`/`useEffect` data-fetching (pre-TanStack Query)
- `window.history` navigation (pre-TanStack Router)

When migrating a page out of this folder:
1. Rewrite it following `frontend/AGENTS.md` and `frontend/UI_ARCHITECTURE.md`.
2. Move it to `src/pages/`.
3. Delete it from this folder.
```

---

### 5. Update router.tsx imports

`frontend/src/app/router.tsx` currently imports every view from `../`. Update each:

| Old import                        | New import                                       |
|-----------------------------------|--------------------------------------------------|
| `from "../home"`                  | `from "../pages/home"`                           |
| `from "../SearchView"`            | `from "../pages/legacy/SearchView"`              |
| `from "../LearnToSearchView"`     | `from "../pages/legacy/LearnToSearchView"`       |
| `from "../QueryBuilderView"`      | `from "../pages/legacy/QueryBuilderView"`        |
| `from "../CardDetailView"`        | `from "../pages/legacy/CardDetailView"`          |
| `from "../DeckExplorerView"`      | `from "../pages/legacy/DeckExplorerView"`        |
| `from "../TierListView"`          | `from "../pages/legacy/TierListView"`            |
| `from "../SealedSimulator"`       | `from "../pages/legacy/SealedSimulator"`         |
| `from "../TradeBalancerView"`     | `from "../pages/legacy/TradeBalancerView"`       |
| `from "../ui"` (NotFoundView)     | `from "../pages/legacy/NotFoundView"`            |

---

### 6. Update intra-legacy imports

Legacy pages that import their own helper components need path updates (all become
relative within `legacy/`):
- `LearnToSearchView.tsx` → imports `CardSearchGuide`, `LtsDetailOverlay`
- Any import of `CardSearchGuideImageOverlay` inside `CardSearchGuide`

These are already relative imports, so the paths just shorten to `./CardSearchGuide`, etc.

---

### 7. Update frontend/AGENTS.md

Update the **Target Architecture Layers** table and **Task Routing** table to reflect
the new `pages/` layer:

- Add `pages/` row: _"Route-level page components; new-paradigm pages go here directly,
  unmigrated pages live in `pages/legacy/`"_
- Update the routing row for "New page route" to say `src/pages/` (not `src/routes/`),
  noting that `src/routes/` remains the eventual target.
- Add a note that `src/pages/legacy/` has its own `AGENTS.md` and should not be
  used as a style reference.

---

## Files Changed Summary

| File | Action |
|------|--------|
| `src/app/AppShell.tsx` | Thinned — nav logic extracted |
| `src/app/AppHeader.tsx` | Created — nav logic from AppShell |
| `src/app/AppHeader.stories.tsx` | Created — moved from `src/header.stories.tsx` |
| `src/app/index.ts` | Updated — exports AppHeader |
| `src/pages/home.tsx` | Moved from `src/home.tsx` |
| `src/pages/home.stories.tsx` | Moved from `src/home.stories.tsx` |
| `src/pages/legacy/AGENTS.md` | Created |
| `src/pages/legacy/*.tsx` (11 files) | Moved from `src/` |
| `src/pages/legacy/NotFoundView.tsx` | Moved from `src/ui/` |
| `src/pages/legacy/NotFoundView.stories.tsx` | Moved from `src/ui/` |
| `src/ui/index.ts` | NotFoundView export removed |
| `src/app/router.tsx` | Import paths updated |
| `frontend/AGENTS.md` | pages/ layer documented |

Files left in place: `src/header.stories.tsx` is deleted (replaced by
`features/AppHeader.stories.tsx`). Utility files at `src/` root (`api.ts`,
`types.ts`, `cardFormat.tsx`, `vite-env.d.ts`) are not moved — they are not
pages and are out of scope.

---

## Verification

1. `npm run build -w @noxiannet/frontend` — must pass with zero errors
2. `npm run test -w @noxiannet/frontend` — must pass
3. `npm run dev:web` — spot-check each route manually:
   - `/` (home), `/cards`, `/cards/learn-to-search`, `/cards/query-builder`
   - `/deck-explorer`, `/tools/tier-list`, `/tools/sealed-pools`, `/tools/trade-balancer`
   - Navigate to a nonexistent path to confirm NotFoundView renders
4. `npm run build-storybook -w @noxiannet/frontend` — must pass; verify
   `UI/AppHeader` story exists and `UI/NotFoundView` story still works at its new path
