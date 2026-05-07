import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export function resolvePriceStorePackageRoot(fromModuleUrl: string = import.meta.url): string {
  let current = dirname(fileURLToPath(fromModuleUrl));

  if (basename(current) === "scripts") {
    current = dirname(current);
  }

  if (basename(current) === "src") {
    current = dirname(current);
  }

  if (basename(current) === "dist") {
    current = dirname(current);
  }

  return current;
}
