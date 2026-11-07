// Local browser smoke checks. Uses an installed Edge browser; no wallet keys or live transfers.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
let testBrowser;
async function main() {
  const browser = (testBrowser = await chromium.launch({
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  }));
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await fs.mkdir("docs/screenshots", { recursive: true });
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Good business/ }).waitFor();
  await page.screenshot({
    path: "docs/screenshots/landing.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Open your workspace" }).click();
  await page
    .getByRole("heading", { name: "A clearer view. A confident next move." })
    .waitFor();
  await page.getByRole("button", { name: "Explore sample invoices" }).click();
  await page
    .getByText("Four fictional samples loaded.", { exact: false })
    .waitFor();
  await page.screenshot({
    path: "docs/screenshots/dashboard.png",
    fullPage: true,
  });
  assert.equal(
    await page.getByText("Potential duplicate", { exact: true }).count(),
    2,
  );
  await page
    .getByRole("button", { name: /F\. Forma Studio FRM-2026-105/ })
    .click();
  await page
    .getByRole("heading", { name: "Similar invoice found" })
    .first()
    .waitFor();
  await page.screenshot({
    path: "docs/screenshots/review.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "← Back to invoices" }).click();
  await page
    .getByRole("button", { name: "Upload invoice", exact: true })
    .click();
  await page
    .getByLabel("Upload invoice file")
    .setInputFiles("public/samples/normal.png");
  await page.getByRole("img", { name: "Uploaded invoice preview" }).waitFor();
  await page.getByRole("button", { name: "Extract with AI" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: /AI extraction is not configured/ })
    .waitFor();
  await page.getByLabel("Vendor name", { exact: true }).fill("Test Vendor");
  await page.getByLabel("Invoice number", { exact: true }).fill("TEST-001");
  await page.getByLabel("Invoice date", { exact: true }).fill("2026-11-06");
  await page.getByLabel("Due date", { exact: true }).fill("2026-11-20");
  await page.getByLabel("Subtotal", { exact: true }).fill("100");
  await page.getByLabel("Tax", { exact: true }).fill("8");
  await page.getByLabel("Total", { exact: true }).fill("108");
  await page.getByLabel("Currency (e.g. USD)", { exact: true }).fill("USD");
  await page.getByRole("button", { name: "Save & verify invoice" }).click();
  await page
    .getByRole("heading", { name: "Test Vendor", exact: true, level: 1 })
    .waitFor();
  await page.getByRole("heading", { name: "No issues detected" }).waitFor();
  await page.getByRole("button", { name: "Review test payment" }).click();
  await page.getByRole("heading", { name: "Approve a test payment" }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Approve in wallet" }).isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: /T\. Test Vendor TEST-001/ })
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name: "Payment receipts" }).click();
  await page.getByRole("heading", { name: "Proof you can verify." }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: landing, samples, exact/near duplicates, upload preview, honest AI fallback, manual save, payment gating, persistence, mobile navigation, and no page errors.",
  );
  await browser.close();
}
main().catch(async (e) => {
  console.error(e);
  await testBrowser?.close();
  process.exitCode = 1;
});
