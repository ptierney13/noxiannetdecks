import { Buffer } from "node:buffer";
import type {
  CanonicalStage1Dataset,
  DeckCardRecord,
  DeckDetailSnapshot,
  DeckRecord,
  EventDetailSnapshot,
  EventIndexSnapshot,
  EventRecord,
  LegendDetailSnapshot,
  LegendRecord,
  MetagamePilotBundle,
  MetagameOverviewSnapshot,
  SnapshotManifest
} from "../index.js";

type PilotDeckSeed = {
  id: string;
  playerName: string;
  placement: number;
  record: string;
  sourceUrl: string;
  legendName: string;
  champion: Array<{ name: string; quantity: number }>;
  runes: Array<{ name: string; quantity: number }>;
  battlefields: Array<{ name: string; quantity: number }>;
  main: Array<{ name: string; quantity: number }>;
};

type PilotRawSourceDocument = {
  version: 1;
  event: {
    name: string;
    slug: string;
    sourceUrl: string;
    startDate: string;
    endDate: string;
    locationLabel: string;
    city: string;
    countryCode: string;
    countryName: string;
    prestigeLabel: string;
    metagameLabel: string;
    notes: string[];
  };
  decks: Array<{
    playerName: string;
    placement: number;
    record: string;
    sourceUrl: string;
    legendName: string;
    champion: Array<{ name: string; quantity: number }>;
    runes: Array<{ name: string; quantity: number }>;
    battlefields: Array<{ name: string; quantity: number }>;
    main: Array<{ name: string; quantity: number }>;
  }>;
};

const eventName = "CCS Riftbound $10,000 Tournament";
const eventSlug = "ccs-riftbound-10000-tournament";
const eventId = `event-${eventSlug}`;
const eventSourceUrl = "https://topdeck.gg/event/ccs-riftbound-10000-tournament";
const captureId = "capture-topdeck-ccs-riftbound-10000-top8-curated";
const sourceCoverageSummary =
  "Pilot built from the public TopDeck event page and 8 public TopDeck top-cut deck pages for CCS Riftbound $10,000 Tournament.";
const pilotAssumptions = [
  "This pilot reflects the captured public Top 8 deck pages for one event, not a full historical archive.",
  "Legend percentages are computed from the 8 included tournament decks in this pilot slice.",
  "Event attendance is left unknown until a trustworthy public value is captured."
];

const pilotDeckSeeds: PilotDeckSeed[] = [
  {
    id: "deck-ccs-10000-collin-kaiser-1st",
    playerName: "Collin Kaiser",
    placement: 1,
    record: "7-0-2",
    sourceUrl: "https://topdeck.gg/deck/ccs-riftbound-10000-tournament/SXGmMuzWdETpN3SYcOrzMCfSqYU2",
    legendName: "Sett, The Boss",
    champion: [{ name: "Sett, The Boss", quantity: 1 }],
    runes: [
      { name: "Body Rune", quantity: 6 },
      { name: "Order Rune", quantity: 6 }
    ],
    battlefields: [
      { name: "Grove of the God-Willow", quantity: 1 },
      { name: "Monastery of Hirana", quantity: 1 },
      { name: "The Dreaming Tree", quantity: 1 }
    ],
    main: [
      { name: "Cithria of Cloudfield", quantity: 3 },
      { name: "Daring Poro", quantity: 1 },
      { name: "Pit Rookie", quantity: 3 },
      { name: "First Mate", quantity: 3 },
      { name: "Fiora, Victorious", quantity: 3 },
      { name: "Kinkou Monk", quantity: 2 },
      { name: "Qiyana, Victorious", quantity: 2 },
      { name: "Sett, Kingpin", quantity: 3 },
      { name: "Lee Sin, Centered", quantity: 2 },
      { name: "Sabotage", quantity: 2 },
      { name: "Showstopper", quantity: 3 },
      { name: "Challenge", quantity: 3 },
      { name: "Hidden Blade", quantity: 2 },
      { name: "Call to Glory", quantity: 3 },
      { name: "Primal Strength", quantity: 2 },
      { name: "Arena Bar", quantity: 3 }
    ]
  },
  {
    id: "deck-ccs-10000-db-lunaloveee-2nd",
    playerName: "db_lunaloveee",
    placement: 2,
    record: "7-1-1",
    sourceUrl: "https://topdeck.gg/deck/ccs-riftbound-10000-tournament/ePtJjEXWPzLudY1wWxJc9nts0203",
    legendName: "Master Yi, Wuju Bladesman",
    champion: [{ name: "Master Yi, Wuju Bladesman", quantity: 1 }],
    runes: [
      { name: "Body Rune", quantity: 6 },
      { name: "Calm Rune", quantity: 6 }
    ],
    battlefields: [
      { name: "Grove of the God-Willow", quantity: 1 },
      { name: "Obelisk of Power", quantity: 1 },
      { name: "Vilemaw's Lair", quantity: 1 }
    ],
    main: [
      { name: "Clockwork Keeper", quantity: 3 },
      { name: "Pit Rookie", quantity: 3 },
      { name: "Stalwart Poro", quantity: 3 },
      { name: "Wielder of Water", quantity: 2 },
      { name: "Qiyana, Victorious", quantity: 3 },
      { name: "Master Yi, Honed", quantity: 1 },
      { name: "Tasty Faefolk", quantity: 2 },
      { name: "Deadbloom Predator", quantity: 3 },
      { name: "Whiteflame Protector", quantity: 2 },
      { name: "Charm", quantity: 3 },
      { name: "Defy", quantity: 3 },
      { name: "En Garde", quantity: 3 },
      { name: "Discipline", quantity: 3 },
      { name: "Find Your Center", quantity: 3 },
      { name: "Zhonya's Hourglass", quantity: 3 }
    ]
  },
  {
    id: "deck-ccs-10000-dizzee-3rd",
    playerName: "Dizzee",
    placement: 3,
    record: "7-2-0",
    sourceUrl: "https://topdeck.gg/deck/ccs-riftbound-10000-tournament/WCRtuNK6koNLkPrZ6K4VM0IisbB2",
    legendName: "Annie, Dark Child",
    champion: [{ name: "Annie, Dark Child", quantity: 1 }],
    runes: [
      { name: "Chaos Rune", quantity: 5 },
      { name: "Fury Rune", quantity: 7 }
    ],
    battlefields: [
      { name: "The Arena's Greatest", quantity: 1 },
      { name: "The Dreaming Tree", quantity: 1 },
      { name: "Zaun Warrens", quantity: 1 }
    ],
    main: [
      { name: "Pouty Poro", quantity: 3 },
      { name: "Traveling Merchant", quantity: 3 },
      { name: "Vi, Destructive", quantity: 3 },
      { name: "Sneaky Deckhand", quantity: 3 },
      { name: "Annie, Stubborn", quantity: 1 },
      { name: "Kai'Sa, Survivor", quantity: 3 },
      { name: "Darius, Trifarian", quantity: 3 },
      { name: "Cleave", quantity: 3 },
      { name: "Stacked Deck", quantity: 3 },
      { name: "Falling Star", quantity: 1 },
      { name: "Fight or Flight", quantity: 2 },
      { name: "Flash", quantity: 3 },
      { name: "Ride the Wind", quantity: 3 },
      { name: "Void Seeker", quantity: 3 },
      { name: "Scrapheap", quantity: 3 }
    ]
  },
  {
    id: "deck-ccs-10000-joey-paladino-4th",
    playerName: "Joey Paladino",
    placement: 4,
    record: "7-2-0",
    sourceUrl: "https://topdeck.gg/deck/ccs-riftbound-10000-tournament/pms6fqSOkQbihX4ZEYUxqL5G8gD2",
    legendName: "Kai'Sa, Daughter of the Void",
    champion: [{ name: "Kai'Sa, Daughter of the Void", quantity: 1 }],
    runes: [
      { name: "Fury Rune", quantity: 7 },
      { name: "Mind Rune", quantity: 5 }
    ],
    battlefields: [
      { name: "Reaver's Row", quantity: 1 },
      { name: "The Dreaming Tree", quantity: 1 },
      { name: "Zaun Warrens", quantity: 1 }
    ],
    main: [
      { name: "Pouty Poro", quantity: 2 },
      { name: "Ravenbloom Student", quantity: 3 },
      { name: "Watchful Sentry", quantity: 3 },
      { name: "Lecturing Yordle", quantity: 2 },
      { name: "Kai'Sa, Survivor", quantity: 2 },
      { name: "Noxus Hopeful", quantity: 2 },
      { name: "Darius, Trifarian", quantity: 3 },
      { name: "Thousand-Tailed Watcher", quantity: 3 },
      { name: "Cleave", quantity: 3 },
      { name: "Hextech Ray", quantity: 3 },
      { name: "Retreat", quantity: 3 },
      { name: "Stupefy", quantity: 3 },
      { name: "Falling Star", quantity: 3 },
      { name: "Void Seeker", quantity: 2 },
      { name: "Icathian Rain", quantity: 2 },
      { name: "Time Warp", quantity: 1 }
    ]
  },
  {
    id: "deck-ccs-10000-rishi-chaudhary-5th",
    playerName: "Rishi Chaudhary",
    placement: 5,
    record: "7-1-1",
    sourceUrl: "https://topdeck.gg/deck/ccs-riftbound-10000-tournament/olN8aijkmVOKQ20n8bo7bKCWHH62",
    legendName: "Annie, Dark Child",
    champion: [{ name: "Annie, Dark Child", quantity: 1 }],
    runes: [
      { name: "Chaos Rune", quantity: 5 },
      { name: "Fury Rune", quantity: 7 }
    ],
    battlefields: [
      { name: "The Arena's Greatest", quantity: 1 },
      { name: "The Dreaming Tree", quantity: 1 },
      { name: "Zaun Warrens", quantity: 1 }
    ],
    main: [
      { name: "Pouty Poro", quantity: 2 },
      { name: "Traveling Merchant", quantity: 3 },
      { name: "Vi, Destructive", quantity: 3 },
      { name: "Sneaky Deckhand", quantity: 3 },
      { name: "Annie, Stubborn", quantity: 1 },
      { name: "Kai'Sa, Survivor", quantity: 3 },
      { name: "Vayne, Hunter", quantity: 1 },
      { name: "Darius, Trifarian", quantity: 3 },
      { name: "Cleave", quantity: 3 },
      { name: "Stacked Deck", quantity: 3 },
      { name: "Falling Star", quantity: 2 },
      { name: "Fight or Flight", quantity: 2 },
      { name: "Flash", quantity: 3 },
      { name: "Ride the Wind", quantity: 3 },
      { name: "Void Seeker", quantity: 2 },
      { name: "Scrapheap", quantity: 3 }
    ]
  },
  {
    id: "deck-ccs-10000-stan-gasque-6th",
    playerName: "Stan Gasque",
    placement: 6,
    record: "7-1-1",
    sourceUrl: "https://topdeck.gg/deck/ccs-riftbound-10000-tournament/RBjaKYXQc3ezPrdu1QOhMDPpIh93",
    legendName: "Kai'Sa, Daughter of the Void",
    champion: [{ name: "Kai'Sa, Daughter of the Void", quantity: 1 }],
    runes: [
      { name: "Fury Rune", quantity: 7 },
      { name: "Mind Rune", quantity: 5 }
    ],
    battlefields: [
      { name: "Grove of the God-Willow", quantity: 1 },
      { name: "The Dreaming Tree", quantity: 1 },
      { name: "Void Gate", quantity: 1 }
    ],
    main: [
      { name: "Legion Rearguard", quantity: 1 },
      { name: "Pouty Poro", quantity: 1 },
      { name: "Ravenbloom Student", quantity: 3 },
      { name: "Watchful Sentry", quantity: 3 },
      { name: "Lecturing Yordle", quantity: 3 },
      { name: "Kai'Sa, Survivor", quantity: 1 },
      { name: "Noxus Hopeful", quantity: 3 },
      { name: "Darius, Trifarian", quantity: 3 },
      { name: "Thousand-Tailed Watcher", quantity: 3 },
      { name: "Cleave", quantity: 3 },
      { name: "Hextech Ray", quantity: 3 },
      { name: "Retreat", quantity: 3 },
      { name: "Stupefy", quantity: 3 },
      { name: "Falling Star", quantity: 3 },
      { name: "Void Seeker", quantity: 1 },
      { name: "Icathian Rain", quantity: 2 },
      { name: "Time Warp", quantity: 1 }
    ]
  },
  {
    id: "deck-ccs-10000-jonathan-ball-7th",
    playerName: "Jonathan Ball",
    placement: 7,
    record: "7-2-0",
    sourceUrl: "https://topdeck.gg/deck/ccs-riftbound-10000-tournament/o1551UftNsb2TEWATyA7W4GhACI3",
    legendName: "Master Yi, Wuju Bladesman",
    champion: [{ name: "Master Yi, Wuju Bladesman", quantity: 1 }],
    runes: [
      { name: "Body Rune", quantity: 6 },
      { name: "Calm Rune", quantity: 6 }
    ],
    battlefields: [
      { name: "Obelisk of Power", quantity: 1 },
      { name: "The Dreaming Tree", quantity: 1 },
      { name: "Vilemaw's Lair", quantity: 1 }
    ],
    main: [
      { name: "Clockwork Keeper", quantity: 3 },
      { name: "Pit Rookie", quantity: 2 },
      { name: "Stalwart Poro", quantity: 3 },
      { name: "First Mate", quantity: 2 },
      { name: "Qiyana, Victorious", quantity: 2 },
      { name: "Master Yi, Honed", quantity: 1 },
      { name: "Tasty Faefolk", quantity: 3 },
      { name: "Deadbloom Predator", quantity: 2 },
      { name: "Whiteflame Protector", quantity: 3 },
      { name: "Charm", quantity: 3 },
      { name: "Defy", quantity: 3 },
      { name: "En Garde", quantity: 3 },
      { name: "Discipline", quantity: 3 },
      { name: "Find Your Center", quantity: 3 },
      { name: "Mystic Reversal", quantity: 1 },
      { name: "Primal Strength", quantity: 1 },
      { name: "Zhonya's Hourglass", quantity: 2 }
    ]
  },
  {
    id: "deck-ccs-10000-diego-rodriguez-del-valle-8th",
    playerName: "Diego rodriguez del valle",
    placement: 8,
    record: "7-2-0",
    sourceUrl: "https://topdeck.gg/deck/ccs-riftbound-10000-tournament/UCbwCj5GO4cNfOtmnr7uAQFLNyG3",
    legendName: "Annie, Dark Child",
    champion: [{ name: "Annie, Dark Child", quantity: 1 }],
    runes: [
      { name: "Chaos Rune", quantity: 5 },
      { name: "Fury Rune", quantity: 7 }
    ],
    battlefields: [
      { name: "The Arena's Greatest", quantity: 1 },
      { name: "The Dreaming Tree", quantity: 1 },
      { name: "Zaun Warrens", quantity: 1 }
    ],
    main: [
      { name: "Pouty Poro", quantity: 2 },
      { name: "Traveling Merchant", quantity: 3 },
      { name: "Vi, Destructive", quantity: 3 },
      { name: "Sneaky Deckhand", quantity: 3 },
      { name: "Annie, Stubborn", quantity: 1 },
      { name: "Kai'Sa, Survivor", quantity: 3 },
      { name: "Vayne, Hunter", quantity: 1 },
      { name: "Darius, Trifarian", quantity: 3 },
      { name: "Cleave", quantity: 3 },
      { name: "Gust", quantity: 1 },
      { name: "Stacked Deck", quantity: 3 },
      { name: "Falling Star", quantity: 1 },
      { name: "Fight or Flight", quantity: 2 },
      { name: "Flash", quantity: 3 },
      { name: "Ride the Wind", quantity: 3 },
      { name: "Void Seeker", quantity: 2 },
      { name: "Scrapheap", quantity: 3 }
    ]
  }
];

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function deckCard(section: DeckCardRecord["section"], name: string, quantity: number): DeckCardRecord {
  return {
    section,
    quantity,
    cardName: name,
    cardSlug: slugify(name),
    canonicalCardId: slugify(name)
  };
}

function legendSlug(legendName: string) {
  return slugify(legendName);
}

function buildRawSourceDocument(): PilotRawSourceDocument {
  return {
    version: 1,
    event: {
      name: eventName,
      slug: eventSlug,
      sourceUrl: eventSourceUrl,
      startDate: "2025-11-22",
      endDate: "2025-11-23",
      locationLabel: "6009 Memorial Dr, Stone Mountain, GA 30083, USA",
      city: "Stone Mountain",
      countryCode: "US",
      countryName: "United States",
      prestigeLabel: "$10,000 open",
      metagameLabel: "Set 1 competitive event",
      notes: [
        "Manual transcription from approved public TopDeck event and deck pages.",
        "Pilot coverage is limited to the public Top 8 deck pages."
      ]
    },
    decks: pilotDeckSeeds.map((deck) => ({
      playerName: deck.playerName,
      placement: deck.placement,
      record: deck.record,
      sourceUrl: deck.sourceUrl,
      legendName: deck.legendName,
      champion: deck.champion,
      runes: deck.runes,
      battlefields: deck.battlefields,
      main: deck.main
    }))
  };
}

function buildLegendRecords(): LegendRecord[] {
  const seen = new Map<string, LegendRecord>();

  for (const deck of pilotDeckSeeds) {
    const id = `legend-${legendSlug(deck.legendName)}`;
    if (seen.has(id)) continue;
    seen.set(id, {
      id,
      slug: legendSlug(deck.legendName),
      name: deck.legendName
    });
  }

  return [...seen.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function buildDeckRecord(seed: PilotDeckSeed, generatedAt: string): DeckRecord {
  const legendId = `legend-${legendSlug(seed.legendName)}`;
  const deckCards = [
    ...seed.champion.map((card) => deckCard("champion", card.name, card.quantity)),
    ...seed.battlefields.map((card) => deckCard("battlefield", card.name, card.quantity)),
    ...seed.runes.map((card) => deckCard("rune", card.name, card.quantity)),
    ...seed.main.map((card) => deckCard("main", card.name, card.quantity))
  ];

  return {
    id: seed.id,
    slug: slugify(`${seed.playerName}-${seed.legendName}`),
    name: seed.legendName,
    legendId,
    legendName: seed.legendName,
    archetypeId: null,
    archetypeName: null,
    subArchetypeId: null,
    subArchetypeName: null,
    source: {
      kind: "event",
      sourceSite: "topdeck",
      sourceId: seed.sourceUrl.split("/").at(-1) ?? seed.id,
      sourceUrl: seed.sourceUrl,
      eventId,
      placement: seed.placement,
      placementLabel: `${seed.placement}${seed.placement === 1 ? "st" : seed.placement === 2 ? "nd" : seed.placement === 3 ? "rd" : "th"}`,
      playerName: seed.playerName,
      record: seed.record,
      publishedAt: generatedAt
    },
    metagameBucket: "set-1",
    primaryRegion: "na",
    regionBuckets: ["na", "non-cn"],
    provenance: {
      primarySourceKind: "registration",
      primarySourceLabel: "TopDeck public tournament deck page",
      confidence: "high",
      usePolicy: "approved",
      evidence: [
        {
          id: `${seed.id}-deck-page`,
          label: `${seed.playerName} TopDeck deck page`,
          sourceKind: "registration",
          sourceSite: "topdeck",
          sourceUrl: seed.sourceUrl,
          sourceId: seed.sourceUrl.split("/").at(-1) ?? seed.id,
          usePolicy: "approved",
          captureId: null,
          notes: ["Approved public decklist source for the pilot deck record."]
        },
        {
          id: `${seed.id}-event-page`,
          label: "TopDeck public event page",
          sourceKind: "registration",
          sourceSite: "topdeck",
          sourceUrl: eventSourceUrl,
          sourceId: eventSlug,
          usePolicy: "approved",
          captureId: captureId,
          notes: ["Approved public event source anchoring the tournament identity."]
        }
      ],
      notes: ["Pilot decklists are manually transcribed from approved public TopDeck pages."]
    },
    reviewState: {
      status: "verified",
      flags: [],
      reviewedAt: generatedAt,
      reviewer: "stage-1-pilot",
      notes: ["Verified against approved public TopDeck sources for the pilot slice."]
    },
    deckCards,
    captureIds: [captureId]
  };
}

function cardSectionsForDeck(deck: DeckRecord): DeckDetailSnapshot["sections"] {
  const orderedSections: DeckCardRecord["section"][] = ["champion", "battlefield", "rune", "main"];

  return orderedSections.map((section) => ({
    section,
    cards: deck.deckCards
      .filter((card) => card.section === section)
      .map((card) => ({
        cardName: card.cardName,
        cardSlug: card.cardSlug,
        canonicalCardId: card.canonicalCardId,
        quantity: card.quantity
      }))
  }));
}

function inclusionRows(decks: DeckRecord[], section: DeckCardRecord["section"]) {
  const grouped = new Map<string, { cardName: string; cardSlug: string; canonicalCardId: string | null; deckCount: number }>();

  for (const deck of decks) {
    const seenInDeck = new Set<string>();
    for (const card of deck.deckCards.filter((candidate) => candidate.section === section)) {
      if (seenInDeck.has(card.cardSlug)) continue;
      seenInDeck.add(card.cardSlug);
      grouped.set(card.cardSlug, {
        cardName: card.cardName,
        cardSlug: card.cardSlug,
        canonicalCardId: card.canonicalCardId,
        deckCount: (grouped.get(card.cardSlug)?.deckCount ?? 0) + 1
      });
    }
  }

  return [...grouped.values()]
    .sort((left, right) => right.deckCount - left.deckCount || left.cardName.localeCompare(right.cardName))
    .map((row) => ({
      section,
      cardName: row.cardName,
      cardSlug: row.cardSlug,
      canonicalCardId: row.canonicalCardId,
      deckCount: row.deckCount,
      inclusionRate: Number((row.deckCount / decks.length).toFixed(4))
    }));
}

function buildLegendDetail(legend: LegendRecord, decks: DeckRecord[], generatedAt: string): LegendDetailSnapshot {
  const legendDecks = decks
    .filter((deck) => deck.legendId === legend.id)
    .sort((left, right) => (left.source.placement ?? Number.MAX_SAFE_INTEGER) - (right.source.placement ?? Number.MAX_SAFE_INTEGER));

  return {
    kind: "legend-detail",
    generatedAt,
    sourceCoverageSummary,
    legendId: legend.id,
    legendName: legend.name,
    filters: {
      metagameBuckets: ["set-1"],
      regionBuckets: ["na", "non-cn"],
      prestigeLevels: ["premier"]
    },
    canonicalDeckId: legendDecks[0]?.id ?? null,
    recentDecks: legendDecks.map((deck) => ({
      deckId: deck.id,
      deckName: deck.name,
      playerName: deck.source.playerName,
      placementLabel: deck.source.placementLabel,
      eventId: deck.source.eventId,
      eventName,
      startDate: "2025-11-22"
    })),
    inclusionBreakdown: {
      champion: inclusionRows(legendDecks, "champion"),
      battlefield: inclusionRows(legendDecks, "battlefield"),
      rune: inclusionRows(legendDecks, "rune"),
      main: inclusionRows(legendDecks, "main")
    }
  };
}

export function createCcs10kTop8PilotArtifacts(generatedAt = new Date().toISOString()) {
  const rawSource = buildRawSourceDocument();
  const rawSourceJson = JSON.stringify(rawSource, null, 2);
  const rawByteLength = Buffer.byteLength(rawSourceJson, "utf8");
  const legends = buildLegendRecords();
  const decks = pilotDeckSeeds
    .map((deck) => buildDeckRecord(deck, generatedAt))
    .sort((left, right) => (left.source.placement ?? Number.MAX_SAFE_INTEGER) - (right.source.placement ?? Number.MAX_SAFE_INTEGER));

  const event: EventRecord = {
    id: eventId,
    slug: eventSlug,
    name: eventName,
    sourceSite: "topdeck",
    sourceId: eventSlug,
    sourceUrl: eventSourceUrl,
    startDate: "2025-11-22",
    endDate: "2025-11-23",
    city: "Stone Mountain",
    countryCode: "US",
    countryName: "United States",
    attendance: null,
    prestige: "premier",
    metagameBucket: "set-1",
    primaryRegion: "na",
    regionBuckets: ["na", "non-cn"],
    rawFacts: {
      sourceMetagameLabel: "Set 1 competitive event",
      sourceCountryCode: "US",
      sourceCountryLabel: "United States",
      sourcePrestigeLabel: "$10,000 open",
      seasonLabel: "Set 1",
      banWindowLabel: null
    },
    provenance: {
      primarySourceKind: "registration",
      primarySourceLabel: "TopDeck public event page",
      confidence: "high",
      usePolicy: "approved",
      evidence: [
        {
          id: `${eventId}-event-page`,
          label: "TopDeck public event page",
          sourceKind: "registration",
          sourceSite: "topdeck",
          sourceUrl: eventSourceUrl,
          sourceId: eventSlug,
          usePolicy: "approved",
          captureId: captureId,
          notes: ["Approved public event metadata source for the pilot."]
        }
      ],
      notes: ["The pilot event identity comes from the TopDeck public event page."]
    },
    reviewState: {
      status: "verified",
      flags: [],
      reviewedAt: generatedAt,
      reviewer: "stage-1-pilot",
      notes: ["Event metadata verified from an approved public source."]
    },
    standingRows: decks.map((deck) => ({
      placement: deck.source.placement,
      placementLabel: deck.source.placementLabel,
      playerName: deck.source.playerName,
      deckId: deck.id,
      decklistStatus: "present",
      record: deck.source.record
    })),
    captureIds: [captureId]
  };

  const dataset: CanonicalStage1Dataset = {
    version: 1,
    generatedAt,
    sourceCaptures: [
      {
        id: captureId,
        sourceSite: "topdeck",
        sourceUrl: eventSourceUrl,
        sourceIdentifier: `${eventSlug}-top8-pilot`,
        kind: "audit-note",
        capturedAt: generatedAt,
        relativePath: "raw/topdeck/pilot/ccs-riftbound-10000-top8-source.json",
        contentType: "application/json",
        byteLength: rawByteLength,
        sha256: null,
        notes: ["Manual transcription of approved public TopDeck event and top-cut deck pages for the local pilot."]
      }
    ],
    legends,
    events: [event],
    decks
  };

  const overview: MetagameOverviewSnapshot = {
    kind: "metagame-overview",
    generatedAt,
    sourceCoverageSummary,
    filters: {
      metagameBuckets: ["set-1"],
      regionBuckets: ["na", "non-cn"],
      prestigeLevels: ["premier"]
    },
    totalDecks: decks.length,
    legends: legends
      .map((legend) => {
        const deckCount = decks.filter((deck) => deck.legendId === legend.id).length;
        return {
          legendId: legend.id,
          legendName: legend.name,
          deckCount,
          percentage: Number(((deckCount / decks.length) * 100).toFixed(1))
        };
      })
      .sort((left, right) => right.deckCount - left.deckCount || left.legendName.localeCompare(right.legendName))
  };

  const eventIndex: EventIndexSnapshot = {
    kind: "event-index",
    generatedAt,
    sourceCoverageSummary,
    filters: {
      metagameBuckets: ["set-1"],
      regionBuckets: ["na", "non-cn"],
      prestigeLevels: ["premier"]
    },
    events: [
      {
        eventId,
        name: eventName,
        startDate: "2025-11-22",
        attendance: null,
        prestige: "premier",
        metagameBucket: "set-1",
        primaryRegion: "na",
        countryCode: "US"
      }
    ]
  };

  const eventDetail: EventDetailSnapshot = {
    kind: "event-detail",
    generatedAt,
    sourceCoverageSummary,
    eventId,
    name: eventName,
    startDate: "2025-11-22",
    attendance: null,
    prestige: "premier",
    metagameBucket: "set-1",
    primaryRegion: "na",
    placements: decks.map((deck) => ({
      placement: deck.source.placement,
      placementLabel: deck.source.placementLabel,
      playerName: deck.source.playerName,
      deckId: deck.id,
      deckName: deck.name,
      decklistStatus: "present"
    }))
  };

  const legendDetails = legends.map((legend) => buildLegendDetail(legend, decks, generatedAt));
  const deckDetails = decks.map((deck) => ({
    kind: "deck-detail" as const,
    generatedAt,
    sourceCoverageSummary,
    deckId: deck.id,
    deckName: deck.name,
    legendId: deck.legendId,
    legendName: deck.legendName,
    eventId: deck.source.eventId,
    eventName,
    placementLabel: deck.source.placementLabel,
    playerName: deck.source.playerName,
    metagameBucket: deck.metagameBucket,
    primaryRegion: deck.primaryRegion,
    sections: cardSectionsForDeck(deck)
  }));

  const snapshotManifest: SnapshotManifest = {
    version: 1,
    generatedAt,
    sourceCoverageSummary,
    entries: [
      { kind: "metagame-overview", id: "overview", relativePath: "exports/metagame-pilot/overview.json" },
      { kind: "event-index", id: "events", relativePath: "exports/metagame-pilot/events/index.json" },
      { kind: "event-detail", id: eventId, relativePath: `exports/metagame-pilot/events/${eventSlug}.json` },
      ...legendDetails.map((detail) => ({
        kind: "legend-detail" as const,
        id: detail.legendId,
        relativePath: `exports/metagame-pilot/legends/${detail.legendId}.json`
      })),
      ...deckDetails.map((detail) => ({
        kind: "deck-detail" as const,
        id: detail.deckId,
        relativePath: `exports/metagame-pilot/decks/${detail.deckId}.json`
      }))
    ]
  };

  const bundle: MetagamePilotBundle = {
    version: 1,
    generatedAt,
    sourceCoverageSummary,
    assumptions: pilotAssumptions,
    overview,
    eventIndex,
    eventDetails: [eventDetail],
    legendDetails,
    deckDetails
  };

  return {
    rawSource,
    rawSourceJson,
    dataset,
    overview,
    eventIndex,
    eventDetail,
    legendDetails,
    deckDetails,
    snapshotManifest,
    bundle
  };
}
