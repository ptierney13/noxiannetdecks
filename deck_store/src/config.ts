import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

export type DeckDataEnvironment = Partial<Record<"NOXIANNET_DECK_DATA_DIR", string>>;

export type DeckDataLayout = {
  rootDir: string;
  rawDir: string;
  canonicalDir: string;
  exportsDir: string;
  auditDir: string;
  archiveManifestPath: string;
  auditPlanPath: string;
  canonicalDatasetPath: string;
  snapshotManifestPath: string;
  pilotRawSourcePath: string;
  pilotCanonicalDatasetPath: string;
  pilotExportsDir: string;
  pilotBundlePath: string;
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

export function resolveRepositoryLocalDeckDataDir(): string {
  const packageRoot = resolvePackageRootFromModule();
  return resolve(packageRoot, "..", ".deck_data");
}

export function resolveDefaultDeckDataDir(environment: DeckDataEnvironment = process.env): string {
  const configuredRoot = environment.NOXIANNET_DECK_DATA_DIR?.trim();
  if (configuredRoot) {
    return resolve(configuredRoot);
  }

  return resolveRepositoryLocalDeckDataDir();
}

export function resolveDeckDataLayout(
  rootDir: string = resolveDefaultDeckDataDir()
): DeckDataLayout {
  const resolvedRoot = resolve(rootDir);

  return {
    rootDir: resolvedRoot,
    rawDir: join(resolvedRoot, "raw"),
    canonicalDir: join(resolvedRoot, "canonical"),
    exportsDir: join(resolvedRoot, "exports"),
    auditDir: join(resolvedRoot, "audit"),
    archiveManifestPath: join(resolvedRoot, "archive-manifest.json"),
    auditPlanPath: join(resolvedRoot, "audit", "source-audit-plan.json"),
    canonicalDatasetPath: join(resolvedRoot, "canonical", "stage1-dataset.json"),
    snapshotManifestPath: join(resolvedRoot, "exports", "snapshot-manifest.json"),
    pilotRawSourcePath: join(resolvedRoot, "raw", "topdeck", "pilot", "ccs-riftbound-10000-top8-source.json"),
    pilotCanonicalDatasetPath: join(resolvedRoot, "canonical", "ccs-riftbound-10000-top8-stage1-dataset.json"),
    pilotExportsDir: join(resolvedRoot, "exports", "metagame-pilot"),
    pilotBundlePath: join(resolvedRoot, "exports", "metagame-pilot", "bundle.json")
  };
}
