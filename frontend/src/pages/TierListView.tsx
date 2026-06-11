import {
  Fragment,
  useState,
  useMemo,
  useRef,
  useEffect,
  type CSSProperties,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { searchCards } from "../api";
import { useAppError } from "../app/ErrorContext";
import { ModalShell } from "../ui-elements";
import type { CardRecord, QueryDiagnostic } from "../types";

// ── Constants ─────────────────────────────────────────────────────────────────

const defaultTierLabels = ["S", "A", "B", "C", "D"] as const;

const tierAccentPairs = [
  { solid: "#c94b4b", soft: "rgba(201,75,75,0.12)" },
  { solid: "#de7c30", soft: "rgba(222,124,48,0.12)" },
  { solid: "#d2ad2b", soft: "rgba(210,173,43,0.12)" },
  { solid: "#7da63d", soft: "rgba(125,166,61,0.12)" },
  { solid: "#4e7cb7", soft: "rgba(78,124,183,0.12)" },
  { solid: "#6a5fb7", soft: "rgba(106,95,183,0.12)" },
  { solid: "#8b5fa3", soft: "rgba(139,95,163,0.12)" },
] as const;

// Card dimensions that must stay in sync with drag preview sizing
const PORTRAIT_CARD_W = 126;
const LANDSCAPE_CARD_W = 246;
const ROW_HEIGHT = 176;

// ── Types ─────────────────────────────────────────────────────────────────────

type TierRow = { id: string; label: string };
type TierLane = { kind: "unranked" } | { kind: "row"; rowId: string };
type TierDropTarget = { lane: TierLane; index: number };
type TierPlacements = { unrankedIds: string[]; rowCardIds: Record<string, string[]> };
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
  inRow: boolean;
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
  inRow: boolean;
  onCardPointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
    cardId: string,
    lane: TierLane,
    index: number,
  ) => void;
};

// ── Pure helpers ──────────────────────────────────────────────────────────────

function cardLayout(card: CardRecord): "portrait" | "landscape" {
  return card.type.cardtype === "Battlefield" || card.media.layout === "landscape"
    ? "landscape"
    : "portrait";
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
  return lane.kind === "unranked"
    ? placements.unrankedIds
    : placements.rowCardIds[lane.rowId] ?? [];
}

function clonePlacements(placements: TierPlacements): TierPlacements {
  return {
    unrankedIds: [...placements.unrankedIds],
    rowCardIds: Object.fromEntries(
      Object.entries(placements.rowCardIds).map(([id, ids]) => [id, [...ids]]),
    ),
  };
}

function moveCard(
  placements: TierPlacements,
  cardId: string,
  source: TierLane,
  sourceIndex: number,
  target: TierDropTarget,
): TierPlacements {
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

  if (
    lanesMatch(source, target.lane) &&
    actualSourceIndex === sourceIndex &&
    actualSourceIndex === clamp(target.index, 0, sourceCards.length + 1)
  ) {
    return placements;
  }

  return next;
}

function createDefaultRows(): TierRow[] {
  return defaultTierLabels.map((label, index) => ({ id: `tier-row-${index + 1}`, label }));
}

function createPlacements(rows: TierRow[], cards: CardRecord[]): TierPlacements {
  return {
    unrankedIds: cards.map((card) => card.id),
    rowCardIds: Object.fromEntries(rows.map((row) => [row.id, []])),
  };
}

function tierAccent(index: number) {
  return tierAccentPairs[index % tierAccentPairs.length];
}

function tierQueryLabel(query: string): string {
  return query.trim() ? query : "All cards";
}

// ── Drag resolution ───────────────────────────────────────────────────────────

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
  return Math.hypot(rect.left + rect.width / 2 - x, rect.top + rect.height / 2 - y);
}

function resolveTargetFromPoint(clientX: number, clientY: number): TierDropTarget | null {
  if (typeof document === "undefined") return null;

  const elementsFromPoint =
    typeof document.elementsFromPoint === "function"
      ? document.elementsFromPoint(clientX, clientY)
      : [];

  const directSlot = elementsFromPoint.find(
    (el): el is HTMLElement => el instanceof HTMLElement && el.dataset.tierDropSlot === "true",
  );
  if (directSlot) return readTargetFromSlotElement(directSlot);

  const activeTrack =
    elementsFromPoint.find(
      (el): el is HTMLElement => el instanceof HTMLElement && el.dataset.tierTrack === "true",
    ) ??
    [...document.querySelectorAll<HTMLElement>("[data-tier-track='true']")].find((track) =>
      pointInRect(track.getBoundingClientRect(), clientX, clientY),
    );

  if (!activeTrack) return null;

  const slots = [...activeTrack.querySelectorAll<HTMLElement>("[data-tier-drop-slot='true']")];
  if (slots.length === 0) return null;

  const nearestSlot = slots.reduce((closest, candidate) =>
    slotDistance(candidate, clientX, clientY) < slotDistance(closest, clientX, clientY)
      ? candidate
      : closest,
  );

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

function resolveDropTarget(
  clientX: number,
  clientY: number,
  eventTarget: EventTarget | null,
): TierDropTarget | null {
  return resolveTargetFromPoint(clientX, clientY) ?? resolveTargetFromEventTarget(eventTarget);
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CardsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false" width="16" height="16">
      <path
        d="M6 3h10a2 2 0 0 1 2 2v13H8a2 2 0 0 1-2-2V3Zm2 2v11h8V5H8Zm-2 15h12v2H6a4 4 0 0 1-4-4V7h2v11a2 2 0 0 0 2 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false" width="15" height="15">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false" width="15" height="15">
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false" width="14" height="14">
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Diagnostics({ diagnostics }: { diagnostics: QueryDiagnostic[] }) {
  if (diagnostics.length === 0) return null;
  return (
    <div
      className="rounded-lg border border-[var(--color-negative-border)] bg-[var(--color-negative-soft)] px-4 py-3 text-sm"
      role="alert"
    >
      <strong className="font-semibold text-text-primary">Query needs attention</strong>
      <ul className="mt-2 list-disc space-y-0.5 pl-4 text-text-secondary">
        {diagnostics.map((d, i) => (
          <li key={`${d.message}-${i}`}>{d.message}</li>
        ))}
      </ul>
    </div>
  );
}

function TierCardButton({ card, hidden, inRow, onPointerDown }: TierCardButtonProps) {
  const layout = cardLayout(card);
  const widthPx = layout === "landscape" ? LANDSCAPE_CARD_W : PORTRAIT_CARD_W;

  return (
    <button
      type="button"
      className="relative block shrink-0 cursor-grab overflow-hidden rounded-lg border-0 p-0 select-none data-[hidden=true]:pointer-events-none data-[hidden=true]:opacity-0"
      style={{ width: widthPx, height: ROW_HEIGHT }}
      data-layout={layout}
      data-hidden={hidden ? "true" : "false"}
      data-testid={`tier-card-${card.id}`}
      aria-label={`Drag ${card.riot_name}`}
      title={card.riot_name}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
    >
      {card.media.image_url ? (
        <img
          src={card.media.image_url}
          alt={card.media.accessibility_text ?? card.riot_name}
          className="block h-full w-full object-cover shadow-[0_10px_24px_rgba(0,0,0,0.5)] pointer-events-none select-none"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-2 p-2 text-center text-xs font-semibold text-text-secondary">
          {card.riot_name}
        </div>
      )}
    </button>
  );
}

function TierDropSlot({ lane, index, active, betweenCards, expanded }: TierDropSlotProps) {
  return (
    <div
      className={[
        "shrink-0 transition-[width,opacity] duration-100",
        expanded ? "w-2" : betweenCards ? "w-1" : "w-0.5",
        active ? "w-5 rounded bg-accent/60" : "",
      ].join(" ")}
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

function TierLaneView({
  lane,
  cardIds,
  cardsById,
  dragState,
  label,
  testId,
  emptyMessage,
  inRow,
  onCardPointerDown,
}: TierLaneViewProps) {
  const activeTarget = dragState?.target;
  const isDragging = dragState !== null;
  const isEmpty = cardIds.length === 0;

  return (
    <div
      className="flex flex-1 overflow-hidden"
      aria-label={label}
      data-testid={testId}
    >
      <div
        className="flex flex-1 flex-wrap content-start items-center gap-0 px-2 py-2 select-none"
        style={{ minHeight: ROW_HEIGHT }}
        data-empty={isEmpty ? "true" : "false"}
        data-tier-track="true"
        data-tier-lane-kind={lane.kind}
        data-tier-row-id={lane.kind === "row" ? lane.rowId : undefined}
      >
        {isEmpty ? (
          <>
            <TierDropSlot
              lane={lane}
              index={0}
              active={Boolean(
                activeTarget && lanesMatch(activeTarget.lane, lane) && activeTarget.index === 0,
              )}
              betweenCards={false}
              expanded
            />
            <div className="flex flex-1 items-center justify-center px-4 text-sm text-text-dim">
              {isDragging ? "Drop cards here" : emptyMessage}
            </div>
          </>
        ) : (
          <>
            <TierDropSlot
              lane={lane}
              index={0}
              active={Boolean(
                activeTarget && lanesMatch(activeTarget.lane, lane) && activeTarget.index === 0,
              )}
              betweenCards={false}
              expanded={false}
            />
            {cardIds.map((cardId, index) => {
              const card = cardsById.get(cardId);
              if (!card) return null;
              return (
                <Fragment key={cardId}>
                  <div
                    className="relative flex shrink-0 items-stretch"
                    data-tier-card-shell="true"
                    data-tier-lane-kind={lane.kind}
                    data-tier-row-id={lane.kind === "row" ? lane.rowId : undefined}
                    data-tier-index={index}
                    data-layout={cardLayout(card)}
                  >
                    <TierCardButton
                      card={card}
                      hidden={dragState?.cardId === card.id}
                      inRow={inRow}
                      onPointerDown={(e) => onCardPointerDown(e, card.id, lane, index)}
                    />
                  </div>
                  <TierDropSlot
                    lane={lane}
                    index={index + 1}
                    active={Boolean(
                      activeTarget &&
                        lanesMatch(activeTarget.lane, lane) &&
                        activeTarget.index === index + 1,
                    )}
                    betweenCards={index + 1 < cardIds.length}
                    expanded={false}
                  />
                </Fragment>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function TierDragPreview({
  dragState,
  card,
}: {
  dragState: TierDragState | null;
  card: CardRecord | null;
}) {
  if (!dragState || !card) return null;
  const layout = cardLayout(card);

  return (
    <div
      className="pointer-events-none fixed z-50 overflow-hidden rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
      data-layout={layout}
      data-testid="tier-drag-preview"
      style={{
        left: dragState.x - dragState.offsetX,
        top: dragState.y - dragState.offsetY,
        width: dragState.previewWidth,
      } as CSSProperties}
    >
      {card.media.image_url ? (
        <img
          src={card.media.image_url}
          alt={card.media.accessibility_text ?? card.riot_name}
          className={["block w-full object-cover", layout === "landscape" ? "[aspect-ratio:1039/744]" : "[aspect-ratio:744/1039]"].join(" ")}
        />
      ) : (
        <div className="flex items-center justify-center bg-surface-2 p-2 text-center text-xs font-semibold text-text-secondary [aspect-ratio:744/1039]">
          {card.riot_name}
        </div>
      )}
    </div>
  );
}

// ── Confirmation modal ────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalShell label={title} onClose={onCancel} showCloseButton={false} panelClassName="max-w-sm">
      <div className="px-7 py-6">
        <h2 className="text-base font-bold text-text-primary">{title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{body}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            className="rounded-lg border border-border-default bg-surface-glass px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
  const [placements, setPlacements] = useState<TierPlacements>(() =>
    createPlacements(createDefaultRows(), []),
  );
  const [dragState, setDragState] = useState<TierDragState | null>(null);
  const [showChangeQueryModal, setShowChangeQueryModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [queryExpanded, setQueryExpanded] = useState(true);

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
        if (!current || current.pointerId !== event.pointerId) return current;
        event.preventDefault();
        return {
          ...current,
          x: event.clientX,
          y: event.clientY,
          target: resolveDropTarget(event.clientX, event.clientY, event.target),
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
      setPlacements((existing) =>
        moveCard(existing, current.cardId, current.source, current.sourceIndex, current.target ?? fallbackTarget),
      );
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

  const cardsById = useMemo(
    () => new Map(generatedCards.map((card) => [card.id, card])),
    [generatedCards],
  );
  const draggedCard = dragState ? (cardsById.get(dragState.cardId) ?? null) : null;
  const bannerQueryLabel = tierQueryLabel(normalizedGeneratedQuery || generatedQuery);
  const hasRankedCards = generatedCards.length > placements.unrankedIds.length;
  const unrankedCount = placements.unrankedIds.length;

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
      setQueryExpanded(false);
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

  function handleChangeQueryConfirm() {
    setShowChangeQueryModal(false);
    setQueryExpanded(true);
  }

  function handleResetConfirm() {
    setShowResetModal(false);
    setDragState(null);
    setPlacements(createPlacements(rows, generatedCards));
  }

  function handleCardPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    cardId: string,
    lane: TierLane,
    index: number,
  ) {
    if (event.button !== 0) return;

    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    dragHandleRef.current = event.currentTarget;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort; window listeners keep dragging functional.
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
      target: { lane, index },
    });
  }

  function addRow() {
    const rowId = `tier-row-${nextRowId.current}`;
    nextRowId.current += 1;
    setRows((current) => [...current, { id: rowId, label: `${current.length + 1}` }]);
    setPlacements((current) => ({
      ...current,
      rowCardIds: { ...current.rowCardIds, [rowId]: [] },
    }));
  }

  function updateRowLabel(rowId: string, label: string) {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, label } : row)));
  }

  function removeRow(rowId: string) {
    if (rows.length === 1) return;
    setRows((current) => current.filter((row) => row.id !== rowId));
    setPlacements((current) => {
      const removedCards = current.rowCardIds[rowId] ?? [];
      const { [rowId]: _removed, ...remainingRows } = current.rowCardIds;
      return { unrankedIds: [...current.unrankedIds, ...removedCards], rowCardIds: remainingRows };
    });
  }

  return (
    <>
      {/* ── Query panel ─────────────────────────────────────────────────────── */}
      <section
        className="relative rounded-[var(--radius-md)] border border-border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0))] bg-surface-1 shadow-[var(--shadow-surface-1)]"
        aria-labelledby="tier-list-heading"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="eyebrow">Tier List Builder</p>
            <h1 id="tier-list-heading" className="text-xl font-bold text-text-primary sm:text-2xl">
              {hasGenerated && !queryExpanded
                ? <>Tier List for <code className="font-mono text-accent-warm text-lg">{bannerQueryLabel}</code></>
                : "Build a Tier List"}
            </h1>
            {hasGenerated && !queryExpanded && (
              <p className="mt-0.5 text-xs text-text-tertiary">
                {generatedCards.length.toLocaleString()} cards
              </p>
            )}
          </div>

          {hasGenerated && !queryExpanded && (
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(197,50,71,0.35)] bg-[rgba(197,50,71,0.09)] px-3.5 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-[rgba(197,50,71,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={() => setShowChangeQueryModal(true)}
            >
              <EditIcon />
              <span>Change Query</span>
            </button>
          )}
        </div>

        {queryExpanded && (
          <div className="border-t border-border-subtle px-5 pb-5 pt-4 sm:px-7">
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="tier-list-query-input"
                className="mb-2 block text-[0.76rem] font-bold uppercase tracking-[0.06em] text-text-secondary"
              >
                Card Search Query
              </label>
              <div className="flex gap-2.5">
                <input
                  id="tier-list-query-input"
                  className="h-10 flex-1 rounded-lg border border-[rgba(255,255,255,0.2)] bg-[linear-gradient(180deg,rgba(18,22,32,0.96),rgba(10,13,20,0.98))] px-3.5 text-sm text-text-primary shadow-[inset_0_1px_2px_rgba(0,0,0,0.36)] placeholder:text-text-tertiary/55 transition hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  placeholder="t:legend s:OGN"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(197,50,71,0.32)] transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <CardsIcon />
                  <span>{isGenerating ? "Generating…" : "Generate Tier List"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <Diagnostics diagnostics={diagnostics} />

      {/* ── Tier editor ─────────────────────────────────────────────────────── */}
      {hasGenerated ? (
        <section
          className="relative overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0))] bg-surface-1 shadow-[var(--shadow-surface-1)]"
          data-dragging={dragState ? "true" : "false"}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
            <h2 className="text-[0.77rem] font-bold uppercase tracking-[0.06em] text-text-secondary">
              Tier Rows
            </h2>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-glass px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={addRow}
            >
              <PlusIcon />
              <span>Add Row</span>
            </button>
          </div>

          {/* Rows */}
          <div className="flex flex-col" data-testid="tier-editor">
            {rows.map((row, index) => {
              const accent = tierAccent(index);
              const lane: TierLane = { kind: "row", rowId: row.id };

              return (
                <div
                  key={row.id}
                  className="group flex min-h-[176px] border-b border-border-subtle last:border-b-0"
                  data-testid={`tier-row-shell-${row.id}`}
                  style={
                    {
                      "--tier-accent": accent.solid,
                      "--tier-accent-soft": accent.soft,
                    } as CSSProperties
                  }
                >
                  {/* Colored label cell */}
                  <div
                    className="relative flex w-14 shrink-0 flex-col items-center justify-center sm:w-16"
                    style={{ backgroundColor: "var(--tier-accent)" } as CSSProperties}
                  >
                    <input
                      aria-label={`${row.label || "Untitled"} row label`}
                      className="w-full bg-transparent text-center text-lg font-black uppercase text-white placeholder:text-white/50 focus:outline-none"
                      value={row.label}
                      onChange={(e) => updateRowLabel(row.id, e.target.value)}
                      placeholder="?"
                      maxLength={4}
                    />
                    {rows.length > 1 && (
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded text-white/70 transition hover:text-white group-hover:flex focus-visible:flex focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
                        aria-label={`Remove ${row.label || "untitled"} row`}
                        onClick={() => removeRow(row.id)}
                      >
                        <span aria-hidden="true" className="text-base leading-none">×</span>
                      </button>
                    )}
                  </div>

                  {/* Card track */}
                  <div
                    className="flex flex-1 items-stretch overflow-hidden"
                    style={{ backgroundColor: "var(--tier-accent-soft)" } as CSSProperties}
                  >
                    <TierLaneView
                      lane={lane}
                      cardIds={placements.rowCardIds[row.id] ?? []}
                      cardsById={cardsById}
                      dragState={dragState}
                      label={`${row.label || "Untitled"} tier row`}
                      testId={`tier-row-${row.id}`}
                      emptyMessage="Drop cards into this tier"
                      inRow
                      onCardPointerDown={handleCardPointerDown}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ── Unranked panel ──────────────────────────────────────────────────── */}
      {hasGenerated ? (
        <section
          className="relative overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0))] bg-surface-1 shadow-[var(--shadow-surface-1)]"
          aria-labelledby="tier-unranked-heading"
          data-dragging={dragState ? "true" : "false"}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
            <h2
              id="tier-unranked-heading"
              className="text-[0.77rem] font-bold uppercase tracking-[0.06em] text-text-secondary"
            >
              Unranked Cards
              {unrankedCount > 0 && (
                <span className="ml-2 rounded-md bg-surface-inset px-1.5 py-0.5 text-[0.7rem] font-bold text-text-tertiary">
                  {unrankedCount.toLocaleString()}
                </span>
              )}
            </h2>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-glass px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              disabled={!hasRankedCards}
              onClick={() => setShowResetModal(true)}
            >
              <ResetIcon />
              <span>Reset Rankings</span>
            </button>
          </div>

          <div className="p-3">
            <TierLaneView
              lane={{ kind: "unranked" }}
              cardIds={placements.unrankedIds}
              cardsById={cardsById}
              dragState={dragState}
              label="Unranked cards"
              testId="tier-unranked-lane"
              emptyMessage="All generated cards are currently ranked"
              inRow={false}
              onCardPointerDown={handleCardPointerDown}
            />
          </div>
        </section>
      ) : (
        /* ── Empty state ──────────────────────────────────────────────────── */
        <section className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-md)] border border-border-subtle bg-surface-1 py-20 text-center shadow-[var(--shadow-surface-1)]">
          <div className="text-text-dim opacity-60">
            <CardsIcon />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Generate a card pool</h2>
            <p className="mt-1.5 max-w-sm text-sm text-text-secondary">
              Enter a card search query above to build a ranked tier list from matching cards.
            </p>
          </div>
        </section>
      )}

      <TierDragPreview dragState={dragState} card={draggedCard} />

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showChangeQueryModal && (
        <ConfirmModal
          title="Change query?"
          body="Changing the query will replace the current card pool and reset all your tier rankings. This can't be undone."
          confirmLabel="Change Query"
          onConfirm={handleChangeQueryConfirm}
          onCancel={() => setShowChangeQueryModal(false)}
        />
      )}
      {showResetModal && (
        <ConfirmModal
          title="Reset all rankings?"
          body="This will move all ranked cards back to unranked. Your tier rows will be kept. This can't be undone."
          confirmLabel="Reset Rankings"
          onConfirm={handleResetConfirm}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </>
  );
}
