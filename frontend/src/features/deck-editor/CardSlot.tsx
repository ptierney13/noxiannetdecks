import type { DraftDeckCard } from "./DeckEditorTypes";

type CardSlotProps = {
  label: string;
  card: DraftDeckCard | null;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  /** Show the full image instead of a top-cropped strip. */
  fullImage?: boolean;
  /** Tailwind aspect-ratio class to use for fullImage mode. Defaults to portrait (9/14). */
  imageAspect?: string;
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
  imageAspect = "aspect-[9/14]",
  hideName = false,
}: CardSlotProps) {
  const base = `w-full flex flex-col rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors ${className}`;

  if (card) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} bg-surface-1 border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.14)] cursor-pointer`}
      >
        {fullImage ? (
          /* Full image — aspect ratio controlled by imageAspect prop */
          <div className={`w-full ${imageAspect} bg-surface-inset overflow-hidden flex items-center justify-center`}>
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
      className={`${base} items-center justify-center gap-1.5 border ${
        fullImage ? imageAspect : ""
      } ${
        disabled
          ? "border-[rgba(255,255,255,0.05)] opacity-30 cursor-not-allowed bg-surface-1/30"
          : "border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.13)] hover:bg-surface-1 cursor-pointer bg-surface-1/50"
      }`}
      style={!fullImage ? { minHeight: "116px" } : undefined}
    >
      <span className="text-lg leading-none text-text-dim/50 select-none">+</span>
      <span className="text-[0.65rem] font-medium tracking-[0.08em] uppercase text-text-dim/50">
        {label}
      </span>
    </button>
  );
}
