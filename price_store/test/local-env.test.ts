import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyLocalEnvFile } from "../src/local-env.js";

const createdDirs: string[] = [];

afterEach(async () => {
  for (const dir of createdDirs.splice(0)) {
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }));
  }
});

describe("local env loading", () => {
  it("applies untracked local env files without overwriting existing values", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "price-store-env-"));
    createdDirs.push(rootDir);
    const envFile = join(rootDir, ".env.local");

    await writeFile(envFile, "JUSTTCG_API_KEY=from-file\nJUSTTCG_DEFAULT_GAME=riftbound\n");

    const environment: NodeJS.ProcessEnv = {
      JUSTTCG_API_KEY: "already-set"
    };

    applyLocalEnvFile(envFile, environment);

    expect(environment.JUSTTCG_API_KEY).toBe("already-set");
    expect(environment.JUSTTCG_DEFAULT_GAME).toBe("riftbound");
  });
});
