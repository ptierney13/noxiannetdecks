import { useState, useEffect } from "react";
import { ModalShell } from "../../ui-elements";
import { searchCards } from "../../api";
import { useDebounce } from "../../lib/useDebounce";
import type { CardRecord } from "../../types";

type CardPickerModalProps = {
  title: string;
  filterQuery: string;
  onSelect: (card: CardRecord) => void;
  onClose: () => void;
};

export function CardPickerModal({ title, filterQuery, onSelect, onClose }: CardPickerModalProps) {
  const [userQuery, setUserQuery] = useState("");
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const debouncedUserQuery = useDebounce(userQuery, 260);

  const combinedQuery = [filterQuery, debouncedUserQuery.trim()]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    searchCards(combinedQuery)
      .then((result) => {
        if (!cancelled) {
          setCards(result.items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [combinedQuery]);

  return (
    <ModalShell
      label={title}
      onClose={onClose}
      panelClassName="flex flex-col max-h-[82vh]"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3 pr-14">
        <h2 className="text-[0.78rem] font-bold tracking-[0.08em] uppercase text-accent-warm/80 mb-3">
          {title}
        </h2>
        {/* Simple search input */}
        <div className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-inset px-3 h-11 focus-within:border-border-strong transition-colors">
          <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-text-primary placeholder:text-text-dim [&::-webkit-search-cancel-button]:hidden"
            placeholder="Filter cards…"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {userQuery ? (
            <button
              type="button"
              className="text-text-tertiary hover:text-text-secondary text-xs flex-shrink-0 leading-none"
              onClick={() => setUserQuery("")}
              aria-label="Clear"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {loading ? (
          <div className="py-10 text-center text-sm text-text-tertiary">Loading…</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-negative">Failed to load cards</div>
        ) : cards.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-tertiary">No cards found</div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                onClick={() => {
                  onSelect(card);
                  onClose();
                }}
              >
                <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-surface-inset">
                  {card.media.image_url ? (
                    <img
                      src={card.media.image_url}
                      alt={card.riot_name}
                      className="w-full h-[120px] object-cover object-top"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate leading-tight">
                    {card.riot_name}
                  </div>
                  <div className="text-xs text-text-tertiary truncate leading-tight mt-0.5">
                    {card.type.typeline}
                  </div>
                </div>
                {card.attributes.cost !== null ? (
                  <span className="text-xs font-mono text-accent-warm flex-shrink-0">
                    {card.attributes.cost}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
