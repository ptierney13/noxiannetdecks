# Public Metagame Site Roadmap

## Summary

This document records the agreed big-picture direction for the public Riftbound
metagame site so later implementation stages stay aligned with the decisions
already made.

The rollout is intentionally staged:

1. Establish a durable local deck/event dataset and snapshot contract.
   This includes proving the UX locally with a one-event approved-source pilot.
2. Publish a passable public site from fixed static artifacts with automatic
   preview/production deployment.
3. Add ingestion and refresh automation only after the dataset and public
   artifact shape are stable.

Source intake should follow a separate analysis-first architecture:

- each public source gets its own source folder
- each source folder requires a written analysis before pull code exists
- each source transforms into a shared event input format
- a separate processing layer converts the shared event input into canonical
  storage

The public site should remain read-heavy and precomputed. Metagame
calculations are generated systematically during rollups and snapshot export,
never on page load.

The acquisition boundary is intentionally conservative:

- automated collection is limited to approved green sources
- blocked or anti-bot-protected sources are out of scope
- third-party aggregators may support manual review, but are not canonical
  automated inputs

## Key Changes

- Treat the product as a read-heavy data publication system, not a live
  user-deck app.
- Keep the source-of-truth archive repo-local and git ignored first, with raw
  payloads preserved and no image/media collection.
- Keep the intake architecture analysis-first so source legality/reasonableness
  is documented before code is written.
- Model provenance and review state directly in the canonical dataset so future
  moderation and source conflicts stay explicit.
- Use publishable static JSON snapshots as the public contract for the first
  hosted release.
- Validate the public page shapes locally before introducing hosting concerns.
- Treat the temporary metagame pilot as disposable scaffolding, not the final
  navigation model.
- Use a route-based `Deck Explorer` shell and a hand-authored local manual data
  module as the first browsing implementation before source-intake work begins.
- Keep the first public site independent of the user's local machine at
  runtime; local work produces artifacts, but the hosted site reads committed
  static data.
- Preserve room in the canonical model for future sub-archetypes and later
  user-deck support, but do not block the metagame site on those features.
- Use manual publish at first:
  - local capture/normalize/rollup/export
  - commit generated artifacts
  - GitHub-connected hosting auto-deploys preview/prod
- Add refresh automation last, after the dataset model and snapshot interface
  have proven stable.

## Planned Public Scope

- Multi-page top-level navigation with stable URLs for:
  - card search
  - deck explorer
- A `Tools` section with stable URLs for:
  - `/tools/tier-list`
  - `/tools/sealed-pools`
- Metagame overview with filters for:
  - Set 1
  - Set 2
  - Set 2.1
  - Set 3
  - China
  - NA
  - EU
  - RoW
  - Non-China
- Legend detail pages with:
  - same top-level filters
  - canonical deck
  - recent successful decks
  - card inclusion percentages split by champion unit, battlefields, runes, and
    main deck cards
- Event listing/detail pages with:
  - same top-level filters
  - size and prestige filters
  - placement rows where missing decklists are labeled but not linked
- Deck detail pages for decks that have an actual list
- A `Deck Explorer` browsing layer with:
  - by-event navigation
  - by-legend navigation
  - stable event and deck URLs

## Test Plan

- Keep each stage independently testable before moving to the next.
- Do not begin the next stage until the previous stage's data model, contracts,
  and deployment assumptions are validated.
- The local `Deck Explorer` slice is now expected to render through real app
  routes and a hand-authored manual event/deck data file before any further
  source-intake work.
- Verify hosted pages only read precomputed artifacts and never depend on live
  metagame calculations.

## Assumptions

- The public site starts read-only.
- Public deck intake and user submission workflows are intentionally deferred to
  a later roadmap step.
- The initial hosted release uses static snapshots rather than a live hosted
  database.
- The first release does not depend on the user's personal machine being
  online.
- Long-term scaling should favor precomputed rollups and cached/static reads
  rather than per-request analytics.
