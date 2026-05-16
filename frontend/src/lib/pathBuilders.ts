export function buildCardDetailPath(cardId: string): string {
  return `/cards/${encodeURIComponent(cardId)}`;
}

export function buildCardsSearchPath(query: string): string {
  return query.trim().length > 0 ? `/cards?q=${encodeURIComponent(query)}` : "/cards";
}

export function buildDeckExplorerEventPath(eventId: string): string {
  return `/deck-explorer/events/${encodeURIComponent(eventId)}`;
}

export function buildDeckExplorerEventDeckPath(eventId: string, deckId: string): string {
  return `/deck-explorer/events/${encodeURIComponent(eventId)}/decks/${encodeURIComponent(deckId)}`;
}

export function buildDeckExplorerDeckPath(deckId: string): string {
  return `/deck-explorer/decks/${encodeURIComponent(deckId)}`;
}

export function buildDeckExplorerLegendPath(legendSlug: string): string {
  return `/deck-explorer/legends/${encodeURIComponent(legendSlug)}`;
}
