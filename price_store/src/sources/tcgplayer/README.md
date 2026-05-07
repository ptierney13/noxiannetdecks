# TCGplayer Source Notes

This folder contains the Stage 2 source-approval notes and the minimal sample
capture workflow for TCGplayer.

## Current Stage Boundary

Stage 2 does not implement a live marketplace pipeline. It does three narrower
things:

- documents the current viable TCGplayer access path and its constraints
- preserves representative raw sample payloads under the shared Stage 1
  capture conventions
- records the fields Stage 3 must evaluate before any normalized schema is
  locked

Affiliate setup is intentionally deferred until the final project stage. This
stage only preserves stable product-linking data that later stages may need.

## Commands

- `npm run import:tcgplayer:samples -w @noxiannet/price-store`
- `npm run import:tcgplayer:samples -w @noxiannet/price-store -- <manifest-path>`

With no explicit manifest path, the command imports the bundled
docs-derived reference examples from `price_store/fixtures/tcgplayer/`.

## Operator Guidance

- Use the bundled manifest when you want a stable, repo-known sample set for
  schema discussion and tests.
- Use a custom manifest when an operator has existing TCGplayer credentials or
  exported payloads and wants to preserve additional representative samples
  under `.price_data/raw/`.
- Review [analysis.md](./analysis.md) before attempting any live or
  credential-backed capture flow.
