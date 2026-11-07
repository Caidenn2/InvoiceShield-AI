// Real local OCR/browser regression; never invokes OpenAI or signs a payment.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const sharp = require("sharp");
let browser;
const baseURL = (process.env.TEST_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const screenshotDir = process.env.TEST_SCREENSHOT_DIR || "docs/screenshots";
async function main() {
  await fs.mkdir(screenshotDir, { recursive: true });
  browser = await chromium.launch({
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  page.setDefaultTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [],
    cloud = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/api/analyze") || r.url().includes("api.openai.com"))
      cloud.push(r.url());
  });
  await page.goto(`${baseURL}/dashboard`, {
    waitUntil: "domcontentloaded",
  });
  await page
    .getByRole("button", { name: "Upload invoice", exact: true })
    .click();
  await page
    .getByLabel("Upload invoice file")
    .setInputFiles("public/samples/normal.png");
  await page
    .getByRole("button", { name: "Extract for free", exact: true })
    .click();
  await page
    .getByText("Extracted on this device. Review every field before saving.", {
      exact: true,
    })
    .waitFor();
  const text = await page.getByLabel("Document text").inputValue();
  try {
    assert.equal(
      await page.getByLabel("Vendor name", { exact: true }).inputValue(),
      "Forma Studio",
    );
    assert.equal(
      await page.getByLabel("Invoice number", { exact: true }).inputValue(),
      "FRM-2026-104",
    );
    assert.equal(
      await page.getByLabel("Total", { exact: true }).inputValue(),
      "2592",
    );
    assert.equal(
      await page.getByLabel("Subtotal", { exact: true }).inputValue(),
      "2400",
    );
    assert.equal(
      await page.getByLabel("Tax", { exact: true }).inputValue(),
      "192",
    );
    assert.equal(
      await page.getByLabel("Invoice date", { exact: true }).inputValue(),
      "2026-11-02",
    );
    assert.equal(
      await page.getByLabel("Due date", { exact: true }).inputValue(),
      "2026-11-16",
    );
  } catch (error) {
    console.error("Recognized fictional fixture text:\n" + text);
    throw error;
  }
  await page.screenshot({
    path: `${screenshotDir}/free-extraction.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save & verify invoice" }).click();
  await page
    .getByRole("heading", { name: "No issues detected", exact: true })
    .waitFor();
  await page
    .getByText("No semantic AI model ran for this invoice.", { exact: false })
    .waitFor();
  await page.getByRole("button", { name: "← Back to invoices" }).click();
  await page
    .getByRole("button", { name: "Catch a suspicious duplicate", exact: false })
    .click();
  await page
    .getByRole("heading", { name: "Suspicious payment request", exact: true })
    .waitFor();
  await page
    .getByRole("heading", {
      name: "Vendor payment details changed",
      exact: true,
    })
    .first()
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Review test payment", exact: true })
      .isDisabled(),
    true,
  );
  await page.screenshot({
    path: `${screenshotDir}/suspicious-review.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "← Back to invoices" }).click();
  const printPage = await browser.newPage();
  await printPage.setContent(
    '<body style="margin:0">' +
      (await fs.readFile("public/samples/normal.svg", "utf8")) +
      "</body>",
  );
  const pdf = await printPage.pdf({
    width: "900px",
    height: "1100px",
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
  });
  await printPage.close();
  for (const fixture of [
    { name: "normal.pdf", mimeType: "application/pdf", buffer: pdf },
    {
      name: "normal.jpg",
      mimeType: "image/jpeg",
      buffer: await sharp("public/samples/normal.png").jpeg().toBuffer(),
    },
  ]) {
    await page
      .getByRole("button", { name: "Upload invoice", exact: true })
      .click();
    await page.getByLabel("Upload invoice file").setInputFiles(fixture);
    await page
      .getByRole("button", { name: "Extract for free", exact: true })
      .click();
    await page
      .getByText(
        "Extracted on this device. Review every field before saving.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await page.getByLabel("Total", { exact: true }).inputValue(),
      "2592",
    );
    assert.equal(
      await page.getByLabel("Vendor name", { exact: true }).inputValue(),
      "Forma Studio",
    );
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }
  assert.deepEqual(cloud, []);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real free local PNG/JPEG OCR and PDF extraction; rules caught duplicate, changed payment details, and suspicious urgency; no cloud AI calls or page errors.",
  );
  await browser.close();
}
main().catch(async (error) => {
  console.error(error.message);
  await browser?.close();
  process.exitCode = 1;
});
