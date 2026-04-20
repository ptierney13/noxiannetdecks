# Card Store

Backend service for Riftbound card knowledge and search.

The service owns:

- Versioned canonical card JSON in `data/cards.json`
- Card record validation
- Storage/source loading through a `CardSource` / `CardRepository` boundary
- Query parsing, diagnostics, normalization, and evaluation
- Fastify API routes under `/api`

The canonical card JSON schema, field reasons, and invariants are documented in
[`docs/card-schema.md`](docs/card-schema.md).

## Local Commands

From the repository root:

- `npm.cmd run dev:api`
- `npm.cmd test -w @noxiannet/card-store`
- `npm.cmd run build -w @noxiannet/card-store`

Refresh local canonical data with:

```sh
npm.cmd run import:riftcodex -w @noxiannet/card-store
```

Riftcodex is an unofficial public data source. Runtime search uses the local JSON file through `JsonFileCardSource` by default. A future REST-backed card source should implement `CardSource` and return canonical `CardRecord` JSON, leaving parser and evaluator code unchanged.
