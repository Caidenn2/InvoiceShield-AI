import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { samples } from "../src/lib/samples";
const { infer } = vi.hoisted(() => ({ infer: vi.fn() }));
vi.mock("../src/lib/semantic-review", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/lib/semantic-review")>()),
  inferReview: infer,
}));
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("GROQ_API_KEY", "test-secret");
  vi.stubEnv("GROQ_FREE_PLAN_CONFIRMED", "true");
  infer.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
const request = (number = "test", origin = "http://localhost") =>
  new Request("http://localhost/api/review", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({
      invoice: { ...samples[2], number },
      text: samples[2].documentText,
      history: [],
      rules: [],
    }),
  });
describe("Public free inference route safeguards (mock model)", () => {
  it("does not call hosted inference until the Free plan is explicitly confirmed", async () => {
    vi.stubEnv("GROQ_FREE_PLAN_CONFIRMED", "false");
    const { GET, POST } = await import("../src/app/api/review/route");
    expect((await (await GET()).json()).available).toBe(false);
    expect((await POST(request())).status).toBe(503);
    expect(infer).not.toHaveBeenCalled();
  });
  it("rejects cross-origin and malformed requests before inference", async () => {
    const { POST } = await import("../src/app/api/review/route");
    expect((await POST(request("test", "https://evil.example"))).status).toBe(
      403,
    );
    expect(
      (
        await POST(
          new Request("http://localhost/api/review", {
            method: "POST",
            body: "bad JSON",
          }),
        )
      ).status,
    ).toBe(400);
    expect(infer).not.toHaveBeenCalled();
  });
  it("reuses an actual prior result only for identical context and labels it cached", async () => {
    infer.mockResolvedValue({
      summary: "Review urgency independently.",
      findings: [],
      provider: "groq",
      model: "openai/gpt-oss-20b",
      analyzedAt: "2026-11-06T12:00:00Z",
    });
    const { POST } = await import("../src/app/api/review/route");
    expect((await (await POST(request())).json()).cached).toBe(false);
    expect((await (await POST(request())).json()).cached).toBe(true);
    expect(infer).toHaveBeenCalledTimes(1);
  });
  it("bounds inference requests rather than attempting paid quota escalation", async () => {
    infer.mockResolvedValue({
      summary: "Review.",
      findings: [],
      provider: "groq",
      model: "openai/gpt-oss-20b",
      analyzedAt: "2026-11-06T12:00:00Z",
    });
    const { POST } = await import("../src/app/api/review/route");
    expect((await POST(request("1"))).status).toBe(200);
    expect((await POST(request("2"))).status).toBe(200);
    expect((await POST(request("3"))).status).toBe(429);
    expect(infer).toHaveBeenCalledTimes(2);
  });
  it("does not reveal provider failures or credentials", async () => {
    infer.mockRejectedValue(new Error("test-secret"));
    const { POST } = await import("../src/app/api/review/route");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("test-secret");
  });
});
