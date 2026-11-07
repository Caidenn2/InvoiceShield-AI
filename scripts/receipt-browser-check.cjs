// Isolated QA browser: displays an actual previously confirmed owner transfer.
// The invoice wrapper is explicitly a QA record; no real invoice settlement is claimed.
const fs = require("node:fs/promises");
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
let browser;
async function main() {
  const receipt = JSON.parse(
    await fs.readFile("test-results/existing-receipt.json", "utf8"),
  );
  const base =
    process.env.TEST_BASE_URL || "https://invoice-shield-ai.vercel.app";
  browser = await chromium.launch({
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  let broadcasts = 0;
  await page.route("**/api.devnet.solana.com/**", async (route) => {
    let body;
    try {
      body = route.request().postDataJSON();
    } catch {}
    if (
      (Array.isArray(body) ? body : [body]).some((v) =>
        /sendTransaction|sendRawTransaction/.test(v?.method || ""),
      )
    ) {
      broadcasts++;
      return route.abort();
    }
    return route.continue();
  });
  await page.addInitScript((receipt) => {
    localStorage.setItem(
      "invoiceshield.records.v1",
      JSON.stringify([
        {
          id: "read-only-receipt-qa",
          createdAt: new Date().toISOString(),
          source: "manual",
          vendor: "Existing Devnet transfer — read-only QA",
          number: "RECEIPT-VERIFICATION",
          date: null,
          dueDate: null,
          subtotal: null,
          tax: null,
          total: null,
          currency: null,
          paymentDetails: null,
          items: [],
          explanation:
            "Isolated test record for an existing owner-provided on-chain transfer. No invoice settlement or new payment is claimed.",
          receipt,
        },
      ]),
    );
  }, receipt);
  await page.goto(base + "/dashboard", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Existing Devnet transfer/ }).click();
  await page
    .getByRole("heading", { name: "Transfer confirmed", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Reverify on Devnet", exact: true })
    .click();
  await page
    .getByText("Receipt verified against Solana Devnet.", { exact: true })
    .waitFor({ timeout: 45000 });
  assert.equal(
    await page
      .getByRole("link", { name: /View on Explorer/ })
      .getAttribute("href"),
    `https://explorer.solana.com/tx/${receipt.signature}?cluster=devnet`,
  );
  assert.equal(broadcasts, 0);
  // A fresh browser can look up the signature without importing invoice history.
  const lookup = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await lookup.route("**/api.devnet.solana.com/**", async (route) => {
    let body;
    try {
      body = route.request().postDataJSON();
    } catch {}
    if (
      (Array.isArray(body) ? body : [body]).some((v) =>
        /sendTransaction|sendRawTransaction/.test(v?.method || ""),
      )
    ) {
      broadcasts++;
      return route.abort();
    }
    return route.continue();
  });
  await lookup.goto(base + "/dashboard", { waitUntil: "domcontentloaded" });
  await lookup
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click();
  await lookup
    .getByRole("button", { name: "Payment receipts", exact: true })
    .click();
  await lookup
    .getByLabel("Public transaction signature", { exact: true })
    .fill(receipt.signature);
  await lookup
    .getByRole("button", { name: "Verify existing transfer", exact: true })
    .click();
  await lookup
    .getByRole("heading", { name: "Existing transfer verified", exact: true })
    .waitFor({ timeout: 45000 });
  await lookup
    .getByText(`${receipt.lamports / 1e9} test SOL`, { exact: true })
    .waitFor();
  assert.equal(
    await lookup.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await lookup.screenshot({
    path: "test-results/public/existing-transfer-lookup-mobile.png",
    fullPage: true,
  });
  assert.equal(broadcasts, 0);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "test-results/public/existing-receipt-mobile.png",
    fullPage: true,
  });
  await fs.writeFile(
    "test-results/public/receipt-browser-report.json",
    JSON.stringify(
      {
        base,
        status: "PASS",
        signature: receipt.signature,
        lamports: receipt.lamports,
        network: "devnet",
        savedReceiptReverified: true,
        freshBrowserLookup: true,
        mobileLayout: true,
        paymentSubmissions: broadcasts,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: actual owner transfer reverified in the public browser without a wallet, signature request, or payment submission; fresh-browser signature lookup and mobile receipt layout passed.",
  );
  await browser.close();
}
main().catch(async (error) => {
  console.error(error.message);
  await browser?.close();
  process.exitCode = 1;
});
