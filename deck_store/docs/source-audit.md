# Stage 1 Source Audit

This audit freezes the initial assumptions for Stage 1 before any importer or
dataset export logic is built.

## Goals

- Find the best green-source backbone for competitive Riftbound event coverage.
- Identify likely supplemental green sources for event metadata and deck text.
- Classify third-party aggregators as manual references rather than collection
  targets when they are not clearly green.
- Keep the archive text-only: HTML, JSON, and extracted metadata only.

## Initial Findings

### TopDeck

- Strong candidate for approved public event metadata capture.
- Public event pages expose dates, locations, organizers, structure, and other
  event details without relying on third-party aggregator summaries.
- Public deck pages can support a curated pilot slice when the deck pages are
  public and accessible without bypassing restrictions.
- Useful for Stage 1 event identity, a first local metagame pilot, and coverage
  baselines even before broader deck acquisition is solved.

Reference:

- https://topdeck.gg/

### Organizer / Host Pages

- Preferred public source when an organizer exposes event detail or deck text
  directly.
- Event pages often contain the cleanest source-of-truth labels for organizer,
  venue, dates, and registration links.
- These pages should be treated as green only when the content is public and
  accessible without bypassing technical restrictions.

Reference:

- https://ccs-houston.com/events/ccs-riftbound-25000-invitational-qualifier-1/

### Official Riot Pages

- Good green source for policy, rules, and public event/result context.
- Not expected to provide canonical public decklists.
- Useful for source policy, metagame-window labeling context, and future rules
  alignment.

References:

- https://developer.riotgames.com/docs/riftbound
- https://developer.riotgames.com/policies/riftbound

### Third-Party Aggregators

- RiftDecks, Riftbound.gg, RiftRank, and RiftManager are valuable ecosystem
  references, but they are not approved automated capture targets for Stage 1.
- They should be treated as manual review aids only.
- If a source blocks or partially blocks scripted collection, that is enough to
  keep it out of the approved automated acquisition set.

References:

- https://riftdecks.com/
- https://riftbound.gg/
- https://riftrank.com/
- https://riftmanager.app/

## Stage 1 Audit Conclusion

- Do **not** use third-party aggregators as the automated backbone source.
- Treat approved public event pages and direct organizer pages as the green
  acquisition path for Stage 1.
- Preserve room in the schema for manual-reference-only evidence so future
  moderators can note corroboration without making those sites canonical
  sources.

## Follow-Up Audit Checklist

- Capture a small sample of TopDeck and organizer event pages to confirm the
  public green-source workflow.
- Keep the current local pilot limited to one approved-source TopDeck event
  until broader organizer-backed coverage is validated.
- Record which event fields can be sourced directly from approved public pages.
- Keep third-party aggregator spot checks manual and outside automated capture.
- Record missing events, missing decklists, and conflicting event metadata in
  the local audit layer once collection begins.
