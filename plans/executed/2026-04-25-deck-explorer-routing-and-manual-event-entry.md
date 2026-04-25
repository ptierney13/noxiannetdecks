# Deck Explorer Routing And Manual Event Entry

## Summary

Replace the temporary `Metagame Pilot` tab with a `Deck Explorer` section and
rework the site into a canonical multi-page app with stable sub-URLs for every
top-level area. The top bar should distinguish primary browsing areas from a
`Tools` section that contains the utility pages. The first data phase for
`Deck Explorer` should not depend on public-source intake yet. Instead, it
should start from manually entered events and their decks so the browsing
model, page structure, and shared data shape can be proven before automated
acquisition work begins.

This plan intentionally separates three concerns:

1. multi-page frontend routing and navigation
2. a manual event/deck data entry path for initial explorer content
3. later public-source intake, which remains subject to the analysis-first
   source architecture already documented elsewhere

## Key Changes

- Replace the `Metagame Pilot` tab label and feature area with `Deck Explorer`.
- Rework the frontend into a route-aware multi-page app where every top-level
  tab has its own stable sub-URL and no non-root page redirects to card search.
- Define the first `Deck Explorer` browsing model around two top-level views:
  - `By Event`
  - `By Legend`
- Start `Deck Explorer` content with manually entered events and decks rather
  than automated public-source pulls.
- Seed the first legend directory from the existing card catalog so legend
  pages are browsable immediately even before any manual event data exists.
- Keep deck and event browsing compatible with the longer-term intake plan by
  using a shared event/deck data shape that can later be populated by source
  transforms.

### Route Structure

- `/cards`
  - card search home
- `/deck-explorer`
  - `Deck Explorer` landing page
- `/deck-explorer/events`
  - event index view
- `/deck-explorer/events/:eventId`
  - single event page
- `/deck-explorer/events/:eventId/decks/:deckId`
  - deck detail scoped to an event
- `/deck-explorer/decks/:deckId`
  - canonical deck detail route when an event-scoped route is not required
- `/deck-explorer/legends`
  - legend index view
- `/deck-explorer/legends/:legendSlug`
  - legend detail page
- `/tools/tier-list`
  - tier list generator
- `/tools/sealed-pools`
  - sealed simulator

### Deck Explorer View Model

- `By Event`
  - shows all imported events
  - each event links to its event page
  - event page lists every entered deck for that event
  - event deck rows link to deck detail pages
- `By Legend`
  - shows legends grouped by set
  - within each set, legends are ordered consistently by color/domain grouping
  - each legend links to a legend page showing all matching imported decks
- `Deck Detail`
  - can be reached from either event view or legend view
  - supports both `/deck-explorer/events/:eventId/decks/:deckId` and
    `/deck-explorer/decks/:deckId`

### Manual Entry Phase

- The first usable `Deck Explorer` dataset should come from manually maintained
  event/deck documents rather than public-source pull code.
- Manual entry should happen through hand-authored source files, not a public
  submission flow and not an in-app admin form in this phase.
- The manual entry shape should support:
  - events
  - legend assignment
  - deck lists
  - event-specific deck membership
  - enough metadata for event and legend browsing
- This manual phase is the bridge between the current empty state and future
  source-based intake.

### Data Organization

- Start with a frontend-local manual-entry module at
  `frontend/src/deck-explorer/manualData.ts` so events and decks can be entered
  by hand without waiting on source-intake code.
- Keep the manual-entry shape event-centric and compatible with later shared
  event input processing, even though this first implementation reads the local
  module directly.
- Treat the frontend-local manual module as a bridge step, not the final
  ingestion/storage architecture.

### Navigation And URL Behavior

- Replace tab-local state switching with route-aware navigation.
- The top bar should separate:
  - primary destinations such as `Cards` and `Deck Explorer`
  - a `Tools` section containing `Tier List` and `Sealed Pools`
- Each top-level destination and tool entry should navigate to its own URL
  instead of mutating a single-page state variable.
- No sub-URL should silently redirect to card search.
- The root route should either:
  - become a lightweight home page, or
  - intentionally choose a neutral default route without pretending every page
    is card search
- Browser back/forward should work naturally for `Deck Explorer` event, legend,
  and deck drilldowns.

## Test Plan

- Verify each top-level area renders from its own stable route:
  - `/cards`
  - `/deck-explorer`
  - `/tools/tier-list`
  - `/tools/sealed-pools`
- Verify loading a non-root route directly does not redirect to card search.
- Verify the top bar presents `Tier List` and `Sealed Pools` under a `Tools`
  section rather than as peer primary tabs to `Deck Explorer`.
- Verify `Deck Explorer` supports both event-first and legend-first navigation.
- Verify event pages link to deck detail pages with event-scoped URLs.
- Verify legend index pages group legends by set and order them consistently
  within each set.
- Verify browser back/forward works across top-level tabs and nested deck
  explorer pages.
- Verify the manual-entry dataset is sufficient to populate event index, legend
  index, event detail, legend detail, and deck detail pages.

## Assumptions

- This phase is about proving the site structure and browsing model, not
  automated public-source intake.
- Manual entry is local and developer-maintained for now; public deck intake
  remains out of scope.
- The routing change is foundational and should happen before more deck
  explorer UI grows around the temporary `Metagame Pilot` structure.
- The first implementation may read directly from a local frontend manual data
  file as long as the event/deck shape stays compatible with later source
  processing.
- The `Deck Explorer` data model should stay compatible with the documented
  shared event input architecture so future source-based intake does not force a
  second redesign.
