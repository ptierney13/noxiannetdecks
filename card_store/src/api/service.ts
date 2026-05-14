import type { CardRecord } from "../data/schema.js";
import {
  generateSealedPool,
  isPackSetId,
  isSealedPoolFormat,
  packGeneratorOptions,
  PackGenerationError,
  type GenerateSealedPoolRequest,
  type PackSetId
} from "../pack_generator/index.js";
import {
  fieldDefinitions,
  parsedQueryReferencesField,
  parseQuery,
  queryFieldGuides,
  querySyntaxGuides,
  searchCards,
  searchCardsFromParsed,
  sortCards
} from "../query/index.js";
import type { SearchPriceIndex } from "../prices/published.js";

export type CardApiServiceOptions = {
  cards: CardRecord[];
  loadMetagamePilotBundle?: () => Promise<unknown>;
  loadSearchPriceIndex?: () => Promise<SearchPriceIndex | null>;
};

export class CardApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "CardApiError";
  }
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

function metadataForCards(cards: CardRecord[]) {
  return {
    sets: uniqueSorted(cards.flatMap((card) => [card.set.set_id, card.set.label])),
    domains: uniqueSorted(cards.flatMap((card) => card.attributes.domain)),
    types: uniqueSorted(cards.map((card) => card.type.cardtype)),
    supertypes: uniqueSorted(cards.map((card) => card.type.supertype)),
    rarities: uniqueSorted(cards.map((card) => card.rarity)),
    tags: uniqueSorted(cards.flatMap((card) => card.type.tags)),
    keywords: uniqueSorted(cards.flatMap((card) => card.text.keywords)),
    variantFlags: ["foil", "nonfoil", "alternate_art", "overnumbered", "signed"],
    numericFields: fieldDefinitions.filter((field) => field.kind === "number"),
    queryFields: fieldDefinitions
  };
}

function parsePackGeneratorRequest(body: unknown): GenerateSealedPoolRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new CardApiError(400, "Request body must be an object.");
  }

  const input = body as Record<string, unknown>;

  if (!isSealedPoolFormat(input.format)) {
    throw new CardApiError(400, "Format must be standard, pre-rift, or custom.");
  }

  const request: GenerateSealedPoolRequest = {
    format: input.format
  };

  if (input.setId !== undefined) {
    if (!isPackSetId(input.setId)) {
      throw new CardApiError(400, "setId must be OGN, SFD, or UNL.");
    }
    request.setId = input.setId;
  }

  if (input.seededPackId !== undefined) {
    if (input.seededPackId !== null && typeof input.seededPackId !== "string") {
      throw new CardApiError(400, "seededPackId must be a string.");
    }
    request.seededPackId = input.seededPackId;
  }

  if (input.packs !== undefined) {
    if (!Array.isArray(input.packs)) {
      throw new CardApiError(400, "packs must be an array.");
    }

    const packs: PackSetId[] = [];
    for (const pack of input.packs) {
      if (!isPackSetId(pack)) {
        throw new CardApiError(400, "Each pack must be OGN, SFD, or UNL.");
      }
      packs.push(pack);
    }
    request.packs = packs;
  }

  return request;
}

export function createCardApiService({
  cards,
  loadMetagamePilotBundle,
  loadSearchPriceIndex
}: CardApiServiceOptions) {
  const sortedCards = sortCards(cards);
  let cachedPriceIndexPromise: Promise<SearchPriceIndex | null> | null = null;

  function getSearchPriceIndex() {
    if (!loadSearchPriceIndex) {
      return Promise.resolve<SearchPriceIndex | null>(null);
    }

    if (!cachedPriceIndexPromise) {
      cachedPriceIndexPromise = loadSearchPriceIndex();
    }

    return cachedPriceIndexPromise;
  }

  return {
    health() {
      return {
        ok: true,
        cardCount: sortedCards.length
      };
    },

    async search(query = "") {
      const parsed = parseQuery(query);
      if (parsed.diagnostics.length > 0) {
        return searchCardsFromParsed(sortedCards, parsed);
      }

      if (!parsedQueryReferencesField(parsed, "price")) {
        return searchCardsFromParsed(sortedCards, parsed);
      }

      const priceIndex = await getSearchPriceIndex();
      if (!priceIndex) {
        throw new CardApiError(503, "Published price data is unavailable.");
      }

      return searchCardsFromParsed(sortedCards, parsed, { priceIndex });
    },

    cardById(id: string) {
      const card = sortedCards.find((candidate) => candidate.id === id);
      if (!card) {
        throw new CardApiError(404, `Card "${id}" was not found.`);
      }

      return card;
    },

    parseQuery(body: { query?: unknown } | null | undefined) {
      const query = body?.query;
      if (query !== undefined && typeof query !== "string") {
        throw new CardApiError(400, "Query must be a string.");
      }

      return parseQuery(query ?? "");
    },

    queryFeatures() {
      return {
        fields: queryFieldGuides,
        syntax: querySyntaxGuides
      };
    },

    metadata() {
      return metadataForCards(sortedCards);
    },

    async metagamePilot() {
      if (!loadMetagamePilotBundle) {
        throw new CardApiError(404, "Metagame pilot bundle has not been seeded yet.");
      }

      try {
        return await loadMetagamePilotBundle();
      } catch (caught) {
        if ((caught as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
          throw new CardApiError(404, "Metagame pilot bundle has not been seeded yet.");
        }

        throw caught;
      }
    },

    packGeneratorOptions() {
      return packGeneratorOptions();
    },

    generateSealedPool(body: unknown) {
      try {
        return generateSealedPool(sortedCards, parsePackGeneratorRequest(body));
      } catch (caught) {
        if (caught instanceof PackGenerationError) {
          throw new CardApiError(400, caught.message);
        }

        throw caught;
      }
    }
  };
}
