# Price Store Agent Notes

Read this file before editing anything under `price_store/`.

## Scope

These notes apply to raw capture, canonicalization, hosted D1 processing, and
published price artifacts.

## Next Initiative Verification Start

The next initiative that does implementation work under `price_store/` should
begin by verifying the contents of:

- `price_store/AGENTS.md`
- `price_store/CLAUDE.md`
- `price_store/README.md`
- `price_store/src/sources/tcgplayer/README.md`
- `price_store/src/sources/justtcg/README.md`
- `docs/reference/cloudflare-deployment/price-pipeline.md`
- `docs/reference/cloudflare-deployment/price-published-data.md`

## Local Price Data

**Do not use `hosted:local:refresh` to get local price data for development.**
That path runs the full JustTCG capture pipeline and burns API budget (100
requests/day free plan).

The canonical way to refresh local price data is:

```bash
npm run pull:live:snapshot -w @noxiannet/price-store
```

This fetches the current published snapshot from `https://noxiannetdecks.com/data/prices-d1/`
and writes it to `frontend/public/data/price_snapshots/<date>/`. After running,
update `ACTIVE_PRICE_PATH_PREFIX` in `frontend/src/lib/priceData.ts` to match
the printed path prefix.

`hosted:local:refresh` is reserved for testing the full pipeline end-to-end
(capture → cook → publish) when the pipeline itself needs development work.

## Key Invariants

- Mutable operational data lives under the repo-local `.price_data/` store by
  default, not inside the tracked workspace tree.
- Raw source payloads are durable source snapshots and should not be edited by
  hand.
- Source-specific behavior belongs under `src/sources/`.
- Canonical, published, and hosted layers have distinct responsibilities and
  should not be collapsed together casually.
- Local development price data comes from the live production endpoint, not from
  a local JustTCG API run. See Local Price Data section above.

## Task Routing

| If you are doing... | Read this first |
| --- | --- |
| TCGPlayer source work | `src/sources/tcgplayer/README.md`, `src/sources/tcgplayer/analysis.md` |
| JustTCG source work | `src/sources/justtcg/README.md`, `src/sources/justtcg/analysis.md` |
| Canonical repository or schema work | `src/canonical/` |
| Published artifact contract work | `src/published/` |
| Hosted worker or D1 workflow changes | `src/hosted/`, `migrations/d1/` |
| Local bootstrap or env setup | `src/bootstrap.ts`, `src/local-env.ts`, `README.md` |
| Active initiative planning | `../docs/work/price-store/README.md`, `../docs/work/price-store/work-status.json` |
| Historical initiative context | `../docs/archive/work/price-store/` |

## Verification

- Keep source-specific tests under `test/` aligned with the changed source or
  layer.
- Bootstrap and structural changes should keep `test/bootstrap.test.ts`
  passing.
