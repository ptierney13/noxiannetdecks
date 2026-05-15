import { type CSSProperties, type FormEvent, type PointerEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { generateSealedPool, loadPackGeneratorOptions } from "./api";
import { cardEnergy } from "./cardFormat";
import { CardsIcon } from "./ui";
import type {
  CardRecord,
  GeneratedPoolCard,
  GeneratedSealedPool,
  GenerateSealedPoolRequest,
  PackGeneratorOptions,
  PackSetId,
} from "./types";

const domainOrder = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] as const;
const domainSectionOrder = [...domainOrder, "Multicolor", "Other"] as const;
const fallbackPackSets: Array<{ id: PackSetId; label: string; supportsPreRift: boolean }> = [
  { id: "OGN", label: "Origins", supportsPreRift: false },
  { id: "SFD", label: "Spiritforged", supportsPreRift: true },
  { id: "UNL", label: "Unleashed", supportsPreRift: true }
];

type PoolView = "packs" | "domain" | "champions" | "units" | "spells" | "gear";
type SealedMode = "standard-OGN" | "standard-SFD" | "pre-rift-SFD" | "standard-UNL" | "pre-rift-UNL" | "custom";
type PreRiftSetId = Extract<PackSetId, "SFD" | "UNL">;
type BlockEntryGroup = {
  key: string;
  entries: GeneratedPoolCard[];
};
type CardPreviewState = {
  entry: GeneratedPoolCard;
  x: number;
  y: number;
};
type CardPreviewHandler = (entry: GeneratedPoolCard, event: PointerEvent<HTMLButtonElement>) => void;
type CardLayout = "portrait" | "landscape";
type DeckSnapshot = {
  id: string;
  name: string;
  mainDeckCards: GeneratedPoolCard[];
  battlefieldEntryIds: Array<string | null>;
  legendEntryId: string | null;
  championEntryId: string | null;
};

function legalCardKey(entry: GeneratedPoolCard): string {
  return entry.card.riftbound_id ?? entry.card.clean_name ?? entry.card.id;
}

function cardNameKey(entry: GeneratedPoolCard): string {
  return entry.card.riot_name.toLocaleLowerCase();
}

function domainSection(card: CardRecord): (typeof domainSectionOrder)[number] {
  const matchingDomains = domainOrder.filter((domain) => card.attributes.domain.includes(domain));

  if (matchingDomains.length > 1) return "Multicolor";
  return matchingDomains[0] ?? "Other";
}

function isLegend(entry: GeneratedPoolCard): boolean {
  return entry.card.type.cardtype === "Legend";
}

function isChampionUnit(entry: GeneratedPoolCard): boolean {
  return entry.card.type.cardtype === "Unit" && entry.card.type.supertype === "Champion";
}

function isBattlefield(entry: GeneratedPoolCard): boolean {
  return entry.card.type.cardtype === "Battlefield";
}

function isMainDeckEntry(entry: GeneratedPoolCard): boolean {
  return !isBattlefield(entry) && !isLegend(entry);
}

function cardDisplayLayout(card: CardRecord): CardLayout {
  return card.type.cardtype === "Battlefield" || card.media.layout === "landscape" ? "landscape" : "portrait";
}

function allPoolCards(pool: GeneratedSealedPool | null): GeneratedPoolCard[] {
  return pool?.packs.flatMap((pack) => pack.cards) ?? [];
}

function packSetLabel(packSets: Array<{ id: PackSetId; label: string }>, setId: PackSetId): string {
  return packSets.find((set) => set.id === setId)?.label ?? setId;
}

function groupedByLegalCard(cards: GeneratedPoolCard[]): BlockEntryGroup[] {
  const groups = new Map<string, GeneratedPoolCard[]>();

  for (const card of [...cards].sort((left, right) => cardNameKey(left).localeCompare(cardNameKey(right)))) {
    const key = legalCardKey(card);
    groups.set(key, [...(groups.get(key) ?? []), card]);
  }

  return [...groups.entries()].map(([key, entries]) => ({ key, entries }));
}

function groupedByEnergy(cards: GeneratedPoolCard[]): Array<{ energy: number | null; groups: BlockEntryGroup[]; hasLandscape: boolean }> {
  const energyGroups = new Map<string, GeneratedPoolCard[]>();

  for (const card of cards) {
    const energy = cardEnergy(card.card);
    const key = energy === null ? "none" : String(energy);
    energyGroups.set(key, [...(energyGroups.get(key) ?? []), card]);
  }

  return [...energyGroups.entries()]
    .map(([key, entries]) => ({
      energy: key === "none" ? null : Number(key),
      groups: groupedByLegalCard(entries),
      hasLandscape: entries.some((entry) => cardDisplayLayout(entry.card) === "landscape")
    }))
    .sort((left, right) => {
      if (left.energy === null && right.energy === null) return 0;
      if (left.energy === null) return 1;
      if (right.energy === null) return -1;
      return left.energy - right.energy;
    });
}

function PoolCard({
  entry,
  onClick,
  inDeck = false,
  onPreview,
  onPreviewEnd,
  labelPrefix = "Add"
}: {
  entry: GeneratedPoolCard;
  onClick?: () => void;
  inDeck?: boolean;
  onPreview?: CardPreviewHandler;
  onPreviewEnd?: () => void;
  labelPrefix?: string;
}) {
  const image = entry.card.media.image_url;
  const label = `${labelPrefix} ${entry.card.riot_name}`;
  const layout = cardDisplayLayout(entry.card);

  return (
    <button
      type="button"
      className={inDeck ? "pool-card in-deck" : "pool-card"}
      aria-label={label}
      data-entry-id={entry.id}
      data-in-deck={inDeck ? "true" : "false"}
      data-layout={layout}
      title={entry.card.riot_name}
      onClick={onClick}
      onPointerEnter={onPreview ? (event) => onPreview(entry, event) : undefined}
      onPointerMove={onPreview ? (event) => onPreview(entry, event) : undefined}
      onPointerLeave={onPreviewEnd}
      onPointerCancel={onPreviewEnd}
    >
      {image ? (
        <img src={image} alt={entry.card.media.accessibility_text ?? entry.card.riot_name} loading="lazy" />
      ) : (
        <span className="missing-image">{entry.card.riot_name}</span>
      )}
      <span className="foil-mark" data-finish={entry.finish}>{entry.finish === "foil" ? "F" : ""}</span>
    </button>
  );
}

function CardBlock({
  title,
  cards,
  deckEntryIds,
  onCardClick,
  onPreview,
  onPreviewEnd
}: {
  title: string;
  cards: GeneratedPoolCard[];
  deckEntryIds: Set<string>;
  onCardClick: (entry: GeneratedPoolCard) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const columns = groupedByEnergy(cards);

  return (
    <section className="pool-block" aria-label={title}>
      <header className="pool-block-header">
        <h3>{title}</h3>
        <span>{cards.length}</span>
      </header>
      {cards.length === 0 ? (
        <div className="empty-block">Empty</div>
      ) : (
        <div className="energy-board">
          {columns.map((column) => (
            <div
              className="energy-column"
              key={column.energy ?? "none"}
              data-testid="energy-column"
              data-energy={column.energy ?? "none"}
              data-wide={column.hasLandscape ? "true" : "false"}
            >
              <div className="energy-label">{column.energy ?? "No Cost"}</div>
              {column.groups.map((group) => {
                const layout = group.entries.some((entry) => cardDisplayLayout(entry.card) === "landscape") ? "landscape" : "portrait";
                const baseHeight = layout === "landscape" ? "var(--sealed-landscape-card-height)" : "var(--sealed-card-height)";

                return (
                  <div
                    className="distinct-card-group"
                    key={group.key}
                    data-layout={layout}
                    style={{
                      "--copy-count": String(group.entries.length),
                      height: `calc(${baseHeight} + ${(group.entries.length - 1) * 14}px)`
                    } as CSSProperties}
                  >
                    {group.entries.map((entry, copyIndex) => (
                      <div
                        className="copy-card"
                        key={entry.id}
                        style={{ "--copy-index": String(copyIndex) } as CSSProperties}
                      >
                        <PoolCard
                          entry={entry}
                          inDeck={deckEntryIds.has(entry.id)}
                          onClick={() => onCardClick(entry)}
                          onPreview={onPreview}
                          onPreviewEnd={onPreviewEnd}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DeckZone({
  title,
  selectedEntryId,
  options,
  onChange,
  onPreview,
  onPreviewEnd
}: {
  title: string;
  selectedEntryId: string | null;
  options: GeneratedPoolCard[];
  onChange: (entryId: string | null) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const entry = options.find((candidate) => candidate.id === selectedEntryId) ?? null;
  const controlId = `${title.toLowerCase()}-selection`;

  return (
    <div
      className="deck-zone"
      data-filled={entry ? "true" : "false"}
      aria-label={`${title} zone`}
    >
      <div className="deck-zone-title">
        <span>{title}</span>
      </div>
      <label className="zone-select-label" htmlFor={controlId}>{title} selection</label>
      <select
        id={controlId}
        value={selectedEntryId ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">No {title}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.card.riot_name}
          </option>
        ))}
      </select>
      {entry ? (
        <PoolCard
          entry={entry}
          labelPrefix={`${title}:`}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
      ) : (
        <div className="zone-placeholder" data-accepts={title.toLowerCase()}>Empty</div>
      )}
    </div>
  );
}

function BattlefieldBack({ slotNumber }: { slotNumber: number }) {
  return (
    <div className="battlefield-back" role="img" aria-label={`Empty battlefield slot ${slotNumber}`}>
      <span>Battlefield</span>
    </div>
  );
}

function BattlefieldSlot({
  slotNumber,
  selectedEntryId,
  options,
  unavailableEntryIds,
  onChange,
  onPreview,
  onPreviewEnd
}: {
  slotNumber: number;
  selectedEntryId: string | null;
  options: GeneratedPoolCard[];
  unavailableEntryIds: Set<string>;
  onChange: (entryId: string | null) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const entry = options.find((candidate) => candidate.id === selectedEntryId) ?? null;
  const controlId = `battlefield-${slotNumber}-selection`;

  return (
    <div className="battlefield-slot" data-filled={entry ? "true" : "false"}>
      <label className="zone-select-label" htmlFor={controlId}>Battlefield {slotNumber}</label>
      <select
        id={controlId}
        value={selectedEntryId ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">No Battlefield</option>
        {options
          .filter((option) => option.id === selectedEntryId || !unavailableEntryIds.has(option.id))
          .map((option) => (
            <option key={option.id} value={option.id}>
              {option.card.riot_name}
            </option>
          ))}
      </select>
      {entry ? (
        <PoolCard
          entry={entry}
          labelPrefix={`Battlefield ${slotNumber}:`}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
      ) : (
        <BattlefieldBack slotNumber={slotNumber} />
      )}
    </div>
  );
}

function DeckCountChip({
  label,
  value,
  target,
  valid
}: {
  label: string;
  value: number;
  target: string;
  valid: boolean;
}) {
  return (
    <span className="deck-count-chip" data-testid={`${label.toLowerCase()}-deck-count`} data-valid={valid ? "true" : "false"}>
      <span>{label}</span>
      <strong>{value}</strong>
      <span>/{target}</span>
    </span>
  );
}

function DeckCardBoard({
  cards,
  onRemove,
  onPreview,
  onPreviewEnd
}: {
  cards: GeneratedPoolCard[];
  onRemove: (entryId: string) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const columns = groupedByEnergy(cards);

  return (
    <div className="energy-board deck-energy-board" data-testid="decklist-strip">
      {columns.map((column) => (
        <div
          className="energy-column"
          key={column.energy ?? "none"}
          data-testid="energy-column"
          data-energy={column.energy ?? "none"}
          data-wide={column.hasLandscape ? "true" : "false"}
        >
          <div className="energy-label">{column.energy ?? "No Cost"}</div>
          {column.groups.map((group) => {
            const layout = group.entries.some((entry) => cardDisplayLayout(entry.card) === "landscape") ? "landscape" : "portrait";
            const baseHeight = layout === "landscape" ? "var(--sealed-landscape-card-height)" : "var(--sealed-card-height)";

            return (
              <div
                className="distinct-card-group"
                key={group.key}
                data-layout={layout}
                style={{
                  "--copy-count": String(group.entries.length),
                  height: `calc(${baseHeight} + ${(group.entries.length - 1) * 14}px)`
                } as CSSProperties}
              >
                {group.entries.map((entry, copyIndex) => (
                  <div
                    className="copy-card"
                    key={entry.id}
                    style={{ "--copy-index": String(copyIndex) } as CSSProperties}
                  >
                    <PoolCard
                      entry={entry}
                      onClick={() => onRemove(entry.id)}
                      onPreview={onPreview}
                      onPreviewEnd={onPreviewEnd}
                      labelPrefix="Remove"
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DecklistPanel({
  poolCards,
  mainDeckCards,
  battlefieldEntryIds,
  legendEntryId,
  championEntryId,
  snapshots,
  onRemove,
  onAssignBattlefield,
  onAssignLegend,
  onAssignChampion,
  onOpenSnapshot,
  onRestoreSnapshot,
  onClearDeck,
  onPreview,
  onPreviewEnd
}: {
  poolCards: GeneratedPoolCard[];
  mainDeckCards: GeneratedPoolCard[];
  battlefieldEntryIds: Array<string | null>;
  legendEntryId: string | null;
  championEntryId: string | null;
  snapshots: DeckSnapshot[];
  onRemove: (entryId: string) => void;
  onAssignBattlefield: (slotIndex: number, entryId: string | null) => void;
  onAssignLegend: (entryId: string | null) => void;
  onAssignChampion: (entryId: string | null) => void;
  onOpenSnapshot: () => void;
  onRestoreSnapshot: (snapshot: DeckSnapshot) => void;
  onClearDeck: () => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  const legendOptions = poolCards.filter(isLegend);
  const championOptions = poolCards.filter(isChampionUnit);
  const battlefieldOptions = poolCards.filter(isBattlefield);
  const selectedBattlefieldIds = new Set(battlefieldEntryIds.filter((entryId): entryId is string => Boolean(entryId)));
  const battlefieldCount = selectedBattlefieldIds.size;
  const legendCount = legendEntryId ? 1 : 0;
  const championCount = championEntryId ? 1 : 0;
  const unitCount = mainDeckCards.filter((entry) => entry.card.type.cardtype === "Unit").length;
  const spellCount = mainDeckCards.filter((entry) => entry.card.type.cardtype === "Spell").length;
  const gearCount = mainDeckCards.filter((entry) => entry.card.type.cardtype === "Gear").length;
  const hasDeckSelection = mainDeckCards.length > 0 || battlefieldCount > 0 || legendCount > 0 || championCount > 0;

  return (
    <section className="decklist-panel" aria-labelledby="decklist-heading">
      <div className="decklist-toolbar">
        <div className="decklist-title-stack">
          <div className="decklist-title-row">
            <h2 id="decklist-heading">Decklist</h2>
            <button type="button" className="text-button strong" onClick={onOpenSnapshot} disabled={!hasDeckSelection}>
              Snapshot
            </button>
          </div>
          <div className="deck-counts" aria-label="Deck counts">
            <DeckCountChip label="Main" value={mainDeckCards.length} target="25" valid={mainDeckCards.length === 25} />
            <DeckCountChip label="Battlefields" value={battlefieldCount} target="3" valid={battlefieldCount >= 0 && battlefieldCount <= 3} />
            <DeckCountChip label="Legend" value={legendCount} target="1" valid={legendCount >= 0 && legendCount <= 1} />
            <DeckCountChip label="Champion" value={championCount} target="1" valid={championCount >= 0 && championCount <= 1} />
          </div>
          <div className="deck-type-summary" aria-label="Deck type summary">
            <span>Units {unitCount}</span>
            <span>Spells {spellCount}</span>
            <span>Gear {gearCount}</span>
          </div>
        </div>
        <button type="button" className="text-button strong" onClick={onClearDeck} disabled={!hasDeckSelection}>
          Clear
        </button>
      </div>
      <div
        className="snapshot-strip"
        data-testid="snapshot-strip"
        data-snapshot-count={snapshots.length}
        aria-label="Saved snapshots"
      >
        {snapshots.map((snapshot) => (
          <button
            key={snapshot.id}
            type="button"
            className="snapshot-button"
            onClick={() => onRestoreSnapshot(snapshot)}
          >
            {snapshot.name}
          </button>
        ))}
      </div>
      <div className="decklist-main">
        {mainDeckCards.length === 0 ? (
          <div className="empty-block">Empty</div>
        ) : (
          <DeckCardBoard
            cards={mainDeckCards}
            onRemove={onRemove}
            onPreview={onPreview}
            onPreviewEnd={onPreviewEnd}
          />
        )}
      </div>
      <div className="deck-zones">
        <div className="battlefield-slots" aria-label="Battlefield slots">
          {battlefieldEntryIds.map((entryId, index) => (
            <BattlefieldSlot
              key={`battlefield-slot-${index + 1}`}
              slotNumber={index + 1}
              selectedEntryId={entryId}
              options={battlefieldOptions}
              unavailableEntryIds={new Set([...selectedBattlefieldIds].filter((selectedId) => selectedId !== entryId))}
              onChange={(nextEntryId) => onAssignBattlefield(index, nextEntryId)}
              onPreview={onPreview}
              onPreviewEnd={onPreviewEnd}
            />
          ))}
        </div>
        <div className="deck-role-zones">
          <DeckZone
            title="Legend"
            selectedEntryId={legendEntryId}
            options={legendOptions}
            onChange={onAssignLegend}
            onPreview={onPreview}
            onPreviewEnd={onPreviewEnd}
          />
          <DeckZone
            title="Champion"
            selectedEntryId={championEntryId}
            options={championOptions}
            onChange={onAssignChampion}
            onPreview={onPreview}
            onPreviewEnd={onPreviewEnd}
          />
        </div>
      </div>
    </section>
  );
}

function domainBlocks(
  cards: GeneratedPoolCard[],
  deckEntryIds: Set<string>,
  onCardClick: (entry: GeneratedPoolCard) => void,
  onPreview: CardPreviewHandler,
  onPreviewEnd: () => void
) {
  const grouped = new Map<(typeof domainSectionOrder)[number], GeneratedPoolCard[]>();

  for (const domain of domainSectionOrder) {
    grouped.set(domain, []);
  }

  for (const card of cards) {
    const domain = domainSection(card.card);
    grouped.set(domain, [...(grouped.get(domain) ?? []), card]);
  }

  return [...grouped.entries()]
    .filter(([, entries], index) => index < domainOrder.length || entries.length > 0)
    .map(([domain, entries]) => (
      <CardBlock
        key={domain}
        title={domain}
        cards={entries}
        deckEntryIds={deckEntryIds}
        onCardClick={onCardClick}
        onPreview={onPreview}
        onPreviewEnd={onPreviewEnd}
      />
    ));
}

function PoolDisplay({
  pool,
  view,
  deckEntryIds,
  onCardClick,
  onPreview,
  onPreviewEnd
}: {
  pool: GeneratedSealedPool | null;
  view: PoolView;
  deckEntryIds: Set<string>;
  onCardClick: (entry: GeneratedPoolCard) => void;
  onPreview: CardPreviewHandler;
  onPreviewEnd: () => void;
}) {
  if (!pool) {
    return (
      <section className="pool-display">
        <div className="empty-pool">No Pool</div>
      </section>
    );
  }

  const cards = allPoolCards(pool);

  if (view === "packs") {
    return (
      <section className="pool-display pack-view" aria-label="Generated packs">
        {pool.packs.map((pack) => (
          <div className="pack-window" key={pack.id}>
            <CardBlock
              title={pack.label}
              cards={pack.cards}
              deckEntryIds={deckEntryIds}
              onCardClick={onCardClick}
              onPreview={onPreview}
              onPreviewEnd={onPreviewEnd}
            />
          </div>
        ))}
      </section>
    );
  }

  if (view === "champions") {
    return (
      <section className="pool-display grouped-view" aria-label="Champions and legends">
        <CardBlock
          title="Champion Units"
          cards={cards.filter(isChampionUnit)}
          deckEntryIds={deckEntryIds}
          onCardClick={onCardClick}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
        <CardBlock
          title="Legends"
          cards={cards.filter(isLegend)}
          deckEntryIds={deckEntryIds}
          onCardClick={onCardClick}
          onPreview={onPreview}
          onPreviewEnd={onPreviewEnd}
        />
      </section>
    );
  }

  const filteredCards =
    view === "units"
      ? cards.filter((entry) => entry.card.type.cardtype === "Unit")
      : view === "spells"
        ? cards.filter((entry) => entry.card.type.cardtype === "Spell")
        : view === "gear"
          ? cards.filter((entry) => entry.card.type.cardtype === "Gear")
          : cards;

  return (
    <section className="pool-display grouped-view" aria-label={`${view} view`}>
      {domainBlocks(filteredCards, deckEntryIds, onCardClick, onPreview, onPreviewEnd)}
    </section>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function CardZoomPreview({ preview }: { preview: CardPreviewState | null }) {
  if (!preview?.entry.card.media.image_url) return null;

  const layout = cardDisplayLayout(preview.entry.card);
  const width = layout === "landscape" ? 420 : 300;
  const height = Math.round(width * (layout === "landscape" ? 744 / 1039 : 1039 / 744));
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const leftCandidate = preview.x + width + 28 > viewportWidth ? preview.x - width - 18 : preview.x + 18;
  const topCandidate = preview.y + 18;
  const left = clamp(leftCandidate, 12, viewportWidth - width - 12);
  const top = clamp(topCandidate, 12, viewportHeight - height - 12);

  return (
    <div
      className="card-zoom-preview"
      data-testid="card-zoom-preview"
      data-layout={layout}
      style={{ left, top, width } as CSSProperties}
    >
      <img src={preview.entry.card.media.image_url} alt={preview.entry.card.media.accessibility_text ?? preview.entry.card.riot_name} />
    </div>
  );
}

function SnapshotDialog({
  name,
  onNameChange,
  onSave,
  onClose
}: {
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const trimmedName = name.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedName) onSave();
  }

  return (
    <div className="snapshot-dialog-backdrop">
      <form className="snapshot-dialog" role="dialog" aria-label="Name snapshot" onSubmit={handleSubmit}>
        <h2>Name Snapshot</h2>
        <label>
          Snapshot name
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Build 1"
            autoFocus
          />
        </label>
        <div className="snapshot-dialog-actions">
          <button type="button" className="text-button strong" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-action compact" disabled={!trimmedName}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function SelectorLayer({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="selector-layer" role="dialog" aria-label={label}>
      {children}
    </div>
  );
}

function PackRecipeMenu({
  packSets,
  recipe,
  onChange
}: {
  packSets: Array<{ id: PackSetId; label: string }>;
  recipe: PackSetId[];
  onChange: (nextRecipe: PackSetId[]) => void;
}) {
  return (
    <SelectorLayer label="Choose packs">
      <div className="pack-menu-grid">
        {recipe.map((setId, index) => (
          <label key={`pack-${index + 1}`}>
            Pack {index + 1}
            <select
              value={setId}
              onChange={(event) => {
                const nextRecipe = [...recipe];
                nextRecipe[index] = event.target.value as PackSetId;
                onChange(nextRecipe);
              }}
            >
              {packSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </SelectorLayer>
  );
}

function PreRiftSeedMenu({
  packs,
  seededPackId,
  onChange
}: {
  packs: Array<{ id: string; label: string }>;
  seededPackId: string;
  onChange: (seededPackId: string) => void;
}) {
  return (
    <SelectorLayer label="Choose pre-rift seed">
      <div className="seed-menu-grid">
        <label>
          Seed
          <select value={seededPackId} onChange={(event) => onChange(event.target.value)}>
            <option value="random">Random</option>
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </SelectorLayer>
  );
}

export default function SealedSimulator({ onError }: { onError: (message: string | null) => void }) {
  const [options, setOptions] = useState<PackGeneratorOptions | null>(null);
  const [sealedMode, setSealedMode] = useState<SealedMode>("pre-rift-UNL");
  const [seededPackId, setSeededPackId] = useState("random");
  const [packRecipe, setPackRecipe] = useState<PackSetId[]>(["OGN", "OGN", "SFD", "SFD", "UNL", "UNL"]);
  const [poolView, setPoolView] = useState<PoolView>("packs");
  const [pool, setPool] = useState<GeneratedSealedPool | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mainDeckCards, setMainDeckCards] = useState<GeneratedPoolCard[]>([]);
  const [battlefieldEntryIds, setBattlefieldEntryIds] = useState<Array<string | null>>([null, null, null]);
  const [legendEntryId, setLegendEntryId] = useState<string | null>(null);
  const [championEntryId, setChampionEntryId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<DeckSnapshot[]>([]);
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [cardPreview, setCardPreview] = useState<CardPreviewState | null>(null);

  const packSets = options?.sets ?? fallbackPackSets.map((set) => ({ ...set, supportsStandard: true }));
  const sealedModeOptions: Array<{ id: SealedMode; label: string }> = [
    { id: "standard-OGN", label: packSetLabel(packSets, "OGN") },
    { id: "standard-SFD", label: packSetLabel(packSets, "SFD") },
    { id: "pre-rift-SFD", label: `${packSetLabel(packSets, "SFD")} Pre-Rift` },
    { id: "standard-UNL", label: packSetLabel(packSets, "UNL") },
    { id: "pre-rift-UNL", label: `${packSetLabel(packSets, "UNL")} Pre-Rift` },
    { id: "custom", label: "Custom" }
  ];
  const selectedPreRiftSet: PreRiftSetId | null =
    sealedMode === "pre-rift-SFD" ? "SFD" : sealedMode === "pre-rift-UNL" ? "UNL" : null;
  const poolCards = useMemo(() => allPoolCards(pool), [pool]);
  const deckEntryIds = useMemo(() => {
    const ids = new Set(mainDeckCards.map((entry) => entry.id));
    for (const entryId of battlefieldEntryIds) {
      if (entryId) ids.add(entryId);
    }
    if (legendEntryId) ids.add(legendEntryId);
    if (championEntryId) ids.add(championEntryId);
    return ids;
  }, [mainDeckCards, battlefieldEntryIds, legendEntryId, championEntryId]);
  const preRiftPacks = useMemo(
    () => selectedPreRiftSet ? (options?.seededPacks ?? []).filter((pack) => pack.setId === selectedPreRiftSet) : [],
    [options, selectedPreRiftSet]
  );

  useEffect(() => {
    let ignore = false;

    async function boot() {
      try {
        const loadedOptions = await loadPackGeneratorOptions();
        if (!ignore) setOptions(loadedOptions);
      } catch (caught) {
        if (!ignore) onError(caught instanceof Error ? caught.message : "Unable to load pack generator.");
      }
    }

    void boot();

    return () => {
      ignore = true;
    };
  }, [onError]);

  useEffect(() => {
    setSeededPackId("random");
  }, [selectedPreRiftSet]);

  function requestForMode(): GenerateSealedPoolRequest {
    switch (sealedMode) {
      case "standard-OGN":
        return { format: "standard", setId: "OGN" };
      case "standard-SFD":
        return { format: "standard", setId: "SFD" };
      case "standard-UNL":
        return { format: "standard", setId: "UNL" };
      case "pre-rift-SFD":
        return { format: "pre-rift", setId: "SFD", seededPackId };
      case "pre-rift-UNL":
        return { format: "pre-rift", setId: "UNL", seededPackId };
      case "custom":
        return { format: "custom", packs: packRecipe };
    }
  }

  async function newPool() {
    setIsGenerating(true);
    onError(null);

    try {
      const generated = await generateSealedPool(requestForMode());
      setPool(generated);
      setPoolView("packs");
      setMainDeckCards([]);
      setBattlefieldEntryIds([null, null, null]);
      setLegendEntryId(null);
      setChampionEntryId(null);
      setSnapshots([]);
      setIsSnapshotDialogOpen(false);
      setSnapshotName("");
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Pool generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function addToMainDeck(entry: GeneratedPoolCard) {
    if (championEntryId === entry.id) return;
    setMainDeckCards((current) => current.some((card) => card.id === entry.id) ? current : [...current, entry]);
  }

  function removeFromDeck(entryId: string) {
    setMainDeckCards((current) => current.filter((entry) => entry.id !== entryId));
    setBattlefieldEntryIds((current) => current.map((candidate) => candidate === entryId ? null : candidate));
    setLegendEntryId((current) => current === entryId ? null : current);
    setChampionEntryId((current) => current === entryId ? null : current);
  }

  function clearDeck() {
    setMainDeckCards([]);
    setBattlefieldEntryIds([null, null, null]);
    setLegendEntryId(null);
    setChampionEntryId(null);
  }

  function assignBattlefield(slotIndex: number, entryId: string | null) {
    if (!entryId) {
      setBattlefieldEntryIds((current) => current.map((candidate, index) => index === slotIndex ? null : candidate));
      return;
    }

    const entry = poolCards.find((candidate) => candidate.id === entryId);
    if (!entry || !isBattlefield(entry)) return;

    setBattlefieldEntryIds((current) => {
      const next = current.map((candidate) => candidate === entryId ? null : candidate);
      next[slotIndex] = entryId;
      return next;
    });
  }

  function assignBattlefieldToNextOpen(entry: GeneratedPoolCard) {
    setBattlefieldEntryIds((current) => {
      if (current.includes(entry.id)) return current;
      const next = [...current];
      const openIndex = next.findIndex((candidate) => candidate === null);
      next[openIndex === -1 ? 0 : openIndex] = entry.id;
      return next;
    });
  }

  function assignLegend(entryId: string | null) {
    if (!entryId) {
      setLegendEntryId(null);
      return;
    }

    const entry = poolCards.find((candidate) => candidate.id === entryId);
    if (entry && isLegend(entry)) {
      setLegendEntryId(entryId);
    }
  }

  function assignChampion(entryId: string | null) {
    if (!entryId) {
      setChampionEntryId(null);
      return;
    }

    const entry = poolCards.find((candidate) => candidate.id === entryId);
    if (entry && isChampionUnit(entry)) {
      setMainDeckCards((current) => current.filter((candidate) => candidate.id !== entryId));
      setChampionEntryId(entryId);
    }
  }

  function addToDeck(entry: GeneratedPoolCard) {
    if (isBattlefield(entry)) {
      assignBattlefieldToNextOpen(entry);
    } else if (isLegend(entry)) {
      assignLegend(entry.id);
    } else if (isMainDeckEntry(entry)) {
      addToMainDeck(entry);
    }
  }

  function togglePoolCard(entry: GeneratedPoolCard) {
    if (deckEntryIds.has(entry.id)) {
      removeFromDeck(entry.id);
      return;
    }

    addToDeck(entry);
  }

  function openSnapshotDialog() {
    setSnapshotName("");
    setIsSnapshotDialogOpen(true);
  }

  function saveSnapshot() {
    const trimmedName = snapshotName.trim();
    if (!trimmedName) return;

    setSnapshots((current) => [
      ...current,
      {
        id: `snapshot-${current.length + 1}-${Date.now()}`,
        name: trimmedName,
        mainDeckCards,
        battlefieldEntryIds,
        legendEntryId,
        championEntryId
      }
    ]);
    setIsSnapshotDialogOpen(false);
    setSnapshotName("");
  }

  function restoreSnapshot(snapshot: DeckSnapshot) {
    const poolEntryIds = new Set(poolCards.map((entry) => entry.id));
    const restoredBattlefields = snapshot.battlefieldEntryIds.map((entryId) => entryId && poolEntryIds.has(entryId) ? entryId : null).slice(0, 3);
    while (restoredBattlefields.length < 3) restoredBattlefields.push(null);
    setMainDeckCards(snapshot.mainDeckCards);
    setBattlefieldEntryIds(restoredBattlefields);
    setLegendEntryId(snapshot.legendEntryId && poolEntryIds.has(snapshot.legendEntryId) ? snapshot.legendEntryId : null);
    setChampionEntryId(snapshot.championEntryId && poolEntryIds.has(snapshot.championEntryId) ? snapshot.championEntryId : null);
  }

  function showPreview(entry: GeneratedPoolCard, event: PointerEvent<HTMLButtonElement>) {
    setCardPreview({ entry, x: event.clientX, y: event.clientY });
  }

  function hidePreview() {
    setCardPreview(null);
  }

  return (
    <>
      <section className="simulator-hero" aria-labelledby="simulator-heading">
        <div className="search-copy">
          <p className="eyebrow">Noxian Netdecks</p>
          <h1 id="simulator-heading">Sealed Simulator</h1>
        </div>
        <div className="simulator-actions">
          <label className="pool-mode-select">
            Pool type
            <select value={sealedMode} onChange={(event) => setSealedMode(event.target.value as SealedMode)}>
              {sealedModeOptions.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="primary-action" onClick={() => void newPool()} disabled={isGenerating}>
            <CardsIcon />
            <span>{isGenerating ? "Generating" : "New Pool"}</span>
          </button>
        </div>
      </section>

      {selectedPreRiftSet ? (
        <PreRiftSeedMenu
          packs={preRiftPacks}
          seededPackId={seededPackId}
          onChange={setSeededPackId}
        />
      ) : null}

      {sealedMode === "custom" ? (
        <PackRecipeMenu
          packSets={packSets}
          recipe={packRecipe}
          onChange={setPackRecipe}
        />
      ) : null}

      <DecklistPanel
        poolCards={poolCards}
        mainDeckCards={mainDeckCards}
        battlefieldEntryIds={battlefieldEntryIds}
        legendEntryId={legendEntryId}
        championEntryId={championEntryId}
        snapshots={snapshots}
        onRemove={removeFromDeck}
        onAssignBattlefield={assignBattlefield}
        onAssignLegend={assignLegend}
        onAssignChampion={assignChampion}
        onOpenSnapshot={openSnapshotDialog}
        onRestoreSnapshot={restoreSnapshot}
        onClearDeck={clearDeck}
        onPreview={showPreview}
        onPreviewEnd={hidePreview}
      />

      {isSnapshotDialogOpen ? (
        <SnapshotDialog
          name={snapshotName}
          onNameChange={setSnapshotName}
          onSave={saveSnapshot}
          onClose={() => setIsSnapshotDialogOpen(false)}
        />
      ) : null}

      <nav className="view-tabs" aria-label="Pool views">
        {[
          ["packs", "Packs"],
          ["domain", "Domain"],
          ["champions", "Champions & Legends"],
          ["units", "Units"],
          ["spells", "Spells"],
          ["gear", "Gear"]
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={poolView === id}
            onClick={() => setPoolView(id as PoolView)}
          >
            {label}
          </button>
        ))}
      </nav>

      <PoolDisplay
        pool={pool}
        view={poolView}
        deckEntryIds={deckEntryIds}
        onCardClick={togglePoolCard}
        onPreview={showPreview}
        onPreviewEnd={hidePreview}
      />
      <CardZoomPreview preview={cardPreview} />
    </>
  );
}
