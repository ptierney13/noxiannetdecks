# lib — Shared Non-Domain Utilities

Shared React hooks, formatters, and data-loading helpers used across the
frontend. All exports are available through the barrel (`lib/index.ts`).
Import from the barrel, not from individual files.

**Import direction:** `lib` may not import from any other layer in this repo
(`app`, `features`, `ui-elements`, `data`, `pages`).

If you need functionality that is currently in `src/cardFormat.tsx` and not
yet in this directory, stop and ask before pulling it in — that file contains
legacy components and the split between what belongs here and what belongs
with those components was intentional.

---

## Files

### `useDebounce.ts`

A generic React hook that delays propagating a changing value until after a
quiet period has elapsed. Used for search inputs and any live-update pattern
that should not fire on every keystroke.

**Exports:**
- `useDebounce<T>(value: T, delayMs: number): T`

---

### `pathBuilders.ts`

Pure functions for constructing frontend URL path strings. Used by components
that need to build navigation links without coupling to TanStack Router's route
object API.

**Exports:**
- `buildCardDetailPath(cardId: string): string`
- `buildCardsSearchPath(query: string): string`
- `buildDeckExplorerEventPath(eventId: string): string`
- `buildDeckExplorerEventDeckPath(eventId: string, deckId: string): string`
- `buildDeckExplorerDeckPath(deckId: string): string`
- `buildDeckExplorerLegendPath(legendSlug: string): string`

---

### `priceData.ts`

The full price data subsystem: types, async loading with promise-level caching,
in-memory indexing by TCGPlayer ID, normalization, display formatting, and
TCGPlayer affiliate link construction.

**Types:**
- `PublishedPriceHistoryPoint` — a single price observation (`amount`, `observedAt`)
- `PublishedPriceRow` — a full price row including condition, printing, history, and current price
- `PublishedPriceManifest` — metadata for the published price snapshot
- `PublishedPriceSnapshot` — the full snapshot envelope containing all price rows
- `PublishedPriceIndex` — in-memory index built from a snapshot; includes a `rowsByTcgplayerId` map for fast lookup
- `TcgplayerAffiliateLinkOptions` — options for building a product-level TCGPlayer affiliate link
- `TcgplayerAffiliateSearchLinkOptions` — options for building a search-level TCGPlayer affiliate link

**Data loading:**
- `usePublishedPriceIndex(): { index: PublishedPriceIndex | null; status: "loading" | "ready" | "error" }` — React hook; loads and caches the price index for the active path prefix
- `loadPublishedPriceIndex(): Promise<PublishedPriceIndex>` — imperative loader using the active path prefix
- `loadPublishedPriceIndexForPath(pathPrefix: string): Promise<PublishedPriceIndex>` — imperative loader for a specific path prefix

**Querying:**
- `getPublishedRowsForCard(index: PublishedPriceIndex | null, tcgplayerId: string | null | undefined): PublishedPriceRow[]` — looks up all price rows for a card by TCGPlayer ID
- `resolveNearMintMarketPrice(rows: PublishedPriceRow[], preferredPrinting?: string | null): PublishedPriceRow | null` — finds the best near-mint price row, preferring the given printing
- `sortPriceRows(rows: PublishedPriceRow[]): PublishedPriceRow[]` — sorts rows by printing order then condition order

**Normalization and display:**
- `normalizePrinting(value: string | null | undefined): string` — normalises "nonfoil" / "non-foil" variants to "normal"
- `formatPrintingLabel(value: string | null | undefined): string` — human label for a printing ("Foil", "Non-foil", etc.)
- `formatUsdPrice(amount: number | null | undefined): string | null` — formats a number as a USD currency string

**TCGPlayer affiliate links:**
- `buildTcgplayerAffiliateLink(options: TcgplayerAffiliateLinkOptions): string | null` — product page affiliate link
- `buildTcgplayerAffiliateSearchLink(options: TcgplayerAffiliateSearchLinkOptions): string | null` — search page affiliate link

**Config:**
- `resolveActivePricePathPrefix(): string` — reads `VITE_PRICE_DATA_PATH_PREFIX` env var or falls back to the default D1 path

---

### `cardPresentation.tsx`

Card text normalisation, inline game symbol rendering, and card attribute
formatting. Provides the building blocks for displaying card data in
`ui-elements/` and `features/` components.

**Game constants:**
- `SYMBOL_MAP: Record<string, string>` — maps card-store shortcode keys (e.g. `rb_might`) to inline token syntax (e.g. `{T}`)
- `RIFTBOUND_REGIONS: Set<string>` — canonical set of Riftbound region names; used for typeline tag classification

**Types:**
- `InlineSymbolVariant` — `"white" | "black"` — controls which color variant of a symbol image is used
- `InlineSymbolSize` — `"text" | "stat" | "chip"` — controls the CSS size class applied to symbol images

**Symbol rendering:**
- `inlineSymbolSrc(token: string, variant?: InlineSymbolVariant): string | null` — returns the asset path for a symbol token, or null if unrecognised
- `renderMultilineText(text: string, keyPrefix: string): ReactNode[]` — renders a plain string as nodes, inserting `<br>` at newlines
- `renderTokenizedText(text: string, options?: { variant?, size? }): ReactNode[]` — primary rendering function; splits text on `{token}` patterns and replaces each with an inline symbol image

**Card text normalisation:**
- `applySymbols(text: string): string` — converts `:shortcode:` and `:rb_energy_N:` notation to `{token}` syntax
- `normalizeCardText(richText: string): string` — strips HTML tags, normalises entities, and applies symbol substitution; use before `renderTokenizedText`

**Card attribute formatters:**
- `cardEnergy(card: CardRecord): number | null` — returns the card's energy attribute
- `formatCostText(card: CardRecord): string | null` — formats the cost attribute as a token string for `renderTokenizedText`; falls back to the energy attribute
- `formatTypeline(card: CardRecord): string` — formats the full display typeline (supertype + cardtype + sorted tags)
- `domainChipClass(domains: string[]): string` — returns the Tailwind class string for a domain chip

## Update Triggers

Update this README when:

- a file is added to or removed from `src/lib/`
- an existing file's exported interface changes (new exports, removed exports,
  renamed symbols, or changed signatures)
- the import-direction rule for this layer changes
- the stop-and-ask rule for `cardFormat.tsx` is resolved or replaced
