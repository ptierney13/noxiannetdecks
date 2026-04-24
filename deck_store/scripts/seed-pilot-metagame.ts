import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateArchiveManifest, writeArchiveManifest } from "../src/archive/fs.js";
import { initializeDeckDataLayout } from "../src/bootstrap.js";
import { resolveDeckDataLayout } from "../src/config.js";
import { createCcs10kTop8PilotArtifacts } from "../src/pilot/ccs-10k-top8.js";

async function writeJson(path: string, content: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(content, null, 2));
}

async function main() {
  const layout = resolveDeckDataLayout();
  await initializeDeckDataLayout(layout);

  const artifacts = createCcs10kTop8PilotArtifacts();
  const snapshotPayloads = new Map<string, unknown>([
    ["metagame-overview::overview", artifacts.overview],
    ["event-index::events", artifacts.eventIndex],
    [`event-detail::${artifacts.eventDetail.eventId}`, artifacts.eventDetail],
    ...artifacts.legendDetails.map((detail) => [`legend-detail::${detail.legendId}`, detail] as const),
    ...artifacts.deckDetails.map((detail) => [`deck-detail::${detail.deckId}`, detail] as const)
  ]);

  await writeJson(layout.pilotRawSourcePath, artifacts.rawSource);
  await writeJson(layout.canonicalDatasetPath, artifacts.dataset);
  await writeJson(layout.pilotCanonicalDatasetPath, artifacts.dataset);
  await writeJson(layout.snapshotManifestPath, artifacts.snapshotManifest);
  await writeJson(layout.pilotBundlePath, artifacts.bundle);

  for (const entry of artifacts.snapshotManifest.entries) {
    const payload = snapshotPayloads.get(`${entry.kind}::${entry.id}`);
    if (!payload) {
      throw new Error(`No payload found for snapshot entry ${entry.kind}:${entry.id}`);
    }

    await writeJson(resolve(layout.rootDir, ...entry.relativePath.split("/")), payload);
  }

  const archiveManifest = await generateArchiveManifest(layout);
  await writeArchiveManifest(layout, archiveManifest);

  console.log(`Seeded metagame pilot bundle at ${layout.pilotBundlePath}`);
}

await main();
