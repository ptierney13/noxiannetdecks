import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronIcon, ResultCard } from "../../ui-elements";
import { NoxianLogoIcon } from "../../ui-elements/Icon";
import { VariantSelectorRow } from "../VariantSelectorRow";
import {
  CARD_SEARCH_SORT_OPTIONS,
  normalizeCardFinish,
  type CardFinish,
  type CardSearchResultGroup,
  type CardSearchSortKey,
  type CardSearchVariantMode,
  type PublishedPriceIndex,
} from "../../lib";
import { executedTokensToDisplay, type ExecutedQueryItem } from "@noxiannet/card-store/query";
import { QuerySummaryChips } from "./QuerySummaryChips";
import type { CardRecord } from "../../types";

export type CardSearchResultsContentProps = {
  groups: CardSearchResultGroup[];
  rawResultCount: number;
  visibleResultCount: number;
  executedTokens: ExecutedQueryItem[];
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  sort: CardSearchSortKey;
  variantMode: CardSearchVariantMode;
  showPrice: boolean;
  showVariants: boolean;
  publishedPriceIndex: PublishedPriceIndex | null;
  onSortChange: (sort: CardSearchSortKey) => void;
  onVariantModeChange: (variantMode: CardSearchVariantMode) => void;
  onShowPriceChange: (showPrice: boolean) => void;
  onShowVariantsChange: (showVariants: boolean) => void;
  onCardClick: (card: CardRecord, group: CardRecord[], finish: CardFinish) => void;
  navSlot?: ReactNode;
  hideSummary?: boolean;
};

// Controls flex row — dropdowns + checkbox stack wrap at narrow widths.
const CONTROL_LAYOUT_CLASSES = "flex flex-wrap items-end gap-4";

// Banner padding mirrors the content padding so controls align with card grid.
const BANNER_PADDING_CLASSES = "px-3 py-4 @[640px]:px-4 @[1024px]:px-5";

// The grid intentionally uses fixed columns, not auto-fill, to match search-plan review rules.
const RESULTS_GRID_CLASSES =
  "grid grid-cols-2 gap-3 @[768px]:grid-cols-3 @[1024px]:grid-cols-4 @[1280px]:grid-cols-5 @[1536px]:grid-cols-6";

// Padding is centralized so pane edge spacing can be tuned without hunting through JSX.
const PANE_PADDING_CLASSES = "p-3 @[640px]:p-4 @[1024px]:p-5";

const VARIANT_OPTIONS: { value: CardSearchVariantMode; label: string }[] = [
  { value: "unique-cards", label: "Unique Cards" },
  { value: "unique-printings", label: "Unique Printings" },
];

// ---------------------------------------------------------------------------
// SearchSelect — custom dropdown used by the controls banner.
// Native <select> option lists are OS-rendered and can't be styled cross-
// browser, so we build a lightweight alternative that respects our tokens:
//   • Selected option highlighted with the accent (red) background.
//   • Hover changes background only (no border/color shift).
//   • Dropdown bg matches the banner surface so the popup reads as elevated.
// ---------------------------------------------------------------------------
type SelectOption<T extends string> = { value: T; label: string };

function SearchSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? String(value);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const idx = options.findIndex((o) => o.value === value);
      const next =
        event.key === "ArrowDown"
          ? Math.min(idx + 1, options.length - 1)
          : Math.max(idx - 1, 0);
      if (options[next]) onChange(options[next]!.value);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex min-h-11 min-w-[9rem] items-center justify-between gap-2 rounded-xl border px-3 text-sm font-bold text-text-primary outline-none transition-[background,border-color,box-shadow] duration-[180ms] hover:border-border-strong hover:bg-[rgba(255,255,255,0.16)] focus:ring-4 focus:ring-focus-ring ${
          open
            ? "border-accent bg-[rgba(255,255,255,0.14)] shadow-[0_0_0_1px_rgba(197,50,71,0.18),0_0_14px_rgba(197,50,71,0.1)]"
            : "border-border-default bg-[rgba(255,255,255,0.12)] focus:border-accent"
        }`}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedLabel}</span>
        <ChevronIcon expanded={open} />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full overflow-hidden rounded-xl border border-border-default bg-surface-2 shadow-surface-1"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected} className="first:rounded-t-xl last:rounded-b-xl overflow-hidden">
                <button
                  type="button"
                  className={`block w-full border border-transparent px-3 py-2.5 text-left text-sm font-bold transition-[color,background-color,border-color] duration-[180ms] ${
                    isSelected
                      ? "bg-accent border-accent text-white"
                      : "text-text-primary hover:bg-[var(--color-accent-soft)] hover:border-[var(--color-accent)]"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ToggleButton({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-bold transition-[background,border-color,color,box-shadow] duration-[180ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
        checked
          ? "border-accent bg-accent-soft text-text-primary shadow-[0_0_0_1px_rgba(197,50,71,0.32),0_0_12px_rgba(197,50,71,0.12)]"
          : "border-border-default bg-[rgba(255,255,255,0.12)] text-text-secondary hover:border-border-strong hover:bg-[rgba(255,255,255,0.16)] hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-white">
      {children}
    </span>
  );
}

function LoadingGrid() {
  return (
    <div className={RESULTS_GRID_CLASSES} aria-label="Loading card results">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="aspect-[5/7] animate-pulse rounded-[18px] border border-border-subtle bg-surface-inset"
        />
      ))}
    </div>
  );
}

function ResultSummary({
  isPending,
  visibleResultCount,
  executedTokens,
}: {
  isPending: boolean;
  visibleResultCount: number;
  executedTokens: ExecutedQueryItem[];
}) {
  // Two separate passes: executed chips (with their AND/OR connectors) and
  // dropped chips (collected flat — connectors between dropped tokens are
  // not meaningful to show since they are already in an error section).
  const executedBlocks = useMemo(() => executedTokensToDisplay(executedTokens), [executedTokens]);
  const droppedBlocks = useMemo(
    () =>
      executedTokensToDisplay(executedTokens, { includeDropped: true }).filter(
        (item): item is import("@noxiannet/card-store/query").DisplayBlock =>
          typeof item !== "string" && item.state === "dropped"
      ),
    [executedTokens]
  );

  if (isPending) {
    return <p className="m-0 text-[1.225rem] font-semibold leading-snug text-text-tertiary">Searching cards…</p>;
  }

  const cardWord = visibleResultCount === 1 ? "card" : "cards";
  const hasGood = executedBlocks.length > 0;
  const hasBad = droppedBlocks.length > 0;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
      {/* Count + "matching" — only show "matching" when there are executed chips */}
      <p className="m-0 shrink-0 text-[1.225rem] font-semibold leading-snug text-text-secondary">
        <span className="font-black text-text-primary">{visibleResultCount.toLocaleString()}</span>
        {" "}{cardWord}{hasGood ? " matching" : ""}
      </p>

      {/* Valid chips — preserve their AND/OR connectors */}
      <QuerySummaryChips items={executedBlocks} />

      {/* Separator + dropped chips — connectors between dropped tokens are omitted */}
      {hasBad ? (
        <>
          <span className="text-[1.225rem] font-semibold leading-snug text-text-tertiary">
            {hasGood ? "| Unable to parse" : "Unable to parse"}
          </span>
          {droppedBlocks.map((block, i) => (
            <span
              key={`drop-${i}`}
              className="inline-flex items-center gap-1 rounded-lg border border-negative-border bg-negative-soft px-3 py-1 text-sm"
            >
              {block.prefix ? (
                <span className="font-semibold text-red-400">{block.prefix}</span>
              ) : null}
              <span className="font-black text-red-300">{block.value}</span>
            </span>
          ))}
        </>
      ) : null}
    </div>
  );
}

export function CardSearchResultsContent({
  groups,
  visibleResultCount,
  executedTokens,
  isPending,
  isError,
  errorMessage,
  sort,
  variantMode,
  showPrice,
  showVariants,
  publishedPriceIndex,
  onSortChange,
  onVariantModeChange,
  onShowPriceChange,
  onShowVariantsChange,
  onCardClick,
  navSlot,
  hideSummary,
}: CardSearchResultsContentProps) {
  return (
    <section aria-label="Card search results" className="flex flex-col flex-1 min-h-0">
      {/* Controls banner */}
      <div className={`bg-surface-2 border-b border-border-subtle ${BANNER_PADDING_CLASSES}`}>
        <div className={CONTROL_LAYOUT_CLASSES}>
          {/* Unified inset surface groups Sort / Variants / Toggles */}
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border-subtle bg-surface-inset px-3 py-2.5">
            <div className="grid gap-2">
              <FieldLabel>Sort</FieldLabel>
              <SearchSelect
                value={sort}
                options={CARD_SEARCH_SORT_OPTIONS}
                onChange={onSortChange}
              />
            </div>

            <div className="grid gap-2">
              <FieldLabel>Variants</FieldLabel>
              <SearchSelect
                value={variantMode}
                options={VARIANT_OPTIONS}
                onChange={onVariantModeChange}
              />
            </div>

            <div className="grid gap-2">
              <FieldLabel>Toggles</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <ToggleButton checked={showPrice} onChange={onShowPriceChange}>
                  Show prices
                </ToggleButton>
                {variantMode === "unique-cards" ? (
                  <ToggleButton checked={showVariants} onChange={onShowVariantsChange}>
                    Show variants
                  </ToggleButton>
                ) : null}
              </div>
            </div>
          </div>

          {navSlot ? (
            <div className="ml-auto hidden @[768px]:flex items-center">
              {navSlot}
            </div>
          ) : null}
        </div>
      </div>

      <div className={`flex flex-col flex-1 min-h-0 gap-4 ${PANE_PADDING_CLASSES}`}>
        {!hideSummary && (
          <ResultSummary
            isPending={isPending}
            visibleResultCount={visibleResultCount}
            executedTokens={executedTokens}
          />
        )}

        {isPending ? <LoadingGrid /> : null}

        {isError ? (
          <div className="rounded-2xl border border-negative-border bg-negative-soft p-5 text-sm text-text-primary">
            <strong className="block font-black">Search failed</strong>
            <span className="mt-1 block text-text-secondary">{errorMessage ?? "Unable to load cards."}</span>
          </div>
        ) : null}

        {!isPending && !isError && groups.length === 0 ? (
          <div className="flex flex-1 min-h-0 flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-2 gap-5 text-center p-8">
            <NoxianLogoIcon className="w-28 h-28 opacity-[0.15]" />
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold text-text-secondary">No cards match this query.</p>
              <p className="text-sm text-text-tertiary">Adjust your filters or remove some constraints<br className="hidden @[400px]:block" /> to see results here.</p>
            </div>
          </div>
        ) : null}

        {!isPending && !isError && groups.length > 0 ? (
          <div className="rounded-2xl border border-border-subtle overflow-hidden p-3 @[640px]:p-4">
          <div className={RESULTS_GRID_CLASSES} data-testid="card-search-results-grid">
            {groups.map((group) => {
              const representative = group.representative;
              const primaryFinish = normalizeCardFinish(representative.finishes[0]);
              const variantCards = showVariants ? group.cards : [];

              return (
                <ResultCard
                  key={group.key}
                  name={representative.riot_name}
                  imageUrl={representative.media.image_url}
                  imageAlt={representative.media.accessibility_text ?? representative.riot_name}
                  layout={representative.media.layout}
                  onClick={() => onCardClick(representative, group.cards, primaryFinish)}
                  footer={
                    variantCards.length > 0 ? (
                      <VariantSelectorRow
                        cards={variantCards}
                        showPrice={showPrice}
                        publishedPriceIndex={publishedPriceIndex}
                        onVariantSelect={({ card, finish }) => onCardClick(card, group.cards, finish)}
                      />
                    ) : undefined
                  }
                />
              );
            })}
          </div>
          </div>
        ) : null}

      </div>
    </section>
  );
}
