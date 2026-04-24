import { readFile } from "node:fs/promises";
import { metagamePilotBundleSchema, snapshotManifestSchema, type MetagamePilotBundle, type SnapshotManifest } from "./schema.js";
import { resolveDeckDataLayout } from "../config.js";

export type SnapshotManifestSource = {
  load(): Promise<SnapshotManifest>;
};

export type MetagamePilotBundleSource = {
  load(): Promise<MetagamePilotBundle>;
};

export class JsonFileSnapshotManifestSource implements SnapshotManifestSource {
  constructor(private readonly manifestPath = resolveDeckDataLayout().snapshotManifestPath) {}

  async load(): Promise<SnapshotManifest> {
    const raw = await readFile(this.manifestPath, "utf8");
    return snapshotManifestSchema.parse(JSON.parse(raw));
  }
}

export class JsonFileMetagamePilotBundleSource implements MetagamePilotBundleSource {
  constructor(private readonly bundlePath = resolveDeckDataLayout().pilotBundlePath) {}

  async load(): Promise<MetagamePilotBundle> {
    const raw = await readFile(this.bundlePath, "utf8");
    return metagamePilotBundleSchema.parse(JSON.parse(raw));
  }
}

export async function loadSnapshotManifest(source: SnapshotManifestSource = new JsonFileSnapshotManifestSource()) {
  return source.load();
}

export async function loadMetagamePilotBundle(
  source: MetagamePilotBundleSource = new JsonFileMetagamePilotBundleSource()
) {
  return source.load();
}
