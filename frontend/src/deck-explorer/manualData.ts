export type ManualDeckCardSection = "champion" | "battlefield" | "rune" | "main";

export type ManualDeckCardLine = {
  cardName: string;
  quantity: number;
};

export type ManualDeckSection = {
  section: ManualDeckCardSection;
  cards: ManualDeckCardLine[];
};

export type ManualEventDeckRecord = {
  id: string;
  deckName: string | null;
  legendName: string;
  legendSlug?: string;
  playerName: string | null;
  placement: number | null;
  placementLabel: string | null;
  status: "available" | "missing";
  notes?: string | null;
  sections?: ManualDeckSection[];
};

export type ManualEventRecord = {
  id: string;
  name: string;
  startDate: string | null;
  regionLabel?: string | null;
  setLabel?: string | null;
  attendance: number | null;
  notes?: string | null;
  decks: ManualEventDeckRecord[];
};

export const manualDeckExplorerEvents: ManualEventRecord[] = [];

/*
Example shape for local manual entry:

export const manualDeckExplorerEvents: ManualEventRecord[] = [
  {
    id: "my-first-event",
    name: "Local Showdown 1",
    startDate: "2026-04-25",
    regionLabel: "NA",
    setLabel: "Set 3",
    attendance: 24,
    decks: [
      {
        id: "my-first-event-lux-1st",
        deckName: "Lux Midrange",
        legendName: "Lux - Lady of Luminosity",
        playerName: "Player One",
        placement: 1,
        placementLabel: "1st",
        status: "available",
        sections: [
          { section: "champion", cards: [{ cardName: "Lux - Lady of Luminosity", quantity: 1 }] },
          { section: "battlefield", cards: [] },
          { section: "rune", cards: [] },
          { section: "main", cards: [{ cardName: "Flash", quantity: 3 }] }
        ]
      },
      {
        id: "my-first-event-jinx-2nd",
        deckName: null,
        legendName: "Jinx - Rebel",
        playerName: "Player Two",
        placement: 2,
        placementLabel: "2nd",
        status: "missing"
      }
    ]
  }
];
*/
