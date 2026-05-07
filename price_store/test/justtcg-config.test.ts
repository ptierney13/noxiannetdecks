import { describe, expect, it } from "vitest";
import { loadJustTcgConfig } from "../src/index.js";

describe("JustTCG config", () => {
  it("defaults to the free-plan maximum item count and history-on capture shape", () => {
    const config = loadJustTcgConfig({
      JUSTTCG_API_KEY: "tcg_test"
    });

    expect(config.defaultLimit).toBe(20);
    expect(config.includePriceHistory).toBe(true);
    expect(config.includeStatistics).toBe(false);
  });

  it("loads bounded default config from environment", () => {
    const config = loadJustTcgConfig({
      JUSTTCG_API_KEY: "tcg_test",
      JUSTTCG_DEFAULT_GAME: "riftbound",
      JUSTTCG_DEFAULT_LIMIT: "4",
      JUSTTCG_INCLUDE_PRICE_HISTORY: "false",
      JUSTTCG_INCLUDE_STATISTICS: "false"
    });

    expect(config.apiKey).toBe("tcg_test");
    expect(config.defaultGame).toBe("riftbound");
    expect(config.defaultLimit).toBe(4);
    expect(config.includePriceHistory).toBe(false);
    expect(config.includeStatistics).toBe(false);
  });

  it("rejects limits above the free-plan ceiling", () => {
    expect(() =>
      loadJustTcgConfig({
        JUSTTCG_API_KEY: "tcg_test",
        JUSTTCG_DEFAULT_LIMIT: "21"
      })
    ).toThrow(/Too big|less than or equal to 20/i);
  });
});
