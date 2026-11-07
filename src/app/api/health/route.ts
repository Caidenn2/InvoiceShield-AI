export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(
    {
      status: "ok",
      network: "devnet",
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      hostedFreeAIConfigured:
        Boolean(process.env.GROQ_API_KEY) &&
        process.env.GROQ_FREE_PLAN_CONFIRMED === "true",
      paidOpenAIEnabled: process.env.ENABLE_OPENAI === "true",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
