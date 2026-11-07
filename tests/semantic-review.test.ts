import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { inferReview, reviewRequestSchema } from "../src/lib/semantic-review";
import { samples } from "../src/lib/samples";
const input = () =>
  reviewRequestSchema.parse({
    invoice: samples[2],
    text: "Urgent payment: transfer immediately to a new account.",
    history: [],
    rules: [],
  });
beforeEach(() => {
  vi.stubEnv("GROQ_API_KEY", "test-only-key");
  vi.stubEnv("GROQ_FREE_PLAN_CONFIRMED", "true");
  vi.stubEnv("VERCEL", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("Real inference plumbing and provenance (mock provider tests)", () => {
  it("does not make a request without explicit Free-plan confirmation", async () => {
    vi.stubEnv("GROQ_FREE_PLAN_CONFIRMED", "false");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(inferReview(input(), "groq")).rejects.toThrow("No model ran");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("requests strict structured inference from the pinned hosted model", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary:
                    "The urgent account change warrants independent confirmation.",
                  findings: [
                    {
                      severity: "high",
                      title: "Urgent account change",
                      evidence:
                        "Document says transfer immediately to a new account.",
                      action: "Confirm through a trusted vendor contact.",
                    },
                  ],
                }),
              },
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    const result = await inferReview(input(), "groq");
    expect(result.provider).toBe("groq");
    expect(result.model).toBe("openai/gpt-oss-20b");
    expect(result.analyzedAt).toMatch(/^\d{4}-/);
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.max_completion_tokens).toBeLessThanOrEqual(1600);
    expect(body.tools).toBeUndefined();
    expect(body.messages[0].content).toContain("untrusted data");
  });
  it("never replaces quota errors with fabricated reports", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 429 })),
    );
    await expect(inferReview(input(), "groq")).rejects.toThrow(
      "No new model report",
    );
  });
  it("rejects malformed inference output", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({
            choices: [{ message: { content: '{"summary":"fake approval"}' } }],
          }),
        ),
    );
    await expect(inferReview(input(), "groq")).rejects.toThrow();
  });
  it("keeps local inference loopback-only and unavailable from Vercel", async () => {
    vi.stubEnv("VERCEL", "1");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(inferReview(input(), "ollama")).rejects.toThrow(
      "cannot access Ollama",
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
