export type SearchUniqueMode = "legal" | "art" | "id" | "cn";

export const defaultSearchUniqueMode: SearchUniqueMode = "legal";

export function normalizeUniqueMode(value: string): SearchUniqueMode | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "*") return "id";

  const compact = trimmed.replace(/[\s_-]+/g, "");

  switch (compact) {
    case "legal":
    case "card":
    case "cards":
    case "gameplay":
    case "riftbound":
    case "tournament":
      return "legal";
    case "art":
    case "artwork":
    case "image":
    case "images":
      return "art";
    case "id":
    case "ids":
    case "record":
    case "records":
    case "print":
    case "prints":
    case "all":
      return "id";
    case "cn":
    case "collector":
    case "collectornumber":
    case "number":
      return "cn";
    default:
      return null;
  }
}
