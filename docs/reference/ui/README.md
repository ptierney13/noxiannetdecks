# UI Reference

This folder is the source of truth for product UI decisions in this repo.
Use it before designing, polishing, migrating, or extracting frontend UI.

Read in this order:

1. [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - visual philosophy, page
   composition, hierarchy rules, and legacy precedence.
2. [TOKENS.md](./TOKENS.md) - current token inventory, token usage, and
   recommended token additions.
3. [COMPONENTS.md](./COMPONENTS.md) - reusable component and page-pattern
   guidance with implementation references.
4. [ANTI-PATTERNS.md](./ANTI-PATTERNS.md) - blunt failures to avoid during UI
   work.

These docs are written for coding agents. Prefer directive rules and existing
implementation references over taste-driven improvisation.

## Current Source Files

The docs are derived primarily from:

- `frontend/src/ui-foundation.css`
- `frontend/src/app/AppHeader.tsx`
- `frontend/src/pages/home.tsx`
- `frontend/src/pages/QueryBuilderView.tsx`
- `frontend/src/pages/LearnToSearchView.tsx`
- `frontend/src/features/card-search/CardSearchResultsContent.tsx`
- `frontend/src/features/learn-to-search/*`
- `frontend/src/ui-elements/*`
- `frontend/src/pages/legacy/AGENTS.md`

## Update Triggers

Update this UI reference set when:

- shared tokens in `frontend/src/ui-foundation.css` change
- shared components under `frontend/src/ui-elements/` or reusable domain UI
  under `frontend/src/features/` change visual contracts
- a legacy page is migrated into the current Tailwind/component approach
- a recurring page-local pattern is promoted into a shared component or token
- user feedback establishes a durable UI rule
