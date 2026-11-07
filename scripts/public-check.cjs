// Real browser, fictional invoices, no wallet signatures and no transaction submission.
const { chromium } = require("playwright");
const { Keypair } = require("@solana/web3.js");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
const base = (
  process.env.TEST_BASE_URL || "https://invoice-shield-ai.vercel.app"
).replace(/\/$/, "");
let browser;
async function main() {
  await fs.mkdir("test-results/public", { recursive: true });
  browser = await chromium.launch({
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  let prohibited = 0;
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api.devnet.solana.com/**", async (route) => {
    let body;
    try {
      body = route.request().postDataJSON();
    } catch {}
    if (body && /sendTransaction|sendRawTransaction/.test(body.method || "")) {
      prohibited++;
      return route.abort();
    }
    return route.continue();
  });
  assert.equal(
    (await page.goto(base, { waitUntil: "domcontentloaded" })).status(),
    200,
  );
  await page.getByRole("heading", { name: /Good business/ }).waitFor();
  await page.getByRole("link", { name: "Open your workspace" }).click();
  await page
    .getByRole("heading", { name: "A clearer view. A confident next move." })
    .waitFor();
  await page.getByRole("button", { name: "Explore sample invoices" }).click();
  await page.getByRole("button", { name: /N\. Nimbus Cloud NMB-0082/ }).click();
  assert.equal(await page.locator(".risk-dial b").innerText(), "0");
  await page
    .getByRole("heading", { name: "No issues detected", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Review test payment", exact: true })
    .click();
  await page.getByLabel("Recipient wallet address").fill("bad");
  await page
    .getByRole("alert")
    .filter({ hasText: "valid recipient" })
    .waitFor();
  await page
    .getByLabel("Recipient wallet address")
    .fill(Keypair.generate().publicKey.toBase58());
  await page.getByLabel("Separate test SOL amount (maximum 1 SOL)").fill("0");
  await page.getByRole("alert").filter({ hasText: "greater than 0" }).waitFor();
  await page.getByLabel("Separate test SOL amount (maximum 1 SOL)").fill("1.1");
  await page.getByRole("alert").filter({ hasText: "at most 1" }).waitFor();
  await page
    .getByLabel("Separate test SOL amount (maximum 1 SOL)")
    .fill("0.001");
  assert.equal(
    await page.getByRole("button", { name: "Approve in wallet" }).isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "← Back to invoices" }).click();
  await page
    .getByRole("button", { name: "Catch a suspicious duplicate", exact: false })
    .click();
  assert.equal(await page.locator(".risk-dial b").innerText(), "100");
  for (const title of [
    "Potential duplicate",
    "Vendor payment details changed",
    "Suspicious payment request",
  ])
    await page
      .getByRole("heading", { name: title, exact: true })
      .first()
      .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Review test payment", exact: true })
      .isDisabled(),
    true,
  );
  await page.screenshot({
    path: "test-results/public/suspicious.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "test-results/public/review-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  assert.equal(prohibited, 0);
  const result = {
    base,
    automated: {
      homepage: "PASS",
      dashboard: "PASS",
      legitimateRisk: { status: "PASS", score: 0 },
      suspiciousRisk: { status: "PASS", score: 100 },
      duplicateChangedDetailsUrgency: "PASS",
      recipientAndAmountValidation: "PASS",
      unsignedPaymentGating: "PASS",
      desktopAndMobile: "PASS",
      pageErrors: 0,
      paymentSubmissions: 0,
    },
    manual: {
      phantomConnection:
        "NOT TESTED: isolated browser has no owner wallet extension",
      existingReceipt:
        "Needs owner public signature or verification in the owner browser",
    },
  };
  await fs.writeFile(
    "test-results/public/report.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}
main().catch(async (error) => {
  console.error(error.message);
  await browser?.close();
  process.exitCode = 1;
});
