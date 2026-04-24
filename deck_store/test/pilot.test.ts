import { describe, expect, it } from "vitest";
import {
  canonicalStage1DatasetSchema,
  createCcs10kTop8PilotArtifacts,
  metagamePilotBundleSchema,
  snapshotManifestSchema
} from "../src/index.js";

describe("metagame pilot artifacts", () => {
  it("generates a valid approved-source TopDeck pilot bundle", () => {
    const generatedAt = "2026-04-24T12:00:00.000Z";
    const artifacts = createCcs10kTop8PilotArtifacts(generatedAt);

    expect(canonicalStage1DatasetSchema.parse(artifacts.dataset)).toEqual(artifacts.dataset);
    expect(snapshotManifestSchema.parse(artifacts.snapshotManifest)).toEqual(artifacts.snapshotManifest);
    expect(metagamePilotBundleSchema.parse(artifacts.bundle)).toEqual(artifacts.bundle);

    expect(artifacts.dataset.events).toHaveLength(1);
    expect(artifacts.dataset.decks).toHaveLength(8);
    expect(artifacts.dataset.decks.every((deck) => deck.provenance.usePolicy === "approved")).toBe(true);
    expect(artifacts.overview.totalDecks).toBe(8);
    expect(artifacts.legendDetails.find((detail) => detail.legendName === "Annie, Dark Child")?.canonicalDeckId).toBe(
      "deck-ccs-10000-dizzee-3rd"
    );
  });
});
