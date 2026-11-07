import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { GET, POST } from "../src/app/api/local-ai/route";
beforeEach(() => {
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("OLLAMA_MODEL", "qwen2.5:1.5b");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const request = (body: unknown, origin = "http://localhost") =>
  new Request("http://localhost/api/local-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
describe("Optional free Ollama provider", () => {
  it("reports an unavailable local service without pretending a model ran", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await (await GET()).json()).available).toBe(false);
    const result = await POST(request({ text: "Example invoice document" }));
    expect(result.status).toBe(503);
    expect((await result.json()).error).toContain("No AI report");
  });
  it("validates a real provider response schema and identifies provenance", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          response: JSON.stringify({
            summary: "No additional concerns in supplied text",
            findings: [],
          }),
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    const result = await POST(request({ text: "Example invoice document" }));
    expect(result.status).toBe(200);
    const data = await result.json();
    expect(data.provider).toBe("ollama");
    expect(data.simulated).toBe(false);
    expect(fetcher.mock.calls[0][0]).toBe(
      "http://127.0.0.1:11434/api/generate",
    );
  });
  it("rejects cross-origin requests and invalid input before calling the model", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(
      (await POST(request({ text: "A document here" }, "https://evil.example")))
        .status,
    ).toBe(403);
    expect((await POST(request({ text: "tiny" }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not try to reach a user laptop from a hosted Vercel function", async () => {
    vi.stubEnv("VERCEL", "1");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(
      (await POST(request({ text: "Example invoice document" }))).status,
    ).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
