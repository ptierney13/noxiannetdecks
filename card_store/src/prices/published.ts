export type PublishedPriceRow = {
  condition?: string | null;
  printing?: string | null;
  externalIds: {
    tcgplayerId?: string | null;
  };
  currentPrice: {
    amount: number | null;
  };
};

export type PublishedPriceSnapshot = {
  rows: PublishedPriceRow[];
};

export type PublishedPriceManifest = {
  snapshotPath: string;
};

export type SearchPriceIndex = {
  nearMintByTcgplayerId: ReadonlyMap<string, number>;
};

const PRINTING_ORDER = new Map<string, number>([
  ["normal", 0],
  ["foil", 1]
]);

function normalizeCondition(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizePrinting(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "nonfoil" || normalized === "non-foil") {
    return "normal";
  }
  return normalized;
}

function compareNearMintRows(left: PublishedPriceRow, right: PublishedPriceRow): number {
  const printingDelta =
    (PRINTING_ORDER.get(normalizePrinting(left.printing)) ?? Number.MAX_SAFE_INTEGER) -
    (PRINTING_ORDER.get(normalizePrinting(right.printing)) ?? Number.MAX_SAFE_INTEGER);

  if (printingDelta !== 0) {
    return printingDelta;
  }

  return (left.externalIds.tcgplayerId ?? "").localeCompare(right.externalIds.tcgplayerId ?? "");
}

export function createSearchPriceIndex(snapshot: PublishedPriceSnapshot): SearchPriceIndex {
  const nearMintCandidates = new Map<string, PublishedPriceRow[]>();

  for (const row of snapshot.rows) {
    const tcgplayerId = row.externalIds.tcgplayerId?.trim();
    if (!tcgplayerId || row.currentPrice.amount === null) {
      continue;
    }

    if (normalizeCondition(row.condition) !== "near mint") {
      continue;
    }

    const existing = nearMintCandidates.get(tcgplayerId) ?? [];
    existing.push(row);
    nearMintCandidates.set(tcgplayerId, existing);
  }

  const nearMintByTcgplayerId = new Map<string, number>();
  for (const [tcgplayerId, rows] of nearMintCandidates.entries()) {
    const selected = [...rows].sort(compareNearMintRows)[0];
    if (selected?.currentPrice.amount !== null) {
      nearMintByTcgplayerId.set(tcgplayerId, selected.currentPrice.amount);
    }
  }

  return {
    nearMintByTcgplayerId
  };
}
