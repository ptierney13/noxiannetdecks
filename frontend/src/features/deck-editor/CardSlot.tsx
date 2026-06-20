import type { DraftDeckCard } from "./DeckEditorTypes";

type CardSlotProps = {
  label: string;
  card: DraftDeckCard | null;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  /** Show the full portrait instead of a top-cropped strip. */
  fullImage?: boolean;
  /** Suppress the card name row below the image (useful when the caller renders its own label). */
  hideName?: boolean;
};

export function CardSlot({
  label,
  card,
  onClick,
  disabled = false,
  className = "",
  fullImage = false,
  hideName = false,
}: CardSlotProps) {
  const base = `w-full flex flex-col rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors ${className}`;

  if (card) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} bg-surface-2 border border-border-default hover:border-border-strong cursor-pointer`}
      >
        {fullImage ? (
          /* Full portrait — 9:14 approximates a Riftbound card */
          <div className="w-full aspect-[9/14] bg-surface-inset overflow-hidden flex items-center justify-center">
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.cardName}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-surface-inset" />
            )}
          </div>
        ) : (
          /* Top-crop — shows approx. the top 30% of a portrait card */
          <div className="h-[72px] w-full overflow-hidden flex-shrink-0 bg-surface-inset">
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.cardName}
                className="w-full h-[240px] object-cover object-top"
              />
            ) : (
              <div className="w-full h-full bg-surface-inset" />
            )}
          </div>
        )}
        {!hideName && (
          <div className="flex flex-1 items-center justify-center px-1.5 py-2">
            <span className="text-[0.7rem] font-semibold text-text-primary leading-tight text-center line-clamp-2">
              {card.cardName}
            </span>
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} items-center justify-center gap-1.5 border-2 border-dashed ${
        fullImage ? "aspect-[9/14]" : ""
      } ${
        disabled
          ? "border-border-subtle opacity-35 cursor-not-allowed"
          : "border-border-default hover:border-border-strong hover:bg-surface-2 cursor-pointer"
      }`}
      style={!fullImage ? { minHeight: "116px" } : undefined}
    >
      <span className="text-[1.4rem] leading-none text-text-tertiary select-none">+</span>
      <span className="text-[0.68rem] font-bold tracking-[0.06em] uppercase text-text-tertiary">
        {label}
      </span>
    </button>
  );
}
