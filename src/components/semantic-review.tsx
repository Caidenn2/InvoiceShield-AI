"use client";
import { useEffect, useRef, useState } from "react";
import { Cpu, LoaderCircle, RefreshCw } from "lucide-react";
import { Invoice, InvoiceData, invoiceSchema, review } from "@/lib/invoice";
import { localAISchema } from "@/lib/local-ai";
type Props = {
  invoice: InvoiceData;
  documentText?: string;
  history: Invoice[];
  report?: Invoice["localAI"];
  onReport: (report: NonNullable<Invoice["localAI"]>) => void;
  disabled?: boolean;
};
export default function SemanticReview({
  invoice,
  documentText = "",
  history,
  report,
  onReport,
  disabled = false,
}: Props) {
  const [status, setStatus] = useState<{
    available: boolean;
    provider?: "groq" | "ollama";
    model?: string;
    reason: string;
  }>({ available: false, reason: "Checking free inference availability…" });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false);
  const parsedInvoice = invoiceSchema.safeParse(invoice);
  const context = {
    invoice: parsedInvoice.success ? parsedInvoice.data : invoice,
    text: documentText.slice(0, 10000),
    history: history.slice(0, 8).map((i) => ({
      vendor: i.vendor,
      number: i.number,
      total: i.total,
      currency: i.currency,
      paymentDetails: i.paymentDetails,
      items: i.items.slice(0, 3).map((v) => v.description.slice(0, 200)),
    })),
    rules: review({ ...invoice, documentText }, history).slice(0, 10),
  };
  const serialized = JSON.stringify(context),
    current = useRef(serialized);
  current.current = serialized;
  async function refresh() {
    try {
      const response = await fetch("/api/review", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setStatus(await response.json());
    } catch {
      setStatus({
        available: false,
        reason:
          "Semantic AI is unavailable. No new model ran. Rule-based review is ready.",
      });
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    setConsent(false);
  }, [serialized]);
  async function run() {
    if (
      !status.available ||
      busy ||
      !parsedInvoice.success ||
      (status.provider === "groq" && !consent)
    )
      return;
    const submitted = serialized;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: submitted,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "AI unavailable. No result generated.");
      if (current.current !== submitted)
        throw new Error(
          "The invoice changed while the model ran. Review current fields and run analysis again.",
        );
      const parsed = localAISchema.parse(data.report);
      if (
        !["groq", "ollama"].includes(data.report.provider) ||
        typeof data.report.model !== "string" ||
        typeof data.report.analyzedAt !== "string"
      )
        throw new Error(
          "The response lacked valid model provenance. No result displayed.",
        );
      onReport({
        ...parsed,
        provider: data.report.provider,
        model: data.report.model,
        analyzedAt: data.report.analyzedAt,
        cached: data.cached === true,
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No AI result generated. Rule-based findings remain available.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="local-ai-report">
      <div className="local-ai-heading">
        <Cpu size={17} />
        <h3>Semantic AI Review</h3>
        <span className="mini-label">
          {report
            ? report.cached
              ? "MODEL RESULT · CACHED"
              : "MODEL RESULT · FRESH AT ANALYSIS"
            : "NOT RUN"}
        </span>
        <button
          className="icon-button"
          onClick={refresh}
          disabled={busy}
          aria-label="Check AI availability"
        >
          <RefreshCw size={13} />
        </button>
      </div>
      {report ? (
        <>
          <p>{report.summary}</p>
          <small>
            {report.provider === "groq"
              ? "Groq Free hosted inference"
              : "Ollama local inference"}{" "}
            · {report.model}
            {report.analyzedAt
              ? ` · ${new Date(report.analyzedAt).toLocaleString()}`
              : ""}
          </small>
          {report.cached && (
            <p className="fine-print">
              Previously generated model output reused for the same input. No
              new inference ran.
            </p>
          )}
          {report.findings.map((f, i) => (
            <article className="finding" key={i}>
              <div>
                <h4>{f.title}</h4>
                <span className="mini-label">AI · {f.severity}</span>
              </div>
              <p>
                <strong>Model explanation</strong> {f.evidence}
              </p>
              <small>
                <strong>Verify next</strong> {f.action}
              </small>
            </article>
          ))}
        </>
      ) : (
        <p>
          No semantic AI model ran for this invoice. Rules remain separate and
          functional. OCR recognizes text; it does not determine fraud.
        </p>
      )}
      <p className="fine-print">{status.reason}</p>
      {status.provider === "groq" && (
        <label className="consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Send this invoice’s text, fields, and up to eight prior invoice
            summaries to Groq for a model-generated explanation. I’m using the
            configured Free plan.
          </span>
        </label>
      )}
      <button
        className="button secondary full small"
        onClick={run}
        disabled={
          !status.available ||
          busy ||
          disabled ||
          !parsedInvoice.success ||
          (status.provider === "groq" && !consent)
        }
      >
        {busy ? <LoaderCircle className="spin" size={15} /> : <Cpu size={15} />}{" "}
        {busy
          ? "Model inference running…"
          : report
            ? "Run AI explanation again"
            : "Explain risks with AI"}
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <p className="fine-print">
        Model suggestions are advisory. They cannot approve a payment or
        establish vendor identity. Your wallet signs only after your separate
        approval.
      </p>
    </div>
  );
}
