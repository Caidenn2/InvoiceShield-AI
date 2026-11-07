"use client";
import { Files, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
export default function DemoGuide({
  onChoose,
  paid,
}: {
  onChoose: (id: string, pay?: boolean) => void;
  paid: boolean;
}) {
  return (
    <section className="demo-guide" aria-label="Free guided demonstration">
      <div className="demo-guide-title">
        <div>
          <span className="eyebrow">THE 2-MINUTE DEMO</span>
          <h2>Catch the risk. Keep the proof.</h2>
        </div>
        <span className="free-badge">$0 APIs required</span>
      </div>
      <div className="demo-steps">
        <button onClick={() => onChoose("sample-cloud")}>
          <span className="step-number">01</span>
          <Files size={19} />
          <strong>Review a legitimate invoice</strong>
          <small>Fictional sample · real rule checks</small>
          <ArrowRight size={15} />
        </button>
        <button onClick={() => onChoose("sample-duplicate")}>
          <span className="step-number">02</span>
          <ShieldCheck size={19} />
          <strong>Catch a suspicious duplicate</strong>
          <small>Duplicate + changed details + urgency</small>
          <ArrowRight size={15} />
        </button>
        <button onClick={() => onChoose("sample-cloud", true)}>
          <span className="step-number">03</span>
          <Wallet size={19} />
          <strong>
            {paid
              ? "Inspect the verified receipt"
              : "Approve a real Devnet transfer"}
          </strong>
          <small>
            {paid
              ? "Confirmed on-chain · test SOL"
              : "Live wallet approval required · test SOL"}
          </small>
          <ArrowRight size={15} />
        </button>
      </div>
      <p>
        Samples are fictional. Checks and OCR run live on your device. A payment
        is shown as successful only after RPC confirmation and receipt matching.
      </p>
    </section>
  );
}
