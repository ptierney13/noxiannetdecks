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
          ? "ring-1 ring-accent/40 bg-surface-2"
          : "bg-surface-1"
      }`}
    >
      {/* Section header — typography carries the hierarchy, no border */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <h2 className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-text-dim flex-1">
          {title}
        </h2>
        <span className="text-[0.65rem] font-mono tabular-nums text-text-dim/60">
          <span className={count >= max ? "text-negative/70" : ""}>{count}</span>
          <span>/{max}</span>
        </span>
      </div>

      {/* Card list */}
      <div className="px-2 pb-3 flex flex-col">
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
        <AddCardsButton onClick={onAddCards} isEmpty={entries.length === 0} />
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
        dimmed ? "opacity-25" : "hover:bg-surface-2"
      }`}
      onPointerDown={(e) => onDragStart(e)}
    >
      {/* Drag handle */}
      <span className="flex-shrink-0 text-text-dim/40 text-xs leading-none cursor-grab active:cursor-grabbing" aria-hidden="true">
        ⠿
      </span>

      {/* Card name */}
      <span className="flex-1 min-w-0 text-[0.82rem] font-medium text-text-secondary truncate">
        {entry.cardName}
      </span>

      {/* Cost — muted, not gold */}
      {entry.cost !== null ? (
        <span className="text-[0.7rem] font-mono text-text-dim tabular-nums flex-shrink-0">
          {entry.cost}
        </span>
      ) : null}

      {/* Quantity stepper — borderless, minimal */}
      <div className="flex items-center gap-0 flex-shrink-0">
        <button
          type="button"
          onClick={() => onAdjustQuantity(-1)}
          className="w-6 h-6 flex items-center justify-center text-[0.7rem] text-text-dim hover:text-text-primary transition-colors rounded"
          aria-label={`Remove one ${entry.cardName}`}
        >
          −
        </button>
        <span className="w-5 text-center text-[0.75rem] font-semibold tabular-nums text-text-secondary">
          {entry.quantity}
        </span>
        <button
          type="button"
          onClick={() => onAdjustQuantity(1)}
          disabled={count >= max}
          className="w-6 h-6 flex items-center justify-center text-[0.7rem] text-text-dim hover:text-text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors rounded"
          aria-label={`Add one ${entry.cardName}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function AddCardsButton({ onClick, isEmpty }: { onClick: () => void; isEmpty: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring text-text-dim hover:text-text-secondary ${
        isEmpty ? "py-8 text-[0.82rem]" : "py-2 text-[0.75rem] mt-1"
      }`}
    >
      <span className="text-sm leading-none">+</span>
      {isEmpty ? "Add cards" : "Add more"}
    </button>
  );
}
