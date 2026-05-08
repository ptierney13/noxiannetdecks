import { useEffect, useState } from "react";

export type PublishedPriceHistoryPoint = {
  amount: number;
  observedAt: string;
};

export type PublishedPriceRow = {
  rowId: string;
  cardName: string;
  sourceCardId: string;
  sourceVariantId: string;
  set?: {
    slug?: string | null;
    label?: string | null;
  };
  collectorNumber?: string | null;
  rarity?: string | null;
  language?: string | null;
  condition?: string | null;
  printing?: string | null;
  externalIds: {
    tcgplayerId?: string;
    tcgplayerSkuId?: string;
  };
  currentPrice: {
    currency: "USD";
    amount: number | null;
    lastUpdatedAt?: string | null;
  };
  priceHistory: PublishedPriceHistoryPoint[];
};

export type PublishedPriceManifest = {
  version: 1;
  snapshotPath: string;
  publishedAt: string;
  sourceCapturedAt: string;
  priceSource: {
    id: string;
    label: string;
  };
};

export type PublishedPriceSnapshot = {
  version: 1;
  publishedAt: string;
  sourceCapturedAt: string;
  priceSource: {
    id: string;
    label: string;
  };
  rows: PublishedPriceRow[];
};

export type PublishedPriceIndex = {
  manifest: PublishedPriceManifest;
  snapshot: PublishedPriceSnapshot;
  rowsByTcgplayerId: Map<string, PublishedPriceRow[]>;
};

const PRINTING_ORDER = new Map<string, number>([
  ["foil", 0],
  ["normal", 1]
]);

const CONDITION_ORDER = new Map<string, number>([
  ["near mint", 0],
  ["lightly played", 1],
  ["moderately played", 2],
  ["heavily played", 3],
  ["damaged", 4],
  ["sealed", 5]
]);

let cachedPriceIndexPromise: Promise<PublishedPriceIndex> | null = null;

export function usePublishedPriceIndex(): {
  index: PublishedPriceIndex | null;
  status: "loading" | "ready" | "error";
} {
  const [index, setIndex] = useState<PublishedPriceIndex | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let ignore = false;

    loadPublishedPriceIndex()
      .then((loaded) => {
        if (ignore) {
          return;
        }

        setIndex(loaded);
        setStatus("ready");
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setIndex(null);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { index, status };
}

export async function loadPublishedPriceIndex(): Promise<PublishedPriceIndex> {
  if (!cachedPriceIndexPromise) {
    cachedPriceIndexPromise = buildPublishedPriceIndex().catch((error) => {
      cachedPriceIndexPromise = null;
      throw error;
    });
  }

  return cachedPriceIndexPromise;
}

export function getPublishedRowsForCard(
  index: PublishedPriceIndex | null,
  tcgplayerId: string | null | undefined
): PublishedPriceRow[] {
  if (!index || !tcgplayerId) {
    return [];
  }

  return index.rowsByTcgplayerId.get(tcgplayerId) ?? [];
}

export function resolveNearMintMarketPrice(
  rows: PublishedPriceRow[],
  preferredPrinting?: string | null
): PublishedPriceRow | null {
  const nearMintRows = rows.filter((row) => normalizeCondition(row.condition) === "near mint" && row.currentPrice.amount !== null);

  if (nearMintRows.length === 0) {
    return null;
  }

  const normalizedPreferredPrinting = normalizePrinting(preferredPrinting);
  if (normalizedPreferredPrinting) {
    const matching = nearMintRows.find((row) => normalizePrinting(row.printing) === normalizedPreferredPrinting);
    if (matching) {
      return matching;
    }
  }

  return sortPriceRows(nearMintRows)[0] ?? null;
}

export function normalizePrinting(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "nonfoil" || normalized === "non-foil") {
    return "normal";
  }

  return normalized;
}

export function formatPrintingLabel(value: string | null | undefined): string {
  const normalized = normalizePrinting(value);

  if (normalized === "foil") {
    return "Foil";
  }

  if (normalized === "normal") {
    return "Non-foil";
  }

  return value?.trim() || "Other";
}

export function formatUsdPrice(amount: number | null | undefined): string | null {
  if (amount == null) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function sortPriceRows(rows: PublishedPriceRow[]): PublishedPriceRow[] {
  return [...rows].sort((left, right) => {
    const printingDelta = resolvePrintingOrder(left.printing) - resolvePrintingOrder(right.printing);
    if (printingDelta !== 0) {
      return printingDelta;
    }

    const conditionDelta = resolveConditionOrder(left.condition) - resolveConditionOrder(right.condition);
    if (conditionDelta !== 0) {
      return conditionDelta;
    }

    return left.rowId.localeCompare(right.rowId);
  });
}

function resolvePrintingOrder(printing: string | null | undefined): number {
  return PRINTING_ORDER.get(normalizePrinting(printing)) ?? Number.MAX_SAFE_INTEGER;
}

function resolveConditionOrder(condition: string | null | undefined): number {
  return CONDITION_ORDER.get(normalizeCondition(condition)) ?? Number.MAX_SAFE_INTEGER;
}

function normalizeCondition(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

async function buildPublishedPriceIndex(): Promise<PublishedPriceIndex> {
  const manifest = await fetchJson<PublishedPriceManifest>("/data/prices/manifest.json");
  const snapshot = await fetchJson<PublishedPriceSnapshot>(`/data/prices/${manifest.snapshotPath}`);
  const rowsByTcgplayerId = new Map<string, PublishedPriceRow[]>();

  for (const row of snapshot.rows) {
    const tcgplayerId = row.externalIds.tcgplayerId;
    if (!tcgplayerId) {
      continue;
    }

    const existing = rowsByTcgplayerId.get(tcgplayerId) ?? [];
    existing.push(row);
    rowsByTcgplayerId.set(tcgplayerId, existing);
  }

  for (const [tcgplayerId, rows] of rowsByTcgplayerId.entries()) {
    rowsByTcgplayerId.set(tcgplayerId, sortPriceRows(rows));
  }

  return {
    manifest,
    snapshot,
    rowsByTcgplayerId
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
