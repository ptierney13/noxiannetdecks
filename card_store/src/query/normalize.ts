export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function unquote(value: string): string {
  if (!value.startsWith("\"") || !value.endsWith("\"")) {
    return value;
  }

  return value
    .slice(1, -1)
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\");
}

export function quoteIfNeeded(value: string): string {
  if (/^[{}A-Za-z0-9_.*'/-]+$/.test(value)) {
    return value;
  }

  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}
