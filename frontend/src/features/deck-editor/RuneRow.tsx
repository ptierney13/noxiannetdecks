const RUNE_SYMBOL_SRC: Record<string, string> = {
  fury:  "/assets/riftbound/symbols/runes/rune-fury-inline.png",
  calm:  "/assets/riftbound/symbols/runes/rune-calm-inline.png",
  mind:  "/assets/riftbound/symbols/runes/rune-mind-inline.png",
  body:  "/assets/riftbound/symbols/runes/rune-body-inline.png",
  chaos: "/assets/riftbound/symbols/runes/rune-chaos-inline.png",
  order: "/assets/riftbound/symbols/runes/rune-order-inline.png",
};

type RuneRowProps = {
  runes: { leftDomain: string; leftCount: number; rightDomain: string; rightCount: number } | null;
  onShiftLeft: () => void;
  onShiftRight: () => void;
};

function RuneGem({ domain, count }: { domain: string; count: number }) {
  const src = RUNE_SYMBOL_SRC[domain.toLowerCase()];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center">
        {src ? (
          <img src={src} alt={domain} className="w-10 h-10" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-inset opacity-30" />
        )}
        {/* Count badge */}
        <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-surface-1 border border-border-default text-[0.62rem] font-bold leading-none text-text-primary px-0.5">
          {count}
        </span>
      </div>
      <span className="text-[0.6rem] font-bold uppercase tracking-[0.06em] leading-none text-text-secondary mt-0.5">
        {domain}
      </span>
    </div>
  );
}

function LockedRuneGem() {
  return (
    <div className="flex flex-col items-center gap-1 opacity-25">
      <div className="w-10 h-10 rounded-full border-2 border-dashed border-text-tertiary flex items-center justify-center">
        <span className="text-[0.9rem] font-bold text-text-tertiary leading-none">–</span>
      </div>
      <span className="text-[0.6rem] font-bold uppercase tracking-[0.06em] leading-none text-text-tertiary mt-0.5">
        rune
      </span>
    </div>
  );
}

export function RuneRow({ runes, onShiftLeft, onShiftRight }: RuneRowProps) {
  const locked = runes === null;

  return (
    <div className="flex items-center justify-center gap-3 py-1">
      {/* Left + button (shifts a rune right→left) */}
      <button
        type="button"
        onClick={onShiftLeft}
        disabled={locked || runes.rightCount <= 1}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[1.1rem] font-bold leading-none border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-30 disabled:cursor-not-allowed text-text-secondary hover:enabled:text-text-primary hover:enabled:bg-surface-2"
        aria-label={locked ? "Select a legend first" : `Add ${runes.leftDomain} rune`}
      >
        +
      </button>

      {locked ? <LockedRuneGem /> : <RuneGem domain={runes.leftDomain} count={runes.leftCount} />}
      {locked ? <LockedRuneGem /> : <RuneGem domain={runes.rightDomain} count={runes.rightCount} />}

      {/* Right + button (shifts a rune left→right) */}
      <button
        type="button"
        onClick={onShiftRight}
        disabled={locked || runes.leftCount <= 1}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[1.1rem] font-bold leading-none border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-30 disabled:cursor-not-allowed text-text-secondary hover:enabled:text-text-primary hover:enabled:bg-surface-2"
        aria-label={locked ? "Select a legend first" : `Add ${runes.rightDomain} rune`}
      >
        +
      </button>
    </div>
  );
}
