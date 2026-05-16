import { Fragment, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { searchCards } from "./api";
import { useAppError } from "./app/ErrorContext";
import type { CardRecord, QueryDiagnostic } from "./types";

const defaultTierLabels = ["S", "A", "B", "C", "D"] as const;
const tierAccentPairs = [
  { solid: "#c94b4b", soft: "rgba(201,75,75,0.10)" },
  { solid: "#de7c30", soft: "rgba(222,124,48,0.10)" },
  { solid: "#d2ad2b", soft: "rgba(210,173,43,0.10)" },
  { solid: "#7da63d", soft: "rgba(125,166,61,0.10)" },
  { solid: "#4e7cb7", soft: "rgba(78,124,183,0.10)" },
  { solid: "#6a5fb7", soft: "rgba(106,95,183,0.10)" },
  { solid: "#8b5fa3", soft: "rgba(139,95,163,0.10)" }
] as const;

type TierRow = {
  id: string;
  label: string;
};

type TierLane = { kind: "unranked" } | { kind: "row"; rowId: string };

type TierDropTarget = {
  lane: TierLane;
  index: number;
};

type TierPlacements = {
  unrankedIds: string[];
  rowCardIds: Record<string, string[]>;
};

type TierDragState = {
  cardId: string;
  pointerId: number;
  x: number;
  y: number;
  previewWidth: number;
  offsetX: number;
  offsetY: number;
  source: TierLane;
  sourceIndex: number;
  target: TierDropTarget | null;
};

type TierCardButtonProps = {
  card: CardRecord;
  hidden: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

type TierDropSlotProps = {
  lane: TierLane;
  index: number;
  active: boolean;
  betweenCards: boolean;
  expanded: boolean;
};

type TierLaneViewProps = {
  lane: TierLane;
  cardIds: string[];
  cardsById: Map<string, CardRecord>;
  dragState: TierDragState | null;
  label: string;
  testId: string;
  emptyMessage: string;
  onCardPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, cardId: string, lane: TierLane, index: number) => void;
};

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        d="m20.7 19.3-4.2-4.2a7.5 7.5 0 1 0-1.4 1.4l4.2 4.2a1 1 0 0 0 1.4-1.4ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M6 3h10a2 2 0 0 1 2 2v13H8a2 2 0 0 1-2-2V3Zm2 2v11h8V5H8Zm-2 15h12v2H6a4 4 0 0 1-4-4V7h2v11a2 2 0 0 0 2 2Z" fill="currentColor" />
    </svg>
  );
}

function Diagnostics({ diagnostics }: { diagnostics: QueryDiagnostic[] }) {
  if (diagnostics.length === 0) return null;

  return (
    <div className="diagnostics" role="alert">
      <strong>Query needs attention</strong>
      <ul>
        {diagnostics.map((diagnostic, index) => (
          <li key={`${diagnostic.message}-${index}`}>{diagnostic.message}</li>
        ))}
      </ul>
    </div>
  );
}

function createDefaultRows(): TierRow[] {
  return defaultTierLabels.map((label, index) => ({ id: `tier-row-${index + 1}`, label }));
}

function createPlacements(rows: TierRow[], cards: CardRecord[]): TierPlacements {
  return {
    unrankedIds: cards.map((card) => card.id),
    rowCardIds: Object.fromEntries(rows.map((row) => [row.id, []]))
  };
}

function cardLayout(card: CardRecord): "portrait" | "landscape" {
  return card.type.cardtype === "Battlefield" || card.media.layout === "landscape" ? "landscape" : "portrait";
}

function laneKey(lane: TierLane): string {
  return lane.kind === "row" ? lane.rowId : "unranked";
}

function lanesMatch(left: TierLane, right: TierLane): boolean {
  if (left.kind === "unranked" && right.kind === "unranked") return true;
  if (left.kind === "row" && right.kind === "row") return left.rowId === right.rowId;
  return false;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function laneCards(placements: TierPlacements, lane: TierLane): string[] {
  return lane.kind === "unranked" ? placements.unrankedIds : placements.rowCardIds[lane.rowId] ?? [];
}

function clonePlacements(placements: TierPlacements): TierPlacements {
  return {
    unrankedIds: [...placements.unrankedIds],
    rowCardIds: Object.fromEntries(Object.entries(placements.rowCardIds).map(([rowId, ids]) => [rowId, [...ids]]))
  };
}

function moveCard(placements: TierPlacements, cardId: string, source: TierLane, sourceIndex: number, target: TierDropTarget): TierPlacements {
  const next = clonePlacements(placements);
  const sourceCards = laneCards(next, source);
  const actualSourceIndex = sourceCards.indexOf(cardId);

  if (actualSourceIndex === -1) return placements;

  sourceCards.splice(actualSourceIndex, 1);

  const targetCards = laneCards(next, target.lane);
  let insertIndex = clamp(target.index, 0, targetCards.length);

  if (lanesMatch(source, target.lane) && actualSourceIndex < target.index) {
    insertIndex -= 1;
  }

  targetCards.splice(clamp(insertIndex, 0, targetCards.length), 0, cardId);

  if (lanesMatch(source, target.lane) && actualSourceIndex === sourceIndex && actualSourceIndex === clamp(target.index, 0, sourceCards.length + 1)) {
    return placements;
  }

  return next;
}

function tierQueryLabel(query: string): string {
  return query.trim() ? query : "All cards";
}

function tierAccent(index: number): { solid: string; soft: string } {
  return tierAccentPairs[index % tierAccentPairs.length];
}

function TierCardButton({ card, hidden, onPointerDown }: TierCardButtonProps) {
  const layout = cardLayout(card);

  return (
    <button
      type="button"
      className="tier-card-button"
      data-layout={layout}
      data-hidden={hidden ? "true" : "false"}
      data-testid={`tier-card-${card.id}`}
      aria-label={`Drag ${card.riot_name}`}
      title={card.riot_name}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={onPointerDown}
    >
      {card.media.image_url ? (
        <img
          src={card.media.image_url}
          alt={card.media.accessibility_text ?? card.riot_name}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
        />
      ) : (
        <div className="missing-image">{card.riot_name}</div>
      )}
    </button>
  );
}

function TierDropSlot({ lane, index, active, betweenCards, expanded }: TierDropSlotProps) {
  return (
    <div
      className="tier-drop-slot"
      data-tier-drop-slot="true"
      data-tier-lane-kind={lane.kind}
      data-tier-row-id={lane.kind === "row" ? lane.rowId : undefined}
      data-tier-drop-index={index}
      data-active={active ? "true" : "false"}
      data-between-cards={betweenCards ? "true" : "false"}
      data-expanded={expanded ? "true" : "false"}
      data-testid={`tier-drop-${laneKey(lane)}-${index}`}
    />
  );
}

function readLaneFromElement(element: HTMLElement): TierLane | null {
  const laneKind = element.dataset.tierLaneKind;

  if (laneKind === "unranked") return { kind: "unranked" };
  if (laneKind === "row" && element.dataset.tierRowId) {
    return { kind: "row", rowId: element.dataset.tierRowId };
  }

  return null;
}

function readTargetFromSlotElement(element: HTMLElement): TierDropTarget | null {
  const lane = readLaneFromElement(element);
  const index = Number(element.dataset.tierDropIndex ?? "");

  if (!lane || Number.isNaN(index)) return null;
  return { lane, index };
}

function pointInRect(rect: DOMRect, x: number, y: number): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function slotDistance(slot: HTMLElement, x: number, y: number): number {
  const rect = slot.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.hypot(centerX - x, centerY - y);
}

function resolveTargetFromPoint(clientX: number, clientY: number): TierDropTarget | null {
  if (typeof document === "undefined") return null;

  const elementsFromPoint = typeof document.elementsFromPoint === "function"
    ? document.elementsFromPoint(clientX, clientY)
    : [];

  const directSlot = elementsFromPoint.find(
    (element): element is HTMLElement => element instanceof HTMLElement && element.dataset.tierDropSlot === "true"
  );
  if (directSlot) return readTargetFromSlotElement(directSlot);

  const activeTrack =
    elementsFromPoint.find(
      (element): element is HTMLElement => element instanceof HTMLElement && element.dataset.tierTrack === "true"
    ) ??
    [...document.querySelectorAll<HTMLElement>("[data-tier-track='true']")].find((track) =>
      pointInRect(track.getBoundingClientRect(), clientX, clientY)
    );

  if (!activeTrack) return null;

  const slots = [...activeTrack.querySelectorAll<HTMLElement>("[data-tier-drop-slot='true']")];
  if (slots.length === 0) return null;

  const nearestSlot = slots.reduce((closest, candidate) => (
    slotDistance(candidate, clientX, clientY) < slotDistance(closest, clientX, clientY) ? candidate : closest
  ));

  return readTargetFromSlotElement(nearestSlot);
}

function resolveTargetFromEventTarget(target: EventTarget | null): TierDropTarget | null {
  if (!(target instanceof HTMLElement)) return null;

  const slot = target.closest<HTMLElement>("[data-tier-drop-slot='true']");
  if (slot) return readTargetFromSlotElement(slot);

  const track = target.closest<HTMLElement>("[data-tier-track='true']");
  if (!track) return null;

  const slots = [...track.querySelectorAll<HTMLElement>("[data-tier-drop-slot='true']")];
  if (slots.length === 0) return null;

  return readTargetFromSlotElement(slots.at(-1) ?? slots[0]);
}

function resolveDropTarget(clientX: number, clientY: number, eventTarget: EventTarget | null): TierDropTarget | null {
  return resolveTargetFromPoint(clientX, clientY) ?? resolveTargetFromEventTarget(eventTarget);
}

function TierLaneView({
  lane,
  cardIds,
  cardsById,
  dragState,
  label,
  testId,
  emptyMessage,
  onCardPointerDown
}: TierLaneViewProps) {
  const activeTarget = dragState?.target;
  const isDragging = dragState !== null;
  const isEmpty = cardIds.length === 0;

  return (
    <div className="tier-lane-surface" aria-label={label} data-testid={testId}>
      <div
        className="tier-card-track"
        data-empty={isEmpty ? "true" : "false"}
        data-tier-track="true"
        data-tier-lane-kind={lane.kind}
        data-tier-row-id={lane.kind === "row" ? lane.rowId : undefined}
      >
        {isEmpty ? (
          <TierDropSlot
            lane={lane}
            index={0}
            active={Boolean(activeTarget && lanesMatch(activeTarget.lane, lane) && activeTarget.index === 0)}
            betweenCards={false}
            expanded
          />
        ) : (
          <>
            <TierDropSlot
              lane={lane}
              index={0}
              active={Boolean(activeTarget && lanesMatch(activeTarget.lane, lane) && activeTarget.index === 0)}
              betweenCards={false}
              expanded={false}
            />
            {cardIds.map((cardId, index) => {
              const card = cardsById.get(cardId);
              if (!card) return null;

              return (
                <Fragment key={cardId}>
                  <div
                    className="tier-card-shell"
                    data-tier-card-shell="true"
                    data-tier-lane-kind={lane.kind}
                    data-tier-row-id={lane.kind === "row" ? lane.rowId : undefined}
                    data-tier-index={index}
                    data-layout={cardLayout(card)}
                  >
                    <TierCardButton
                      card={card}
                      hidden={dragState?.cardId === card.id}
                      onPointerDown={(event) => onCardPointerDown(event, card.id, lane, index)}
                    />
                  </div>
                  <TierDropSlot
                    lane={lane}
                    index={index + 1}
                    active={Boolean(activeTarget && lanesMatch(activeTarget.lane, lane) && activeTarget.index === index + 1)}
                    betweenCards={index + 1 < cardIds.length}
                    expanded={false}
                  />
                </Fragment>
              );
            })}
          </>
        )}
        {isEmpty ? <div className="tier-empty-target">{isDragging ? "Drop cards here" : emptyMessage}</div> : null}
      </div>
    </div>
  );
}

function TierDragPreview({ dragState, card }: { dragState: TierDragState | null; card: CardRecord | null }) {
  if (!dragState || !card) return null;

  const layout = cardLayout(card);

  return (
    <div
      className="tier-drag-preview"
      data-layout={layout}
      data-testid="tier-drag-preview"
      style={{
        left: dragState.x - dragState.offsetX,
        top: dragState.y - dragState.offsetY,
        width: dragState.previewWidth
      } as CSSProperties}
    >
      {card.media.image_url ? (
        <img src={card.media.image_url} alt={card.media.accessibility_text ?? card.riot_name} />
      ) : (
        <div className="missing-image">{card.riot_name}</div>
      )}
    </div>
  );
}

export default function TierListView() {
  const setError = useAppError();
  const [draftQuery, setDraftQuery] = useState("");
  const [generatedCards, setGeneratedCards] = useState<CardRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<QueryDiagnostic[]>([]);
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [normalizedGeneratedQuery, setNormalizedGeneratedQuery] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rows, setRows] = useState<TierRow[]>(() => createDefaultRows());
  const [placements, setPlacements] = useState<TierPlacements>(() => createPlacements(createDefaultRows(), []));
  const [dragState, setDragState] = useState<TierDragState | null>(null);
  const nextRowId = useRef(defaultTierLabels.length + 1);
  const dragStateRef = useRef<TierDragState | null>(null);
  const dragHandleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    if (!dragState) return;

    function handlePointerMove(event: PointerEvent) {
      setDragState((current) => {
        if (!current || current.pointerId !== event.pointerId) {
          return current;
        }

        event.preventDefault();

        return {
          ...current,
          x: event.clientX,
          y: event.clientY,
          target: resolveDropTarget(event.clientX, event.clientY, event.target)
        };
      });
    }

    function finishDrag(event: PointerEvent) {
      const current = dragStateRef.current;
      if (!current || current.pointerId !== event.pointerId) return;

      if (
        dragHandleRef.current &&
        typeof dragHandleRef.current.hasPointerCapture === "function" &&
        dragHandleRef.current.hasPointerCapture(event.pointerId)
      ) {
        dragHandleRef.current.releasePointerCapture(event.pointerId);
      }

      const fallbackTarget = { lane: current.source, index: current.sourceIndex };
      setPlacements((existing) => moveCard(existing, current.cardId, current.source, current.sourceIndex, current.target ?? fallbackTarget));
      dragHandleRef.current = null;
      setDragState(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [dragState?.pointerId]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;

    if (dragState) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [dragState]);

  const cardsById = useMemo(() => new Map(generatedCards.map((card) => [card.id, card])), [generatedCards]);
  const draggedCard = dragState ? cardsById.get(dragState.cardId) ?? null : null;
  const bannerQueryLabel = tierQueryLabel(normalizedGeneratedQuery || generatedQuery);
  const hasRankedCards = generatedCards.length > placements.unrankedIds.length;

  async function generateTierList() {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await searchCards(draftQuery);
      setGeneratedCards(result.items);
      setDiagnostics(result.diagnostics);
      setGeneratedQuery(draftQuery);
      setNormalizedGeneratedQuery(result.normalizedQuery);
      setPlacements(createPlacements(rows, result.items));
      setDragState(null);
      setHasGenerated(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tier list generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void generateTierList();
  }

  function handleCardPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    cardId: string,
    lane: TierLane,
    index: number
  ) {
    if (event.button !== 0) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    dragHandleRef.current = event.currentTarget;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; window listeners still keep dragging functional.
    }

    setDragState({
      cardId,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      previewWidth: Math.max(rect.width, 96),
      offsetX: rect.width ? event.clientX - rect.left : 24,
      offsetY: rect.height ? event.clientY - rect.top : 32,
      source: lane,
      sourceIndex: index,
      target: { lane, index }
    });
  }

  function addRow() {
    const rowId = `tier-row-${nextRowId.current}`;
    nextRowId.current += 1;

    setRows((current) => [...current, { id: rowId, label: `Tier ${current.length + 1}` }]);
    setPlacements((current) => ({
      ...current,
      rowCardIds: {
        ...current.rowCardIds,
        [rowId]: []
      }
    }));
  }

  function updateRowLabel(rowId: string, label: string) {
    setRows((current) => current.map((row) => row.id === rowId ? { ...row, label } : row));
  }

  function removeRow(rowId: string) {
    if (rows.length === 1) return;

    setRows((current) => current.filter((row) => row.id !== rowId));
    setPlacements((current) => {
      const removedCards = current.rowCardIds[rowId] ?? [];
      const { [rowId]: _removed, ...remainingRows } = current.rowCardIds;

      return {
        unrankedIds: [...current.unrankedIds, ...removedCards],
        rowCardIds: remainingRows
      };
    });
  }

  function resetRankings() {
    setDragState(null);
    setPlacements(createPlacements(rows, generatedCards));
  }

  return (
    <>
      <section className="search-panel tier-generator-panel" aria-labelledby="tier-list-heading">
        <div className="search-copy">
          <p className="eyebrow">Noxian Netdecks</p>
          <h1 id="tier-list-heading">Tier List</h1>
        </div>
        <form className="search-form" onSubmit={handleSubmit}>
          <label htmlFor="tier-list-query-input">Query</label>
          <div className="search-row">
            <input
              id="tier-list-query-input"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder='t:legend s:OGN'
              autoComplete="off"
            />
            <button type="submit" disabled={isGenerating}>
              <CardsIcon />
              <span>{isGenerating ? "Generating" : "Generate"}</span>
            </button>
          </div>
        </form>
      </section>

      <Diagnostics diagnostics={diagnostics} />

      {hasGenerated ? (
        <section className="tier-builder" data-dragging={dragState ? "true" : "false"}>
          <div className="tier-query-banner" role="status" aria-live="polite">
            <span className="tier-query-title">Tier List for <code>{bannerQueryLabel}</code></span>
            <span className="tier-query-meta">{generatedCards.length.toLocaleString()} cards</span>
          </div>

          <div className="tier-toolbar">
            <div className="section-heading compact">
              <h2>Tier List Editor</h2>
            </div>
            <button type="button" className="text-button strong" onClick={addRow}>
              <SearchIcon />
              <span>Add Row</span>
            </button>
          </div>

          <div className="tier-editor" data-testid="tier-editor">
            {rows.map((row, index) => {
              const accent = tierAccent(index);
              const lane: TierLane = { kind: "row", rowId: row.id };

              return (
                <div
                  className="tier-row"
                  key={row.id}
                  data-testid={`tier-row-shell-${row.id}`}
                  style={{
                    "--tier-accent": accent.solid,
                    "--tier-accent-soft": accent.soft
                  } as CSSProperties}
                >
                  <div className="tier-row-label-panel">
                    <label className="tier-row-label-stack">
                      <span className="tier-row-label-caption">Tier</span>
                      <input
                        aria-label={`${row.label || "Untitled"} row label`}
                        className="tier-row-label-input"
                        value={row.label}
                        onChange={(event) => updateRowLabel(row.id, event.target.value)}
                        placeholder="Tier"
                      />
                    </label>
                  </div>

                  <TierLaneView
                    lane={lane}
                    cardIds={placements.rowCardIds[row.id] ?? []}
                    cardsById={cardsById}
                    dragState={dragState}
                    label={`${row.label || "Untitled"} tier row`}
                    testId={`tier-row-${row.id}`}
                    emptyMessage="Drop cards into this tier"
                    onCardPointerDown={handleCardPointerDown}
                  />

                  {rows.length > 1 ? (
                    <button
                      type="button"
                      className="tier-row-remove-button"
                      aria-label={`Remove ${row.label || "untitled"} row`}
                      onClick={() => removeRow(row.id)}
                    >
                      <span aria-hidden="true">X</span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <section className="tier-unranked-panel" aria-labelledby="tier-unranked-heading" data-dragging={dragState ? "true" : "false"}>
            <div className="tier-unranked-header">
              <h2 id="tier-unranked-heading">Unmatched Cards</h2>
              <div className="tier-unranked-actions">
                <span className="tier-query-meta">{placements.unrankedIds.length.toLocaleString()} unranked</span>
                <button
                  type="button"
                  className="text-button strong"
                  disabled={!hasRankedCards}
                  onClick={resetRankings}
                >
                  Reset Rankings
                </button>
              </div>
            </div>

            <TierLaneView
              lane={{ kind: "unranked" }}
              cardIds={placements.unrankedIds}
              cardsById={cardsById}
              dragState={dragState}
              label="Unmatched cards"
              testId="tier-unranked-lane"
              emptyMessage="All generated cards are currently ranked"
              onCardPointerDown={handleCardPointerDown}
            />
          </section>
        </section>
      ) : (
        <section className="tier-empty-state">
          <CardsIcon />
          <h2>Generate a filtered card pool</h2>
          <p>Use the card search query language above, then generate a tier list editor from those exact matching cards.</p>
        </section>
      )}

      <TierDragPreview dragState={dragState} card={draggedCard} />
    </>
  );
}
