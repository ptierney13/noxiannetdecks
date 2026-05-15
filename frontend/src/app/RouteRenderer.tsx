import { useState } from "react";
import CardDetailViewDefault from "../CardDetailView";
import DeckExplorerView from "../DeckExplorerView";
import LearnToSearchViewDefault from "../LearnToSearchView";
import QueryBuilderView from "../QueryBuilderView";
import SearchViewDefault from "../SearchView";
import SealedSimulatorDefault from "../SealedSimulator";
import TierListView from "../TierListView";
import TradeBalancerView from "../TradeBalancerView";
import { CardQuickLookModal } from "../cardFormat";
import { buildCardDetailPath } from "../routes";
import { HomePage as SiteHomePage } from "../siteSystem";
import type { AppRoute } from "../routes";
import type { CardRecord } from "../types";

function TradeBalancerQuickLookWrapper({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [quickLookCard, setQuickLookCard] = useState<CardRecord | null>(null);
  return (
    <>
      <TradeBalancerView onNavigate={onNavigate} onQuickLook={setQuickLookCard} />
      {quickLookCard && (
        <CardQuickLookModal card={quickLookCard} onClose={() => setQuickLookCard(null)} onNavigate={onNavigate} />
      )}
    </>
  );
}

export default function RouteRenderer({
  route,
  locationSearch,
  onError,
  onNavigate,
  onAppendToSearch,
}: {
  route: AppRoute;
  locationSearch: string;
  onError: (message: string | null) => void;
  onNavigate: (path: string) => void;
  onAppendToSearch: (fragment: string) => void;
}) {
  if (route.kind === "home") {
    return <SiteHomePage onNavigate={onNavigate} />;
  }

  return (
    <main className="app-shell">
      <div className="site-page-shell">
        {route.kind === "cards" ? (
          <SearchViewDefault onError={onError} locationSearch={locationSearch} onNavigate={onNavigate} />
        ) : route.kind === "cards-learn-to-search" ? (
          <LearnToSearchViewDefault onError={onError} onAppendToSearch={onAppendToSearch} />
        ) : route.kind === "cards-query-builder" ? (
          <QueryBuilderView onNavigate={onNavigate} />
        ) : route.kind === "card-detail" ? (
          <CardDetailViewDefault cardId={route.cardId} onError={onError} onNavigate={onNavigate} />
        ) : route.kind === "tools-tier-list" ? (
          <TierListView onError={onError} />
        ) : route.kind === "tools-sealed-pools" ? (
          <SealedSimulatorDefault onError={onError} />
        ) : route.kind === "tools-trade-balancer" ? (
          <TradeBalancerQuickLookWrapper onNavigate={onNavigate} />
        ) : route.kind.startsWith("deck-explorer") ? (
          <DeckExplorerView route={route} onError={onError} onNavigate={onNavigate} />
        ) : (
          <section className="route-panel route-panel--not-found">
            <div className="section-heading">
              <p className="eyebrow">Not Found</p>
              <h1>That page does not exist</h1>
              <p>The current URL is not mapped to Cards, Deck Explorer, or one of the Tools routes.</p>
            </div>
            <nav className="view-tabs" aria-label="Recovery navigation">
              <a href="/cards" onClick={(e) => { e.preventDefault(); onNavigate("/cards"); }}>
                Back to Cards
              </a>
              <a href="/deck-explorer" onClick={(e) => { e.preventDefault(); onNavigate("/deck-explorer"); }}>
                Open Deck Explorer
              </a>
            </nav>
          </section>
        )}
      </div>
    </main>
  );
}
