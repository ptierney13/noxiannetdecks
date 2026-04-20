# Build Card Store Query Engine And Search Website

## Summary

Build `card_store` as a TypeScript/Node backend with an internal query-engine layer, plus a Vite React website in `frontend` for direct text-query search. The website shows a query input, a detailed query-language feature chart, and a scrollable four-column desktop card image grid with every matching card. No clickable query builder and no pagination are included in this pass.

## Key Changes

- Added root npm workspace tooling for `card_store` and `frontend`.
- Implemented `card_store` with Fastify, TypeScript, Zod, Vitest, TSX, Chevrotain-backed tokenization, and an internal parser/evaluator query layer.
- Seeded local canonical JSON card data from the unofficial Riftcodex API and retained official Riftbound URLs as provenance references.
- Exposed `/api/health`, `/api/cards`, `/api/cards/:id`, `/api/query/parse`, `/api/query/features`, and `/api/metadata`.
- Built a Vite React frontend with button-driven query search, parse diagnostics, the query-language feature chart, and a responsive image grid that is four cards wide on desktop.

## Query Language Features

| Feature | Syntax examples | Behavior |
|---|---|---|
| Free text | `dragon`, `"Void Gate"` | Searches name, subtitle, rules text, keywords, and tags. |
| Field contains | `name:jinx`, `text:"draw a card"` | Case-insensitive normalized contains match. |
| Exact field match | `name="Void Gate"`, `set=OGN` | Exact normalized match. |
| Field aliases | `n:jinx`, `o:draw`, `t:unit`, `d:body`, `s:OGN`, `r:rare`, `k:dragon` | Aliases map to name, text, type, domain, set, rarity, and keyword. |
| Numeric comparisons | `cost>=3`, `might<5`, `power=2` | Supports `=`, `<`, `<=`, `>`, `>=` on numeric fields. |
| Numeric aliases | `c>=3`, `m>4`, `p=1` | Aliases map to cost, might, and power. |
| Boolean AND | `type:unit domain:body`, `type:unit and domain:body` | Whitespace is implicit AND; `and` is explicit. |
| Boolean OR | `domain:body or domain:fury` | Matches either side. |
| Negation | `not type:gear`, `-rarity:common` | Excludes matching cards. |
| Grouping | `(domain:body or domain:fury) type:unit` | Parentheses control precedence. |
| Wildcards | `name:jin*`, `text:*dragon*` | Supports `*` in string values. |
| Missing values | `might:none`, `artist:none` | Matches null or empty field values. |
| Diagnostics | `cost>>3`, `(type:unit` | Returns useful parse and validation errors without crashing. |

## Test Plan

- Run `npm.cmd install`.
- Run `npm.cmd test`.
- Run `npm.cmd run build`.
- Verify `/api/health`, `/api/cards`, and the Vite frontend load from local dev servers.
- Run `git -c core.excludesfile=.git/info/exclude status -sb` and confirm only intended workspace, card_store, frontend, and plan files are pending.

## Assumptions

- Query processing is an internal `card_store` domain layer in v1, not a separate deployed service.
- The frontend calls the backend API; it does not reimplement query parsing client-side.
- This pass implements only the text-entry power-user UI plus documentation chart; the clickable query builder is deferred.
- Search is button-driven, with Enter as a shortcut; no live search while typing.
- Frontend results never paginate; returning all current Riftbound card matches is acceptable for v1 scale.
- Remote image URLs are stored in canonical JSON; image binaries are not committed.

