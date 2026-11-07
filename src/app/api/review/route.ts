import { createHash } from "node:crypto";
import {
  inferReview,
  reviewRequestSchema,
  GROQ_MODEL,
} from "@/lib/semantic-review";
export const runtime = "nodejs";
export const maxDuration = 60;
const entries = new Map<
  string,
  { at: number; report: Awaited<ReturnType<typeof inferReview>> }
>();
let windowStart = 0,
  requests = 0;
function groqReady() {
  return (
    process.env.GROQ_FREE_PLAN_CONFIRMED === "true" &&
    Boolean(process.env.GROQ_API_KEY)
  );
}
export async function GET() {
  if (groqReady())
    return Response.json(
      {
        available: true,
        provider: "groq",
        model: GROQ_MODEL,
        reason:
          "Hosted model configured for the owner-confirmed Groq Free plan. Text is sent only when you request analysis.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  if (!process.env.VERCEL) {
    try {
      const response = await fetch("http://127.0.0.1:11434/api/tags", {
        signal: AbortSignal.timeout(1500),
        cache: "no-store",
      });
      const data = await response.json();
      const model = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";
      if (data.models?.some((m: { name: string }) => m.name === model))
        return Response.json(
          {
            available: true,
            provider: "ollama",
            model,
            reason:
              "Local Ollama model ready. Analysis stays on this development computer.",
          },
          { headers: { "Cache-Control": "no-store" } },
        );
    } catch {
      /* Honest unavailable state below. */
    }
  }
  return Response.json(
    {
      available: false,
      provider: null,
      reason:
        "Semantic AI is not configured. No language model has run. Free OCR and deterministic rules remain available.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Request analysis from this application." },
      { status: 403 },
    );
  const provider = groqReady() ? "groq" : !process.env.VERCEL ? "ollama" : null;
  if (!provider)
    return Response.json(
      {
        error:
          "No free inference provider is configured. No model ran; rule-based review remains available.",
      },
      { status: 503 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: "Missing review context." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 48000) {
      await reader.cancel();
      return Response.json(
        { error: "Review context is too large." },
        { status: 413 },
      );
    }
    chunks.push(value);
  }
  let input;
  try {
    input = reviewRequestSchema.parse(
      JSON.parse(Buffer.concat(chunks).toString("utf8")),
    );
  } catch {
    return Response.json(
      { error: "Invalid invoice review context." },
      { status: 400 },
    );
  }
  const hash = createHash("sha256")
      .update(JSON.stringify({ provider, input }))
      .digest("hex"),
    now = Date.now();
  const saved = entries.get(hash);
  if (saved && now - saved.at < 10 * 60 * 1000)
    return Response.json(
      { report: saved.report, cached: true, simulated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  if (now - windowStart >= 60000) {
    windowStart = now;
    requests = 0;
  }
  // A small per-instance limiter conserves free quota. Provider Free-tier limits
  // remain the hard boundary; this is not a durable multi-instance quota system.
  if (requests >= 2)
    return Response.json(
      {
        error:
          "Demo AI rate limit reached. No new model report ran. Retry in a minute; rules remain available.",
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  requests++;
  try {
    const report = await inferReview(input, provider);
    if (entries.size >= 30) entries.delete(entries.keys().next().value!);
    entries.set(hash, { at: now, report });
    return Response.json(
      { report, cached: false, simulated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error &&
          /No |Free AI quota|model report/.test(error.message)
            ? error.message
            : "AI analysis did not return a valid report. No AI result is displayed; rules remain available.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
