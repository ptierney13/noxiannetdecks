import { domainColor } from "./DeckEditorTypes";

type RuneRowProps = {
  runes: { leftDomain: string; leftCount: number; rightDomain: string; rightCount: number } | null;
  onShiftLeft: () => void;
  onShiftRight: () => void;
};

function RuneGem({ domain, count }: { domain: string; count: number }) {
  const color = domainColor(domain);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 36 42" width="36" height="42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Hexagon rune shape */}
          <polygon
            points="18,2 34,11 34,31 18,40 2,31 2,11"
            fill={color}
            fillOpacity="0.15"
            stroke={color}
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          <polygon
            points="18,7 29,13.5 29,28.5 18,35 7,28.5 7,13.5"
            fill={color}
            fillOpacity="0.08"
          />
        </svg>
        <span
          className="absolute text-[0.9rem] font-bold leading-none"
          style={{ color }}
        >
          {count}
        </span>
      </div>
      <span
        className="text-[0.62rem] font-bold uppercase tracking-[0.06em] leading-none"
        style={{ color, opacity: 0.7 }}
      >
        {domain}
      </span>
    </div>
  );
}

export function RuneRow({ runes, onShiftLeft, onShiftRight }: RuneRowProps) {
  const locked = runes === null;

  return (
    <div className="flex items-center justify-center gap-3 py-1">
      {/* Left + button */}
      <button
        type="button"
        onClick={onShiftLeft}
        disabled={locked || runes.rightCount <= 1}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[1.1rem] font-bold leading-none border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-30 disabled:cursor-not-allowed"
        style={
          locked || runes.rightCount <= 1
            ? {}
            : {
                color: domainColor(runes.leftDomain),
                borderColor: `color-mix(in srgb, ${domainColor(runes.leftDomain)} 30%, transparent)`,
              }
        }
        aria-label={locked ? "Select a legend first" : `Add ${runes.leftDomain} rune`}
      >
        +
      </button>

      {/* Left rune */}
      {locked ? (
        <LockedRuneGem />
      ) : (
        <RuneGem domain={runes.leftDomain} count={runes.leftCount} />
      )}

      {/* Right rune */}
      {locked ? (
        <LockedRuneGem />
      ) : (
        <RuneGem domain={runes.rightDomain} count={runes.rightCount} />
      )}

      {/* Right + button */}
      <button
        type="button"
        onClick={onShiftRight}
        disabled={locked || runes.leftCount <= 1}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[1.1rem] font-bold leading-none border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-30 disabled:cursor-not-allowed"
        style={
          locked || runes.leftCount <= 1
            ? {}
            : {
                color: domainColor(runes.rightDomain),
                borderColor: `color-mix(in srgb, ${domainColor(runes.rightDomain)} 30%, transparent)`,
              }
        }
        aria-label={locked ? "Select a legend first" : `Add ${runes.rightDomain} rune`}
      >
        +
      </button>
    </div>
  );
}

function LockedRuneGem() {
  return (
    <div className="flex flex-col items-center gap-1 opacity-25">
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 36 42" width="36" height="42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <polygon
            points="18,2 34,11 34,31 18,40 2,31 2,11"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            className="text-text-tertiary"
          />
        </svg>
        <span className="absolute text-[0.9rem] font-bold leading-none text-text-tertiary">–</span>
      </div>
      <span className="text-[0.62rem] font-bold uppercase tracking-[0.06em] text-text-tertiary">rune</span>
    </div>
  );
}
