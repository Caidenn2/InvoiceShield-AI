// Log provider diagnostics without exposing credentials or uploaded documents.
export function safeErrorSummary(error: unknown) {
  const item = error as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
    code?: unknown;
  };
  let message =
    typeof item?.message === "string" ? item.message : "Unknown analysis error";
  for (const secret of [
    process.env.OPENAI_API_KEY,
    process.env.INVOICE_ANALYSIS_TOKEN,
  ]) {
    if (secret) message = message.split(secret).join("[redacted]");
  }
  message = message
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/data:[^\s]+/g, "[document omitted]")
    .slice(0, 600);
  return {
    name: typeof item?.name === "string" ? item.name : "Error",
    status: typeof item?.status === "number" ? item.status : undefined,
    code: typeof item?.code === "string" ? item.code : undefined,
    message,
  };
}

export function analysisErrorResponse(error: unknown) {
  const item = error as { status?: number; code?: string };
  if (
    item?.status === 429 &&
    [
      "credit_balance_exhausted",
      "insufficient_quota",
      "billing_hard_limit_reached",
    ].includes(item.code || "")
  )
    return {
      status: 503,
      code: "AI_CREDITS_REQUIRED",
      error:
        "AI extraction is unavailable because the API project has no remaining credits. The project owner must add API credits or configure a funded key. You can still enter fields manually and run deterministic checks.",
    };
  if (item?.status === 429)
    return {
      status: 429,
      code: "AI_RATE_LIMITED",
      error:
        "AI extraction is temporarily rate limited. Wait a moment and retry, or enter details manually.",
    };
  if (item?.status === 401 || item?.status === 403)
    return {
      status: 503,
      code: "AI_CONFIGURATION_REQUIRED",
      error:
        "The AI provider rejected the server credentials or model access. The project owner must check the API configuration. Manual entry and deterministic checks remain available.",
    };
  return {
    status: 502,
    code: "AI_EXTRACTION_FAILED",
    error:
      "Extraction failed. Retry or enter details manually. No payment has been initiated.",
  };
}
