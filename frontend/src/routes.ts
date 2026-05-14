export type AppRoute =
  | { kind: "home"; path: "/" | "/home" }
  | { kind: "cards"; path: "/cards" }
  | { kind: "cards-learn-to-search"; path: "/cards/learn-to-search" }
  | { kind: "cards-query-builder"; path: "/cards/query-builder" }
  | { kind: "card-detail"; path: string; cardId: string }
  | { kind: "deck-explorer-home"; path: "/deck-explorer" }
  | { kind: "deck-explorer-events"; path: "/deck-explorer/events" }
  | { kind: "deck-explorer-event"; path: string; eventId: string }
  | { kind: "deck-explorer-event-deck"; path: string; eventId: string; deckId: string }
  | { kind: "deck-explorer-deck"; path: string; deckId: string }
  | { kind: "deck-explorer-legends"; path: "/deck-explorer/legends" }
  | { kind: "deck-explorer-legend"; path: string; legendSlug: string }
  | { kind: "tools-tier-list"; path: "/tools/tier-list" }
  | { kind: "tools-sealed-pools"; path: "/tools/sealed-pools" }
  | { kind: "tools-trade-balancer"; path: "/tools/trade-balancer" }
  | { kind: "not-found"; path: string };

export type NavSection = "home" | "cards" | "deck-explorer" | "tools-tier-list" | "tools-sealed-pools" | "tools-trade-balancer" | "not-found";

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return trimmed.length === 0 ? "/" : trimmed;
}

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function parseAppRoute(pathname: string): AppRoute {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/" || normalizedPath === "/home") {
    return { kind: "home", path: normalizedPath as "/" | "/home" };
  }

  if (normalizedPath === "/cards") {
    return { kind: "cards", path: "/cards" };
  }

  if (normalizedPath === "/cards/learn-to-search") {
    return { kind: "cards-learn-to-search", path: "/cards/learn-to-search" };
  }

  if (normalizedPath === "/cards/query-builder") {
    return { kind: "cards-query-builder", path: "/cards/query-builder" };
  }

  const segments = normalizedPath.split("/").filter(Boolean).map(decodeSegment);

  if (segments[0] === "cards" && segments.length === 2) {
    return { kind: "card-detail", path: normalizedPath, cardId: segments[1] };
  }

  if (segments[0] === "deck-explorer") {
    if (segments.length === 1) {
      return { kind: "deck-explorer-home", path: "/deck-explorer" };
    }

    if (segments[1] === "events") {
      if (segments.length === 2) {
        return { kind: "deck-explorer-events", path: "/deck-explorer/events" };
      }

      if (segments.length === 3) {
        return {
          kind: "deck-explorer-event",
          path: normalizedPath,
          eventId: segments[2]
        };
      }

      if (segments.length === 5 && segments[3] === "decks") {
        return {
          kind: "deck-explorer-event-deck",
          path: normalizedPath,
          eventId: segments[2],
          deckId: segments[4]
        };
      }
    }

    if (segments[1] === "decks" && segments.length === 3) {
      return {
        kind: "deck-explorer-deck",
        path: normalizedPath,
        deckId: segments[2]
      };
    }

    if (segments[1] === "legends") {
      if (segments.length === 2) {
        return { kind: "deck-explorer-legends", path: "/deck-explorer/legends" };
      }

      if (segments.length === 3) {
        return {
          kind: "deck-explorer-legend",
          path: normalizedPath,
          legendSlug: segments[2]
        };
      }
    }
  }

  if (normalizedPath === "/tools/tier-list") {
    return { kind: "tools-tier-list", path: "/tools/tier-list" };
  }

  if (normalizedPath === "/tools/sealed-pools") {
    return { kind: "tools-sealed-pools", path: "/tools/sealed-pools" };
  }

  if (normalizedPath === "/tools/trade-balancer") {
    return { kind: "tools-trade-balancer", path: "/tools/trade-balancer" };
  }

  return { kind: "not-found", path: normalizedPath };
}

export function routeSection(route: AppRoute): NavSection {
  switch (route.kind) {
    case "home":
      return "home";
    case "cards":
    case "cards-learn-to-search":
    case "cards-query-builder":
    case "card-detail":
      return "cards";
    case "deck-explorer-home":
    case "deck-explorer-events":
    case "deck-explorer-event":
    case "deck-explorer-event-deck":
    case "deck-explorer-deck":
    case "deck-explorer-legends":
    case "deck-explorer-legend":
      return "deck-explorer";
    case "tools-tier-list":
      return "tools-tier-list";
    case "tools-sealed-pools":
      return "tools-sealed-pools";
    case "tools-trade-balancer":
      return "tools-trade-balancer";
    default:
      return "not-found";
  }
}

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
