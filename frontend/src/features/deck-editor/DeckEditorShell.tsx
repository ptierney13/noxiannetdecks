import { useState, useRef, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { useDraftDeck } from "./useDraftDeck";
import { CardSlot } from "./CardSlot";
import { RuneRow } from "./RuneRow";
import { BattlefieldRow } from "./BattlefieldRow";
import { CardListSection } from "./CardListSection";
import { CardPickerModal } from "./CardPickerModal";
import type { DeckListDragState, DeckSection, DraftDeckCard } from "./DeckEditorTypes";
import { MAINDECK_MAX, SIDEBOARD_MAX } from "./DeckEditorTypes";
import type { CardRecord } from "../../types";

type PickerContext =
  | { kind: "legend" }
  | { kind: "champion" }
  | { kind: "battlefield"; index: number }
  | { kind: "maindeck" }
  | { kind: "sideboard" };

function charName(cardName: string): string {
  return cardName.split(" - ")[0].trim();
}

type FilterQueryArgs = {
  ctx: PickerContext;
  legendDomains: string[];
  legendCardName: string | null;
  championCardName: string | null;
};

function buildFilterQuery({ ctx, legendDomains, legendCardName, championCardName }: FilterQueryArgs): string {
  switch (ctx.kind) {
    case "legend": {
      const base = "unique:legal t:legend";
      return championCardName ? `${base} g:"${charName(championCardName)}"` : base;
    }
    case "champion": {
      const domainClause = legendDomains.length > 0 ? ` d:${legendDomains[0]}` : "";
      const tagClause = legendCardName ? ` g:"${charName(legendCardName)}"` : "";
      return `unique:legal supertype:Champion${domainClause}${tagClause}`;
    }
    case "battlefield":
      return "unique:legal ct:Battlefield";
    case "maindeck":
    case "sideboard": {
      if (legendDomains.length === 0) return "ct:Spell";
      if (legendDomains.length === 1) return `ct:Spell d:${legendDomains[0]}`;
      return `ct:Spell (d:${legendDomains[0]} OR d:${legendDomains[1]})`;
    }
  }
}

function buildPickerTitle(ctx: PickerContext): string {
  switch (ctx.kind) {
    case "legend": return "Choose a Legend";
    case "champion": return "Choose a Champion";
    case "battlefield": return "Choose a Battlefield";
    case "maindeck": return "Add to Maindeck";
    case "sideboard": return "Add to Sideboard";
  }
}

function resolveDropSection(x: number, y: number): DeckSection | null {
  const elements = document.elementsFromPoint(x, y);
  for (const el of elements) {
    const section = el instanceof HTMLElement ? el.dataset.deckSection : null;
    if (section === "maindeck" || section === "sideboard") return section;
  }
  return null;
}

export function DeckEditorShell() {
  const {
    deck,
    setLegend,
    setChampion,
    setBattlefield,
    toggleBattlefieldEnabled,
    shiftRuneLeft,
    shiftRuneRight,
    addCard,
    adjustQuantity,
    moveCardBetweenSections,
    maindeckCount,
    sideboardCount,
  } = useDraftDeck();

  const [pickerCtx, setPickerCtx] = useState<PickerContext | null>(null);
  const [deckName, setDeckName] = useState("Untitled Deck");

  // ── Drag state for maindeck ↔ sideboard ──────────────────────────────────
  const [dragState, setDragState] = useState<DeckListDragState | null>(null);
  const dragStateRef = useRef<DeckListDragState | null>(null);
  const dragHandleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    if (!dragState) return;

    function handlePointerMove(e: PointerEvent) {
      setDragState((cur) => {
        if (!cur || cur.pointerId !== e.pointerId) return cur;
        e.preventDefault();
        return {
          ...cur,
          x: e.clientX,
          y: e.clientY,
          targetSection: resolveDropSection(e.clientX, e.clientY),
        };
      });
    }

    function finishDrag(e: PointerEvent) {
      const cur = dragStateRef.current;
      if (!cur || cur.pointerId !== e.pointerId) return;
      if (dragHandleRef.current?.hasPointerCapture(e.pointerId)) {
        dragHandleRef.current.releasePointerCapture(e.pointerId);
      }
      if (cur.targetSection && cur.targetSection !== cur.fromSection) {
        moveCardBetweenSections(cur.cardId, cur.fromSection, cur.targetSection);
      }
      dragHandleRef.current = null;
      setDragState(null);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [dragState?.pointerId, moveCardBetweenSections]);

  useEffect(() => {
    if (!dragState) return;
    const prevSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    return () => {
      document.body.style.userSelect = prevSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [!!dragState]);

  function handleDragStart(
    e: ReactPointerEvent<HTMLElement>,
    cardId: string,
    cardName: string,
    fromSection: DeckSection,
  ) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const el = e.currentTarget;
    dragHandleRef.current = el;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // best-effort
    }
    setDragState({
      cardId,
      cardName,
      fromSection,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      targetSection: fromSection,
    });
  }

  // ── Picker callbacks ──────────────────────────────────────────────────────
  const legendDomains = deck.legend?.domain ?? [];
  const legendCardName = deck.legend?.cardName ?? null;
  const championCardName = deck.champion?.cardName ?? null;

  function handlePickerSelect(card: CardRecord) {
    if (!pickerCtx) return;
    const base: DraftDeckCard = {
      cardId: card.id,
      cardName: card.riot_name,
      imageUrl: card.media.image_url,
    };
    switch (pickerCtx.kind) {
      case "legend":
        setLegend({ ...base, domain: card.attributes.domain });
        break;
      case "champion":
        setChampion(base);
        break;
      case "battlefield":
        setBattlefield(pickerCtx.index, base);
        break;
      case "maindeck":
        addCard("maindeck", { ...base, cost: card.attributes.cost });
        break;
      case "sideboard":
        addCard("sideboard", { ...base, cost: card.attributes.cost });
        break;
    }
  }

  // ── Shared section renderers ──────────────────────────────────────────────

  const legendChampionSection = (
    <div>
      {/* Aligned label row */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1">
          <SectionLabel title="Legend" count={deck.legend ? 1 : 0} max={1} />
        </div>
        <div className="flex-1">
          <SectionLabel title="Champion" count={deck.champion ? 1 : 0} max={1} />
        </div>
      </div>
      {/* Slot row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <CardSlot
            label="Legend"
            card={deck.legend}
            onClick={() => setPickerCtx({ kind: "legend" })}
            fullImage
          />
        </div>
        <div className="flex-1">
          <CardSlot
            label="Champion"
            card={deck.champion}
            onClick={() => setPickerCtx({ kind: "champion" })}
            disabled={!deck.legend}
            fullImage
          />
        </div>
      </div>
    </div>
  );

  const runesSection = (
    <div className="rounded-xl bg-surface-2 py-3 px-4">
      <div className="mb-2">
        <span className="text-[0.75rem] font-bold tracking-[0.06em] uppercase text-accent-warm/75">
          Runes
        </span>
      </div>
      <RuneRow
        runes={deck.runes}
        onShiftLeft={shiftRuneLeft}
        onShiftRight={shiftRuneRight}
      />
    </div>
  );

  const battlefieldsSection = (
    <div>
      <SectionLabel title="Battlefields" count={deck.battlefields.filter(Boolean).length} max={3} className="mb-2" />
      <BattlefieldRow
        slots={deck.battlefields as [any, any, any]}
        onSlotClick={(i) => setPickerCtx({ kind: "battlefield", index: i })}
        onToggleEnabled={toggleBattlefieldEnabled}
      />
    </div>
  );

  const deckNameSection = (
    <div>
      <input
        type="text"
        value={deckName}
        onChange={(e) => setDeckName(e.target.value)}
        className="w-full bg-transparent border-0 outline-none text-[1.15rem] font-bold text-text-primary placeholder:text-text-dim focus:border-b focus:border-border-default pb-0.5"
        placeholder="Untitled Deck"
        aria-label="Deck name"
      />
      <p className="text-[0.68rem] text-text-dim mt-0.5">
        {deck.updatedAt
          ? `Saved ${new Date(deck.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "Not saved"}
      </p>
    </div>
  );

  const maindeckSection = (
    <CardListSection
      section="maindeck"
      title="Maindeck"
      entries={deck.maindeck}
      count={maindeckCount}
      max={MAINDECK_MAX}
      onAddCards={() => setPickerCtx({ kind: "maindeck" })}
      onAdjustQuantity={(cardId, delta) => adjustQuantity("maindeck", cardId, delta)}
      dragState={dragState}
      onDragStart={handleDragStart}
      isDropTarget={dragState?.targetSection === "maindeck"}
    />
  );

  const sideboardSection = (
    <CardListSection
      section="sideboard"
      title="Sideboard"
      entries={deck.sideboard}
      count={sideboardCount}
      max={SIDEBOARD_MAX}
      onAddCards={() => setPickerCtx({ kind: "sideboard" })}
      onAdjustQuantity={(cardId, delta) => adjustQuantity("sideboard", cardId, delta)}
      dragState={dragState}
      onDragStart={handleDragStart}
      isDropTarget={dragState?.targetSection === "sideboard"}
    />
  );

  const dragPreview = dragState ? (
    <div
      className="fixed z-50 pointer-events-none select-none"
      style={{
        left: dragState.x - dragState.offsetX,
        top: dragState.y - dragState.offsetY,
        opacity: 0.85,
      }}
    >
      <div className="bg-surface-3 border border-border-strong rounded-lg px-3 py-2 shadow-surface-2 text-sm font-medium text-text-primary whitespace-nowrap">
        {dragState.cardName}
      </div>
    </div>
  ) : null;

  const pickerModal = pickerCtx ? (
    <CardPickerModal
      title={buildPickerTitle(pickerCtx)}
      filterQuery={buildFilterQuery({ ctx: pickerCtx, legendDomains, legendCardName, championCardName })}
      onSelect={handlePickerSelect}
      onClose={() => setPickerCtx(null)}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-app-bg">
      {/*
       * Layout:
       *   Mobile  — single column, all sections stacked.
       *   lg+     — two-column: fixed left pane (hero + runes + battlefields)
       *             and flex right pane (deck name + lists).
       * Left pane is sticky + scrollable so it stays in view while the right
       * pane content scrolls independently.
       */}
      <div className="lg:flex lg:min-h-screen">

        {/* ── Left pane — hero setup ── */}
        <div className="lg:w-[640px] lg:shrink-0 lg:border-r lg:border-border-subtle lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <div className="flex flex-col gap-4 px-3 pt-4 pb-6">
            {legendChampionSection}
            {runesSection}
            {battlefieldsSection}

            {/* Mobile-only: deck lists follow directly below setup sections */}
            <div className="flex flex-col gap-4 lg:hidden">
              {deckNameSection}
              {maindeckSection}
              {sideboardSection}
            </div>
          </div>
        </div>

        {/* ── Right pane — deck lists (desktop only) ── */}
        <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:min-w-0">
          <div className="flex flex-col gap-4 px-6 pt-4 pb-12">
            {deckNameSection}
            {maindeckSection}
            {sideboardSection}
          </div>
        </div>

      </div>

      {dragPreview}
      {pickerModal}
    </div>
  );
}

type SectionLabelProps = {
  title: string;
  count: number;
  max: number;
  className?: string;
};

function SectionLabel({ title, count, max, className = "" }: SectionLabelProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-[0.75rem] font-bold tracking-[0.06em] uppercase text-accent-warm/75">
        {title}
      </span>
      <span className="text-[0.68rem] font-mono text-text-dim tabular-nums">
        {count}/{max}
      </span>
    </div>
  );
}
