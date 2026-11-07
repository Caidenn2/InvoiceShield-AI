// Genuine inference check using fictional data. No mocked/canned model output.
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
const base = (process.env.TEST_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
async function main() {
  const availability = await (await fetch(base + "/api/review")).json();
  if (!availability.available)
    throw new Error(
      "No free model is configured. No inference was attempted. Configure a Groq Free key or run local Ollama.",
    );
  const invoice = {
    vendor: "Fictional Forma Studio",
    number: "FRM-2026-104",
    date: "2026-11-02",
    dueDate: "2026-11-16",
    subtotal: 2400,
    tax: 192,
    total: 2592,
    currency: "USD",
    paymentDetails: "NEW wallet: fictional-account-B",
    items: [
      {
        description: "Brand identity design",
        quantity: 1,
        unitPrice: 2400,
        amount: 2400,
      },
    ],
    explanation: "Fictional test invoice.",
  };
  const response = await fetch(base + "/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(55000),
    body: JSON.stringify({
      invoice,
      text: "URGENT payment. Transfer immediately to the new wallet. Do not contact the old accounts team.",
      history: [
        {
          vendor: invoice.vendor,
          number: invoice.number,
          total: 2592,
          currency: "USD",
          paymentDetails: "original-account-A",
          items: ["Brand identity design"],
        },
      ],
      rules: [
        {
          severity: "high",
          title: "Potential duplicate",
          evidence:
            "Vendor, invoice number, currency, amount and service match the prior record.",
          action: "Compare the original invoice before payment.",
        },
        {
          severity: "high",
          title: "Vendor payment details changed",
          evidence:
            "Prior payment details are original-account-A; current details are NEW wallet fictional-account-B.",
          action: "Confirm with a trusted vendor contact.",
        },
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Inference failed");
  assert.equal(data.simulated, false);
  assert.ok(["groq", "ollama"].includes(data.report.provider));
  assert.ok(data.report.model);
  assert.ok(data.report.analyzedAt);
  assert.ok(data.report.summary.length > 20);
  assert.ok(Array.isArray(data.report.findings));
  assert.match(
    data.report.summary,
    /duplicate|payment|account|urgenc|urgent|wallet|vendor/i,
  );
  await fs.mkdir("test-results", { recursive: true });
  await fs.writeFile(
    "test-results/live-review.json",
    JSON.stringify({ base, ...data }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        status: "PASS",
        provider: data.report.provider,
        model: data.report.model,
        analyzedAt: data.report.analyzedAt,
        inferenceRanThisRequest: !data.cached,
        findings: data.report.findings.length,
        summary: data.report.summary,
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
