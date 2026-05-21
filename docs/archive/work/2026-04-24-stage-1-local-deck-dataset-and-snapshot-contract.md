# Stage 1 Local Deck Dataset And Snapshot Contract

## Summary

Create the Stage 1 deck/event data foundation for the public metagame site.
This work establishes a storage-aware deck data workspace, a git-ignored
repo-local data-directory contract, canonical schemas for deck/event records,
typed snapshot contracts for later static hosting, and explicit provenance /
review-state fields in the canonical dataset model. The implementation
explicitly excludes image/media collection and restricts automated collection to
approved green sources. Stage 1 now also includes a local approved-source
metagame pilot bundle for one TopDeck event so the app can render a real
overview, legend detail, event detail, and deck detail flow locally.

## Key Changes

- Add a new `deck_store` workspace for Stage 1 deck/event data modeling.
- Define canonical dataset schemas for events, decks, legends, source captures,
  provenance, review state, and snapshot artifacts.
- Resolve a git-ignored repo-local data directory for the raw archive,
  canonical dataset, and exported snapshots.
- Document the Stage 1 source policy so only approved green sources are used
  for automated capture.
- Treat third-party aggregators such as RiftDecks as manual review references
  only, not canonical automated inputs.
- Record archive sizing expectations and enforce a text-only collection policy.
- Seed a repo-local pilot dataset and export bundle for `CCS Riftbound
  $10,000 Tournament` using approved public TopDeck pages only.
- Expose that pilot bundle through the local app so Stage 1 ends with a
  viewable metagame slice instead of only backend contracts.

## Test Plan

- Run `npm.cmd run test -w @noxiannet/deck-store`.
- Run `npm.cmd run build -w @noxiannet/deck-store`.
- Run `npm.cmd run seed:pilot-metagame -w @noxiannet/deck-store`.
- Run `npm.cmd test`.
- Run `npm.cmd run build`.

## Assumptions

- The first archive is local-only and does not yet perform live collection or
  public hosting.
- Raw source payloads must be preserved so the canonical dataset can be rebuilt
  without re-scraping.
- Archive storage should remain text-only and avoid downloading images or other
  bulky media assets.
- Deck provenance is modeled directly on the deck record, with event placement
  details nested under the deck source where applicable.
- Public deck intake is not part of Stage 1 or the first public site stages.
- Third-party aggregators may inform manual review later, but they are not
  approved automated collection sources under the Stage 1 policy.
- The first locally viewable metagame slice may use a single approved public
  event if that is enough to validate the end-to-end UI and dataset contract.
