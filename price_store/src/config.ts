import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type PriceDataEnvironment = Partial<Record<"NOXIANNET_PRICE_DATA_DIR", string>>;

export type PriceDataLayout = {
  rootDir: string;
  rawDir: string;
  canonicalDir: string;
  exportsDir: string;
  runsDir: string;
};

function resolvePackageRootFromModule(): string {
  let current = dirname(fileURLToPath(import.meta.url));

  if (basename(current) === "src") {
    current = dirname(current);
  }

  if (basename(current) === "dist") {
    current = dirname(current);
  }

  return current;
}

export function resolveRepositoryLocalPriceDataDir(): string {
  const packageRoot = resolvePackageRootFromModule();
  return resolve(packageRoot, "..", ".price_data");
}

export function resolveDefaultPriceDataDir(environment: PriceDataEnvironment = process.env): string {
  const configuredRoot = environment.NOXIANNET_PRICE_DATA_DIR?.trim();
  if (configuredRoot) {
    return resolve(configuredRoot);
  }

  return resolveRepositoryLocalPriceDataDir();
}

export function resolvePriceDataLayout(
  rootDir: string = resolveDefaultPriceDataDir()
): PriceDataLayout {
  const resolvedRoot = resolve(rootDir);

  return {
    rootDir: resolvedRoot,
    rawDir: join(resolvedRoot, "raw"),
    canonicalDir: join(resolvedRoot, "canonical"),
    exportsDir: join(resolvedRoot, "exports"),
    runsDir: join(resolvedRoot, "runs")
  };
}
