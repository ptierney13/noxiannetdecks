# DRAFT: Price Store Stage 7.2.1 Deploy Automation

## Draft Status

This is a draft summary plan for Stage 7.2.1. It must be finalized and
manually approved before implementation begins.

When Stage 7.2.1 is completed, refresh Stage 7.3 and later `price-store`
drafts with the final deploy workflow, secret ownership model, and any CI
constraints that later stages must assume.

## Summary

Stage 7.2.1 automates deployment of the queue-based Stage 7.2 hosted
Cloudflare path after the manual rollout has already been proven once.

This is a follow-on operational hardening stage, not a replacement for the
current manual setup. Its goal is to move the repo from a dashboard-plus-local-
shell deployment process toward a checked-in, repeatable release flow.

## Pertinent Details So Far

- Stage 7.2 currently assumes:
  - hosted workers are defined in repo-managed Wrangler config files
  - D1, KV, and Queue identifiers may be checked into the repo where
    appropriate
  - secrets such as `JUSTTCG_API_KEY` remain external to the repo
  - Cloudflare account-side resources and bindings still require manual setup
  - `wrangler deploy`, queue configuration, and `wrangler d1 migrations apply`
    are currently operator-invoked steps
- The current hosted path should depend on:
  - one D1 database for shared run, raw, cooked, and publish truth
  - one KV namespace for published `prices-d1` artifacts
  - discovery, ingestion, cook, publish, and maintenance workers named
    `noxian-price-discovery`, `noxian-price-ingestion`,
    `noxian-price-cook`, `noxian-price-publish`, and
    `noxian-maintenance`
  - ingestion, cook, and publish queues
  - Pages bindings for the hosted read path
- The manual rollout remains the active path until this stage is finalized and
  accepted.

## Expected Outputs

- a checked-in deploy automation workflow for the hosted workers
- a repeatable migration strategy for D1
- explicit separation of preview versus production deployment behavior
- updated operator docs that distinguish one-time Cloudflare setup from normal
  day-to-day deploy flow

## Likely Scope

- add CI or equivalent automation for multi-worker `wrangler deploy`
- decide whether D1 migrations and queue configuration updates run
  automatically, manually via CI, or through a gated release job
- document required CI secrets and their ownership
- reduce ongoing dependence on manual local deploy commands for routine changes

## Explicit Non-Goals

- no removal of the old price method
- no major architecture redesign beyond what Stage 7.2 already established
- no attempt to fully eliminate all one-time dashboard setup work

## Questions To Finalize In The Real Stage Plan

- whether deploy automation should live in GitHub Actions or another runner
- whether D1 migrations should be automatic on merge, manually dispatched, or
  protected behind an approval gate
- how preview environments should provision or share D1, KV, and Queue
  resources
- which branch or tag events are allowed to deploy production workers

## Test Plan

- verify CI can deploy the discovery, ingestion, cook, publish, and maintenance
  workers from the checked-in repo state
- verify CI can run or gate D1 migrations and queue configuration safely
- verify production deploy automation uses the intended Cloudflare account,
  worker names, bindings, and queue consumers
- verify operator docs clearly separate bootstrap setup from routine deploys

## Assumptions

- the Stage 7.2 manual deployment path will be completed and validated before
  Stage 7.2.1 begins
- long-term maintenance will benefit from deploys happening from checked-in
  state rather than a local authenticated shell
