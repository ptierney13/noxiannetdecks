import type {
  ArchiveManifest,
  SourceAuditPlan,
  CanonicalStage1Dataset,
  DeckDetailSnapshot,
  SnapshotManifest
} from "../src/index.js";

export const fixtureArchiveManifest: ArchiveManifest = {
  version: 1,
  generatedAt: "2026-04-24T12:00:00.000Z",
  totalFiles: 5,
  totalBytes: 4096,
  layers: [
    { layer: "raw", fileCount: 2, totalBytes: 2048 },
    { layer: "canonical", fileCount: 1, totalBytes: 1024 },
    { layer: "exports", fileCount: 1, totalBytes: 768 },
    { layer: "audit", fileCount: 1, totalBytes: 256 }
  ],
  sources: [
    { sourceId: "riftdecks", captureCount: 4, totalBytes: 4096 }
  ]
};

export const fixtureDataset: CanonicalStage1Dataset = {
  version: 1,
  generatedAt: "2026-04-24T12:00:00.000Z",
  sourceCaptures: [
    {
      id: "capture-topdeck-event-1",
      sourceSite: "topdeck",
      sourceUrl: "https://topdeck.gg/event/test-event",
      sourceIdentifier: "topdeck-test-event",
      kind: "event-detail",
      capturedAt: "2026-04-24T12:00:00.000Z",
      relativePath: "raw/topdeck/events/test-event.html",
      contentType: "text/html",
      byteLength: 2048,
      sha256: "abc123",
      notes: ["HTML only; no image capture"]
    },
    {
      id: "capture-organizer-deck-1",
      sourceSite: "organizer",
      sourceUrl: "https://example.com/events/test-event/player-one-deck",
      sourceIdentifier: "player-one-deck",
      kind: "deck-detail",
      capturedAt: "2026-04-24T12:05:00.000Z",
      relativePath: "raw/organizer/decks/player-one-deck.html",
      contentType: "text/html",
      byteLength: 1024,
      sha256: "def456",
      notes: ["Organizer-hosted public deck text."]
    }
  ],
  legends: [
    {
      id: "legend-kaisa",
      slug: "kaisa-daughter-of-the-void",
      name: "Kai'Sa, Daughter of the Void"
    }
  ],
  events: [
    {
      id: "event-test-1",
      slug: "test-event",
      name: "Test Event",
      sourceSite: "topdeck",
      sourceId: "topdeck-test-event",
      sourceUrl: "https://topdeck.gg/event/test-event",
      startDate: "2026-04-19",
      endDate: null,
      city: "Seattle",
      countryCode: "US",
      countryName: "United States",
      attendance: 128,
      prestige: "premier",
      metagameBucket: "set-3",
      primaryRegion: "na",
      regionBuckets: ["na", "non-cn"],
      rawFacts: {
        sourceMetagameLabel: "Unleashed Constructed",
        sourceCountryCode: "US",
        sourceCountryLabel: "United States",
        sourcePrestigeLabel: "City Championship",
        seasonLabel: "Set 3",
        banWindowLabel: "Post-Ban"
      },
      provenance: {
        primarySourceKind: "registration",
        primarySourceLabel: "TopDeck public event page",
        confidence: "high",
        usePolicy: "approved",
        evidence: [
          {
            id: "event-test-1-topdeck",
            label: "TopDeck public event page",
            sourceKind: "registration",
            sourceSite: "topdeck",
            sourceUrl: "https://topdeck.gg/event/test-event",
            sourceId: "topdeck-test-event",
            usePolicy: "approved",
            captureId: "capture-topdeck-event-1",
            notes: ["Approved public event metadata source."]
          }
        ],
        notes: ["Stage 1 event metadata is sourced from approved public event pages."]
      },
      reviewState: {
        status: "verified",
        flags: [],
        reviewedAt: "2026-04-24T12:10:00.000Z",
        reviewer: "stage-1-audit",
        notes: ["Verified against an approved public event source."]
      },
      standingRows: [
        {
          placement: 1,
          placementLabel: "1st",
          playerName: "Player One",
          deckId: "deck-test-1",
          decklistStatus: "present",
          record: "8-1"
        },
        {
          placement: 2,
          placementLabel: "2nd",
          playerName: "Player Two",
          deckId: null,
          decklistStatus: "missing",
          record: "7-2"
        }
      ],
      captureIds: ["capture-topdeck-event-1"]
    }
  ],
  decks: [
    {
      id: "deck-test-1",
      slug: "player-one-kaisa",
      name: "Kai'Sa Premier Build",
      legendId: "legend-kaisa",
      legendName: "Kai'Sa, Daughter of the Void",
      archetypeId: null,
      archetypeName: null,
      subArchetypeId: null,
      subArchetypeName: null,
      source: {
        kind: "event",
        sourceSite: "organizer",
        sourceId: "deck-1",
        sourceUrl: "https://example.com/events/test-event/player-one-deck",
        eventId: "event-test-1",
        placement: 1,
        placementLabel: "1st",
        playerName: "Player One",
        record: "8-1",
        publishedAt: "2026-04-20T12:00:00.000Z"
      },
      metagameBucket: "set-3",
      primaryRegion: "na",
      regionBuckets: ["na", "non-cn"],
      provenance: {
        primarySourceKind: "organizer",
        primarySourceLabel: "Organizer-hosted public deck page",
        confidence: "high",
        usePolicy: "approved",
        evidence: [
          {
            id: "deck-test-1-organizer",
            label: "Organizer deck page",
            sourceKind: "organizer",
            sourceSite: "organizer",
            sourceUrl: "https://example.com/events/test-event/player-one-deck",
            sourceId: "player-one-deck",
            usePolicy: "approved",
            captureId: "capture-organizer-deck-1",
            notes: ["Approved decklist source for the canonical record."]
          },
          {
            id: "deck-test-1-riftdecks-reference",
            label: "RiftDecks public deck page",
            sourceKind: "aggregator",
            sourceSite: "riftdecks",
            sourceUrl: "https://riftdecks.com/riftbound-metagame/deck-draven-glorious-executioner-101800",
            sourceId: "riftdecks-reference-only",
            usePolicy: "manual-review-only",
            captureId: null,
            notes: ["Secondary manual review reference only. Not canonical input."]
          }
        ],
        notes: ["Aggregator references may support manual review, but only approved primary evidence can anchor the canonical deck."]
      },
      reviewState: {
        status: "reviewed",
        flags: ["manual-reference-only"],
        reviewedAt: "2026-04-24T12:15:00.000Z",
        reviewer: "stage-1-audit",
        notes: ["Reviewed with an aggregator reference, but the canonical deck remains anchored to the organizer source."]
      },
      deckCards: [
        {
          section: "champion",
          quantity: 1,
          cardName: "Kai'Sa, Voracious Skyhunter",
          cardSlug: "kaisa-voracious-skyhunter",
          canonicalCardId: "kaisa-voracious-skyhunter"
        },
        {
          section: "battlefield",
          quantity: 1,
          cardName: "Reaver's Row",
          cardSlug: "reavers-row",
          canonicalCardId: null
        },
        {
          section: "rune",
          quantity: 12,
          cardName: "Body Rune",
          cardSlug: "body-rune",
          canonicalCardId: null
        },
        {
          section: "main",
          quantity: 3,
          cardName: "Stacked Deck",
          cardSlug: "stacked-deck",
          canonicalCardId: "stacked-deck"
        }
      ],
      captureIds: ["capture-organizer-deck-1"]
    }
  ]
};

export const fixtureSnapshotManifest: SnapshotManifest = {
  version: 1,
  generatedAt: "2026-04-24T12:00:00.000Z",
  sourceCoverageSummary: "Approved public event and organizer sources with HTML-only archival captures.",
  entries: [
    {
      kind: "deck-detail",
      id: "deck-test-1",
      relativePath: "exports/decks/deck-test-1.json"
    }
  ]
};

export const fixtureDeckDetailSnapshot: DeckDetailSnapshot = {
  kind: "deck-detail",
  generatedAt: "2026-04-24T12:00:00.000Z",
  sourceCoverageSummary: "Approved public event and organizer sources with HTML-only archival captures.",
  deckId: "deck-test-1",
  deckName: "Kai'Sa Premier Build",
  legendId: "legend-kaisa",
  legendName: "Kai'Sa, Daughter of the Void",
  eventId: "event-test-1",
  eventName: "Test Event",
  placementLabel: "1st",
  playerName: "Player One",
  metagameBucket: "set-3",
  primaryRegion: "na",
  sections: [
    {
      section: "champion",
      cards: [
        {
          cardName: "Kai'Sa, Voracious Skyhunter",
          cardSlug: "kaisa-voracious-skyhunter",
          canonicalCardId: "kaisa-voracious-skyhunter",
          quantity: 1
        }
      ]
    }
  ]
};

export const fixtureSourceAuditPlan: SourceAuditPlan = {
  version: 1,
  generatedAt: "2026-04-24T12:00:00.000Z",
  collectionPolicy: {
    textOnly: true,
    allowImages: false,
    allowOtherMedia: false,
    allowManualReviewReferences: true,
    allowAutomatedManualReviewSources: false,
    allowDisallowedSourceCapture: false
  },
  sources: [
    {
      sourceSite: "topdeck",
      role: "backbone",
      usePolicy: "approved",
      summary: "Primary green-source event metadata target for Stage 1 public collection.",
      auditNotes: ["Capture HTML/text only."],
      targets: [
        {
          id: "topdeck-event-sample",
          sourceSite: "topdeck",
          label: "TopDeck public event page sample",
          url: "https://topdeck.gg/event/test-event",
          captureKind: "event-detail",
          usePolicy: "approved",
          notes: ["Approved public event source."],
          enabled: true,
          status: "pending",
          relativePath: null,
          capturedAt: null,
          lastError: null,
          lastByteLength: null,
          lastContentType: null
        }
      ]
    }
  ]
};
