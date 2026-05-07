# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Noxian Net Decks** — a card search platform for the Riftbound card game. It consists of a Fastify REST API with a query DSL engine (`card_store`) and a React frontend (`frontend`). Card data is sourced from Riftcodex and stored in `card_store/data/cards.json`.

## Commands

All commands run from the **repository root** via npm workspaces.

```bash
# Dev servers (API on :4545, frontend on :5173)
npm run dev              # both concurrently
npm run dev:api          # card_store only
npm run dev:web          # frontend only

# Build
npm run build            # both workspaces

# Test
npm run test             # all tests
npm run test -w @noxiannet/card-store   # backend tests only
npm run test -w @noxiannet/frontend     # frontend tests only

# Run a single test file
npx vitest run card_store/test/parser.test.ts

# Refresh card data from Riftcodex
npm run import:riftcodex -w @noxiannet/card-store
```

There is no lint script configured.

## Architecture

### Workspaces

| Workspace | Package | Purpose |
|---|---|---|
| `card_store/` | `@noxiannet/card-store` | API server + query engine + card schema |
| `frontend/` | `@noxiannet/frontend` | React UI (imports types from card-store) |
| `deck_store/` | — | Placeholder, not yet implemented |

### Data flow

1. `cards.json` is the canonical card database (committed). The import script populates it from Riftcodex.
2. `JsonFileCardSource` loads `cards.json`; `CardRepository` wraps it with caching and deduplication.
3. The Fastify app (`card_store/src/api/app.ts`) exposes routes: `GET /api/cards?q=`, `GET /api/cards/:id`, `POST /api/query/parse`, `GET /api/query/features`, `GET /api/metadata`.
4. Vite dev server proxies `/api` to `http://127.0.0.1:4545`, so the frontend calls `/api/...` without cross-origin issues.
5. The React app (`frontend/src/App.tsx`) sends search queries, renders diagnostics, and displays a card grid.

### Query engine (`card_store/src/query/`)

The query DSL is parsed by **Chevrotain** and evaluated against card records:

- `parser.ts` — lexer + parser, outputs a `QueryNode` AST
- `ast.ts` — AST node type definitions
- `evaluator.ts` — `evaluateQueryNode()` recurses over the AST; `searchCards()` filters and sorts
- `fields.ts` — field aliases (`n:` → `name`, `e:` → `energy`, etc.) and their types (string / number)
- `features.ts` — field/syntax guides surfaced to the UI via `/api/query/features`

Query syntax: `name:jinx energy>=3 or domain:body`, `-keyword:stealth`, `is:foil`, `name:jin*`, `cost:none`.

### Card data model (`card_store/src/data/schema.ts`)

The `CardRecord` Zod schema is the single source of truth. Key invariants:

- Foil and nonfoil prints share one record via the `finishes: ("foil" | "nonfoil")[]` array.
- `signed` cards must also be `overnumbered`.
- All cards with the same `clean_name` share one `riftbound_id` (used for decklists).
- IDs are globally unique.

The `CardSource` interface abstracts data loading — `JsonFileCardSource` is the current implementation; `RestCardSource` is a future placeholder.

## GitHub Workflow

### Setup constraints

The `gh` CLI is **not installed** on this machine. All GitHub operations go through plain `git` commands.

### Branching

Claude Code works on `claude/<session-name>` branches (created automatically per worktree session). Commits go to the session branch first.

### Pushing a branch

```bash
git push -u origin claude/<branch-name>
```

### Merging to main

`main` is permanently checked out in its own worktree at:

```
C:\Users\ptier\repos\Deck Archive Project-main-merge
```

Because of this, you **cannot** `git checkout main` from any other worktree. To merge a finished branch to main:

```bash
git -C "C:\Users\ptier\repos\Deck Archive Project-main-merge" merge --ff-only <branch-name>
git -C "C:\Users\ptier\repos\Deck Archive Project-main-merge" push origin main
```

Always prefer `--ff-only` to keep history linear. If it fails (diverged histories), stop and ask the user before doing anything else.

### Deployment

Cloudflare Pages is connected to the `main` branch and deploys automatically on push. There is no manual deploy step.

## Plan-first development

Significant work (new features, architecture changes, data model changes, migrations, integrations, broad refactors) requires an approved plan before implementation. Plans live in `plans/todo/` (proposed/approved) and `plans/executed/` (completed). See `AGENTS.md` for full requirements.

Trivial fixes and small docs edits may skip this process.
