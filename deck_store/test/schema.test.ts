import { describe, expect, it } from "vitest";
import {
  archiveManifestSchema,
  canonicalStage1DatasetSchema,
  createEmptyArchiveManifest,
  deckDetailSnapshotSchema,
  deckRecordSchema,
  eventRecordSchema,
  provenanceEvidenceSchema,
  reviewStateSchema,
  snapshotManifestSchema
} from "../src/index.js";
import { fixtureArchiveManifest, fixtureDataset, fixtureDeckDetailSnapshot, fixtureSnapshotManifest } from "./fixtures.js";

describe("Stage 1 deck schemas", () => {
  it("validates the fixture archive manifest and generates empty manifests", () => {
    expect(archiveManifestSchema.parse(fixtureArchiveManifest)).toEqual(fixtureArchiveManifest);

    const manifest = createEmptyArchiveManifest("2026-04-24T12:00:00.000Z");
    expect(manifest.totalFiles).toBe(0);
    expect(manifest.layers).toHaveLength(4);
  });

  it("validates the canonical Stage 1 dataset fixture", () => {
    expect(canonicalStage1DatasetSchema.parse(fixtureDataset)).toEqual(fixtureDataset);
  });

  it("requires event deck sources to carry an event id", () => {
    const candidate = {
      ...fixtureDataset.decks[0],
      source: {
        ...fixtureDataset.decks[0].source,
        eventId: null
      }
    };

    expect(() => deckRecordSchema.parse(candidate)).toThrow(/event id/i);
  });

  it("enforces consistent event region bucket groupings", () => {
    const candidate = {
      ...fixtureDataset.events[0],
      primaryRegion: "cn" as const,
      regionBuckets: ["cn", "non-cn"] as const
    };

    expect(() => eventRecordSchema.parse(candidate)).toThrow(/must not be tagged as non-cn/i);
  });

  it("prevents manual-review-only evidence from referencing stored captures", () => {
    const candidate = {
      ...fixtureDataset.decks[0].provenance.evidence[1],
      captureId: "capture-topdeck-event-1"
    };

    expect(() => provenanceEvidenceSchema.parse(candidate)).toThrow(/stored capture/i);
  });

  it("requires review flags when a record needs attention", () => {
    const candidate = {
      ...fixtureDataset.decks[0].reviewState,
      status: "needs-attention" as const,
      flags: []
    };

    expect(() => reviewStateSchema.parse(candidate)).toThrow(/at least one review flag/i);
  });

  it("validates the snapshot contracts", () => {
    expect(snapshotManifestSchema.parse(fixtureSnapshotManifest)).toEqual(fixtureSnapshotManifest);
    expect(deckDetailSnapshotSchema.parse(fixtureDeckDetailSnapshot)).toEqual(fixtureDeckDetailSnapshot);
  });
});
