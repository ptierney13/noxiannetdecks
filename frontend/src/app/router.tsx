import { createRootRoute, createRoute, createRouter, useNavigate } from "@tanstack/react-router";
import AppShell from "./AppShell";
import { HomePage } from "../pages/home";
import { NotFoundView } from "../pages/NotFoundView";
import CardSearchView from "../pages/CardSearchView";
import LearnToSearchView from "../pages/LearnToSearchView";
import QueryBuilderView from "../pages/QueryBuilderView";
import CardDetailView from "../pages/CardDetailView";
import DeckExplorerView from "../pages/DeckExplorerView";
import TierListView from "../pages/TierListView";
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

const LEARN_TABS = ["visual-guide", "text-guide", "syntax-guide"] as const;
type LearnTab = (typeof LEARN_TABS)[number];

const cardsLearnToSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cards/learn-to-search",
  validateSearch: (search: Record<string, unknown>) => ({
    mode: LEARN_TABS.includes(search.mode as LearnTab)
      ? (search.mode as LearnTab)
      : ("visual-guide" as LearnTab),
  }),
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
  component: () => <DeckExplorerView />,
});

const deckExplorerEventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events",
  component: () => <DeckExplorerView />,
});

const deckExplorerEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events/$eventId",
  component: () => <DeckExplorerView />,
});

const deckExplorerEventDeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/events/$eventId/decks/$deckId",
  component: () => <DeckExplorerView />,
});

const deckExplorerDeckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/decks/$deckId",
  component: () => <DeckExplorerView />,
});

const deckExplorerLegendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/legends",
  component: () => <DeckExplorerView />,
});

const deckExplorerLegendRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "deck-explorer/legends/$legendSlug",
  component: () => <DeckExplorerView />,
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
  component: function NotFoundRoute() {
    const navigate = useNavigate();
    return <NotFoundView onNavigate={(href) => void navigate({ href })} />;
  },
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
