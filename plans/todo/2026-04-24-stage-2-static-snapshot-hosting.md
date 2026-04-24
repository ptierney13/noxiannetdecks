# Stage 2 Static Snapshot Hosting

## Summary

Stage 2 takes the fixed dataset and snapshot artifacts from Stage 1 and turns
 them into a passable public site with automatic deployment. The goal is a real
 public URL, preview deploys for changes, and a production deploy flow that
 reads only static exported data.

## Key Changes

- Add a read-only metagame frontend slice that consumes exported snapshot files
  rather than a live deck API.
- Keep hosting independent from the local archive:
  - local tooling exports snapshot artifacts
  - artifacts are committed/published
  - hosting serves those artifacts directly
- Support the agreed first public page set:
  - metagame overview
  - legend detail
  - event listing/detail
  - deck detail
- Use GitHub-connected hosting with:
  - preview deployments for branches/PRs
  - production deploys from the main branch
- Surface dataset freshness and coverage metadata in the UI so the site clearly
  communicates when the snapshot was generated.
- Keep manual publish as the initial refresh model; no scheduled ingestion yet.

## Test Plan

- Verify preview deployments render the current committed snapshot artifacts.
- Verify production deploy does not require any local services or local files at
  runtime.
- Verify each public page renders from the exported snapshot contract and fails
  clearly when expected snapshot inputs are missing.
- Verify dataset freshness/coverage metadata appears in the hosted UI.

## Assumptions

- Static hosting is the first public deployment target.
- The initial hosted site is read-only and snapshot-backed.
- Public deck intake is still deferred at this stage.
- A real hosted database is not required for the first public launch.
- Search beyond the agreed metagame/event/deck browsing flow can wait until
  after the snapshot-backed site is proven.

## Future Database Addendum

- If a hosted database is introduced later, it should become the source of
  truth for imports and rollups, not the direct runtime dependency for every
  metagame page.
- Hot public pages should remain snapshot-backed or heavily cached to avoid
  expensive per-request analytics.
