import { CardSlot } from "./CardSlot";
import type { DraftDeckCard } from "./DeckEditorTypes";
import { BATTLEFIELD_SLOT_LABELS } from "./DeckEditorTypes";

type BattlefieldSlot = (DraftDeckCard & { enabled: boolean }) | null;

type BattlefieldRowProps = {
  slots: [BattlefieldSlot, BattlefieldSlot, BattlefieldSlot];
  onSlotClick: (index: number) => void;
  onToggleEnabled: (index: number) => void;
};

export function BattlefieldRow({ slots, onSlotClick, onToggleEnabled }: BattlefieldRowProps) {
  return (
    <div className="flex gap-2">
      {slots.map((slot, index) => {
        const label = BATTLEFIELD_SLOT_LABELS[index]!;
        return (
          <div key={label} className="flex-1 flex flex-col gap-1.5">
            <CardSlot
              label={label}
              card={slot}
              onClick={() => onSlotClick(index)}
            />
            {/* Label + enabled toggle below the slot */}
            <div className="flex items-center justify-center gap-1.5">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={slot?.enabled ?? true}
                  disabled={!slot}
                  onChange={() => onToggleEnabled(index)}
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
      })}
    </div>
  );
}
