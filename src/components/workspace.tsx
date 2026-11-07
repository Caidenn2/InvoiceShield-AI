"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import { get, set } from "idb-keyval";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDownLeft,
  ShieldCheck,
  LayoutDashboard,
  Files,
  ReceiptText,
  Plus,
  Search,
  ChevronRight,
  Upload,
  X,
  Check,
  AlertTriangle,
  ScanLine,
  Wallet,
  Activity,
  ExternalLink,
  Printer,
  RefreshCw,
  Menu,
  FileText,
  LoaderCircle,
  Trash2,
  Download,
  LockKeyhole,
} from "lucide-react";
import {
  Invoice,
  InvoiceData,
  blankInvoice,
  invoiceSchema,
  review,
  status,
  formatMoney,
  riskScore,
} from "@/lib/invoice";
import { extractLocally } from "@/lib/local-extraction";
import { parseInvoiceText } from "@/lib/local-parser";
import DemoGuide from "./demo-guide";
import SemanticReview from "./semantic-review";
import ReceiptLookup from "./receipt-lookup";
import { samples } from "@/lib/samples";
import {
  explorer,
  submitPayment,
  waitForReceipt,
  paymentInputError,
} from "@/lib/payment";

const storageKey = "invoiceshield.records.v1";
function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal">
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
const short = (s: string) => s.slice(0, 5) + "…" + s.slice(-5);
function RiskMeter({ findings }: { findings: ReturnType<typeof review> }) {
  const score = riskScore(findings);
  return (
    <div
      className={
        "risk-meter " + (score >= 40 ? "high" : score ? "medium" : "low")
      }
    >
      <div
        className="risk-dial"
        style={{
          background: `conic-gradient(currentColor ${score * 3.6}deg, #26333d 0deg)`,
        }}
      >
        <span>
          <b>{score}</b>
          <small>/100</small>
        </span>
      </div>
      <div>
        <span className="mini-label">RULE-BASED REVIEW PRIORITY</span>
        <h3>
          {score >= 40
            ? "Investigate before paying"
            : score
              ? "A closer look is needed"
              : "No rule-based issues detected"}
        </h3>
        <p>Transparent triage score · not a probability of fraud</p>
      </div>
    </div>
  );
}
export default function Workspace() {
  const [extractedText, setExtractedText] = useState(""),
    [localMethod, setLocalMethod] = useState<
      "pdf-text" | "local-ocr" | undefined
    >(),
    [localReport, setLocalReport] = useState<Invoice["localAI"]>(),
    [progress, setProgress] = useState("");
  const [records, setRecords] = useState<Invoice[]>([]),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState("");
  const [tab, setTab] = useState<"overview" | "invoices" | "receipts">(
      "overview",
    ),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false),
    [draft, setDraft] = useState<InvoiceData>(blankInvoice),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [source, setSource] = useState<"ai" | "manual" | "local">("manual"),
    [notice, setNotice] = useState("");
  const [edit, setEdit] = useState(false),
    [payOpen, setPayOpen] = useState(false),
    [recipient, setRecipient] = useState(""),
    [sol, setSol] = useState("0.01"),
    [consent, setConsent] = useState(false),
    [payBusy, setPayBusy] = useState(false),
    [payError, setPayError] = useState(""),
    [balance, setBalance] = useState<number | null>(null),
    [balanceError, setBalanceError] = useState(""),
    [mobile, setMobile] = useState(false);
  const submitting = useRef(false),
    history = useRef<Invoice[]>([]);
  const { connection } = useConnection(),
    wallet = useWallet();
  const { setVisible: setWalletSelectorVisible } = useWalletModal();
  useEffect(() => {
    setLocalReport(undefined);
  }, [draft]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) throw new Error();
        setRecords(
          parsed.map((row) => ({ ...row, ...invoiceSchema.parse(row) })),
        );
      }
      setReady(true);
    } catch {
      setStorageError(
        "Saved history could not be read. Export or clear browser data before using payments.",
      );
    }
  }, []);
  useEffect(() => {
    history.current = records;
  }, [records]);
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        try {
          const next = JSON.parse(event.newValue) as Invoice[];
          next.forEach((i) => invoiceSchema.parse(i));
          history.current = next;
          setRecords(next);
        } catch {
          setStorageError(
            "Another tab changed the stored history to an unreadable format. Payments are blocked.",
          );
        }
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (!selected) return;
    get<File>("file:" + selected)
      .then((v) => setFile(v || null))
      .catch(() => setFile(null));
  }, [selected]);
  async function refreshBalance() {
    if (!wallet.publicKey) {
      setBalance(null);
      return;
    }
    try {
      setBalanceError("");
      setBalance(
        (await connection.getBalance(wallet.publicKey, "confirmed")) / 1e9,
      );
    } catch {
      setBalanceError("Balance unavailable. Retry.");
    }
  }
  useEffect(() => {
    refreshBalance(); /* wallet changes trigger a fresh Devnet balance */
  }, [wallet.publicKey, connection]); // eslint-disable-line react-hooks/exhaustive-deps
  function persist(next: Invoice[]) {
    localStorage.setItem(storageKey, JSON.stringify(next));
    history.current = next;
    setRecords(next);
  }
  function loadSamples() {
    const existing = history.current;
    const next = [
      ...existing,
      ...samples.filter((s) => !existing.some((i) => i.id === s.id)),
    ];
    try {
      persist(next);
      setNotice(
        "Four fictional samples loaded. No AI extraction or blockchain payments were simulated.",
      );
    } catch {
      setStorageError("Browser storage is full or disabled.");
    }
  }
  const current = records.find((i) => i.id === selected),
    findings = current
      ? review(
          current,
          records.filter((i) => i.id !== current.id),
        )
      : [];
  const attention = records.filter(
    (i) =>
      review(
        i,
        records.filter((h) => h.id !== i.id),
      ).length > 0,
  ).length;
  const receipts = records.filter((i) => i.receipt);
  const filtered = records
    .filter((i) =>
      `${i.vendor} ${i.number}`.toLowerCase().includes(query.toLowerCase()),
    )
    .filter((i) => tab !== "receipts" || i.receipt)
    .filter(
      (i) =>
        filter === "all" ||
        (filter === "review"
          ? review(
              i,
              records.filter((h) => h.id !== i.id),
            ).length > 0
          : filter === "paid"
            ? !!i.receipt
            : !i.receipt),
    );
  function openUpload() {
    setExtractedText("");
    setLocalMethod(undefined);
    setLocalReport(undefined);
    setProgress("");
    setSelected(null);
    setDraft({ ...blankInvoice });
    setFile(null);
    setSource("manual");
    setError("");
    setUploadOpen(true);
  }
  function chooseFile(f?: File) {
    if (!f) return;
    if (
      !["application/pdf", "image/png", "image/jpeg"].includes(f.type) ||
      f.size === 0 ||
      f.size > 4 * 1024 * 1024
    ) {
      setError("Choose a PDF, PNG, or JPG under 4 MB.");
      return;
    }
    setFile(f);
    setError("");
    setDraft({ ...blankInvoice });
    setSource("manual");
    setExtractedText("");
    setLocalMethod(undefined);
    setLocalReport(undefined);
  }
  async function extract() {
    if (!file) return;
    setBusy(true);
    setError("");
    setLocalReport(undefined);
    try {
      const result = await extractLocally(file, setProgress);
      setDraft(result.invoice);
      setExtractedText(result.text);
      setLocalMethod(result.method);
      setSource("local");
      setProgress(
        "Extracted on this device. Review every field before saving.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Local extraction failed. Enter fields manually or paste document text.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function extractWithOpenAI() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set(
        "history",
        JSON.stringify(
          history.current
            .filter((i) => i.id !== selected)
            .slice(0, 20)
            .map((i) => ({
              vendor: i.vendor,
              number: i.number,
              date: i.date,
              total: i.total,
              currency: i.currency,
              items: i.items.slice(0, 5).map((item) => ({
                description: item.description.slice(0, 200),
              })),
            })),
        ),
      );
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: form,
        headers: token ? { "x-analysis-token": token } : {},
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDraft(invoiceSchema.parse(result.invoice));
      setSource("ai");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Extraction unavailable. Enter details manually.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setError("");
    try {
      const data = invoiceSchema.parse(draft);
      const id = edit && current ? current.id : crypto.randomUUID();
      if (file) await set("file:" + id, file);
      const row: Invoice = {
        ...(edit && current ? current : {}),
        ...data,
        id,
        createdAt:
          current && edit ? current.createdAt : new Date().toISOString(),
        source: edit && current ? current.source : source,
        filename: file?.name,
        documentText: extractedText || undefined,
        extractionMethod: localMethod,
        localAI: localReport,
      };
      persist(
        edit
          ? history.current.map((i) => (i.id === id ? row : i))
          : [row, ...history.current],
      );
      setSelected(id);
      setUploadOpen(false);
      setEdit(false);
      setNotice("Invoice saved. Deterministic checks have been updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save invoice.");
    }
  }
  async function updatePayment(id: string, change: Partial<Invoice>) {
    persist(
      history.current.map((i) => (i.id === id ? { ...i, ...change } : i)),
    );
  }
  async function pay() {
    if (
      !current ||
      !wallet.publicKey ||
      !wallet.signTransaction ||
      submitting.current
    )
      return;
    const id = current.id;
    setPayError("");
    submitting.current = true;
    setPayBusy(true);
    try {
      if (!consent)
        throw new Error("Confirm the recipient and test payment first.");
      const run = async () => {
        const fresh = JSON.parse(
          localStorage.getItem(storageKey) || "[]",
        ) as Invoice[];
        const record = fresh.find((i) => i.id === id);
        if (!record || record.pending || record.receipt)
          throw new Error(
            "This invoice already has a submitted payment. Verify its receipt.",
          );
        if (
          review(
            record,
            fresh.filter((i) => i.id !== record.id),
          ).some((f) => f.severity === "high")
        )
          throw new Error(
            "Resolve high-severity invoice findings before payment.",
          );
        history.current = fresh;
        const receipt = await submitPayment(
          connection,
          wallet.publicKey!,
          recipient,
          sol,
          wallet.signTransaction!,
          async (pending) => updatePayment(id, { pending }),
        );
        await updatePayment(id, { receipt, pending: undefined });
        setPayOpen(false);
        setNotice(
          "Devnet transfer confirmed and receipt matched against blockchain data.",
        );
        refreshBalance();
      };
      if (!navigator.locks)
        throw new Error(
          "This browser does not support payment locking. Use a current Chrome, Edge, or Firefox browser.",
        );
      await navigator.locks.request(
        "invoiceshield-payment",
        { mode: "exclusive" },
        run,
      );
    } catch (e) {
      setPayError(
        e instanceof Error
          ? e.message
          : "Wallet rejected or payment failed. Check pending status before retrying.",
      );
    } finally {
      submitting.current = false;
      setPayBusy(false);
    }
  }
  async function retryVerification() {
    const previous = current?.pending || current?.receipt;
    if (!current || !previous) return;
    setPayBusy(true);
    setPayError("");
    try {
      const receipt = await waitForReceipt(connection, previous);
      await updatePayment(current.id, { receipt, pending: undefined });
      setNotice("Receipt verified against Solana Devnet.");
      refreshBalance();
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Verification unavailable.");
    } finally {
      setPayBusy(false);
    }
  }
  function exportHistory() {
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoiceshield-history.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  const field = (key: keyof InvoiceData, label: string, type = "text") => (
    <label className="field" key={key}>
      <span>{label}</span>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? 0 : undefined}
        value={draft[key] === null ? "" : String(draft[key])}
        onChange={(e) =>
          setDraft({
            ...draft,
            [key]:
              e.target.value === ""
                ? null
                : type === "number"
                  ? Number(e.target.value)
                  : key === "currency"
                    ? e.target.value.toUpperCase()
                    : e.target.value,
          })
        }
      />
    </label>
  );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "is-open" : "")}>
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ShieldCheck size={23} />
          </span>
          InvoiceShield<span className="ai">AI</span>
        </Link>
        <div className="workspace-label">
          WORKSPACE <span>Personal</span>
        </div>
        <nav>
          {(
            [
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "invoices", label: "All invoices", icon: Files },
              { id: "receipts", label: "Payment receipts", icon: ReceiptText },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              onClick={() => {
                setTab(n.id);
                setSelected(null);
                setMobile(false);
              }}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === "invoices" && (
                <span className="nav-count">{records.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="devnet-card">
            <div>
              <span className="network">
                <i /> Devnet workspace
              </span>
            </div>
            <p>
              A real blockchain.
              <br />
              Only test funds.
            </p>
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noreferrer"
            >
              Get test SOL <ArrowUpRight size={14} />
            </a>
          </div>
          <button className="profile" onClick={exportHistory}>
            <span className="profile-avatar">IS</span>
            <span>
              Personal workspace<small>Export your invoice history</small>
            </span>
            <Download size={16} />
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <b>
              {current
                ? "Invoice review"
                : tab === "receipts"
                  ? "Payment receipts"
                  : tab === "invoices"
                    ? "All invoices"
                    : "Overview"}
            </b>
          </div>
          <div className="header-actions">
            <span className="network">
              <i /> Solana Devnet
            </span>
            <WalletMultiButton />
          </div>
        </header>
        <main className="workspace-content">
          {storageError && (
            <div className="notice danger" role="alert">
              {storageError}
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              <Check size={16} />
              {notice}
              <button
                className="icon-button"
                onClick={() => setNotice("")}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {!ready && !storageError ? (
            <p>Loading your workspace…</p>
          ) : (
            <>
              {current ? (
                <>
                  <button
                    className="back-link"
                    onClick={() => {
                      setSelected(null);
                      setPayError("");
                    }}
                  >
                    ← Back to invoices
                  </button>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">INVOICE REVIEW</div>
                      <h1>{current.vendor || "Unnamed vendor"}</h1>
                      <p>
                        {current.number || "No invoice number"} ·{" "}
                        {current.source === "sample"
                          ? "Fictional sample"
                          : current.source === "local"
                            ? `${current.extractionMethod === "pdf-text" ? "Local PDF text" : "Local OCR"} · review required`
                            : current.source === "ai"
                              ? "AI extracted · review required"
                              : "Manually entered"}
                      </p>
                    </div>
                    <span
                      className={
                        "status-badge " +
                        (findings.length ? "warning" : "success")
                      }
                    >
                      {status(findings)}
                    </span>
                  </div>
                  <div className="review-grid">
                    <section className="panel invoice-document">
                      <div className="panel-title">
                        <h2>
                          <FileText size={18} /> Invoice details
                        </h2>
                        {!current.pending && !current.receipt && (
                          <button
                            className="text-button"
                            onClick={() => {
                              setDraft(current);
                              setExtractedText(current.documentText || "");
                              setLocalMethod(current.extractionMethod);
                              setLocalReport(current.localAI);
                              setEdit(true);
                              setError("");
                              setUploadOpen(true);
                            }}
                          >
                            Edit details <ArrowUpRight size={14} />
                          </button>
                        )}
                      </div>
                      <div className="invoice-paper">
                        <div className="document-top">
                          <span className="document-logo">
                            {(current.vendor || "I").slice(0, 1)}.
                          </span>
                          <span>
                            INVOICE
                            {current.source === "sample" && (
                              <small>FICTIONAL SAMPLE</small>
                            )}
                          </span>
                        </div>
                        <h2>{current.vendor || "Vendor not provided"}</h2>
                        <div className="document-meta">
                          <div>
                            <span>Invoice reference</span>
                            <strong>{current.number || "Missing"}</strong>
                          </div>
                          <div>
                            <span>Issued</span>
                            <strong>{current.date || "Missing"}</strong>
                          </div>
                          <div>
                            <span>Due date</span>
                            <strong>{current.dueDate || "Missing"}</strong>
                          </div>
                        </div>
                        <div className="document-lines">
                          <div className="line-head">
                            <span>Description</span>
                            <span>Amount</span>
                          </div>
                          {current.items.length ? (
                            current.items.map((item, i) => (
                              <div key={i}>
                                <span>
                                  {item.description}
                                  <small>
                                    {item.quantity ?? "—"} ×{" "}
                                    {formatMoney(
                                      item.unitPrice,
                                      current.currency,
                                    )}
                                  </small>
                                </span>
                                <b>
                                  {formatMoney(item.amount, current.currency)}
                                </b>
                              </div>
                            ))
                          ) : (
                            <p className="muted">No line items extracted.</p>
                          )}
                        </div>
                        <div className="document-totals">
                          <p>
                            <span>Subtotal</span>
                            <b>
                              {formatMoney(current.subtotal, current.currency)}
                            </b>
                          </p>
                          <p>
                            <span>Tax</span>
                            <b>{formatMoney(current.tax, current.currency)}</b>
                          </p>
                          <p className="grand-total">
                            <span>Total due</span>
                            <strong>
                              {formatMoney(current.total, current.currency)}
                            </strong>
                          </p>
                        </div>
                        {current.paymentDetails && (
                          <p className="document-payment">
                            Printed payment details: {current.paymentDetails}
                          </p>
                        )}
                      </div>
                      {preview && (
                        <details className="original-file">
                          <summary>View original uploaded document</summary>
                          {file?.type === "application/pdf" ? (
                            <iframe
                              title="Original invoice PDF"
                              src={preview}
                            />
                          ) : (
                            <img
                              src={preview}
                              alt="Original uploaded invoice"
                            />
                          )}
                        </details>
                      )}
                    </section>
                    <div className="review-right">
                      <section className="panel verification-panel">
                        <div className="panel-title">
                          <h2>
                            <ShieldCheck size={18} /> Verification report
                          </h2>
                          <span className="mini-label">RULE-BASED</span>
                        </div>
                        <RiskMeter findings={findings} />
                        <div
                          className={
                            "review-summary " +
                            (findings.length ? "has-findings" : "")
                          }
                        >
                          <span>
                            {findings.length ? (
                              <AlertTriangle size={24} />
                            ) : (
                              <ShieldCheck size={24} />
                            )}
                          </span>
                          <div>
                            <h3>{status(findings)}</h3>
                            <p>
                              {findings.length
                                ? `${findings.length} finding${findings.length === 1 ? "" : "s"} to review before payment.`
                                : "Arithmetic, required fields, and available history checked."}
                            </p>
                          </div>
                        </div>
                        {findings.map((f, i) => (
                          <article className={"finding " + f.severity} key={i}>
                            <div>
                              <span className="severity-dot" />
                              <h4>{f.title}</h4>
                              <span className="mini-label">{f.severity}</span>
                            </div>
                            <p>{f.evidence}</p>
                            <small>{f.action}</small>
                          </article>
                        ))}
                        <div className="analysis-note">
                          <ScanLine size={17} />
                          <p>
                            <strong>
                              {current.source === "ai"
                                ? "AI interpretation"
                                : "Review context"}
                            </strong>
                            {current.explanation ||
                              "No AI model ran for this record. Deterministic checks use only your local history."}
                          </p>
                        </div>
                        <p className="fine-print">
                          These checks cannot establish authenticity or prove
                          fraud. Confirm vendor identity independently.
                        </p>
                      </section>
                      <section className="panel payment-panel">
                        <SemanticReview
                          invoice={current}
                          documentText={current.documentText}
                          history={records.filter((i) => i.id !== current.id)}
                          report={current.localAI}
                          onReport={(report) => {
                            updatePayment(current.id, {
                              localAI: report,
                            }).catch(() =>
                              setPayError(
                                "Could not save model report. Browser storage may be full.",
                              ),
                            );
                          }}
                        />
                        <div className="panel-title">
                          <h2>
                            <Wallet size={18} /> Devnet payment
                          </h2>
                          <span className="network">
                            <i /> Test funds
                          </span>
                        </div>
                        {current.receipt ? (
                          <>
                            <div className="confirmed-heading">
                              <ShieldCheck size={28} />
                              <div>
                                <h3>Transfer confirmed</h3>
                                <p>Verified against blockchain data</p>
                              </div>
                            </div>
                            <dl className="receipt-data">
                              <dt>Invoice</dt>
                              <dd>{current.number || current.id}</dd>
                              <dt>Amount</dt>
                              <dd>{current.receipt.lamports / 1e9} test SOL</dd>
                              <dt>Network</dt>
                              <dd>Solana Devnet</dd>
                              <dt>Sender</dt>
                              <dd>{current.receipt.sender}</dd>
                              <dt>Recipient</dt>
                              <dd>{current.receipt.recipient}</dd>
                              <dt>Signature</dt>
                              <dd>{current.receipt.signature}</dd>
                              <dt>Slot</dt>
                              <dd>{current.receipt.slot}</dd>
                              <dt>Block time</dt>
                              <dd>
                                {current.receipt.timestamp
                                  ? new Date(
                                      current.receipt.timestamp * 1000,
                                    ).toLocaleString()
                                  : "Unavailable from RPC"}
                              </dd>
                            </dl>
                            <div className="button-row">
                              <button
                                className="button secondary small"
                                disabled={payBusy}
                                onClick={retryVerification}
                              >
                                {payBusy ? (
                                  <LoaderCircle className="spin" size={14} />
                                ) : (
                                  <RefreshCw size={14} />
                                )}
                                Reverify on Devnet
                              </button>
                              <a
                                className="button secondary small"
                                href={explorer(current.receipt.signature)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View on Explorer <ExternalLink size={14} />
                              </a>
                              <button
                                className="icon-button"
                                onClick={() => window.print()}
                                aria-label="Print receipt"
                              >
                                <Printer size={18} />
                              </button>
                            </div>
                          </>
                        ) : current.pending ? (
                          <>
                            <div className="notice warning">
                              <Activity size={18} /> Transfer submitted. Verify
                              before taking any further action.
                            </div>
                            <p className="fine-print break-all">
                              {current.pending.signature}
                            </p>
                            <button
                              className="button secondary"
                              disabled={payBusy}
                              onClick={retryVerification}
                            >
                              {payBusy ? (
                                <LoaderCircle className="spin" size={16} />
                              ) : (
                                <RefreshCw size={16} />
                              )}{" "}
                              Verify submitted transfer
                            </button>
                            <a
                              className="text-button"
                              href={explorer(current.pending.signature)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Inspect on Explorer <ExternalLink size={14} />
                            </a>
                          </>
                        ) : (
                          <>
                            <div className="payment-total">
                              <span>Invoice value</span>
                              <b>
                                {formatMoney(current.total, current.currency)}
                              </b>
                            </div>
                            <p className="fine-print">
                              Pay a separately chosen test SOL amount. This demo
                              does not settle the invoice’s fiat value. No
                              invoice details are written on-chain.
                            </p>
                            {findings.length > 0 && (
                              <p className="inline-warning">
                                <AlertTriangle size={15} /> Resolve or
                                investigate the findings first.
                              </p>
                            )}
                            <button
                              className="button full"
                              disabled={
                                !ready ||
                                !!storageError ||
                                findings.some((f) => f.severity === "high")
                              }
                              onClick={() => {
                                setPayOpen(true);
                                setConsent(false);
                                setPayError("");
                              }}
                            >
                              Review test payment <ArrowRight size={17} />
                            </button>
                          </>
                        )}
                        {payError && (
                          <p className="error-text" role="alert">
                            {payError}
                          </p>
                        )}
                      </section>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">YOUR FINANCES, IN FOCUS</div>
                      <h1>
                        {tab === "overview"
                          ? "A clearer view. A confident next move."
                          : tab === "invoices"
                            ? "Every invoice. One workspace."
                            : "Proof you can verify."}
                      </h1>
                      <p>
                        {tab === "receipts"
                          ? "Confirmed Devnet transfers, matched to the payments you approved."
                          : "Review the details. Catch the unexpected. Pay with proof."}
                      </p>
                    </div>
                    <button
                      className="button"
                      onClick={openUpload}
                      disabled={!ready || !!storageError}
                    >
                      <Plus size={18} /> Upload invoice
                    </button>
                  </div>
                  {tab === "overview" && (
                    <>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <span>
                            Total invoices <Files size={18} />
                          </span>
                          <strong>
                            {records.length.toString().padStart(2, "0")}
                          </strong>
                          <small>
                            <span className="green-dot" /> In your browser
                            workspace
                          </small>
                        </div>
                        <div className="stat-card">
                          <span>
                            Needs review <ScanLine size={18} />
                          </span>
                          <strong>
                            {attention.toString().padStart(2, "0")}
                            <em>to check</em>
                          </strong>
                          <small className="amber">
                            Findings that deserve a closer look
                          </small>
                        </div>
                        <div className="stat-card">
                          <span>
                            Confirmed payments <ShieldCheck size={18} />
                          </span>
                          <strong>
                            {receipts.length.toString().padStart(2, "0")}
                          </strong>
                          <small>
                            <span className="green-dot" /> Verified Devnet
                            transfers
                          </small>
                        </div>
                        <div className="stat-card">
                          <span>
                            Test SOL transferred <ArrowUpRight size={18} />
                          </span>
                          <strong>
                            {receipts
                              .reduce(
                                (s, i) => s + i.receipt!.lamports / 1e9,
                                0,
                              )
                              .toFixed(3)}
                            <em>SOL</em>
                          </strong>
                          <small>Test funds · no monetary value</small>
                        </div>
                      </div>
                      <div className="workspace-banner">
                        <div className="banner-icon">
                          <ShieldCheck size={30} />
                        </div>
                        <div>
                          <span className="eyebrow">
                            MEET YOUR SECOND PAIR OF EYES
                          </span>
                          <h2>One invoice can tell two different stories.</h2>
                          <p>
                            Try our fictional samples. See how duplicate
                            detection connects the dots.
                          </p>
                        </div>
                        <button
                          className="button secondary small"
                          onClick={loadSamples}
                          disabled={!ready || !!storageError}
                        >
                          Explore sample invoices <ArrowRight size={16} />
                        </button>
                        <div className="banner-decoration" />
                      </div>
                    </>
                  )}
                  {tab === "overview" && ready && !storageError && (
                    <DemoGuide
                      paid={
                        !!records.find((i) => i.id === "sample-cloud")?.receipt
                      }
                      onChoose={(id, pay) => {
                        loadSamples();
                        setSelected(id);
                        setPayError("");
                        if (
                          pay &&
                          !history.current.find((i) => i.id === id)?.receipt
                        ) {
                          setPayOpen(true);
                          setConsent(false);
                        }
                      }}
                    />
                  )}
                  {tab === "receipts" && <ReceiptLookup />}
                  <div className="dashboard-grid">
                    <section className="panel invoices-panel">
                      <div className="panel-title">
                        <div>
                          <h2>
                            {tab === "receipts"
                              ? "Payment receipts"
                              : "Invoice workspace"}{" "}
                            <span className="count-badge">
                              {tab === "receipts"
                                ? receipts.length
                                : records.length}
                            </span>
                          </h2>
                          <p>
                            Every detail reviewed. Every next step intentional.
                          </p>
                        </div>
                        <button
                          className="icon-button"
                          onClick={exportHistory}
                          aria-label="Export invoice history"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                      <div className="table-tools">
                        <div className="tabs">
                          {[
                            { id: "all", label: "All invoices" },
                            { id: "review", label: "Needs review" },
                            { id: "paid", label: "Paid" },
                          ].map((f) => (
                            <button
                              key={f.id}
                              className={filter === f.id ? "selected" : ""}
                              onClick={() => setFilter(f.id)}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        <label className="search">
                          <Search size={16} />
                          <input
                            aria-label="Search invoices"
                            placeholder="Search invoices…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>VENDOR / INVOICE</th>
                              <th>AMOUNT</th>
                              <th>VERIFICATION</th>
                              <th>PAYMENT</th>
                              <th>
                                <span className="sr-only">Open</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((row) => {
                              const issues = review(
                                row,
                                records.filter((i) => i.id !== row.id),
                              );
                              return (
                                <tr
                                  key={row.id}
                                  onClick={() => {
                                    setSelected(row.id);
                                    setPayError("");
                                  }}
                                >
                                  <td>
                                    <button
                                      className="vendor-cell"
                                      onClick={() => setSelected(row.id)}
                                    >
                                      <span
                                        className={
                                          "vendor-avatar tone-" +
                                          ((row.vendor || "").length % 3)
                                        }
                                      >
                                        {(row.vendor || "?").slice(0, 1)}.
                                      </span>
                                      <span>
                                        <strong>
                                          {row.vendor || "Unnamed vendor"}
                                        </strong>
                                        <small>
                                          {row.number || "Missing reference"}
                                          {row.source === "sample"
                                            ? " · Sample"
                                            : ""}
                                        </small>
                                      </span>
                                    </button>
                                  </td>
                                  <td className="amount-cell">
                                    {formatMoney(row.total, row.currency)}
                                    <small>
                                      {row.dueDate
                                        ? `Due ${row.dueDate}`
                                        : "No due date"}
                                    </small>
                                  </td>
                                  <td>
                                    <span
                                      className={
                                        "risk-pill " +
                                        (riskScore(issues) >= 40
                                          ? "high"
                                          : riskScore(issues)
                                            ? "medium"
                                            : "low")
                                      }
                                    >
                                      {riskScore(issues)}/100
                                    </span>{" "}
                                    <span
                                      className={
                                        "status-badge " +
                                        (issues.length ? "warning" : "success")
                                      }
                                    >
                                      {issues.length ? (
                                        <AlertTriangle size={12} />
                                      ) : (
                                        <Check size={12} />
                                      )}{" "}
                                      {issues.some(
                                        (f) =>
                                          f.title === "Potential duplicate",
                                      )
                                        ? "Potential duplicate"
                                        : issues.length
                                          ? "Needs review"
                                          : "No issues detected"}
                                    </span>
                                  </td>
                                  <td>
                                    <span
                                      className={
                                        "payment-label " +
                                        (row.receipt ? "green" : "")
                                      }
                                    >
                                      {row.receipt
                                        ? "Confirmed"
                                        : row.pending
                                          ? "Submitted"
                                          : "Unpaid"}
                                    </span>
                                  </td>
                                  <td>
                                    <ChevronRight size={16} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {!filtered.length && (
                        <div className="empty-state">
                          <div className="empty-icon">
                            <Files size={29} />
                          </div>
                          <h3>
                            {records.length
                              ? "No matching invoices"
                              : "A fresh start for your finances."}
                          </h3>
                          <p>
                            {records.length
                              ? "Try a different search or filter."
                              : "Upload your first invoice or explore fictional samples to see the checks in action."}
                          </p>
                          {!records.length && (
                            <button
                              className="button secondary small"
                              onClick={loadSamples}
                              disabled={!ready || !!storageError}
                            >
                              Load sample invoices <ArrowRight size={15} />
                            </button>
                          )}
                        </div>
                      )}
                      <div className="table-footer">
                        <span>
                          {filtered.length} record
                          {filtered.length === 1 ? "" : "s"} · Stored on this
                          device
                        </span>
                        <LockKeyhole size={13} />
                        <span>Your invoice details stay off-chain</span>
                      </div>
                    </section>
                    {tab === "overview" && (
                      <aside className="dashboard-right">
                        <section className="panel wallet-card">
                          <div className="panel-title">
                            <h2>
                              <Wallet size={17} /> Your wallet
                            </h2>
                            <span className="network">
                              <i /> Devnet
                            </span>
                          </div>
                          <div className="wallet-balance">
                            <span>AVAILABLE TEST BALANCE</span>
                            <strong>
                              {wallet.connected
                                ? balance === null
                                  ? "—"
                                  : balance.toFixed(4)
                                : "—"}
                              <small>SOL</small>
                            </strong>
                            <p>
                              {wallet.publicKey
                                ? short(wallet.publicKey.toBase58())
                                : "Connect a wallet to get started"}
                            </p>
                          </div>
                          {wallet.publicKey ? (
                            <button
                              className="button secondary full small"
                              onClick={refreshBalance}
                            >
                              <RefreshCw size={15} /> Refresh balance
                            </button>
                          ) : (
                            <WalletMultiButton />
                          )}
                          {balanceError && (
                            <p className="error-text">{balanceError}</p>
                          )}
                          <p className="fine-print">
                            <ShieldCheck size={13} /> You approve every
                            transaction in your wallet.
                          </p>
                        </section>
                        <section className="panel activity-card">
                          <div className="panel-title">
                            <h2>Activity overview</h2>
                            <Activity size={17} />
                          </div>
                          {records.length ? (
                            records.slice(0, 3).map((i) => (
                              <div className="activity-item" key={i.id}>
                                <span className="activity-icon">
                                  {i.receipt ? (
                                    <ArrowUpRight size={15} />
                                  ) : (
                                    <ArrowDownLeft size={15} />
                                  )}
                                </span>
                                <div>
                                  <strong>
                                    {i.receipt
                                      ? "Transfer confirmed"
                                      : "Invoice added"}
                                  </strong>
                                  <p>{i.vendor || "Unnamed vendor"}</p>
                                  <small>
                                    {i.source === "sample"
                                      ? "Fictional sample"
                                      : new Date(
                                          i.createdAt,
                                        ).toLocaleDateString()}
                                  </small>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="muted activity-empty">
                              Your next move starts the story.
                              <br />
                              Activity appears as you add invoices.
                            </p>
                          )}
                          <div className="activity-note">
                            <span className="green-dot" /> Your workspace, up to
                            date.
                          </div>
                        </section>
                      </aside>
                    )}
                  </div>
                  <div className="workspace-footnote">
                    <ShieldCheck size={14} /> Review intelligently. Approve
                    intentionally.{" "}
                    <span>Devnet only · AI-assisted, human-approved</span>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
      <Modal
        open={uploadOpen}
        onOpenChange={(v) => {
          if (!busy) {
            setUploadOpen(v);
            if (!v) setEdit(false);
          }
        }}
        title={edit ? "Correct invoice details" : "Bring an invoice into focus"}
        description="PDF, PNG, or JPG · up to 4 MB. Review extracted fields before saving."
      >
        <div className="upload-layout">
          <div>
            <label
              className="dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                chooseFile(e.dataTransfer.files[0]);
              }}
            >
              <Upload size={28} />
              <strong>{file ? file.name : "Drop an invoice here"}</strong>
              <span>or click to choose a document</span>
              <input
                aria-label="Upload invoice file"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => chooseFile(e.target.files?.[0])}
              />
            </label>
            <div className="sample-downloads">
              <span>Fictional samples</span>
              <a href="/samples/normal.png" download>
                Normal <Download size={11} />
              </a>
              <a href="/samples/exact-duplicate.png" download>
                Duplicate <Download size={11} />
              </a>
              <a href="/samples/near-duplicate.png" download>
                Similar <Download size={11} />
              </a>
              <a href="/samples/suspicious-duplicate.png" download>
                Suspicious <Download size={11} />
              </a>
            </div>
            {preview && (
              <div className="upload-preview">
                {file?.type === "application/pdf" ? (
                  <iframe title="Uploaded invoice preview" src={preview} />
                ) : (
                  <img src={preview} alt="Uploaded invoice preview" />
                )}
              </div>
            )}
            <button
              className="button full"
              disabled={!file || busy}
              onClick={extract}
            >
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <ScanLine size={17} />
              )}{" "}
              {busy ? "Reading on your device…" : "Extract for free"}
            </button>
            <p className="fine-print">
              PDF text and image OCR run on this device. No paid API, account,
              or document upload is needed. Review every extracted value.
            </p>
            {progress && (
              <p className="extraction-progress" role="status">
                {progress}
              </p>
            )}
            <details className="extracted-text">
              <summary>Read or correct document text</summary>
              <textarea
                aria-label="Document text"
                maxLength={20000}
                value={extractedText}
                onChange={(e) => {
                  setExtractedText(e.target.value);
                  setLocalReport(undefined);
                }}
                placeholder="Paste invoice text here if OCR is unavailable."
              />
              <button
                className="button secondary small"
                disabled={!extractedText || busy}
                onClick={() => {
                  setDraft(parseInvoiceText(extractedText));
                  setSource("local");
                  setError("");
                }}
              >
                Map text to fields
              </button>
            </details>
            <SemanticReview
              invoice={draft}
              documentText={extractedText}
              history={records.filter((i) => i.id !== selected)}
              report={localReport}
              onReport={setLocalReport}
              disabled={busy}
            />
            <details className="optional-cloud">
              <summary>Optional cloud provider (disabled by default)</summary>
              <p className="fine-print">
                OpenAI is not needed for this demo. Enabling it may use paid API
                credits. Requires ENABLE_OPENAI=true on the server and explicit
                use of this button.
              </p>
              <label className="field">
                <span>Optional cloud access token</span>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <button
                className="button secondary small"
                disabled={!file || busy}
                onClick={extractWithOpenAI}
              >
                Request optional OpenAI extraction
              </button>
            </details>
          </div>
          <div>
            <div className="form-caption">
              <span className="mini-label">
                {source === "ai"
                  ? "AI EXTRACTED · VERIFY VALUES"
                  : source === "local"
                    ? "LOCAL EXTRACTION · VERIFY VALUES"
                    : "MANUAL ENTRY"}
              </span>
              <p>Leave unknown values blank. Never guess.</p>
            </div>
            <div className="fields-grid">
              {field("vendor", "Vendor name")}
              {field("number", "Invoice number")}
              {field("date", "Invoice date", "date")}
              {field("dueDate", "Due date", "date")}
              {field("subtotal", "Subtotal", "number")}
              {field("tax", "Tax", "number")}
              {field("total", "Total", "number")}
              {field("currency", "Currency (e.g. USD)")}
            </div>
            {field("paymentDetails", "Printed vendor payment details")}
            <div className="line-item-editor">
              <div>
                <h4>Line items</h4>
                <button
                  className="text-button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      items: [
                        ...draft.items,
                        {
                          description: "",
                          quantity: null,
                          unitPrice: null,
                          amount: null,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={14} /> Add line
                </button>
              </div>
              {draft.items.map((item, i) => (
                <div className="edit-line" key={i}>
                  <input
                    aria-label={`Line ${i + 1} description`}
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        items: draft.items.map((v, j) =>
                          i === j ? { ...v, description: e.target.value } : v,
                        ),
                      })
                    }
                  />
                  {(["quantity", "unitPrice", "amount"] as const).map((k) => (
                    <input
                      key={k}
                      aria-label={`Line ${i + 1} ${k}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={
                        k === "quantity"
                          ? "Qty"
                          : k === "unitPrice"
                            ? "Price"
                            : "Amount"
                      }
                      value={item[k] ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          items: draft.items.map((v, j) =>
                            i === j
                              ? {
                                  ...v,
                                  [k]:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                }
                              : v,
                          ),
                        })
                      }
                    />
                  ))}
                  <button
                    className="icon-button"
                    aria-label={`Remove line ${i + 1}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        items: draft.items.filter((_, j) => j !== i),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {draft.explanation && (
              <p className="fine-print">{draft.explanation}</p>
            )}
          </div>
        </div>
        {error && (
          <div className="notice danger" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <span>
            <LockKeyhole size={13} /> Saved in this browser only
          </span>
          <button className="button" disabled={busy} onClick={save}>
            Save & verify invoice <ArrowRight size={16} />
          </button>
        </div>
      </Modal>
      <Modal
        open={payOpen}
        onOpenChange={(v) => {
          if (!payBusy) setPayOpen(v);
        }}
        title="Approve a test payment"
        description="Solana Devnet · test SOL only · your wallet signs the transfer."
      >
        <div className="payment-dialog">
          <div className="notice warning">
            <AlertTriangle size={20} />
            <p>
              This is a demo transfer, not settlement of the invoice’s{" "}
              {current?.currency || "fiat"} value. A transfer does not verify
              the recipient’s business identity.
            </p>
          </div>
          <div className="payment-wallet">
            {wallet.publicKey ? (
              <>
                <span className="network">
                  <i />
                  Connected wallet · Devnet transfer
                </span>
                <span>{wallet.publicKey.toBase58()}</span>
              </>
            ) : (
              <>
                <button
                  className="button secondary"
                  onClick={() => {
                    setPayOpen(false);
                    setWalletSelectorVisible(true);
                    setNotice(
                      "Connect your wallet, then reopen the test payment review. Your recipient and amount stay in the form.",
                    );
                  }}
                >
                  <Wallet size={16} />
                  Connect wallet to continue
                </button>
                <p className="fine-print">
                  Wallet selection opens separately. Reopen this payment review
                  after connecting.
                </p>
              </>
            )}
          </div>
          <label className="field">
            <span>Recipient wallet address</span>
            <input
              value={recipient}
              aria-invalid={Boolean(
                recipient &&
                paymentInputError(recipient, sol, wallet.publicKey?.toBase58()),
              )}
              onChange={(e) => {
                setRecipient(e.target.value.trim());
                setConsent(false);
              }}
              placeholder="Enter and independently confirm the recipient"
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Separate test SOL amount (maximum 1 SOL)</span>
            <input
              inputMode="decimal"
              value={sol}
              onChange={(e) => {
                setSol(e.target.value);
                setConsent(false);
              }}
            />
          </label>
          <p className="fine-print">
            Devnet priority fee is explicitly set to 0 test SOL before signing.
            The network base fee still applies and is shown by your wallet.
          </p>
          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I confirmed this exact recipient address and the {sol || "chosen"}{" "}
              test SOL amount. I reviewed the invoice findings and understand
              this does not settle the invoice’s fiat value.
            </span>
          </label>
          {payError && (
            <p className="error-text" role="alert">
              {payError}
            </p>
          )}
          {(recipient || consent) &&
            paymentInputError(recipient, sol, wallet.publicKey?.toBase58()) && (
              <p className="error-text" role="alert">
                {paymentInputError(
                  recipient,
                  sol,
                  wallet.publicKey?.toBase58(),
                )}
              </p>
            )}
          <button
            className="button full"
            onClick={pay}
            disabled={
              !wallet.publicKey ||
              !wallet.signTransaction ||
              !consent ||
              Boolean(
                paymentInputError(recipient, sol, wallet.publicKey?.toBase58()),
              ) ||
              payBusy ||
              !!current?.pending ||
              !!current?.receipt
            }
          >
            {payBusy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Wallet size={17} />
            )}{" "}
            {payBusy
              ? "Awaiting signature / confirmation…"
              : "Approve in wallet"}
          </button>
          <p className="fine-print">
            If a submitted transaction cannot be verified, return to the invoice
            and retry verification. Never send again to resolve a timeout.
          </p>
        </div>
      </Modal>
    </div>
  );
}
