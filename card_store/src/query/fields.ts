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
  { canonical: "text", aliases: ["o"], kind: "string", description: "Rules text and flavour text." },
  { canonical: "t", aliases: [], kind: "string", description: "Type line." },
  { canonical: "type", aliases: [], kind: "string", description: "Card type." },
  { canonical: "cardtype", aliases: [], kind: "string", description: "Card type." },
  { canonical: "supertype", aliases: ["u"], kind: "string", description: "Card supertype." },
  { canonical: "typeline", aliases: [], kind: "string", description: "Full type line." },
  { canonical: "tag", aliases: [], kind: "string", description: "Card tag." },
  { canonical: "keyword", aliases: ["k"], kind: "string", description: "Rules keyword." },
  { canonical: "domain", aliases: ["d"], kind: "string", description: "Riftbound domain." },
  { canonical: "set", aliases: ["s"], kind: "string", description: "Set code or set name." },
  { canonical: "rarity", aliases: ["r"], kind: "string", description: "Card rarity." },
  { canonical: "artist", aliases: ["a"], kind: "string", description: "Illustrator." },
  { canonical: "number", aliases: ["c"], kind: "string", description: "Collector number." },
  { canonical: "is", aliases: [], kind: "string", description: "Finish or treatment flag." },
  { canonical: "finish", aliases: ["variant"], kind: "string", description: "Finish availability." },
  { canonical: "layout", aliases: ["orientation"], kind: "string", description: "Card media layout." },
  { canonical: "id", aliases: [], kind: "string", description: "Riftcodex source ID." },
  { canonical: "riftbound_id", aliases: [], kind: "string", description: "Decklist card ID." },
  { canonical: "tcgplayer_id", aliases: [], kind: "string", description: "TCGplayer ID." },
  { canonical: "language", aliases: [], kind: "string", description: "Card language." },
  { canonical: "cost", aliases: [], kind: "number", description: "Cost value." },
  { canonical: "energy", aliases: ["e"], kind: "number", description: "Energy value." },
  { canonical: "might", aliases: ["m"], kind: "number", description: "Might value." },
  { canonical: "power", aliases: ["p"], kind: "number", description: "Power value." }
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
