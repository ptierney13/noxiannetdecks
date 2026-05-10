import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { deriveDecklistCardId, deriveLegalCleanName } from "../src/data/decklist-id.js";
import { cardDatabaseSchema } from "../src/data/schema.js";

const OUTPUT_PATH = path.resolve("data", "cards.json");

async function main() {
  const raw = await readFile(OUTPUT_PATH, "utf8");
  const existing = cardDatabaseSchema.parse(JSON.parse(raw));

  const refreshed = existing.map((card) => {
    const cleanName = deriveLegalCleanName(card.clean_name, card.riot_name);
    return {
      ...card,
      clean_name: cleanName,
      riftbound_id: deriveDecklistCardId(cleanName, card.riot_name)
    };
  });

  const validated = cardDatabaseSchema.parse(refreshed);
  await writeFile(OUTPUT_PATH, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  console.log(`Refreshed derived identity fields for ${validated.length} cards in ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
