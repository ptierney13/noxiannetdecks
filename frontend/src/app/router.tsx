import { createRootRoute, createRoute, createRouter, useNavigate } from "@tanstack/react-router";
import AppShell from "./AppShell";
import { HomePage } from "../pages/home";
import { NotFoundView } from "../pages/legacy/NotFoundView";
import CardSearchView from "../pages/CardSearchView";
import LearnToSearchView from "../pages/legacy/LearnToSearchView";
import QueryBuilderView from "../pages/legacy/QueryBuilderView";
import CardDetailView from "../pages/legacy/CardDetailView";
import DeckExplorerView from "../pages/legacy/DeckExplorerView";
import TierListView from "../pages/legacy/TierListView";
import SealedSimulator from "../pages/legacy/SealedSimulator";
import TradeBalancerView from "../pages/legacy/TradeBalancerView";

export const rootRoute = createRootRoute({ component: AppShell });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function HomeRoute() {
    const navigate = useNavigate();
    return (
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
    );
  },
});

const cardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards",
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: () => <CardSearchView />,
});

const cardsLearnToSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards/learn-to-search",
  component: () => <LearnToSearchView />,
});

const cardsQueryBuilderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards/query-builder",
  component: () => <QueryBuilderView />,
});

const cardDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards/$cardId",
  component: function CardDetailRoute() {
    const { cardId } = cardDetailRoute.useParams();
    return <CardDetailView cardId={cardId} />;
  },
});

const deckExplorerIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer",
  component: () => <DeckExplorerView section={{ kind: "home" }} />,
});

const deckExplorerEventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events",
  component: () => <DeckExplorerView section={{ kind: "events" }} />,
});

const deckExplorerEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events/$eventId",
  component: function DeckExplorerEventRoute() {
    const { eventId } = deckExplorerEventRoute.useParams();
    return <DeckExplorerView section={{ kind: "event", eventId }} />;
  },
});

const deckExplorerEventDeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events/$eventId/decks/$deckId",
  component: function DeckExplorerEventDeckRoute() {
    const { eventId, deckId } = deckExplorerEventDeckRoute.useParams();
    return <DeckExplorerView section={{ kind: "event-deck", eventId, deckId }} />;
  },
});

const deckExplorerDeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/decks/$deckId",
  component: function DeckExplorerDeckRoute() {
    const { deckId } = deckExplorerDeckRoute.useParams();
    return <DeckExplorerView section={{ kind: "deck", deckId }} />;
  },
});

const deckExplorerLegendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/legends",
  component: () => <DeckExplorerView section={{ kind: "legends" }} />,
});

const deckExplorerLegendRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/legends/$legendSlug",
  component: function DeckExplorerLegendRoute() {
    const { legendSlug } = deckExplorerLegendRoute.useParams();
    return <DeckExplorerView section={{ kind: "legend", legendSlug }} />;
  },
});

const toolsTierListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tools/tier-list",
  component: () => <TierListView />,
});

const toolsSealedPoolsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tools/sealed-pools",
  component: () => <SealedSimulator />,
});

const toolsTradeBalancerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "tools/trade-balancer",
  component: function TradeBalancerRoute() {
    const navigate = useNavigate();
    return <TradeBalancerView onNavigate={(path) => void navigate({ href: path })} />;
  },
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: () => <NotFoundView />,
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
