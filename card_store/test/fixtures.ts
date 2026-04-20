import type { CardRecord } from "../src/data/schema.js";

type FixtureOverrides = Partial<CardRecord>;

export function makeCard(overrides: FixtureOverrides = {}): CardRecord {
  return {
    id: "fixture-001",
    riftbound_id: "fixture-001",
    tcgplayer_id: null,
    riot_name: "Void Gate",
    clean_name: "void gate",
    collector_number: "1",
    language: "en",
    rarity: "Rare",
    variant: {
      alternate_art: false,
      overnumbered: false,
      signed: false
    },
    finishes: ["foil"],
    attributes: {
      cost: 3,
      energy: 3,
      might: 4,
      power: 2,
      domain: ["Body"]
    },
    type: {
      cardtype: "Unit",
      supertype: null,
      tags: ["Dragon"],
      typeline: "Unit - Dragon"
    },
    text: {
      rich: "Draw a card. A dragon arrives.",
      plain: "Draw a card. A dragon arrives.",
      flavour: null,
      keywords: []
    },
    set: {
      set_id: "OGN",
      label: "Origins"
    },
    media: {
      image_url: "https://example.test/card.png",
      artist: "Example Artist",
      accessibility_text: "Void Gate card image.",
      layout: "portrait"
    },
    ...overrides
  };
}

export const fixtureCards: CardRecord[] = [
  makeCard(),
  makeCard({
    id: "fixture-002",
    riftbound_id: "fixture-002",
    riot_name: "Jinx - Loose Cannon",
    clean_name: "jinx loose cannon",
    collector_number: "2",
    rarity: "Common",
    finishes: ["nonfoil", "foil"],
    attributes: { cost: null, energy: null, might: null, power: null, domain: ["Fury"] },
    type: { cardtype: "Unit", supertype: "Champion", tags: ["Quick", "Jinx"], typeline: "Unit - Champion - Quick - Jinx" },
    text: {
      rich: "When you discard, draw a card.",
      plain: "When you discard, draw a card.",
      flavour: null,
      keywords: []
    },
    media: { image_url: "https://example.test/jinx.png", artist: null, accessibility_text: "Jinx card image.", layout: "portrait" }
  }),
  makeCard({
    id: "fixture-003",
    riftbound_id: "fixture-003",
    riot_name: "Shield Wall",
    clean_name: "shield wall",
    collector_number: "3",
    rarity: "Uncommon",
    finishes: ["nonfoil", "foil"],
    attributes: { cost: 1, energy: 1, might: null, power: null, domain: ["Calm"] },
    type: { cardtype: "Gear", supertype: null, tags: [], typeline: "Gear" },
    text: {
      rich: "[Action] Buff a friendly unit.",
      plain: "[Action] Buff a friendly unit.",
      flavour: null,
      keywords: ["Action"]
    },
    media: { image_url: "https://example.test/shield.png", artist: "Second Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "fixture-004",
    riftbound_id: "fixture-004",
    riot_name: "Alternate Gate",
    clean_name: "alternate gate",
    collector_number: "3a",
    rarity: "Showcase",
    variant: { alternate_art: true, overnumbered: false, signed: false },
    attributes: { cost: 4, energy: 4, might: 5, power: 2, domain: ["Chaos"] },
    type: { cardtype: "Spell", supertype: null, tags: ["Alternate"], typeline: "Spell - Alternate" },
    text: {
      rich: "Alternate art promo.",
      plain: "Alternate art promo.",
      flavour: null,
      keywords: []
    },
    media: { image_url: "https://example.test/alt.png", artist: "Example Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "fixture-005",
    riftbound_id: "fixture-005",
    riot_name: "Signed Gate",
    clean_name: "signed gate",
    collector_number: "4",
    rarity: "Promo",
    variant: { alternate_art: false, overnumbered: true, signed: true },
    attributes: { cost: 2, energy: 2, might: null, power: null, domain: ["Mind"] },
    type: { cardtype: "Spell", supertype: null, tags: [], typeline: "Spell" },
    text: {
      rich: "Signed promo.",
      plain: "Signed promo.",
      flavour: null,
      keywords: []
    },
    media: { image_url: "https://example.test/signed.png", artist: "Example Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "fixture-006",
    riftbound_id: "fixture-006",
    riot_name: "Overnumbered Gate",
    clean_name: "overnumbered gate",
    collector_number: "5",
    rarity: "Promo",
    variant: { alternate_art: false, overnumbered: true, signed: false },
    attributes: { cost: 2, energy: 2, might: null, power: null, domain: ["Order"] },
    type: { cardtype: "Gear", supertype: null, tags: [], typeline: "Gear" },
    text: {
      rich: "Overnumbered promo.",
      plain: "Overnumbered promo.",
      flavour: null,
      keywords: []
    },
    media: { image_url: "https://example.test/on.png", artist: "Example Artist", accessibility_text: null, layout: "portrait" }
  }),
  makeCard({
    id: "fixture-007",
    riftbound_id: "fixture-007",
    riot_name: "Foil Gate",
    clean_name: "foil gate",
    collector_number: "6",
    rarity: "Promo",
    variant: { alternate_art: false, overnumbered: false, signed: false },
    attributes: { cost: 1, energy: 1, might: null, power: null, domain: ["Body"] },
    type: { cardtype: "Spell", supertype: null, tags: [], typeline: "Spell" },
    text: {
      rich: "Foil promo.",
      plain: "Foil promo.",
      flavour: null,
      keywords: []
    },
    media: { image_url: "https://example.test/foil.png", artist: "Example Artist", accessibility_text: null, layout: "portrait" }
  })
];
