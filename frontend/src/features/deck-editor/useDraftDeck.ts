import { useState, useCallback } from "react";
import type { DraftDeck, DraftDeckCard, DraftDeckListEntry, DeckSection } from "./DeckEditorTypes";
import { MAINDECK_MAX, SIDEBOARD_MAX, RUNE_TOTAL } from "./DeckEditorTypes";

const STORAGE_KEY = "noxiannet:deck:draft";

function emptyDeck(): DraftDeck {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    legend: null,
    champion: null,
    runes: null,
    battlefields: [null, null, null],
    maindeck: [],
    sideboard: [],
  };
}

function loadFromStorage(): DraftDeck {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDeck();
    const parsed = JSON.parse(raw) as DraftDeck;
    if (parsed.version !== 1) return emptyDeck();
    while (parsed.battlefields.length < 3) parsed.battlefields.push(null);
    return parsed;
  } catch {
    return emptyDeck();
  }
}

function persist(deck: DraftDeck): DraftDeck {
  const stamped = { ...deck, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
  } catch {
    // best-effort
  }
  return stamped;
}

export function useDraftDeck() {
  const [deck, setDeck] = useState<DraftDeck>(loadFromStorage);

  const update = useCallback((mutate: (current: DraftDeck) => DraftDeck) => {
    setDeck((current) => persist(mutate(current)));
  }, []);

  const setLegend = useCallback(
    (card: (DraftDeckCard & { domain: string[] }) | null) => {
      update((d) => {
        const runes =
          card && card.domain.length >= 2
            ? {
                leftDomain: card.domain[0]!,
                leftCount: 6,
                rightDomain: card.domain[1]!,
                rightCount: 6,
              }
            : null;
        // Clearing legend resets champion and runes
        return { ...d, legend: card, runes, champion: null };
      });
    },
    [update],
  );

  const setChampion = useCallback(
    (card: DraftDeckCard | null) => {
      update((d) => ({ ...d, champion: card }));
    },
    [update],
  );

  const setBattlefield = useCallback(
    (index: number, card: DraftDeckCard | null) => {
      update((d) => {
        const battlefields = [...d.battlefields] as DraftDeck["battlefields"];
        battlefields[index] = card ? { ...card, enabled: true } : null;
        return { ...d, battlefields };
      });
    },
    [update],
  );

  const toggleBattlefieldEnabled = useCallback(
    (index: number) => {
      update((d) => {
        const battlefields = [...d.battlefields] as DraftDeck["battlefields"];
        const slot = battlefields[index];
        if (slot) battlefields[index] = { ...slot, enabled: !slot.enabled };
        return { ...d, battlefields };
      });
    },
    [update],
  );

  // Move 1 rune from right → left
  const shiftRuneLeft = useCallback(() => {
    update((d) => {
      if (!d.runes || d.runes.rightCount <= 1) return d;
      return {
        ...d,
        runes: {
          ...d.runes,
          leftCount: d.runes.leftCount + 1,
          rightCount: d.runes.rightCount - 1,
        },
      };
    });
  }, [update]);

  // Move 1 rune from left → right
  const shiftRuneRight = useCallback(() => {
    update((d) => {
      if (!d.runes || d.runes.leftCount <= 1) return d;
      return {
        ...d,
        runes: {
          ...d.runes,
          rightCount: d.runes.rightCount + 1,
          leftCount: d.runes.leftCount - 1,
        },
      };
    });
  }, [update]);

  const addCard = useCallback(
    (section: DeckSection, entry: Omit<DraftDeckListEntry, "quantity">) => {
      update((d) => {
        const list = [...d[section]];
        const max = section === "maindeck" ? MAINDECK_MAX : SIDEBOARD_MAX;
        const totalQty = list.reduce((s, r) => s + r.quantity, 0);
        if (totalQty >= max) return d;
        const idx = list.findIndex((r) => r.cardId === entry.cardId);
        if (idx >= 0) {
          list[idx] = { ...list[idx]!, quantity: list[idx]!.quantity + 1 };
        } else {
          list.push({ ...entry, quantity: 1 });
        }
        return { ...d, [section]: list };
      });
    },
    [update],
  );

  const adjustQuantity = useCallback(
    (section: DeckSection, cardId: string, delta: number) => {
      update((d) => {
        const list = [...d[section]];
        const idx = list.findIndex((r) => r.cardId === cardId);
        if (idx < 0) return d;
        const max = section === "maindeck" ? MAINDECK_MAX : SIDEBOARD_MAX;
        const totalQty = list.reduce((s, r) => s + r.quantity, 0);
        if (delta > 0 && totalQty >= max) return d;
        const newQty = list[idx]!.quantity + delta;
        if (newQty <= 0) {
          list.splice(idx, 1);
        } else {
          list[idx] = { ...list[idx]!, quantity: newQty };
        }
        return { ...d, [section]: list };
      });
    },
    [update],
  );

  const moveCardBetweenSections = useCallback(
    (cardId: string, fromSection: DeckSection, toSection: DeckSection) => {
      if (fromSection === toSection) return;
      update((d) => {
        const from = [...d[fromSection]];
        const to = [...d[toSection]];
        const fromIdx = from.findIndex((r) => r.cardId === cardId);
        if (fromIdx < 0) return d;
        const toMax = toSection === "maindeck" ? MAINDECK_MAX : SIDEBOARD_MAX;
        const toTotal = to.reduce((s, r) => s + r.quantity, 0);
        if (toTotal >= toMax) return d;
        const card = from[fromIdx]!;
        if (card.quantity <= 1) {
          from.splice(fromIdx, 1);
        } else {
          from[fromIdx] = { ...card, quantity: card.quantity - 1 };
        }
        const toIdx = to.findIndex((r) => r.cardId === cardId);
        if (toIdx >= 0) {
          to[toIdx] = { ...to[toIdx]!, quantity: to[toIdx]!.quantity + 1 };
        } else {
          to.push({ cardId: card.cardId, cardName: card.cardName, cost: card.cost, quantity: 1 });
        }
        return { ...d, [fromSection]: from, [toSection]: to };
      });
    },
    [update],
  );

  const maindeckCount = deck.maindeck.reduce((s, r) => s + r.quantity, 0);
  const sideboardCount = deck.sideboard.reduce((s, r) => s + r.quantity, 0);

  return {
    deck,
    setLegend,
    setChampion,
    setBattlefield,
    toggleBattlefieldEnabled,
    shiftRuneLeft,
    shiftRuneRight,
    addCard,
    adjustQuantity,
    moveCardBetweenSections,
    maindeckCount,
    sideboardCount,
    runeTotal: RUNE_TOTAL,
  };
}
