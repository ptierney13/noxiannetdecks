# Frontend

Vite React website for Riftbound card search.

The current site provides:

- Direct text entry for the Riftbound query DSL
- A Search button and Enter-key submission
- Structured query diagnostics
- A detailed query-language feature chart
- A scrollable card-image grid with four columns on desktop

## Local Commands

From the repository root:

- `npm.cmd run dev:web`
- `npm.cmd test -w @noxiannet/frontend`
- `npm.cmd run build -w @noxiannet/frontend`

The Vite dev server proxies `/api` to the card store API at `http://127.0.0.1:4545`.

