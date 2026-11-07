import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    responses = { parse };
  },
}));
import { POST } from "../src/app/api/analyze/route";
import { blankInvoice } from "../src/lib/invoice";
function upload(
  bytes: Uint8Array = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
  type = "image/png",
  token = "secret",
) {
  const form = new FormData();
  form.set("file", new File([bytes as BlobPart], "test.png", { type }));
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: form,
    headers: token ? { "x-analysis-token": token } : {},
  });
}
beforeEach(() => {
  vi.stubEnv("ENABLE_OPENAI", "true");
  vi.stubEnv("OPENAI_API_KEY", "test-only-not-a-real-key");
  vi.stubEnv("INVOICE_ANALYSIS_TOKEN", "secret");
  parse.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
describe("AI upload endpoint", () => {
  it("keeps optional paid extraction disabled unless the server owner explicitly opts in", async () => {
    vi.stubEnv("ENABLE_OPENAI", "false");
    const response = await POST(upload());
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("CLOUD_AI_DISABLED");
    expect(parse).not.toHaveBeenCalled();
  });
  it("explains exhausted API credits without leaking provider details", async () => {
    parse.mockRejectedValue({
      status: 429,
      code: "credit_balance_exhausted",
      message: "private provider detail",
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await POST(upload());
    expect(result.status).toBe(503);
    const body = await result.json();
    expect(body.code).toBe("AI_CREDITS_REQUIRED");
    expect(body.error).toContain("no remaining credits");
    expect(body.error).not.toContain("private provider detail");
    log.mockRestore();
  });
  it.each([
    ["application/pdf", [37, 80, 68, 70, 45], "input_file"],
    ["image/jpeg", [255, 216, 255, 224], "input_image"],
  ])(
    "routes %s input to the correct model content type",
    async (mime, bytes, kind) => {
      parse.mockResolvedValue({ output_parsed: blankInvoice });
      expect(
        (await POST(upload(new Uint8Array(bytes as number[]), mime as string)))
          .status,
      ).toBe(200);
      expect(parse.mock.calls[0][0].input[0].content[1].type).toBe(kind);
    },
  );
  it("reports unavailable AI honestly without a key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const r = await POST(upload());
    expect(r.status).toBe(503);
    expect(parse).not.toHaveBeenCalled();
  });
  it("requires the private demo token", async () => {
    expect((await POST(upload(undefined, undefined, ""))).status).toBe(401);
    expect(parse).not.toHaveBeenCalled();
  });
  it("rejects spoofed MIME and empty files", async () => {
    expect(
      (await POST(upload(new Uint8Array([1, 2, 3]), "image/png"))).status,
    ).toBe(400);
    expect((await POST(upload(new Uint8Array()))).status).toBe(400);
    expect(parse).not.toHaveBeenCalled();
  });
  it("bounds actual uploads even with an untrusted Content-Length", async () => {
    const r = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "x-analysis-token": "secret" },
        body: new Uint8Array(4 * 1024 * 1024 + 65537),
      }),
    );
    expect(r.status).toBe(413);
    expect(parse).not.toHaveBeenCalled();
  });
  it("returns schema-validated results and does not store model input", async () => {
    parse.mockResolvedValue({ output_parsed: blankInvoice });
    const r = await POST(upload());
    expect(r.status).toBe(200);
    expect((await r.json()).invoice.total).toBeNull();
    const args = parse.mock.calls[0][0];
    expect(args.store).toBe(false);
    expect(args.instructions).toContain("untrusted data");
    expect(args.text.format.type).toBe("json_schema");
  });
  it("handles refusal without fabricating extraction", async () => {
    parse.mockResolvedValue({ output_parsed: null });
    expect((await POST(upload())).status).toBe(422);
  });
  it("rejects malformed model output", async () => {
    parse.mockResolvedValue({ output_parsed: { total: "bad" } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await POST(upload())).status).toBe(502);
    log.mockRestore();
  });
});
