import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  ScanLine,
  Layers3,
  Check,
  Fingerprint,
  CircleDot,
  Zap,
} from "lucide-react";
export default function Landing() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ShieldCheck size={23} />
          </span>
          InvoiceShield<span className="ai">AI</span>
        </Link>
        <div className="nav-links">
          <a href="#workflow">How it works</a>
          <a href="#intelligence">Intelligence</a>
          <span className="network">
            <i />
            Solana Devnet
          </span>
        </div>
        <Link className="button secondary small" href="/dashboard">
          Launch app <ArrowUpRight size={16} />
        </Link>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pill-dot" /> THE CONFIDENCE TO MOVE FORWARD
          </div>
          <h1>
            Good business.
            <br />
            Better verification.
            <br />
            <span>Proof of every payment.</span>
          </h1>
          <p>
            Your invoices deserve a second look. Catch duplicates, uncover
            discrepancies, and turn approved payments into verifiable proof on
            Solana.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/dashboard">
              Open your workspace <ArrowRight size={18} />
            </Link>
            <a href="#workflow" className="text-button">
              See how it works <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="hero-note">
            <ShieldCheck size={16} /> Human-approved payments <span>·</span>{" "}
            Devnet test SOL only
          </div>
        </div>
        <div className="hero-preview">
          <div className="preview-top">
            <span>
              <i /> LIVE WORKSPACE PREVIEW
            </span>
            <span className="muted">Fictional sample</span>
          </div>
          <div className="preview-title">
            <div className="vendor-avatar">F.</div>
            <div>
              <h3>Forma Studio</h3>
              <p>FRM-2026-104 · Design services</p>
            </div>
            <span className="preview-amount">
              $2,592<span>USD</span>
            </span>
          </div>
          <div className="scan-visual">
            <ScanLine size={25} />
            <span>Every detail. A closer look.</span>
            <div className="scan-beam" />
          </div>
          <div className="preview-check">
            <span>
              <Check size={15} /> Invoice arithmetic
            </span>
            <b>Matches</b>
          </div>
          <div className="preview-check">
            <span>
              <Check size={15} /> Duplicate detection
            </span>
            <b>Checked</b>
          </div>
          <div className="preview-check">
            <span>
              <Check size={15} /> Required fields
            </span>
            <b>Complete</b>
          </div>
          <div className="proof-card">
            <Fingerprint size={26} />
            <div>
              <strong>From invoice to independent proof.</strong>
              <p>Review. Approve. Verify on Solana.</p>
            </div>
            <ArrowUpRight size={18} />
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <span>BUILT FOR THE WAY SMALL BUSINESSES WORK</span>
        <div>
          <Layers3 size={17} /> Less busywork
        </div>
        <div>
          <ShieldCheck size={17} /> More clarity
        </div>
        <div>
          <CircleDot size={17} /> Verifiable transfers
        </div>
      </div>
      <section id="workflow" className="workflow">
        <div className="section-heading">
          <div>
            <div className="eyebrow">A CLEAR PATH TO PAYMENT</div>
            <h2>Three steps. Zero guesswork.</h2>
          </div>
          <p>
            Keep your judgment.
            <br />
            Give it better information.
          </p>
        </div>
        <div className="feature-grid">
          {[
            {
              n: "01",
              icon: ScanLine,
              title: "Bring your invoices.",
              text: "Upload a PDF or image. Extract the details with AI, then review and correct every field.",
            },
            {
              n: "02",
              icon: ShieldCheck,
              title: "Catch the unexpected.",
              text: "Check the math, compare invoice history, and understand what needs a closer look.",
            },
            {
              n: "03",
              icon: Zap,
              title: "Pay. With proof.",
              text: "Approve a test SOL transfer in your wallet. Get a receipt verified against Solana Devnet.",
            },
          ].map((f) => (
            <article key={f.n}>
              <div className="feature-top">
                <f.icon size={24} />
                <span>{f.n}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="intelligence" className="landing-bottom">
        <ShieldCheck size={32} />
        <h2>
          A second pair of eyes.
          <br />
          <span>You make the final call.</span>
        </h2>
        <p>
          AI helps interpret documents. Deterministic checks verify the numbers.
          <br />
          Your wallet stays in your control.
        </p>
        <Link href="/dashboard" className="button">
          Start with a sample invoice <ArrowRight size={17} />
        </Link>
      </section>
      <footer>
        <span>© 2026 InvoiceShield AI</span>
        <span>Verify smarter. Pay faster. Prove everything.</span>
        <span>Built on Solana · Devnet</span>
      </footer>
    </main>
  );
}
