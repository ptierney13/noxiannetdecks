# Card Store

Backend service for Riftbound card knowledge and search.

The service owns:

- Versioned canonical card JSON in `data/cards.json`
- Card record validation
- Storage/source loading through a `CardSource` / `CardRepository` boundary
- Query parsing, diagnostics, normalization, and evaluation
- Reusable API service logic in `src/api/service.ts`
- Fastify API routes under `/api` for local Node development
- A Cloudflare Pages Functions adapter under `../functions/api/[[route]].ts`

The Cloudflare adapter bundles canonical card data directly from the repo.
Local metagame pilot exports remain optional and continue to return `404` in
the hosted adapter until a publishable snapshot is wired in.

The canonical card JSON schema, field reasons, and invariants are documented in
[`docs/card-schema.md`](docs/card-schema.md).

## Local Commands

From the repository root:

- `npm run dev:api`
- `npm run test -w @noxiannet/card-store`
- `npm run build -w @noxiannet/card-store`

Refresh local canonical data with:

```sh
npm run import:riftcodex -w @noxiannet/card-store
```

Riftcodex is an unofficial public data source. Runtime search uses the local JSON file through `JsonFileCardSource` by default. A future REST-backed card source should implement `CardSource` and return canonical `CardRecord` JSON, leaving parser and evaluator code unchanged.
