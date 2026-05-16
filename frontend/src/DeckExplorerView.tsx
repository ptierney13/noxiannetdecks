import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { searchCards } from "./api";
import { manualDeckExplorerEvents, type ManualEventDeckRecord, type ManualEventRecord } from "./deck-explorer/manualData";
import {
  buildDeckExplorerDeckPath,
  buildDeckExplorerEventDeckPath,
  buildDeckExplorerEventPath,
  buildDeckExplorerLegendPath,
} from "./lib";
import { useAppError } from "./app/ErrorContext";
import type { CardRecord } from "./types";

const domainOrder = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] as const;
const setOrder = ["OGN", "SFD", "UNL"] as const;
const manualDataPath = "frontend/src/deck-explorer/manualData.ts";

export type DeckExplorerSection =
  | { kind: "home" }
  | { kind: "events" }
  | { kind: "event"; eventId: string }
  | { kind: "event-deck"; eventId: string; deckId: string }
  | { kind: "deck"; deckId: string }
  | { kind: "legends" }
  | { kind: "legend"; legendSlug: string };

type DeckExplorerViewProps = {
  section: DeckExplorerSection;
};

type IndexedDeckRecord = ManualEventDeckRecord & {
  event: ManualEventRecord;
  legendSlug: string;
};

type LegendDirectoryEntry = {
  slug: string;
  name: string;
  setId: string;
  setLabel: string;
  primaryDomain: string | null;
  domains: string[];
  cardId: string | null;
};

function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function eventDeckSort(left: IndexedDeckRecord, right: IndexedDeckRecord) {
  const leftPlacement = left.placement ?? Number.MAX_SAFE_INTEGER;
  const rightPlacement = right.placement ?? Number.MAX_SAFE_INTEGER;

  if (leftPlacement !== rightPlacement) {
    return leftPlacement - rightPlacement;
  }

  return `${left.playerName ?? ""}|${left.legendName}|${left.id}`.localeCompare(
    `${right.playerName ?? ""}|${right.legendName}|${right.id}`
  );
}

function legendSort(left: LegendDirectoryEntry, right: LegendDirectoryEntry) {
  const leftSetIndex = setOrder.indexOf(left.setId as (typeof setOrder)[number]);
  const rightSetIndex = setOrder.indexOf(right.setId as (typeof setOrder)[number]);
  const normalizedLeftSetIndex = leftSetIndex === -1 ? Number.MAX_SAFE_INTEGER : leftSetIndex;
  const normalizedRightSetIndex = rightSetIndex === -1 ? Number.MAX_SAFE_INTEGER : rightSetIndex;

  if (normalizedLeftSetIndex !== normalizedRightSetIndex) {
    return normalizedLeftSetIndex - normalizedRightSetIndex;
  }

  if (left.setLabel !== right.setLabel) {
    return left.setLabel.localeCompare(right.setLabel);
  }

  const leftDomainIndex = left.primaryDomain ? domainOrder.indexOf(left.primaryDomain as (typeof domainOrder)[number]) : Number.MAX_SAFE_INTEGER;
  const rightDomainIndex = right.primaryDomain ? domainOrder.indexOf(right.primaryDomain as (typeof domainOrder)[number]) : Number.MAX_SAFE_INTEGER;
  const normalizedLeftDomainIndex = leftDomainIndex === -1 ? Number.MAX_SAFE_INTEGER : leftDomainIndex;
  const normalizedRightDomainIndex = rightDomainIndex === -1 ? Number.MAX_SAFE_INTEGER : rightDomainIndex;

  if (normalizedLeftDomainIndex !== normalizedRightDomainIndex) {
    return normalizedLeftDomainIndex - normalizedRightDomainIndex;
  }

  return left.name.localeCompare(right.name);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Date pending";
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function RouteLink({
  href,
  current = false,
  className,
  children
}: {
  href: string;
  current?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    navigate({ href });
  }

  return (
    <a href={href} className={className} aria-current={current ? "page" : undefined} onClick={handleClick}>
      {children}
    </a>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="route-empty">
      <h2>{title}</h2>
      <p>{body}</p>
      <p>
        Add hand-authored events in <code>{manualDataPath}</code>.
      </p>
    </div>
  );
}

export default function DeckExplorerView({ section }: DeckExplorerViewProps) {
  const setError = useAppError();
  const [legendCards, setLegendCards] = useState<CardRecord[]>([]);
  const [isLoadingLegends, setIsLoadingLegends] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadLegendCards() {
      setIsLoadingLegends(true);

      try {
        const response = await searchCards("type:Legend");
        if (ignore) {
          return;
        }

        setLegendCards(response.items);
        setError(null);
      } catch (caught) {
        if (ignore) {
          return;
        }

        setError(caught instanceof Error ? caught.message : "Failed to load legend catalog.");
      } finally {
        if (!ignore) {
          setIsLoadingLegends(false);
        }
      }
    }

    void loadLegendCards();

    return () => {
      ignore = true;
    };
  }, [setError]);

  const indexedDecks = useMemo<IndexedDeckRecord[]>(() => {
    return manualDeckExplorerEvents
      .flatMap((event) =>
        event.decks.map((deck) => ({
          ...deck,
          event,
          legendSlug: deck.legendSlug ?? toSlug(deck.legendName)
        }))
      )
      .sort(eventDeckSort);
  }, []);

  const legends = useMemo<LegendDirectoryEntry[]>(() => {
    const catalogEntries: LegendDirectoryEntry[] = legendCards.map((card) => ({
      slug: toSlug(card.clean_name ?? card.riot_name),
      name: card.riot_name,
      setId: card.set.set_id,
      setLabel: card.set.label,
      primaryDomain: card.attributes.domain[0] ?? null,
      domains: card.attributes.domain,
      cardId: card.id
    }));

    const bySlug = new Map(catalogEntries.map((legend) => [legend.slug, legend]));

    for (const deck of indexedDecks) {
      if (!bySlug.has(deck.legendSlug)) {
        bySlug.set(deck.legendSlug, {
          slug: deck.legendSlug,
          name: deck.legendName,
          setId: "MANUAL",
          setLabel: "Manual Only",
          primaryDomain: null,
          domains: [],
          cardId: null
        });
      }
    }

    return [...bySlug.values()].sort(legendSort);
  }, [indexedDecks, legendCards]);

  const legendCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const deck of indexedDecks) {
      counts.set(deck.legendSlug, (counts.get(deck.legendSlug) ?? 0) + 1);
    }

    return counts;
  }, [indexedDecks]);

  const legendsBySet = useMemo(() => {
    const grouped = new Map<string, { setLabel: string; legends: LegendDirectoryEntry[] }>();

    for (const legend of legends) {
      const existing = grouped.get(legend.setId);
      if (existing) {
        existing.legends.push(legend);
      } else {
        grouped.set(legend.setId, { setLabel: legend.setLabel, legends: [legend] });
      }
    }

    return [...grouped.entries()]
      .sort(([leftSetId, left], [rightSetId, right]) => {
        const leftIndex = setOrder.indexOf(leftSetId as (typeof setOrder)[number]);
        const rightIndex = setOrder.indexOf(rightSetId as (typeof setOrder)[number]);
        const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
        const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

        if (normalizedLeftIndex !== normalizedRightIndex) {
          return normalizedLeftIndex - normalizedRightIndex;
        }

        return left.setLabel.localeCompare(right.setLabel);
      })
      .map(([setId, value]) => ({ setId, setLabel: value.setLabel, legends: value.legends.sort(legendSort) }));
  }, [legends]);

  const deckById = useMemo(() => new Map(indexedDecks.map((deck) => [deck.id, deck])), [indexedDecks]);
  const eventById = useMemo(() => new Map(manualDeckExplorerEvents.map((event) => [event.id, event])), []);

  const activeLegend = section.kind === "legend"
    ? legends.find((legend) => legend.slug === section.legendSlug) ?? null
    : null;
  const activeLegendDecks = activeLegend
    ? indexedDecks.filter((deck) => deck.legendSlug === activeLegend.slug)
    : [];

  const activeEvent = (section.kind === "event" || section.kind === "event-deck")
    ? eventById.get(section.eventId) ?? null
    : null;

  const activeDeck = (section.kind === "deck" || section.kind === "event-deck")
    ? deckById.get(section.deckId) ?? null
    : null;

  const activeSection = (section.kind === "event" || section.kind === "event-deck")
    ? "events"
    : section.kind === "legend"
      ? "legends"
      : section.kind === "home"
        ? "home"
        : section.kind === "deck"
          ? "events"
          : "home";

  function renderHome() {
    const legendsWithEntries = [...legendCounts.values()].filter((count) => count > 0).length;

    return (
      <>
        <section className="route-hero">
          <div className="search-copy">
            <p className="eyebrow">Noxian Netdecks</p>
            <h1>Deck Explorer</h1>
            <p>
              Browse hand-authored tournament data locally, starting with event lists and legend pages.
              This view reads from <code>{manualDataPath}</code> rather than public intake sources.
            </p>
          </div>
          <div className="deck-explorer-summary-grid">
            <article className="summary-card">
              <strong>{manualDeckExplorerEvents.length}</strong>
              <span>Imported events</span>
            </article>
            <article className="summary-card">
              <strong>{indexedDecks.length}</strong>
              <span>Listed entries</span>
            </article>
            <article className="summary-card">
              <strong>{legendsWithEntries}</strong>
              <span>Legends with entries</span>
            </article>
          </div>
        </section>

        <div className="deck-explorer-choice-grid">
          <RouteLink href="/deck-explorer/events" className="deck-explorer-choice">
            <strong>By Event</strong>
            <span>See the events you have imported and drill into placements, players, and linked decks.</span>
          </RouteLink>
          <RouteLink href="/deck-explorer/legends" className="deck-explorer-choice">
            <strong>By Legend</strong>
            <span>Browse every legend by set and color, then open detail pages for whichever ones you are tracking.</span>
          </RouteLink>
        </div>
      </>
    );
  }

  function renderEventsIndex() {
    return (
      <section className="route-panel">
        <div className="section-heading">
          <h1>Events</h1>
          <p>Every event currently entered in the manual Deck Explorer data file.</p>
        </div>
        {manualDeckExplorerEvents.length === 0 ? (
          <EmptyState
            title="No events imported yet"
            body="The event view is ready, but there are no manually entered tournaments to list yet."
          />
        ) : (
          <div className="deck-explorer-list">
            {manualDeckExplorerEvents.map((event) => (
              <RouteLink
                key={event.id}
                href={buildDeckExplorerEventPath(event.id)}
                className="deck-explorer-list-item"
                  >
                <div>
                  <strong>{event.name}</strong>
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="deck-explorer-list-meta">
                  <span>{event.setLabel ?? "Set pending"}</span>
                  <span>{event.attendance ? `${event.attendance} players` : `${event.decks.length} listed entries`}</span>
                </div>
              </RouteLink>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderEventDetail() {
    if (!activeEvent) {
      return (
        <EmptyState
          title="Event not found"
          body="This event route does not match anything in the local manual event file."
        />
      );
    }

    const sortedDecks = [...activeEvent.decks]
      .map((deck) => ({
        ...deck,
        event: activeEvent,
        legendSlug: deck.legendSlug ?? toSlug(deck.legendName)
      }))
      .sort(eventDeckSort);

    return (
      <section className="route-panel">
        <div className="section-heading">
          <p className="eyebrow">Event Detail</p>
          <h1>{activeEvent.name}</h1>
          <p>
            {formatDate(activeEvent.startDate)}
            {activeEvent.regionLabel ? ` • ${activeEvent.regionLabel}` : ""}
            {activeEvent.setLabel ? ` • ${activeEvent.setLabel}` : ""}
          </p>
        </div>
        <div className="deck-explorer-detail-meta">
          <span>{activeEvent.attendance ? `${activeEvent.attendance} players` : "Attendance pending"}</span>
          <span>{sortedDecks.length} listed entries</span>
        </div>
        <div className="event-entry-table" role="table" aria-label={`${activeEvent.name} entries`}>
          <div className="event-entry-row event-entry-row--header" role="row">
            <span role="columnheader">Place</span>
            <span role="columnheader">Player</span>
            <span role="columnheader">Legend</span>
            <span role="columnheader">Deck</span>
          </div>
          {sortedDecks.map((deck) => (
            <div key={deck.id} className="event-entry-row" role="row">
              <span role="cell">{deck.placementLabel ?? (deck.placement ? `${deck.placement}` : "—")}</span>
              <span role="cell">{deck.playerName ?? "Unknown player"}</span>
              <span role="cell">{deck.legendName}</span>
              <span role="cell">
                {deck.status === "available" ? (
                  <RouteLink
                    href={buildDeckExplorerEventDeckPath(activeEvent.id, deck.id)}
                                     >
                    {deck.deckName ?? "Untitled deck"}
                  </RouteLink>
                ) : (
                  "Missing list"
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderDeckDetail() {
    if (!activeDeck) {
      return (
        <EmptyState
          title="Deck not found"
          body="This deck route does not match any available manual deck entry."
        />
      );
    }

    return (
      <section className="route-panel">
        <div className="section-heading">
          <p className="eyebrow">Deck View</p>
          <h1>{activeDeck.deckName ?? activeDeck.legendName}</h1>
          <p>
            {activeDeck.playerName ?? "Unknown player"}
            {activeDeck.placementLabel ? ` • ${activeDeck.placementLabel}` : ""}
            {activeDeck.event ? ` • ${activeDeck.event.name}` : ""}
          </p>
        </div>
        <div className="deck-explorer-detail-meta">
          <RouteLink href={buildDeckExplorerLegendPath(activeDeck.legendSlug)}>
            {activeDeck.legendName}
          </RouteLink>
          {activeDeck.event ? (
            <RouteLink href={buildDeckExplorerEventPath(activeDeck.event.id)}>
              Back to event
            </RouteLink>
          ) : null}
        </div>
        {activeDeck.status !== "available" || !activeDeck.sections || activeDeck.sections.length === 0 ? (
          <EmptyState
            title="Decklist not entered yet"
            body="This placement exists in the event list, but the actual deck contents have not been added yet."
          />
        ) : (
          <div className="deck-section-grid">
            {activeDeck.sections.map((section) => (
              <article key={section.section} className="deck-section-card">
                <h2>{section.section === "main" ? "Main Deck" : section.section[0].toUpperCase() + section.section.slice(1)}</h2>
                {section.cards.length === 0 ? (
                  <p>No cards entered.</p>
                ) : (
                  <ul>
                    {section.cards.map((card) => (
                      <li key={`${section.section}-${card.cardName}`}>
                        <span>{card.cardName}</span>
                        <strong>x{card.quantity}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  function renderLegendsIndex() {
    return (
      <section className="route-panel">
        <div className="section-heading">
          <h1>Legends</h1>
          <p>Organized by set, then kept in a stable domain order within each set.</p>
        </div>
        {isLoadingLegends ? <p className="status-copy">Loading legend catalog...</p> : null}
        <div className="legend-set-stack">
          {legendsBySet.map((setGroup) => (
            <section key={setGroup.setId} className="legend-set-group" aria-labelledby={`legend-set-${setGroup.setId}`}>
              <div className="section-heading compact">
                <h2 id={`legend-set-${setGroup.setId}`}>{setGroup.setLabel}</h2>
                <p>{setGroup.legends.length} legends</p>
              </div>
              <div className="legend-card-grid">
                {setGroup.legends.map((legend) => (
                  <RouteLink
                    key={legend.slug}
                    href={buildDeckExplorerLegendPath(legend.slug)}
                    className="legend-card"
                                     >
                    <strong>{legend.name}</strong>
                    <span>{legend.primaryDomain ?? "Color pending"}</span>
                    <span>{legendCounts.get(legend.slug) ?? 0} linked entries</span>
                  </RouteLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    );
  }

  function renderLegendDetail() {
    if (!activeLegend) {
      return (
        <EmptyState
          title="Legend not found"
          body="This legend route does not match the current card catalog or your manual event data."
        />
      );
    }

    return (
      <section className="route-panel">
        <div className="section-heading">
          <p className="eyebrow">Legend Detail</p>
          <h1>{activeLegend.name}</h1>
          <p>
            {activeLegend.setLabel}
            {activeLegend.domains.length > 0 ? ` • ${activeLegend.domains.join(" / ")}` : ""}
          </p>
        </div>
        {activeLegendDecks.length === 0 ? (
          <EmptyState
            title="No decks added for this legend"
            body="The legend directory is in place, but you have not attached any manual event entries to this legend yet."
          />
        ) : (
          <div className="deck-explorer-list">
            {activeLegendDecks.map((deck) => {
              const href = deck.status === "available"
                ? buildDeckExplorerEventDeckPath(deck.event.id, deck.id)
                : buildDeckExplorerEventPath(deck.event.id);

              return (
                <RouteLink key={deck.id} href={href} className="deck-explorer-list-item">
                  <div>
                    <strong>{deck.deckName ?? deck.event.name}</strong>
                    <span>{deck.playerName ?? "Unknown player"}</span>
                  </div>
                  <div className="deck-explorer-list-meta">
                    <span>{deck.placementLabel ?? "Placement pending"}</span>
                    <span>{deck.status === "available" ? deck.event.name : "Missing list"}</span>
                  </div>
                </RouteLink>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function renderCurrentRoute() {
    switch (section.kind) {
      case "home":
        return renderHome();
      case "events":
        return renderEventsIndex();
      case "event":
        return renderEventDetail();
      case "event-deck":
      case "deck":
        return renderDeckDetail();
      case "legends":
        return renderLegendsIndex();
      case "legend":
        return renderLegendDetail();
      default:
        return null;
    }
  }

  return (
    <section className="deck-explorer-shell">
      <nav className="view-tabs" aria-label="Deck Explorer views">
        <RouteLink
          href="/deck-explorer/events"
          current={activeSection === "events"}
          className="view-tab-link"
        >
          By Event
        </RouteLink>
        <RouteLink
          href="/deck-explorer/legends"
          current={activeSection === "legends"}
          className="view-tab-link"
        >
          By Legend
        </RouteLink>
      </nav>
      {renderCurrentRoute()}
    </section>
  );
}
