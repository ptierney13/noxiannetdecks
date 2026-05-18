import { createRootRoute, createRoute, createRouter, useNavigate } from "@tanstack/react-router";
import AppShell from "./AppShell";
import { PageShell } from "../ui";
import { HomePage } from "../home";
import { NotFoundView } from "../ui";
import SearchView from "../SearchView";
import LearnToSearchView from "../LearnToSearchView";
import QueryBuilderView from "../QueryBuilderView";
import CardDetailView from "../CardDetailView";
import DeckExplorerView from "../DeckExplorerView";
import TierListView from "../TierListView";
import SealedSimulator from "../SealedSimulator";
import TradeBalancerView from "../TradeBalancerView";

export const rootRoute = createRootRoute({ component: AppShell });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function HomeRoute() {
    const navigate = useNavigate();
    return (
      <PageShell>
        <HomePage
          onNavigate={(href) => {
            const url = new URL(href, window.location.origin);
            if (url.pathname === "/cards") {
              void navigate({ to: "/cards", search: { q: url.searchParams.get("q") ?? undefined } });
            } else {
              void navigate({ href });
            }
          }}
        />
      </PageShell>
    );
  },
});

const cardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards",
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: () => <PageShell><SearchView /></PageShell>,
});

const cardsLearnToSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards/learn-to-search",
  component: () => <PageShell><LearnToSearchView /></PageShell>,
});

const cardsQueryBuilderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards/query-builder",
  component: () => <PageShell><QueryBuilderView /></PageShell>,
});

const cardDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards/$cardId",
  component: function CardDetailRoute() {
    const { cardId } = cardDetailRoute.useParams();
    return <PageShell><CardDetailView cardId={cardId} /></PageShell>;
  },
});

const deckExplorerIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer",
  component: () => <PageShell><DeckExplorerView section={{ kind: "home" }} /></PageShell>,
});

const deckExplorerEventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events",
  component: () => <PageShell><DeckExplorerView section={{ kind: "events" }} /></PageShell>,
});

const deckExplorerEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events/$eventId",
  component: function DeckExplorerEventRoute() {
    const { eventId } = deckExplorerEventRoute.useParams();
    return <PageShell><DeckExplorerView section={{ kind: "event", eventId }} /></PageShell>;
  },
});

const deckExplorerEventDeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events/$eventId/decks/$deckId",
  component: function DeckExplorerEventDeckRoute() {
    const { eventId, deckId } = deckExplorerEventDeckRoute.useParams();
    return <PageShell><DeckExplorerView section={{ kind: "event-deck", eventId, deckId }} /></PageShell>;
  },
});

const deckExplorerDeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/decks/$deckId",
  component: function DeckExplorerDeckRoute() {
    const { deckId } = deckExplorerDeckRoute.useParams();
    return <PageShell><DeckExplorerView section={{ kind: "deck", deckId }} /></PageShell>;
  },
});

const deckExplorerLegendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/legends",
  component: () => <PageShell><DeckExplorerView section={{ kind: "legends" }} /></PageShell>,
});

const deckExplorerLegendRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/legends/$legendSlug",
  component: function DeckExplorerLegendRoute() {
    const { legendSlug } = deckExplorerLegendRoute.useParams();
    return <PageShell><DeckExplorerView section={{ kind: "legend", legendSlug }} /></PageShell>;
  },
});

const toolsTierListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tools/tier-list",
  component: () => <PageShell><TierListView /></PageShell>,
});

const toolsSealedPoolsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tools/sealed-pools",
  component: () => <PageShell><SealedSimulator /></PageShell>,
});

const toolsTradeBalancerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tools/trade-balancer",
  component: function TradeBalancerRoute() {
    const navigate = useNavigate();
    return <PageShell><TradeBalancerView onNavigate={(path) => void navigate({ href: path })} /></PageShell>;
  },
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => <PageShell><NotFoundView /></PageShell>,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  cardsRoute,
  cardsLearnToSearchRoute,
  cardsQueryBuilderRoute,
  cardDetailRoute,
  deckExplorerIndexRoute,
  deckExplorerEventsRoute,
  deckExplorerEventRoute,
  deckExplorerEventDeckRoute,
  deckExplorerDeckRoute,
  deckExplorerLegendsRoute,
  deckExplorerLegendRoute,
  toolsTierListRoute,
  toolsSealedPoolsRoute,
  toolsTradeBalancerRoute,
  notFoundRoute,
]);

export { routeTree };

export function createAppRouter() {
  return createRouter({ routeTree });
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
