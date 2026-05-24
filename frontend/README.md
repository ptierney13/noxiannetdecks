# Frontend

Vite React website for Riftbound card search.

The current site provides:

- Direct text entry for the Riftbound query DSL
- A Search button and Enter-key submission
- Structured query diagnostics
- A detailed query-language feature chart
- A scrollable card-image grid with four columns on desktop

## UI Terms

- `Card Summary Popup` is the canonical internal name for the compact dialog
  that opens when a search-result card is clicked. It is a code/doc identifier,
  not UI copy — the phrase should not appear as visible text inside the component.
- The popup shows a lightweight card summary and actions such as
  `Buy on TCGPlayer` and `View full details`.
- Some older internal code and CSS still use `quick-look` in names like
  `CardQuickLookModal` and `.card-quick-look-*`. Treat those as legacy internal
  identifiers for the same Card Summary Popup surface rather than a different UI.

## UI Foundation

- Shared semantic UI tokens and small cross-route primitives live in
  `frontend/src/ui-foundation.css`.
- Current route and feature styling uses Tailwind utilities on components,
  shared primitives from `frontend/src/ui-elements/`, and reusable domain UI
  from `frontend/src/features/`.
- `frontend/src/styles.css` is legacy and shrinking; do not add new rules.
- Durable UI decision guidance lives in `docs/reference/ui/`.
- Frontend contributor guidance for agents and humans lives in
  `frontend/AGENTS.md`.

## Local Commands

From the repository root:

- `npm run dev:web`
- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
- `npm run storybook -w @noxiannet/frontend`
- `npm run test:storybook -w @noxiannet/frontend`
- `npm run build-storybook -w @noxiannet/frontend`

## Storybook

- Storybook is the primary isolated review surface for the shared shell,
  homepage composition, and reusable route-level presentation patterns.
- Stories for the top-level design system live beside the implementation under
  `frontend/src/*.stories.tsx`.
- Use Storybook before route-by-route tweaking when making future visual passes
  so top-level design decisions stay centralized.

Browser API calls default to same-origin `/api/*` routes so the production
shape matches Cloudflare Pages + Functions. Local browser development points to
`http://127.0.0.1:4545` through `frontend/.env.development`.
