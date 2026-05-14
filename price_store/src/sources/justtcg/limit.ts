import type { JustTcgConfig } from "./config.js";
import { fetchJustTcgCards, JustTcgRequestError } from "./client.js";

const DOCUMENTED_FREE_PLAN_LIMIT = 20;
const DEFAULT_LIMIT_SEARCH_UPPER_BOUND = 200;

export type VerifyJustTcgRequestLimitInput = {
  game?: string;
  includePriceHistory?: boolean;
  includeStatistics?: boolean;
  searchUpperBound?: number;
};

export type VerifyJustTcgRequestLimitResult = {
  verifiedLimit: number;
  testedLimits: number[];
  documentedLimitWorked: boolean;
  nextHigherLimitWorked: boolean;
  searchUpperBound: number;
  boundedBySearchUpperLimit: boolean;
};

export async function verifyJustTcgRequestLimit(
  config: JustTcgConfig,
  input: VerifyJustTcgRequestLimitInput = {}
): Promise<VerifyJustTcgRequestLimitResult> {
  const game = input.game ?? config.defaultGame;
  const includePriceHistory = input.includePriceHistory ?? config.includePriceHistory;
  const includeStatistics = input.includeStatistics ?? config.includeStatistics;
  const searchUpperBound = Math.max(
    DOCUMENTED_FREE_PLAN_LIMIT + 1,
    input.searchUpperBound ?? DEFAULT_LIMIT_SEARCH_UPPER_BOUND
  );
  const testedLimits: number[] = [];
  const probe = async (limit: number): Promise<boolean> => {
    testedLimits.push(limit);

    try {
      await fetchJustTcgCards(config, {
        game,
        limit,
        includePriceHistory,
        includeStatistics
      });
      return true;
    } catch (error) {
      if (isUnsupportedLimitError(error)) {
        return false;
      }

      throw error;
    }
  };

  const documentedLimitWorked = await probe(DOCUMENTED_FREE_PLAN_LIMIT);

  if (!documentedLimitWorked) {
    const verifiedLimit = await findHighestSupportedLimit(1, DOCUMENTED_FREE_PLAN_LIMIT - 1, probe);
    return {
      verifiedLimit,
      testedLimits,
      documentedLimitWorked,
      nextHigherLimitWorked: false,
      searchUpperBound,
      boundedBySearchUpperLimit: false
    };
  }

  const nextHigherLimitWorked = await probe(DOCUMENTED_FREE_PLAN_LIMIT + 1);
  if (!nextHigherLimitWorked) {
    return {
      verifiedLimit: DOCUMENTED_FREE_PLAN_LIMIT,
      testedLimits,
      documentedLimitWorked,
      nextHigherLimitWorked,
      searchUpperBound,
      boundedBySearchUpperLimit: false
    };
  }

  let supportedLimit = DOCUMENTED_FREE_PLAN_LIMIT + 1;
  let failingLimit: number | undefined;
  let candidate = supportedLimit * 2;

  while (candidate <= searchUpperBound) {
    if (await probe(candidate)) {
      supportedLimit = candidate;
      candidate *= 2;
      continue;
    }

    failingLimit = candidate;
    break;
  }

  if (!failingLimit) {
    const verifiedLimit =
      candidate > searchUpperBound
        ? await findHighestSupportedLimit(supportedLimit + 1, searchUpperBound, probe, supportedLimit)
        : supportedLimit;

    return {
      verifiedLimit,
      testedLimits,
      documentedLimitWorked,
      nextHigherLimitWorked,
      searchUpperBound,
      boundedBySearchUpperLimit: verifiedLimit === searchUpperBound
    };
  }

  const verifiedLimit = await findHighestSupportedLimit(
    supportedLimit + 1,
    failingLimit - 1,
    probe,
    supportedLimit
  );

  return {
    verifiedLimit,
    testedLimits,
    documentedLimitWorked,
    nextHigherLimitWorked,
    searchUpperBound,
    boundedBySearchUpperLimit: false
  };
}

function isUnsupportedLimitError(error: unknown): boolean {
  return error instanceof JustTcgRequestError && (error.status === 400 || error.status === 422);
}

async function findHighestSupportedLimit(
  low: number,
  high: number,
  probe: (limit: number) => Promise<boolean>,
  knownSupportedLimit = 0
): Promise<number> {
  let best = knownSupportedLimit;
  let left = low;
  let right = high;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    if (await probe(middle)) {
      best = Math.max(best, middle);
      left = middle + 1;
      continue;
    }

    right = middle - 1;
  }

  return best;
}
