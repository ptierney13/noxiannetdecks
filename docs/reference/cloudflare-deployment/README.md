# Cloudflare Deployment Architecture

## Summary

This folder describes the live Cloudflare-hosted production shape for the repo.

The current deployment includes:

- a Cloudflare Pages-hosted web app under `noxiannetdecks`
- a Pages Functions API surface that serves `card_store` logic
- a hosted `price_store` worker pipeline backed by D1 and KV
- a published `/data/prices-d1/*` contract consumed by both the frontend and
  the API layer

The core project identity lives in
[`cloudflare-pages.config.json`](../../../cloudflare-pages.config.json):

- project name: `noxiannetdecks`
- production branch: `main`
- production URL: `https://noxiannetdecks.com`

## Preview Links

Branches pushed to `origin` are automatically deployed by Cloudflare Pages.

To find the expected preview URL for a branch, use the repo-local
[noxiannet-preview-url skill](../../../.agents/skills/noxiannet-preview-url/SKILL.md).

That skill captures:

- the branch-alias rule used by this repo
- the expected preview URL shape
- the caveat that derived preview URLs are not proof that a deployment is live

## Contents

These docs are detailed references for subparts of the Cloudflare deployment
architecture:

- [card-data.md](card-data.md): the current shipped card-data model bundled
  into the hosted API
- [pages-api.md](pages-api.md): public `/api/*` surface and its `card_store`
  boundary
- [pages-app.md](pages-app.md): frontend hosting, build output, and same-origin
  assumptions
- [price-pipeline.md](price-pipeline.md): hosted `price_store` workers, queues,
  and storage roles
- [price-published-data.md](price-published-data.md): the published
  `prices-d1` artifact contract and its consumers

## Boundaries

This folder is for durable architecture and runtime shape.

Do not use it for:

- rollout history
- one-time migration notes
- operator procedures

Those belong in archived work docs or runbooks instead.

## Update Triggers

Update this README when:

- the set of Cloudflare-hosted components changes
- the Cloudflare project identity or preview-link behavior changes
- a subdoc in this folder is added, removed, renamed, or changes scope
