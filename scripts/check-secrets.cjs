// Load credentials with --env-file; report only booleans and affected paths.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const secrets = [
  "OPENAI_API_KEY",
  "INVOICE_ANALYSIS_TOKEN",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
]
  .map((k) => process.env[k])
  .filter(Boolean);
console.log("configured_secret_count=" + secrets.length);
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
if (tracked.includes(".env.local")) {
  console.error("FAIL: .env.local is tracked.");
  process.exit(1);
}
const ignored =
  execFileSync("git", ["check-ignore", ".env.local"], {
    encoding: "utf8",
  }).trim() === ".env.local";
const files = [...tracked];
function walk(root) {
  if (!fs.existsSync(root)) return;
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) walk(p);
    else files.push(p);
  }
}
walk(".next/static");
const matches = files.filter(
  (p) =>
    fs.existsSync(p) &&
    secrets.some((s) => fs.readFileSync(p).includes(Buffer.from(s))),
);
console.log("env_local_ignored=" + ignored);
console.log("env_local_tracked=false");
console.log(
  "credentials_found_in_tracked_files_or_browser_assets=" +
    (matches.length > 0),
);
if (matches.length) console.log("Affected paths: " + matches.join(", "));
if (!ignored || matches.length) process.exitCode = 1;
