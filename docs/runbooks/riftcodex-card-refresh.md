# Riftcodex Card Refresh

This runbook describes the repeatable local process for refreshing canonical
Riftbound card data from Riftcodex and shipping it through the existing
Cloudflare Pages deployment flow.

## Summary

Canonical card data currently lives in:

- `card_store/data/cards.json`

The hosted API bundles that file at deploy time. A card refresh therefore does
not require a Cloudflare database, KV namespace, Worker, or dashboard-side
resource change. The refresh is a normal branch, review, push, and Pages deploy.

## Preflight

1. Start from a clean branch or clean worktree based on `origin/main`.
2. Check current local status:

   ```sh
   git status --short
   ```

3. Inspect Riftcodex set coverage:

   ```sh
   curl.exe -s "https://api.riftcodex.com/sets"
   ```

4. Compare the live set list to the import finish policy in:

   - `card_store/src/data/riftcodex-import-policy.ts`

## Finish Policy

Riftcodex does not currently expose a direct canonical finish-availability
contract for the site. The importer keeps a small explicit set policy:

- `DUAL_FINISH_SET_IDS`: normal booster sets whose base Common/Uncommon records
  should receive both `nonfoil` and `foil`
- `FOIL_ONLY_OR_SPECIAL_SET_IDS`: promo, judge, proving-ground, or other special
  sets that should not receive base-set dual finishes

When Riftcodex adds a likely normal booster set, update
`DUAL_FINISH_SET_IDS` before importing. When Riftcodex adds a special set,
update `FOIL_ONLY_OR_SPECIAL_SET_IDS` instead.

The importer fails with a clear message when it sees a likely booster set that
has not been classified.

## Refresh

From the repository root:

```sh
npm run import:riftcodex -w @noxiannet/card-store
```

Review the printed set summary and the resulting data diff:

```sh
git diff -- card_store/data/cards.json
```

Useful sanity checks:

- new expected set codes are present
- card count increased or changed as expected
- existing set counts are not unexpectedly zeroed
- special treatments still have the expected finish availability
- Riftcodex source quirks, such as subtitle-only duplicate Legend rows beside
  full champion/title Legend rows, were removed by the importer

## Verification

Run focused backend verification:

```sh
npm run test -w @noxiannet/card-store
npm run build -w @noxiannet/card-store
```

For a full release candidate, run the root checks too:

```sh
npm test
npm run build
```

## Preview Deployment

Push the refresh branch to `origin`. Cloudflare Pages should create a branch
preview deployment for the `noxiannetdecks` project.

Compute the expected preview URL with:

```sh
npm run preview:url -- <branch-name>
```

The URL is expected, not proof of a completed deployment. Confirm the deployment
status in Cloudflare Pages before treating the preview as live.

Recommended preview checks:

- `/api/health`
- `/api/metadata`
- `/api/cards?q=s:<new-set-code>`
- `/cards?q=s:<new-set-code>` in the app
- a card-detail page for at least one new set card

## Publish

After preview validation, publish through the normal repo release flow. Do not
merge directly to `main` unless the task explicitly asks for production
publishing.

## Update Triggers

Update this runbook when:

- canonical card data stops being bundled from `card_store/data/cards.json`
- Riftcodex changes its API shape or finish metadata contract
- card refreshes move to a hosted automation instead of local branch updates
- Cloudflare preview or production deployment behavior changes
