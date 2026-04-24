import { readFile } from "node:fs/promises";
import { canonicalStage1DatasetSchema, type CanonicalStage1Dataset } from "./schema.js";
import { resolveDeckDataLayout } from "../config.js";

export type Stage1DatasetSource = {
  load(): Promise<CanonicalStage1Dataset>;
};

export class JsonFileStage1DatasetSource implements Stage1DatasetSource {
  constructor(private readonly datasetPath = resolveDeckDataLayout().canonicalDatasetPath) {}

  async load(): Promise<CanonicalStage1Dataset> {
    const raw = await readFile(this.datasetPath, "utf8");
    return canonicalStage1DatasetSchema.parse(JSON.parse(raw));
  }
}

export class Stage1DatasetRepository {
  private cachedDataset: CanonicalStage1Dataset | null = null;

  constructor(private readonly source: Stage1DatasetSource = new JsonFileStage1DatasetSource()) {}

  async loadDataset(): Promise<CanonicalStage1Dataset> {
    if (this.cachedDataset) return this.cachedDataset;

    const dataset = await this.source.load();
    this.cachedDataset = dataset;
    return dataset;
  }

  clearCache(): void {
    this.cachedDataset = null;
  }
}

const defaultRepository = new Stage1DatasetRepository();

export function createStage1DatasetRepository(source: Stage1DatasetSource = new JsonFileStage1DatasetSource()) {
  return new Stage1DatasetRepository(source);
}

export async function loadCanonicalStage1Dataset(source?: Stage1DatasetSource): Promise<CanonicalStage1Dataset> {
  if (source) return createStage1DatasetRepository(source).loadDataset();
  return defaultRepository.loadDataset();
}
