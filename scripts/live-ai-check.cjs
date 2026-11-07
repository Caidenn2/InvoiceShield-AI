// Uses .env.local via `node --env-file=.env.local scripts/live-ai-check.cjs`.
// Only fictional project fixtures are uploaded. Never prints credentials.
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
async function main() {
  assert.equal(
    process.env.ENABLE_OPENAI,
    "true",
    "Optional cloud testing is disabled. Use test:free-demo for the no-cost path.",
  );
  assert.ok(process.env.OPENAI_API_KEY, "OPENAI_API_KEY must be configured");
  assert.ok(
    process.env.INVOICE_ANALYSIS_TOKEN,
    "INVOICE_ANALYSIS_TOKEN must be configured",
  );
  const form = new FormData();
  form.set(
    "file",
    new File([await fs.readFile("public/samples/normal.png")], "normal.png", {
      type: "image/png",
    }),
  );
  const response = await fetch("http://127.0.0.1:3000/api/analyze", {
    method: "POST",
    body: form,
    headers: { "x-analysis-token": process.env.INVOICE_ANALYSIS_TOKEN },
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      `Analysis returned HTTP ${response.status} [${result.code || "unclassified"}]: ${result.error || "Unknown failure"}`,
    );
  const invoice = result.invoice;
  assert.equal(invoice.vendor, "Forma Studio");
  assert.equal(invoice.number, "FRM-2026-104");
  assert.equal(invoice.date, "2026-11-02");
  assert.equal(invoice.dueDate, "2026-11-16");
  assert.equal(invoice.subtotal, 2400);
  assert.equal(invoice.tax, 192);
  assert.equal(invoice.total, 2592);
  assert.equal(invoice.currency, "USD");
  assert.equal(invoice.items.length, 2);
  console.log(
    "PASS: real OpenAI PNG extraction matched vendor, reference, dates, amounts, currency, and line count.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
