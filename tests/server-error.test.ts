import { afterEach, describe, it, expect, vi } from "vitest";
import {
  safeErrorSummary,
  analysisErrorResponse,
} from "../src/lib/server-error";
afterEach(() => vi.unstubAllEnvs());
describe("Private AI error handling", () => {
  it("redacts both credentials from diagnostics", () => {
    vi.stubEnv("OPENAI_API_KEY", "test-api-secret");
    vi.stubEnv("INVOICE_ANALYSIS_TOKEN", "test-demo-secret");
    const result = safeErrorSummary(
      new Error(
        "test-api-secret test-demo-secret sk-abcdef data:image/png;base64,abcd",
      ),
    );
    expect(result.message).not.toContain("test-api-secret");
    expect(result.message).not.toContain("test-demo-secret");
    expect(result.message).not.toContain("sk-abcdef");
    expect(result.message).not.toContain("base64");
  });
  it("distinguishes exhausted billing from a transient rate limit", () => {
    expect(
      analysisErrorResponse({ status: 429, code: "credit_balance_exhausted" })
        .code,
    ).toBe("AI_CREDITS_REQUIRED");
    expect(
      analysisErrorResponse({ status: 429, code: "rate_limit_exceeded" })
        .status,
    ).toBe(429);
  });
  it("does not send provider messages or keys to the client", () => {
    expect(
      JSON.stringify(analysisErrorResponse({ status: 401, message: "secret" })),
    ).not.toContain("secret");
  });
});
