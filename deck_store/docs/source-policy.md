# Stage 1 Source Policy

This document records the approved acquisition boundary for the Stage 1 deck
dataset.

## Operating Rule

- Only take green-source actions.
- Do not automate collection from sites that block, throttle, or otherwise
  signal that crawling is not permitted.
- Treat third-party aggregators as manual review references only, not canonical
  dataset inputs.

## Source Classes

### Green

Approved for collection when the page is publicly accessible without bypassing
technical restrictions:

- official Riot policy/rules/event context pages
- direct organizer or host event pages
- public registration/result pages such as TopDeck event pages
- direct public deck text/list pages from organizers or other first-party event
  sources

### Yellow

Allowed only as manual secondary references:

- RiftDecks
- Riftbound.gg
- RiftRank
- RiftManager
- similar third-party aggregator or editorial sites

Yellow sources may be used by a human reviewer to spot-check a specific record,
but they must not be:

- automated capture targets
- canonical source-of-truth inputs
- programmatic validation dependencies
- bulk mirrored or indexed locally

### Red

Not allowed for Stage 1 collection:

- blocked or anti-bot-protected routes
- sources that require bypassing technical restrictions
- wholesale third-party archive mirroring
- any workflow that depends on a competitor archive to validate every record

## Canonical Dataset Rules

- Every canonical event/deck record must carry provenance describing its
  approved primary evidence.
- Review state must be explicit so conflicts or incomplete records do not get
  silently treated as verified.
- Manual-reference-only sources may be noted in provenance evidence, but they
  must not point at stored raw captures.

## Future Intake Boundary

- Public deck intake is out of scope for the current public site stages.
- If intake is added later, submissions should still be reviewed against
  primary approved evidence first.
- Aggregator mismatches can create manual review tasks, but must not become
  automatic source-of-truth enforcement.
