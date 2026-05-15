import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function runGit(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  }).trim();
}

function readConfig() {
  const configPath = resolve("cloudflare-pages.config.json");
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function currentBranch() {
  return runGit(["branch", "--show-current"]);
}

const MAX_PREVIEW_ALIAS_LENGTH = 28;

function sanitizeBranchAlias(branch) {
  return branch
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_PREVIEW_ALIAS_LENGTH)
    .replace(/-+$/g, "");
}

function previewInfo(branch, config) {
  const alias = sanitizeBranchAlias(branch);
  const previewUrl = `https://${alias}.${config.projectName}.pages.dev`;
  const isProduction = branch === config.productionBranch;
  return {
    branch,
    alias,
    previewUrl,
    productionUrl: config.productionUrl,
    activeUrl: isProduction ? config.productionUrl : previewUrl
  };
}

function parseArgs(argv) {
  const [action, ...flags] = argv;
  if (!action || !["ship", "publish"].includes(action)) {
    console.error("Usage: node scripts/release-command.mjs <ship|publish> [--dry-run]");
    process.exit(1);
  }

  return {
    action,
    dryRun: flags.includes("--dry-run")
  };
}

function ensureBranch(branch) {
  if (!branch) {
    console.error("Unable to determine the current git branch.");
    process.exit(1);
  }
}

function pushBranch(branch, dryRun) {
  if (!dryRun) {
    execFileSync("git", ["push", "-u", "origin", branch], { stdio: "inherit" });
  }
}

function publishBranch(branch, dryRun) {
  const mainWorktree = "C:\\Users\\ptier\\repos\\Deck Archive Project-main-merge";

  if (!dryRun) {
    execFileSync("git", ["-C", mainWorktree, "fetch", "origin"], { stdio: "inherit" });
    execFileSync("git", ["-C", mainWorktree, "merge", "--ff-only", "origin/main"], { stdio: "inherit" });
    execFileSync("git", ["-C", mainWorktree, "merge", "--ff-only", branch], { stdio: "inherit" });
    execFileSync("git", ["-C", mainWorktree, "push", "origin", "main"], { stdio: "inherit" });
  }

  return mainWorktree;
}

const { action, dryRun } = parseArgs(process.argv.slice(2));
const config = readConfig();
const branch = currentBranch();
ensureBranch(branch);

const result = {
  action,
  dryRun,
  ...previewInfo(branch, config)
};

if (action === "ship") {
  pushBranch(branch, dryRun);
} else {
  result.mainWorktree = publishBranch(branch, dryRun);
}

console.log(JSON.stringify(result, null, 2));
