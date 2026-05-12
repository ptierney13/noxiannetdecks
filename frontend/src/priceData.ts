import { useEffect, useState } from "react";

const LEGACY_PRICE_PATH_PREFIX = "/data/prices";
const D1_PRICE_PATH_PREFIX = "/data/prices-d1";

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
  game?: {
    slug: string;
    key: string;
    label?: string;
  };
  snapshotPath: string;
  publishedAt: string;
  sourceCapturedAt: string;
  rowCount?: number;
  variantCount?: number;
  freshness?: {
    rowCount: number;
    pricedRowCount: number;
    freshestPriceAt?: string;
    stalestPriceAt?: string;
  };
  priceSource: {
    id: string;
    label: string;
  };
};

export type PublishedPriceSnapshot = {
  version: 1;
  game?: {
    slug: string;
    key: string;
    label?: string;
  };
  publishedAt: string;
  sourceCapturedAt: string;
  freshness?: {
    rowCount: number;
    pricedRowCount: number;
    freshestPriceAt?: string;
    stalestPriceAt?: string;
  };
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

const cachedPriceIndexPromises = new Map<string, Promise<PublishedPriceIndex>>();

export function usePublishedPriceIndex(): {
  index: PublishedPriceIndex | null;
  status: "loading" | "ready" | "error";
} {
  return usePublishedPriceIndexForPath(resolveActivePricePathPrefix());
}

export function useOptionalPublishedPriceIndex(
  pathPrefix: string,
  enabled: boolean
): {
  index: PublishedPriceIndex | null;
  status: "idle" | "loading" | "ready" | "error";
} {
  const [index, setIndex] = useState<PublishedPriceIndex | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(enabled ? "loading" : "idle");

  useEffect(() => {
    let ignore = false;

    if (!enabled) {
      setIndex(null);
      setStatus("idle");
      return () => {
        ignore = true;
      };
    }

    setStatus("loading");
    loadPublishedPriceIndexForPath(pathPrefix)
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
  }, [enabled, pathPrefix]);

  return { index, status };
}

function usePublishedPriceIndexForPath(pathPrefix: string): {
  index: PublishedPriceIndex | null;
  status: "loading" | "ready" | "error";
} {
  const [index, setIndex] = useState<PublishedPriceIndex | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let ignore = false;

    loadPublishedPriceIndexForPath(pathPrefix)
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
  }, [pathPrefix]);

  return { index, status };
}

export async function loadPublishedPriceIndex(): Promise<PublishedPriceIndex> {
  return loadPublishedPriceIndexForPath(resolveActivePricePathPrefix());
}

export async function loadPublishedPriceIndexForPath(pathPrefix: string): Promise<PublishedPriceIndex> {
  const normalizedPathPrefix = normalizePathPrefix(pathPrefix);

  if (!cachedPriceIndexPromises.has(normalizedPathPrefix)) {
    cachedPriceIndexPromises.set(
      normalizedPathPrefix,
      buildPublishedPriceIndex(normalizedPathPrefix).catch((error) => {
        cachedPriceIndexPromises.delete(normalizedPathPrefix);
        throw error;
      })
    );
  }

  return cachedPriceIndexPromises.get(normalizedPathPrefix) as Promise<PublishedPriceIndex>;
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

async function buildPublishedPriceIndex(pathPrefix = "/data/prices"): Promise<PublishedPriceIndex> {
  const manifest = await fetchJson<PublishedPriceManifest>(`${pathPrefix}/manifest.json`);
  const snapshot = await fetchJson<PublishedPriceSnapshot>(`${pathPrefix}/${manifest.snapshotPath}`);
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

function normalizePathPrefix(pathPrefix: string): string {
  return pathPrefix.endsWith("/") ? pathPrefix.slice(0, -1) : pathPrefix;
}

export function resolveActivePricePathPrefix(): string {
  const fromQuery = resolvePricePathPrefixFromLocation();
  if (fromQuery) {
    return fromQuery;
  }

  const configured = import.meta.env.VITE_PRICE_DATA_PATH_PREFIX?.trim();
  if (configured) {
    return configured;
  }

  return LEGACY_PRICE_PATH_PREFIX;
}

export function resolveComparisonPricePathPrefix(): string | null {
  const active = resolveActivePricePathPrefix();
  if (active === D1_PRICE_PATH_PREFIX) {
    return LEGACY_PRICE_PATH_PREFIX;
  }

  if (active === LEGACY_PRICE_PATH_PREFIX) {
    return D1_PRICE_PATH_PREFIX;
  }

  return null;
}

function resolvePricePathPrefixFromLocation(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedSource = params.get("priceSource")?.trim().toLowerCase();

  if (requestedSource === "d1") {
    return D1_PRICE_PATH_PREFIX;
  }

  if (requestedSource === "legacy") {
    return LEGACY_PRICE_PATH_PREFIX;
  }

  return null;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
