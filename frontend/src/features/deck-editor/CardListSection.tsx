import type { PointerEvent as ReactPointerEvent } from "react";
import type { DraftDeckListEntry, DeckSection, DeckListDragState } from "./DeckEditorTypes";

type CardListSectionProps = {
  section: DeckSection;
  title: string;
  entries: DraftDeckListEntry[];
  count: number;
  max: number;
  onAddCards: () => void;
  onAdjustQuantity: (cardId: string, delta: number) => void;
  dragState: DeckListDragState | null;
  onDragStart: (
    e: ReactPointerEvent<HTMLElement>,
    cardId: string,
    cardName: string,
    section: DeckSection,
  ) => void;
  isDropTarget: boolean;
};

export function CardListSection({
  section,
  title,
  entries,
  count,
  max,
  onAddCards,
  onAdjustQuantity,
  dragState,
  onDragStart,
  isDropTarget,
}: CardListSectionProps) {
  const isDraggingFromThis = dragState?.fromSection === section;

  return (
    <section
      data-deck-section={section}
      className={`rounded-xl overflow-hidden transition-colors ${
        isDropTarget && dragState?.fromSection !== section
          ? "ring-2 ring-accent/60 bg-surface-3"
          : "bg-surface-2"
      }`}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2.5 border-b border-border-subtle">
        <h2 className="text-[0.75rem] font-bold tracking-[0.06em] uppercase text-accent-warm/75 flex-1">
          {title}
        </h2>
        <span className="text-[0.72rem] font-mono text-text-tertiary tabular-nums">
          <span className={count >= max ? "text-negative" : "text-text-secondary"}>{count}</span>
          <span className="text-text-dim">/{max}</span>
        </span>
      </div>

      {/* Card list */}
      <div className="px-3 pt-2 pb-1 flex flex-col gap-0.5">
        {entries.length === 0 ? (
          <AddCardsButton onClick={onAddCards} />
        ) : (
          <>
            {entries.map((entry) => {
              const isBeingDragged = isDraggingFromThis && dragState?.cardId === entry.cardId;
              return (
                <CardRow
                  key={entry.cardId}
                  entry={entry}
                  dimmed={isBeingDragged}
                  onAdjustQuantity={(delta) => onAdjustQuantity(entry.cardId, delta)}
                  onDragStart={(e) => onDragStart(e, entry.cardId, entry.cardName, section)}
                  max={max}
                  count={count}
                />
              );
            })}
            <div className="pt-1 pb-2">
              <AddCardsButton onClick={onAddCards} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

type CardRowProps = {
  entry: DraftDeckListEntry;
  dimmed: boolean;
  onAdjustQuantity: (delta: number) => void;
  onDragStart: (e: ReactPointerEvent<HTMLElement>) => void;
  max: number;
  count: number;
};

function CardRow({ entry, dimmed, onAdjustQuantity, onDragStart, max, count }: CardRowProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-opacity touch-none select-none ${
        dimmed ? "opacity-30" : "hover:bg-surface-3"
      }`}
      onPointerDown={(e) => onDragStart(e)}
    >
      {/* Drag handle dots */}
      <span className="flex-shrink-0 text-text-dim text-xs leading-none cursor-grab active:cursor-grabbing" aria-hidden="true">
        ⋮⋮
      </span>

      {/* Card name */}
      <span className="flex-1 min-w-0 text-[0.82rem] font-medium text-text-primary truncate">
        {entry.cardName}
      </span>

      {/* Cost */}
      {entry.cost !== null ? (
        <span className="text-[0.72rem] font-mono text-accent-warm/80 flex-shrink-0 tabular-nums">
          {entry.cost}
        </span>
      ) : null}

      {/* Stacked –/+ quantity controls */}
      <div className="flex flex-col flex-shrink-0 rounded overflow-hidden border border-border-subtle" style={{ minWidth: "28px" }}>
        <button
          type="button"
          onClick={() => onAdjustQuantity(1)}
          disabled={count >= max}
          className="flex items-center justify-center h-5 text-[0.65rem] font-bold text-text-secondary hover:bg-surface-3 hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-b border-border-subtle"
          aria-label={`Add one ${entry.cardName}`}
        >
          +
        </button>
        <span className="flex items-center justify-center h-5 text-[0.72rem] font-bold tabular-nums text-text-primary">
          {entry.quantity}
        </span>
        <button
          type="button"
          onClick={() => onAdjustQuantity(-1)}
          className="flex items-center justify-center h-5 text-[0.65rem] font-bold text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors border-t border-border-subtle"
          aria-label={`Remove one ${entry.cardName}`}
        >
          −
        </button>
      </div>
    </div>
  );
}

function AddCardsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-positive/40 py-2.5 text-[0.78rem] font-semibold text-positive hover:bg-positive-emphasis hover:border-positive/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      <span className="text-base leading-none">+</span>
      Add Cards
    </button>
  );
}
