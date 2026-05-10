import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readConfig() {
  const configPath = resolve("cloudflare-pages.config.json");
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function currentBranch() {
  return execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
}

function sanitizeBranchAlias(branch) {
  return branch
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const config = readConfig();
const requestedBranch = process.argv[2]?.trim();
const branch = requestedBranch && requestedBranch.length > 0 ? requestedBranch : currentBranch();

if (!branch) {
  console.error("Unable to determine a git branch name.");
  process.exit(1);
}

const alias = sanitizeBranchAlias(branch);
const previewUrl = `https://${alias}.${config.projectName}.pages.dev`;
const isProduction = branch === config.productionBranch;

console.log(JSON.stringify({
  branch,
  alias,
  previewUrl,
  productionUrl: config.productionUrl,
  activeUrl: isProduction ? config.productionUrl : previewUrl
}, null, 2));
