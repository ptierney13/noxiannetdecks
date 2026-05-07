import { readFileSync } from "node:fs";

export function applyLocalEnvFile(filePath: string, environment: NodeJS.ProcessEnv = process.env): void {
  let content: string;

  try {
    content = readFileSync(filePath, "utf8");
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") {
      return;
    }

    throw error;
  }

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || environment[key] !== undefined) {
      continue;
    }

    environment[key] = stripSurroundingQuotes(value);
  }
}

function stripSurroundingQuotes(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
