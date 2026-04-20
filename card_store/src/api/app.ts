import cors from "@fastify/cors";
import Fastify from "fastify";
import type { CardRecord } from "../data/schema.js";
import { fieldDefinitions, parseQuery, queryFieldGuides, querySyntaxGuides, searchCards, sortCards } from "../query/index.js";

type CreateAppOptions = {
  cards: CardRecord[];
};

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

export async function createApp({ cards }: CreateAppOptions) {
  const app = Fastify({
    logger: false,
    ajv: {
      customOptions: {
        coerceTypes: false
      }
    }
  });
  const sortedCards = sortCards(cards);

  await app.register(cors, {
    origin: true
  });

  app.get("/api/health", async () => ({
    ok: true,
    cardCount: sortedCards.length
  }));

  app.get<{ Querystring: { q?: string } }>("/api/cards", async (request) => {
    const query = request.query.q ?? "";
    return searchCards(sortedCards, query);
  });

  app.get<{ Params: { id: string } }>("/api/cards/:id", async (request, reply) => {
    const card = sortedCards.find((candidate) => candidate.id === request.params.id);
    if (!card) {
      return reply.status(404).send({ message: `Card "${request.params.id}" was not found.` });
    }

    return card;
  });

  app.post<{ Body: { query?: unknown } }>(
    "/api/query/parse",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            query: { type: "string" }
          }
        }
      }
    },
    async (request, reply) => {
      const query = request.body?.query;
      if (query !== undefined && typeof query !== "string") {
        return reply.status(400).send({ message: "Query must be a string." });
      }

      return parseQuery(query ?? "");
    }
  );

  app.get("/api/query/features", async () => ({
    fields: queryFieldGuides,
    syntax: querySyntaxGuides
  }));

  app.get("/api/metadata", async () => metadataForCards(sortedCards));

  return app;
}
