import { createHash } from "node:crypto";

const DECKLIST_ID_NAMESPACE = "noxiannet:rdf:decklist-card:v1";
const PRESENTATION_SUFFIX_PATTERN = /\s+(?:alternate art|alt art|overnumbered|signed|signature|starter|metal|gg ez|launch exclusive|ultimate)$/i;
const RIOT_PRESENTATION_SUFFIX_PATTERN = /\s+\((?:alternate art|alt art|overnumbered|signed|signature|starter|metal|gg ez|launch exclusive|ultimate)\)$/i;

function formatGuid(bytes: Buffer): string {
  const hash = Buffer.from(bytes.subarray(0, 16));
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hex = hash.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function normalizeDecklistIdentityName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function deriveLegalCleanName(cleanName: string | null, fallbackName: string): string {
  const sourceName = cleanName ?? fallbackName;
  return sourceName
    .replace(RIOT_PRESENTATION_SUFFIX_PATTERN, "")
    .replace(PRESENTATION_SUFFIX_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveDecklistCardId(cleanName: string | null, fallbackName: string): string {
  const identityName = normalizeDecklistIdentityName(deriveLegalCleanName(cleanName, fallbackName));
  const hash = createHash("sha1").update(DECKLIST_ID_NAMESPACE).update("\0").update(identityName).digest();
  return formatGuid(hash);
}
