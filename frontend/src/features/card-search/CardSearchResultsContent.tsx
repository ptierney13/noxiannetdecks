import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronIcon, ResultCard } from "../../ui-elements";
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
import type { CardRecord, QueryDiagnostic } from "../../types";
import { parseQueryToBlocks, type ParsedQueryItem } from "./queryBlocks";

export type CardSearchResultsContentProps = {
  groups: CardSearchResultGroup[];
  rawResultCount: number;
  visibleResultCount: number;
  rawQuery: string;
  diagnostics: QueryDiagnostic[];
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
        className="inline-flex min-h-11 min-w-[9rem] items-center justify-between gap-2 rounded-xl border border-border-default bg-[rgba(255,255,255,0.12)] px-3 text-sm font-bold text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-focus-ring"
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
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={`block w-full border border-transparent px-3 py-2.5 text-left text-sm font-bold transition-[color,background-color,border-color] ${
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

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-white">
      {children}
    </span>
  );
}

function Diagnostics({ diagnostics }: { diagnostics: QueryDiagnostic[] }) {
  if (diagnostics.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-negative-border bg-negative-soft p-4 text-sm text-text-primary" role="alert">
      <strong className="block text-sm font-black">Query needs attention</strong>
      <ul className="mt-2 grid gap-1 pl-5">
        {diagnostics.map((diagnostic, index) => (
          <li key={`${diagnostic.message}-${index}`} className="list-disc">
            {diagnostic.message}
          </li>
        ))}
      </ul>
    </div>
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

function QueryBlocksDisplay({ items }: { items: ParsedQueryItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      {items.map((item, i) => {
        if (item === "AND" || item === "OR") {
          return (
            <span key={i} className="text-[0.7rem] font-black uppercase tracking-widest text-text-tertiary">
              {item}
            </span>
          );
        }
        if (item.kind === "unknown") {
          return (
            <span
              key={i}
              className="inline-flex items-center rounded-lg border border-negative-border bg-negative-soft px-3 py-1 text-sm font-semibold text-negative"
            >
              UNKNOWN QUERY &quot;{item.raw}&quot;
            </span>
          );
        }
        return (
          <span
            key={i}
            className="inline-flex items-center rounded-lg border border-[rgba(215,170,73,0.4)] bg-accent-warm-soft px-3 py-1 text-sm font-semibold text-accent-warm"
          >
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

function ResultSummary({
  isPending,
  visibleResultCount,
  rawResultCount,
  rawQuery,
}: {
  isPending: boolean;
  visibleResultCount: number;
  rawResultCount: number;
  rawQuery: string;
}) {
  const blocks = useMemo(() => parseQueryToBlocks(rawQuery), [rawQuery]);

  if (isPending) {
    return <p className="m-0 text-[1.225rem] font-semibold leading-snug text-text-tertiary">Searching cards…</p>;
  }

  const cardWord = visibleResultCount === 1 ? "card" : "cards";
  const printings =
    rawResultCount !== visibleResultCount
      ? ` with ${rawResultCount.toLocaleString()} printings`
      : "";

  return (
    <div className="grid gap-2">
      <p className="m-0 text-[1.225rem] font-semibold leading-snug text-text-secondary">
        <span className="font-black text-text-primary">{visibleResultCount.toLocaleString()}</span>
        {" "}{cardWord}{printings}{blocks.length > 0 ? " matching" : ""}
      </p>
      <QueryBlocksDisplay items={blocks} />
    </div>
  );
}

export function CardSearchResultsContent({
  groups,
  rawResultCount,
  visibleResultCount,
  rawQuery,
  diagnostics,
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
}: CardSearchResultsContentProps) {
  return (
    <section aria-label="Card search results">
      {/* Full-width controls banner — no rounded sub-box, spans edge to edge */}
      <div className={`bg-surface-2 border-b border-border-subtle ${BANNER_PADDING_CLASSES}`}>
        <div className={CONTROL_LAYOUT_CLASSES}>
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

          {/* Checkboxes as plain stacked rows — gap-2 matches label-to-dropdown spacing */}
          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-text-secondary">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(event) => onShowPriceChange(event.target.checked)}
              />
              Show prices
            </label>
            {variantMode === "unique-cards" ? (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-text-secondary">
                <input
                  type="checkbox"
                  checked={showVariants}
                  onChange={(event) => onShowVariantsChange(event.target.checked)}
                />
                Show variants
              </label>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${PANE_PADDING_CLASSES}`}>
        <ResultSummary
          isPending={isPending}
          visibleResultCount={visibleResultCount}
          rawResultCount={rawResultCount}
          rawQuery={rawQuery}
        />

        <Diagnostics diagnostics={diagnostics} />

        {isPending ? <LoadingGrid /> : null}

        {isError ? (
          <div className="rounded-2xl border border-negative-border bg-negative-soft p-5 text-sm text-text-primary">
            <strong className="block font-black">Search failed</strong>
            <span className="mt-1 block text-text-secondary">{errorMessage ?? "Unable to load cards."}</span>
          </div>
        ) : null}

        {!isPending && !isError && groups.length === 0 ? (
          <div className="rounded-2xl border border-border-default bg-surface-2 p-8 text-center text-text-secondary">
            No cards matched this query.
          </div>
        ) : null}

        {!isPending && !isError && groups.length > 0 ? (
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
        ) : null}
      </div>
    </section>
  );
}
