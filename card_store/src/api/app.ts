import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "@fastify/cors";
import Fastify from "fastify";
import type { CardRecord } from "../data/schema.js";
import { CardApiError, createCardApiService } from "./service.js";

type CreateAppOptions = {
  cards: CardRecord[];
  loadMetagamePilotBundle?: () => Promise<unknown>;
};

function resolveDefaultMetagamePilotBundlePath(environment: NodeJS.ProcessEnv = process.env) {
  const configuredRoot = environment.NOXIANNET_DECK_DATA_DIR?.trim();
  if (configuredRoot) {
    return resolve(configuredRoot, "exports", "metagame-pilot", "bundle.json");
  }

  const currentDir = dirname(fileURLToPath(import.meta.url));
  return resolve(currentDir, "..", "..", "..", ".deck_data", "exports", "metagame-pilot", "bundle.json");
}

async function loadMetagamePilotBundleFromDisk() {
  const raw = await readFile(resolveDefaultMetagamePilotBundlePath(), "utf8");
  return JSON.parse(raw) as unknown;
}

export async function createApp({ cards, loadMetagamePilotBundle = loadMetagamePilotBundleFromDisk }: CreateAppOptions) {
  const app = Fastify({
    logger: false,
    ajv: {
      customOptions: {
        coerceTypes: false
      }
    }
  });
  const api = createCardApiService({
    cards,
    loadMetagamePilotBundle
  });

  await app.register(cors, {
    origin: true
  });

  app.get("/api/health", async () => api.health());

  app.get<{ Querystring: { q?: string } }>("/api/cards", async (request) => {
    return api.search(request.query.q ?? "");
  });

  app.get<{ Params: { id: string } }>("/api/cards/:id", async (request, reply) => {
    try {
      return api.cardById(request.params.id);
    } catch (caught) {
      if (caught instanceof CardApiError) {
        return reply.status(caught.status).send({ message: caught.message });
      }

      throw caught;
    }
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
      try {
        return api.parseQuery(request.body);
      } catch (caught) {
        if (caught instanceof CardApiError) {
          return reply.status(caught.status).send({ message: caught.message });
        }

        throw caught;
      }
    }
  );

  app.get("/api/query/features", async () => api.queryFeatures());

  app.get("/api/metadata", async () => api.metadata());

  app.get("/api/metagame/pilot", async (_request, reply) => {
    try {
      return await api.metagamePilot();
    } catch (caught) {
      if (caught instanceof CardApiError) {
        return reply.status(caught.status).send({ message: caught.message });
      }

      throw caught;
    }
  });

  app.get("/api/pack-generator/options", async () => api.packGeneratorOptions());

  app.post<{ Body: unknown }>("/api/pack-generator/pools", async (request, reply) => {
    try {
      return api.generateSealedPool(request.body);
    } catch (caught) {
      if (caught instanceof CardApiError) {
        return reply.status(caught.status).send({ message: caught.message });
      }

      throw caught;
    }
  });

  return app;
}
