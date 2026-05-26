export default function DeckExplorerView() {
  return (
    <div className="px-[var(--space-shell-x)] pt-10 pb-16 max-w-[var(--content-max-width)] mx-auto">

      {/* Policy disclaimer — top, most prominent */}
      <div className="bg-accent-soft border border-border-accent rounded-[var(--radius-md)] p-5 sm:p-7 mb-12 max-w-[700px]">
        <p className="text-[0.68rem] font-extrabold tracking-[0.1em] uppercase text-accent mb-3">
          Data Philosophy
        </p>
        <div className="space-y-3 text-text-secondary text-[0.92rem] leading-relaxed">
          <p>
            Riot Games has a strict policy against using their APIs for{" "}
            <strong className="text-text-primary font-semibold">meta aggregation</strong>
            {" "}— collecting and publishing winrates, play rates, and popularity statistics derived from match data.
          </p>
          <p>
            I agree with this. Riftbound is a game about having fun with your favorite champions.
            Massive data analysis driven by winrates and popularity numbers works against that spirit
            and can push players toward narrow, optimized metas instead of creative exploration.
          </p>
          <p>
            <strong className="text-text-primary font-semibold">
              This site will not provide metagame analysis, winrate aggregation, or popularity rankings.
            </strong>
          </p>
          <p>
            What I do want to offer is a curated view of{" "}
            <strong className="text-text-primary font-semibold">select successful and proven decks per Legend</strong>
            {" "}— spotlighting builds that have performed well or brought something inventive to the table,
            without reducing the game to a popularity contest.
          </p>
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <p className="eyebrow">Deck Explorer</p>
        <h1 className="text-text-primary text-[2.2rem] sm:text-[2.8rem] font-bold leading-tight tracking-[-0.03em] mt-1 mb-4">
          Coming Soon
        </h1>
        <p className="text-text-secondary text-base leading-relaxed max-w-[500px]">
          Browse curated decks for each Legend — hand-selected from successful showings and innovative
          community builds. No tier lists. No winrates. Just decks worth playing.
        </p>
      </div>

    </div>
  );
}
