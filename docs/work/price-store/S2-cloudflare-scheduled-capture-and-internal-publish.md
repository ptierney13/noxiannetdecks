# Price Store Stage 7 Cloudflare Hosted Queue Pipeline

> Status: plan

## Summary

Implement Stage 7 of the `price-store` initiative by moving the existing
JustTCG refresh flow into a Cloudflare-hosted, queue-driven runtime with five
clear responsibilities:

1. a discovery worker that determines the full page count and enqueues bounded
   ingestion chunks
2. an ingestion worker that consumes one chunk at a time and persists raw page
   payloads into D1
3. a cook worker that converts the completed raw batch into relational
   publishable truth
4. a publish worker that writes the finished site-serving snapshot state
5. a maintenance worker that trims old run data after a newer KV snapshot has
   aged in successfully

This Stage 7 plan supersedes the earlier two-worker capture/publish hosted
shape. The Stage 7.1 local D1 work remains useful as context, but earlier Stage
7.1 and Stage 7.2 planning assumptions are not binding restrictions for the
current architecture.

The intended result is a fully hosted pipeline where Cloudflare schedules
discovery and maintenance, queues mediate multi-step work, D1 tracks shared
run state across all phases, and the published frontend contract remains the
same shape introduced in Stages 5 and 6.

Because there is no production data worth preserving yet, Stage 7 may make
breaking D1 schema changes as needed. Backward compatibility for persisted
price-store data is explicitly not a requirement, though the plan must still
cover the exact D1 migration and Cloudflare configuration updates required.

This stage should be executed as four explicit sub-stages:

1. **Stage 7.1** - retain as completed historical local-validation work, but do
   not treat its architecture details as a binding constraint on the new queue
   pipeline
2. **Stage 7.2** - implement and roll out the queue-based hosted runtime with
   discovery, ingestion, cook, publish, and maintenance workers
3. **Stage 7.2.1** - automate hosted deployment from checked-in repo state
   after the manual rollout is proven once
4. **Stage 7.3** - remove the old price method only after the new path has been
   validated and accepted

The dedicated sub-stage documents for fresh implementation windows are:

- [S4-live-d1-worker-rollout.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/work/price-store/S4-live-d1-worker-rollout.md)
- [S3-deploy-automation.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/work/price-store/S3-deploy-automation.md)
- [S5-old-price-method-removal.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/work/price-store/S5-old-price-method-removal.md)

Key implementation details now live in the Stage 7.2 plan, which is the
authoritative current-stage document for the hosted runtime design.
