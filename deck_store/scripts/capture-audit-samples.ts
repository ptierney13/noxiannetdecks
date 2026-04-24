import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { generateArchiveManifest, writeArchiveManifest } from "../src/archive/fs.js";
import { loadSourceAuditPlan } from "../src/audit/repository.js";
import { sourceAuditPlanSchema, type AuditTarget, type SourceAuditPlan } from "../src/audit/schema.js";
import { initializeDeckDataLayout } from "../src/bootstrap.js";
import { resolveDeckDataLayout } from "../src/config.js";

const allowedContentTypes = ["text/html", "application/xhtml+xml", "application/json", "text/plain"];

function parseArguments(argv: string[]) {
  const args = {
    source: "topdeck",
    limit: Number.POSITIVE_INFINITY
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--source" && argv[index + 1]) {
      args.source = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--limit" && argv[index + 1]) {
      args.limit = Number(argv[index + 1]);
      index += 1;
    }
  }

  return args;
}

function sanitizeTargetId(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function inferExtension(contentType: string | null): "html" | "json" | "txt" {
  if (!contentType) return "html";
  if (contentType.includes("json")) return "json";
  if (contentType.includes("plain")) return "txt";
  return "html";
}

function withTargetSuccess(target: AuditTarget, relativePath: string, capturedAt: string, byteLength: number, contentType: string | null): AuditTarget {
  return {
    ...target,
    status: "captured",
    relativePath,
    capturedAt,
    lastError: null,
    lastByteLength: byteLength,
    lastContentType: contentType
  };
}

function withTargetFailure(target: AuditTarget, error: unknown): AuditTarget {
  return {
    ...target,
    status: "failed",
    lastError: error instanceof Error ? error.message : "Unknown capture failure"
  };
}

function withTargetSkipped(target: AuditTarget, reason: string): AuditTarget {
  return {
    ...target,
    status: "skipped",
    lastError: reason
  };
}

function updatedPlan(plan: SourceAuditPlan, sourceSite: string, updatedTargets: Map<string, AuditTarget>): SourceAuditPlan {
  return sourceAuditPlanSchema.parse({
    ...plan,
    sources: plan.sources.map((source) => (
      source.sourceSite !== sourceSite
        ? source
        : {
            ...source,
            targets: source.targets.map((target) => updatedTargets.get(target.id) ?? target)
          }
    ))
  });
}

async function captureTarget(layout: ReturnType<typeof resolveDeckDataLayout>, target: AuditTarget) {
  const response = await fetch(target.url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.1",
      "User-Agent": "NoxiannetDecksStage1Audit/0.1"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  if (!allowedContentTypes.some((allowed) => contentType?.includes(allowed))) {
    throw new Error(`Refusing non-text content type: ${contentType ?? "unknown"}`);
  }

  const body = await response.text();
  const capturedAt = new Date().toISOString();
  const extension = inferExtension(contentType);
  const baseName = sanitizeTargetId(target.id);
  const relativeBase = join("raw", target.sourceSite, "samples", baseName).replaceAll("\\", "/");
  const targetPath = join(layout.rootDir, `${relativeBase}.${extension}`);
  const metadataPath = join(layout.rootDir, `${relativeBase}.meta.json`);

  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, body, "utf8");
  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        id: target.id,
        sourceSite: target.sourceSite,
        captureKind: target.captureKind,
        url: target.url,
        capturedAt,
        contentType,
        byteLength: Buffer.byteLength(body, "utf8"),
        textOnly: true,
        imagesDownloaded: false
      },
      null,
      2
    )
  );

  return withTargetSuccess(target, `${relativeBase}.${extension}`, capturedAt, Buffer.byteLength(body, "utf8"), contentType);
}

async function main() {
  const layout = resolveDeckDataLayout();
  await initializeDeckDataLayout(layout);
  const { source, limit } = parseArguments(process.argv.slice(2));
  const plan = await loadSourceAuditPlan();
  const auditSource = plan.sources.find((candidate) => candidate.sourceSite === source);

  if (!auditSource) {
    throw new Error(`Unknown source "${source}" in audit plan.`);
  }

  const updatedTargets = new Map<string, AuditTarget>();
  const selectedTargets = auditSource.targets
    .filter((target) => target.enabled)
    .slice(0, Number.isFinite(limit) ? limit : undefined);

  for (const target of selectedTargets) {
    if (target.usePolicy !== "approved" || auditSource.usePolicy !== "approved") {
      const reason = `Capture blocked by audit policy: ${target.usePolicy !== "approved" ? target.usePolicy : auditSource.usePolicy}`;
      updatedTargets.set(target.id, withTargetSkipped(target, reason));
      console.log(`Skipped ${target.label}: ${reason}`);
      continue;
    }

    try {
      const captured = await captureTarget(layout, target);
      updatedTargets.set(target.id, captured);
      console.log(`Captured ${target.label} -> ${captured.relativePath}`);
    } catch (error) {
      updatedTargets.set(target.id, withTargetFailure(target, error));
      console.log(`Failed ${target.label}: ${error instanceof Error ? error.message : "Unknown capture failure"}`);
    }
  }

  const nextPlan = updatedPlan(plan, auditSource.sourceSite, updatedTargets);
  await writeFile(layout.auditPlanPath, JSON.stringify(nextPlan, null, 2));

  const manifest = await generateArchiveManifest(layout);
  await writeArchiveManifest(layout, manifest);
}

await main();
