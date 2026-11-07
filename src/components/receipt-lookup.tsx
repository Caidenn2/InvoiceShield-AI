"use client";
import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  ReceiptText,
  RefreshCw,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";
import { Receipt } from "@/lib/invoice";
import { readConfirmedTransfer, explorer } from "@/lib/payment";
export default function ReceiptLookup() {
  const { connection } = useConnection();
  const [signature, setSignature] = useState(""),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function verify() {
    if (busy) return;
    setBusy(true);
    setError("");
    setReceipt(null);
    try {
      setReceipt(await readConfirmedTransfer(connection, signature.trim()));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Receipt verification unavailable. No payment was initiated.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel receipt-lookup">
      <div className="panel-title">
        <div>
          <h2>
            <ReceiptText size={18} />
            Verify an existing transfer
          </h2>
          <p>
            Read-only Solana Devnet lookup · no wallet connection or new payment
          </p>
        </div>
        <span className="network">
          <i />
          Devnet
        </span>
      </div>
      <div className="receipt-lookup-body">
        <label className="field">
          <span>Public transaction signature</span>
          <input
            value={signature}
            onChange={(e) => {
              setSignature(e.target.value);
              setReceipt(null);
              setError("");
            }}
            placeholder="Paste the signature of a previously confirmed transfer"
            autoComplete="off"
          />
        </label>
        <button
          className="button secondary small"
          disabled={busy || !signature.trim()}
          onClick={verify}
        >
          {busy ? (
            <LoaderCircle className="spin" size={15} />
          ) : (
            <RefreshCw size={15} />
          )}
          Verify existing transfer
        </button>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {receipt && (
          <>
            <div className="confirmed-heading">
              <ReceiptText size={25} />
              <div>
                <h3>Existing transfer verified</h3>
                <p>Confirmed Devnet data · no payment was sent</p>
              </div>
            </div>
            <dl className="receipt-data">
              <dt>Amount</dt>
              <dd>{receipt.lamports / 1e9} test SOL</dd>
              <dt>Sender</dt>
              <dd>{receipt.sender}</dd>
              <dt>Recipient</dt>
              <dd>{receipt.recipient}</dd>
              <dt>Signature</dt>
              <dd>{receipt.signature}</dd>
              <dt>Slot</dt>
              <dd>{receipt.slot}</dd>
              <dt>Block time</dt>
              <dd>
                {receipt.timestamp
                  ? new Date(receipt.timestamp * 1000).toLocaleString()
                  : "Unavailable"}
              </dd>
            </dl>
            <a
              className="text-button"
              href={explorer(receipt.signature)}
              target="_blank"
              rel="noreferrer"
            >
              Inspect existing transfer on Explorer
              <ExternalLink size={14} />
            </a>
            <p className="fine-print">
              This reads the transfer associated with this signature. Compare
              its recipient and amount with your original approval. It does not
              verify business identity or mark any invoice as paid.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
