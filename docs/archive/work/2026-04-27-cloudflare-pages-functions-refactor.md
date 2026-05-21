# Cloudflare Pages Functions Refactor

## Summary

This document defines the next refactor stage for moving the project onto a
clean Cloudflare-hosted architecture. The active deployment target should be
`Cloudflare Pages + Functions`, with a mostly static frontend, a small
server-backed API for the public behaviors that should remain centralized, and
lightweight deck/catalog data that does not depend on a live database.

This stage is about clarifying the deploy boundary, cleaning up separation of
concerns, and documenting the intended runtime model before larger feature work
continues. It is not the stage where card pricing refreshes, scheduled jobs,
or broader ingestion automation are implemented.

The refactor should leave the project with:

1. a clear Cloudflare deployment surface for the public site and `/api/*`
2. reusable domain logic separated from hosting/runtime glue
3. frontend feature modules aligned with the hosted route model
4. a documented future path for separate price data publication

## Key Changes

- Adopt `Cloudflare Pages + Functions` as the active hosting model for the
  public site.
- Treat `noxiannetdecks.com` as the production hostname and Cloudflare preview
  deploys as the standard branch/PR validation flow.
- Keep the frontend static where possible, but serve API routes from
  Cloudflare Functions under the same public origin.

### Deploy Boundary

- Introduce a clear Cloudflare app/deployment surface instead of relying on the
  current local-only split between Vite proxy behavior and a separate Fastify
  server process.
- Separate reusable domain logic from deployable HTTP wiring so search, pack
  generation, and lightweight deck/catalog lookups stay portable and testable.
- Keep package-level modularity, but reduce ambiguity about which layer owns:
  - public HTTP routes
  - Cloudflare-specific hosting concerns
  - shared domain/query logic

### Server-Side Public API

- Keep card search server-backed and API-first even though browser-only search
  is technically possible at the current dataset size.
- Keep lightweight utility endpoints server-side when they improve cleanliness,
  consistency, or future extensibility, including:
  - card search and detail lookup
  - card metadata helpers
  - pack generation and related sealed-pool utility endpoints
  - deck/event read helpers only where an API boundary is cleaner than direct
    frontend data imports
- Do not move naturally client-only interactions to the backend just because
  hosting is changing. In particular:
  - deck-building state
  - tier-list interaction state
  - local sealed-pool manipulation after generation
  should remain client-managed unless a later feature explicitly requires
  shared persistence or multi-user coordination.
- Do not introduce:
  - user accounts
  - shared mutable user state
  - long-term backend storage
  - a live database

### Frontend Refactor

- Split the oversized frontend composition into cleaner feature modules so
  Cards, Deck Explorer, Tier List, and Sealed Pools are not all coordinated
  from one large application file.
- Keep the frontend dependent on stable API contracts and route definitions
  rather than on local proxy assumptions.
- Ensure direct navigation and hosted route behavior work cleanly under the
  Cloudflare runtime model for both preview and production environments.

### Deck And Catalog Scope

- Re-scope `deck_store` to the new small-catalog goal:
  - preserve the useful static event/deck browsing foundation
  - keep catalog data lightweight and non-database-backed
  - support a curated public deck list rather than a large-scale live archive
- Freeze or quarantine the broader metagame/archive/ingestion roadmap from the
  mainline runtime path unless a piece is directly useful for the lightweight
  public deck catalog.
- Avoid carrying Stage 2/3 metagame snapshot automation into this refactor
  unless a specific artifact or abstraction directly improves the Cloudflare
  deployment target.

### Price Data Decision

- Canonical card metadata should remain static, versioned, and separate from
  mutable price information.
- Future price data should not be written back into canonical `cards.json`.
- The intended future direction is:
  - canonical card data stays static
  - a separate scheduled Worker may periodically fetch price data
  - that Worker may publish a public derived snapshot such as `prices.json`
  - runtime API/functions may merge canonical card data with published price
    data when needed
- This stage only documents that decision and preserves a clean extension point
  for it. It does not implement scheduled refreshes, price storage, or price
  merging behavior.

### Documentation And Deployment Expectations

- Document the intended Cloudflare deployment flow, including:
  - local development expectations
  - preview deploy expectations
  - production deploy expectations
- Document which runtime responsibilities belong to:
  - static frontend assets
  - Cloudflare Functions
  - future separate scheduled Workers
- Document the public API surface and the parts of the app that are
  intentionally static versus computed.

## Public Interfaces / Runtime Shape

- Public site:
  - one Cloudflare-hosted origin serving both the frontend and `/api/*`
- Server-backed API:
  - card search
  - card detail / metadata helpers as needed
  - pack-generation endpoints and similar lightweight card-tooling endpoints
  - deck/event read endpoints only if they are cleaner than direct static
    imports for the hosted app shape
- Explicitly not part of this stage:
  - user persistence
  - long-term backend storage
  - live database adoption
  - scheduled pricing refresh implementation
  - large-scale metagame ingestion automation

## Test Plan

- Verify the repo can support a Cloudflare-style local development flow without
  depending on the current Vite-to-local-Fastify proxy shape as the production
  mental model.
- Verify preview and production hosting assumptions are documented clearly
  enough to implement without reopening the core hosting decision.
- Verify extracted server-side responsibilities can be tested through reusable
  domain logic and targeted integration coverage rather than tightly coupling
  tests to hosting glue.
- Verify frontend route and API expectations are documented for Cloudflare
  deployment, including direct URL access behavior.
- Verify the price-data decision is documented clearly enough that later work
  preserves the separation between:
  - canonical card data
  - mutable price data
  - scheduled refresh responsibility

## Assumptions

- The current hosting decision is locked to `Cloudflare Pages + Functions`.
- Card search remains API-first even though browser-only search is technically
  feasible at the current project scale.
- A future scheduled Worker for price refresh is expected, but it is a
  separate later concern and not part of this refactor stage.
- Future price storage should be handled as a separate public snapshot layer,
  not by mutating canonical card assets in place.
- This stage is satisfied by producing the plan document and aligning later
  implementation against it, rather than by bundling unrelated code changes
  into the same planning step.
