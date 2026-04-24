import { generateArchiveManifest, manifestSummaryLines, writeArchiveManifest } from "../src/archive/fs.js";
import { initializeDeckDataLayout } from "../src/bootstrap.js";
import { resolveDeckDataLayout } from "../src/config.js";

async function main() {
  const layout = resolveDeckDataLayout();
  await initializeDeckDataLayout(layout);
  const manifest = await generateArchiveManifest(layout);
  await writeArchiveManifest(layout, manifest);

  for (const line of manifestSummaryLines(layout, manifest)) {
    console.log(line);
  }
}

await main();
