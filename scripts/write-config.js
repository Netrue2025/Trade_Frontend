const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const DEFAULT_API_BASE_URL = "https://tradebackend-production-8530.up.railway.app";
const apiBaseUrl = String(process.env.TRADE_API_BASE_URL || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
const explicitBuildId = String(
  process.env.NETRUEFI_BUILD_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    ""
).trim();
const fallbackBuildId = process.env.VERCEL
  ? (() => {
      try {
        return childProcess.execSync("git rev-parse --short=12 HEAD", { encoding: "utf8" }).trim();
      } catch {
        return "";
      }
    })()
  : "local";
const buildId = (explicitBuildId || fallbackBuildId || "local").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
const configPath = path.join(__dirname, "..", "public", "config.js");

fs.writeFileSync(
  configPath,
  [
    `window.TRADE_API_BASE_URL = ${JSON.stringify(apiBaseUrl)};`,
    `window.NETRUEFI_BUILD_ID = ${JSON.stringify(buildId)};`,
    "",
  ].join("\n")
);
console.log(`Wrote frontend API config: ${apiBaseUrl || "same-origin"}`);
console.log(`Wrote frontend build id: ${buildId}`);
