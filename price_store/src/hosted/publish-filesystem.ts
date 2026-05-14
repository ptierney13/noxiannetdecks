import { resolvePriceDataLayout } from "../config.js";
import { writePublishedPriceArtifacts } from "../published/repository.js";
import type {
  HostedPublishedArtifactWriter,
  HostedPublishedArtifactWriterInput
} from "./publish.js";

export type CreateFilesystemPublishedArtifactWriterInput = {
  repositoryRoot?: string;
  dataRootDir?: string;
};

export function createFilesystemPublishedArtifactWriter(
  options: CreateFilesystemPublishedArtifactWriterInput = {}
): HostedPublishedArtifactWriter {
  return async (input: HostedPublishedArtifactWriterInput): Promise<void> => {
    const layout = resolvePriceDataLayout(options.dataRootDir);
    await writePublishedPriceArtifacts(layout, {
      gameKey: input.gameKey,
      publishedAt: input.publishedAt,
      canonicalRelativeSnapshotPath: input.canonicalRelativeSnapshotPath,
      manifest: input.manifest,
      snapshot: input.snapshot,
      repositoryRoot: options.repositoryRoot,
      pathPrefix: "prices-d1"
    });
  };
}
