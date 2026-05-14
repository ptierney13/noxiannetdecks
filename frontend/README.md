# Frontend

Vite React website for Riftbound card search.

The current site provides:

- Direct text entry for the Riftbound query DSL
- A Search button and Enter-key submission
- Structured query diagnostics
- A detailed query-language feature chart
- A scrollable card-image grid with four columns on desktop

## UI Terms

- `Quick View` is the canonical product term for the compact dialog that opens
  when a search-result card is clicked.
- Quick View shows a lightweight card summary and actions such as `Buy on TCG`
  and `View full details`.
- Some older internal code and CSS still use `quick-look` in names like
  `CardQuickLookModal` and `.card-quick-look-*`. Treat those as legacy internal
  identifiers for the same Quick View surface rather than a different UI.

## Local Commands

From the repository root:

- `npm run dev:web`
- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`

Browser API calls default to same-origin `/api/*` routes so the production
shape matches Cloudflare Pages + Functions. Local browser development points to
`http://127.0.0.1:4545` through `frontend/.env.development`.
