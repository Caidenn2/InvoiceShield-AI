// Genuine model inference in the browser, followed by an explicitly cached replay.
// Uses fictional samples, never signs or submits payments, and never mocks AI output.
const { chromium } = require("playwright");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
let browser;
const base =
  process.env.TEST_BASE_URL || "https://invoice-shield-ai.vercel.app";
async function main() {
  await fs.mkdir("test-results/public", { recursive: true });
  browser = await chromium.launch({
    executablePath:
      process.env.BROWSER_EXECUTABLE ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  let submissions = 0;
  page.on("pageerror", (e) => errors.push(e.message));
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
      submissions++;
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(base + "/dashboard", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: "Catch a suspicious duplicate", exact: false })
    .click();
  await page
    .getByText("No semantic AI model ran for this invoice.", { exact: false })
    .waitFor();
  const consent = page.getByRole("checkbox", { name: /Send this invoice/ });
  await consent.waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Explain risks with AI", exact: true })
      .isDisabled(),
    true,
  );
  await consent.check();
  const resultPromise = page.waitForResponse(
    (r) => r.url().endsWith("/api/review") && r.request().method() === "POST",
    { timeout: 55000 },
  );
  await page
    .getByRole("button", { name: "Explain risks with AI", exact: true })
    .click();
  const response = await resultPromise;
  const result = await response.json();
  if (!response.ok()) throw new Error(result.error || "Model inference failed");
  assert.equal(result.simulated, false);
  assert.equal(result.report.provider, "groq");
  assert.equal(result.report.model, "openai/gpt-oss-20b");
  assert.equal(typeof result.cached, "boolean");
  await page.getByText(result.report.summary, { exact: true }).waitFor();
  assert.equal(await page.locator(".risk-dial b").innerText(), "100");
  assert.equal(
    await page
      .getByRole("button", { name: "Review test payment", exact: true })
      .isDisabled(),
    true,
  );
  await page
    .locator(".local-ai-report")
    .screenshot({
      path: result.cached
        ? "test-results/public/cached-ai-first.png"
        : "test-results/public/genuine-ai.png",
    });
  const cachedPromise = page.waitForResponse(
    (r) => r.url().endsWith("/api/review") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Run AI explanation again", exact: true })
    .click();
  const cached = await (await cachedPromise).json();
  assert.equal(cached.cached, true);
  assert.equal(cached.report.analyzedAt, result.report.analyzedAt);
  await page
    .getByText(
      "Previously generated model output reused for the same input. No new inference ran.",
      { exact: true },
    )
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "test-results/public/cached-ai-mobile.png",
    fullPage: true,
  });
  assert.equal(submissions, 0);
  assert.deepEqual(errors, []);
  await fs.writeFile(
    result.cached
      ? "test-results/public/cached-ai-check.json"
      : "test-results/public/genuine-ai.json",
    JSON.stringify(
      {
        base,
        ...result,
        cachedReplayVerified: true,
        paymentSubmissions: submissions,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        status: "PASS",
        provider: result.report.provider,
        model: result.report.model,
        analyzedAt: result.report.analyzedAt,
        findings: result.report.findings.length,
        inferenceRanThisRequest: !result.cached,
        cachedReplay: "PASS",
        ruleGateUnchanged: "PASS",
        paymentSubmissions: submissions,
        summary: result.report.summary,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
main().catch(async (error) => {
  console.error(error.message);
  await browser?.close();
  process.exitCode = 1;
});
