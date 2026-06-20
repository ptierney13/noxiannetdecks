import { CardSlot } from "./CardSlot";
import type { DraftDeckCard } from "./DeckEditorTypes";
import { BATTLEFIELD_SLOT_LABELS } from "./DeckEditorTypes";

type BattlefieldSlot = (DraftDeckCard & { enabled: boolean }) | null;

type BattlefieldRowProps = {
  slots: [BattlefieldSlot, BattlefieldSlot, BattlefieldSlot];
  onSlotClick: (index: number) => void;
  onToggleEnabled: (index: number) => void;
};

function SlotCell({
  slot,
  label,
  onSlotClick,
  onToggleEnabled,
}: {
  slot: BattlefieldSlot;
  label: string;
  onSlotClick: () => void;
  onToggleEnabled: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <CardSlot
        label={label}
        card={slot}
        onClick={onSlotClick}
        fullImage
        hideName
      />
      {/* Label + enabled toggle */}
      <div className="flex items-center justify-center gap-1.5 py-0.5">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={slot?.enabled ?? true}
            disabled={!slot}
            onChange={onToggleEnabled}
            className="w-3 h-3 rounded-sm accent-accent cursor-pointer disabled:cursor-default disabled:opacity-30"
          />
          <span
            className={`text-[0.65rem] font-semibold tracking-[0.04em] uppercase leading-none ${
              slot ? "text-text-tertiary" : "text-text-dim"
            }`}
          >
            {label}
          </span>
        </label>
      </div>
    </div>
  );
}

export function BattlefieldRow({ slots, onSlotClick, onToggleEnabled }: BattlefieldRowProps) {
  const [game1, play, draw] = slots;
  const [label0, label1, label2] = BATTLEFIELD_SLOT_LABELS;

  return (
    /*
     * Mobile: 3 equal columns in one row.
     * lg+: 2-row layout — Game 1 centered on top, Play/Draw side by side below.
     * We use CSS grid: 3 cols on mobile, 2 cols on lg.
     * Game 1 spans both lg columns and is self-centered.
     */
    <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
      {/* Game 1 — col 1 of 3 on mobile; spans 2 cols on lg, centered */}
      <div className="lg:col-span-2 lg:flex lg:justify-center">
        <div className="w-full lg:w-1/2">
          <SlotCell
            slot={game1}
            label={label0}
            onSlotClick={() => onSlotClick(0)}
            onToggleEnabled={() => onToggleEnabled(0)}
          />
        </div>
      </div>
      {/* Play */}
      <div>
        <SlotCell
          slot={play}
          label={label1}
          onSlotClick={() => onSlotClick(1)}
          onToggleEnabled={() => onToggleEnabled(1)}
        />
      </div>
      {/* Draw */}
      <div>
        <SlotCell
          slot={draw}
          label={label2}
          onSlotClick={() => onSlotClick(2)}
          onToggleEnabled={() => onToggleEnabled(2)}
        />
      </div>
    </div>
  );
}
