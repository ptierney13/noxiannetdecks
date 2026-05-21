# Deck Archive Project

Deck Archive Project has two main product surfaces:

- User-facing web app
  - defined in `frontend/`
- Backend service
  - card data and query logic from `card_store/`
  - published price data from `price_store/`
  - public API exposed from `functions/`

Work in progress:

- `deck_store/` is the in-progress package for storing, publishing, and
  eventually serving deck and event data through the backend surface.

## Documentation Map

- [AGENTS.md](./AGENTS.md): authoritative agent workflow and repo rules
- [docs/README.md](./docs/README.md): documentation topology
- [card_store/README.md](./card_store/README.md): backend card/search semantics
- [frontend/README.md](./frontend/README.md): frontend app semantics
- [price_store/README.md](./price_store/README.md): price pipeline semantics
- [deck_store/README.md](./deck_store/README.md): deck archive semantics

## Documentation Principles

- `README.md` files describe durable semantics and what belongs in a folder.
- `docs/reference/` holds evergreen reference and policy.
- `docs/runbooks/` holds repeatable operations.
- `docs/work/` holds active initiatives.
- `docs/archive/` holds completed or superseded historical work.
- `.agents/skills/` holds repo-local Codex skills for accomplishing specific
  recurring tasks.

When initiative work is completed, only evergreen conclusions should remain in
READMEs or runbooks. Completed initiative docs should move out of the main
docs surface and into the archive.
