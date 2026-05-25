export type FieldKind = "string" | "number";

export type FieldDefinition = {
  canonical: string;
  aliases: string[];
  kind: FieldKind;
  description: string;
};

export const fieldDefinitions: FieldDefinition[] = [
  { canonical: "name", aliases: ["n"], kind: "string", description: "Card name." },
  { canonical: "clean_name", aliases: [], kind: "string", description: "Normalized card name." },
  { canonical: "text", aliases: ["o"], kind: "string", description: "Rules text." },
  { canonical: "t", aliases: ["type", "typeline"], kind: "string", description: "Type line (word-by-word match, any order)." },
  { canonical: "cardtype", aliases: ["ct"], kind: "string", description: "Card type." },
  { canonical: "supertype", aliases: ["u"], kind: "string", description: "Card supertype." },
  { canonical: "tag", aliases: ["g"], kind: "string", description: "Card tag." },
  { canonical: "keyword", aliases: ["k", "kw"], kind: "string", description: "Rules keyword." },
  { canonical: "domain", aliases: ["d"], kind: "string", description: "Riftbound domain." },
  { canonical: "set", aliases: ["s"], kind: "string", description: "Set code or set name." },
  { canonical: "rarity", aliases: ["r"], kind: "string", description: "Card rarity." },
  { canonical: "artist", aliases: ["a"], kind: "string", description: "Illustrator." },
  { canonical: "number", aliases: ["cn"], kind: "string", description: "Collector number." },
  { canonical: "is", aliases: [], kind: "string", description: "Finish or treatment flag." },
  { canonical: "finish", aliases: ["variant"], kind: "string", description: "Finish availability." },
  { canonical: "layout", aliases: ["orientation"], kind: "string", description: "Card media layout." },
  { canonical: "id", aliases: [], kind: "string", description: "Riftcodex source ID." },
  { canonical: "riftbound_id", aliases: [], kind: "string", description: "Decklist card ID." },
  { canonical: "tcgplayer_id", aliases: [], kind: "string", description: "TCGplayer ID." },
  { canonical: "flavour", aliases: ["ft", "flavor"], kind: "string", description: "Flavor text." },
  { canonical: "language", aliases: [], kind: "string", description: "Card language." },
  { canonical: "cost", aliases: ["c"], kind: "number", description: "Cost value." },
  { canonical: "energy", aliases: ["e"], kind: "number", description: "Energy value." },
  { canonical: "might", aliases: ["m"], kind: "number", description: "Might value." },
  { canonical: "power", aliases: ["p"], kind: "number", description: "Power value." },
  { canonical: "price", aliases: [], kind: "number", description: "Published near-mint market price." }
];

const fieldLookup = new Map<string, FieldDefinition>();

for (const definition of fieldDefinitions) {
  fieldLookup.set(definition.canonical, definition);
  for (const alias of definition.aliases) {
    fieldLookup.set(alias, definition);
  }
}

export function resolveField(field: string): FieldDefinition | undefined {
  return fieldLookup.get(field.toLowerCase());
}
