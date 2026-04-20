import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { cardDatabaseSchema, type CardDatabase, type CardRecord } from "./schema.js";

export type CardSource = {
  load(): Promise<CardDatabase>;
};

const defaultDatabasePath = fileURLToPath(new URL("../../data/cards.json", import.meta.url));

function assertUniqueCardIds(database: CardDatabase): void {
  const ids = new Set<string>();

  for (const card of database) {
    if (ids.has(card.id)) {
      throw new Error(`Duplicate card id in canonical data: ${card.id}`);
    }
    ids.add(card.id);
  }
}

export class JsonFileCardSource implements CardSource {
  constructor(private readonly databasePath = defaultDatabasePath) {}

  async load(): Promise<CardDatabase> {
    const raw = await readFile(this.databasePath, "utf8");
    return cardDatabaseSchema.parse(JSON.parse(raw));
  }
}

export class RestCardSource implements CardSource {
  constructor(
    private readonly url: string | URL,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async load(): Promise<CardDatabase> {
    const response = await this.fetchImpl(this.url);
    if (!response.ok) {
      throw new Error(`Card source request failed: ${response.status} ${response.statusText}`);
    }

    return cardDatabaseSchema.parse(await response.json());
  }
}

export class CardRepository {
  private cachedDatabase: CardDatabase | null = null;

  constructor(private readonly source: CardSource = new JsonFileCardSource()) {}

  async loadCardDatabase(): Promise<CardDatabase> {
    if (this.cachedDatabase) return this.cachedDatabase;

    const database = await this.source.load();
    assertUniqueCardIds(database);

    this.cachedDatabase = database;
    return database;
  }

  async loadCards(): Promise<CardRecord[]> {
    return this.loadCardDatabase();
  }

  clearCache(): void {
    this.cachedDatabase = null;
  }
}

const defaultRepository = new CardRepository();

export function createCardRepository(source: CardSource = new JsonFileCardSource()): CardRepository {
  return new CardRepository(source);
}

export async function loadCardDatabase(source?: CardSource): Promise<CardDatabase> {
  if (source) return createCardRepository(source).loadCardDatabase();
  return defaultRepository.loadCardDatabase();
}

export async function loadCards(source?: CardSource): Promise<CardRecord[]> {
  if (source) return createCardRepository(source).loadCards();
  return defaultRepository.loadCards();
}

export function clearCardDatabaseCacheForTests(): void {
  defaultRepository.clearCache();
}
