# InvoiceShield AI

**Verify smarter. Pay faster. Prove everything.**

A free-first invoice review workspace with local document reading, explainable risk checks, optional local semantic AI, and wallet-approved Solana Devnet transfers.

## A complete demo without paid APIs

- PDF text extraction with PDF.js and image/scanned-PDF OCR with Tesseract.js run in your browser. Workers and English recognition data are served by this app; documents are not sent to an OCR service.
- Field mapping preserves unknown values as blank. Users can correct fields or paste document text. This is a limited pattern parser, not universal invoice understanding.
- Deterministic rules check arithmetic, exact/near duplicates, changed payment details, unusual amounts, missing fields, urgent/secret payment requests, and embedded review instructions.
- A transparent 0–100 rule-based review-priority score helps triage invoices. It is not a probability of fraud. High findings count 40 points per category, medium 18, informational 5; repeated findings in one category count once.
- Optional Groq Free hosted inference or local Ollama adds a separately labeled semantic report before payment. Reports identify the provider, model, and time. Cached outputs and NOT RUN states are explicit. Local OCR performs text recognition, not a semantic fraud verdict.
- OpenAI remains optional and is disabled by default, even when a key is present. No API credits are required for the demo.
- Wallet Standard connection, Devnet balances, explicitly approved test SOL transfers, confirmation checks, and matched on-chain receipts. No private key or seed phrase is requested or stored.

## Run locally

Use Node 24 and pnpm 10.11.0.

    corepack enable
    pnpm install --frozen-lockfile
    pnpm dev

Open http://127.0.0.1:3000. No environment variables are needed for the free demo. The dev/build scripts prepare local PDF and OCR worker assets automatically. The English OCR model is included in the repository.

If pnpm is already installed, Corepack setup is unnecessary. Windows PowerShell can copy the optional configuration with: Copy-Item .env.example .env.local.

## Two-minute guided demo

1. Open the dashboard. Select Upload invoice, choose public/samples/normal.png, and click Extract for free. This performs real local OCR. Review and save the fields.
2. Select Catch a suspicious duplicate in the guided demo. The fictional sample has a matching invoice number, changed payment details, and urgent instructions. Findings are live deterministic results, not prerecorded AI output. High-severity findings block payment.
3. Select Review a legitimate invoice for the clean fictional Nimbus Cloud record.
4. Connect a compatible Solana wallet, switch its display to Devnet, and get test SOL from https://faucet.solana.com/.
5. Select Approve a real Devnet transfer. Enter an independently confirmed recipient and a separate test SOL amount, check the explicit confirmation, and sign in your wallet.
6. Wait for RPC confirmation and sender/recipient/amount matching. Inspect Explorer and print the receipt. If verification is delayed, retry the same signature; do not send another payment.

The invoice can be in USD while the demo transfer is in test SOL. This transfer does not settle the invoice's fiat value. A transfer receipt does not prove a vendor's identity. The app never simulates a successful payment.

Downloadable PNG samples include normal, exact-duplicate, near-duplicate, and suspicious-duplicate. The guided samples are fictional, prefilled scenario data. Loading them does not claim OCR or a semantic model ran.

## Optional free semantic AI

For a public semantic-AI demo, use an eligible Groq Free account with billing disabled. Set GROQ_API_KEY privately in Vercel and .env.local, and set GROQ_FREE_PLAN_CONFIRMED=true only after verifying that account is on Free. No new SDK or paid dependency is required. The model is pinned to openai/gpt-oss-20b on Groq; it does not call OpenAI's API. Select Explain risks with AI on an uploaded or saved invoice and explicitly consent before sending document context to Groq. The response is schema validated and kept separate from deterministic rules. No model can approve a payment or alter the transfer.

The application cannot inspect a provider account's billing tier. The confirmation flag is an owner assertion, not a billing API verification. Keep billing disabled. Provider quota exhaustion produces an error and preserves the rules; the app never upgrades a plan. A per-instance two-request/minute limiter, bounded context/output, and a ten-minute identical-input cache conserve free quota. Multi-instance quota enforcement remains the provider's responsibility.

Without a hosted key, local Ollama is the fallback. It was not installed/running on the development computer during verification. See docs/FREE-DEMO.md and docs/AI-TRACK.md for setup, primary sources, and honest verification limits.

Install Ollama from https://ollama.com/download/windows, then run:

    ollama pull qwen2.5:1.5b
    ollama serve

The model download is roughly 986 MB; performance depends on your hardware. OLLAMA_MODEL can select another installed model. The app checks for the configured local model and enables Explain risks with AI when available. Fields, text, history summaries, and deterministic evidence go to the local process. Results are schema validated and shown separately from rules.

A hosted Vercel function cannot reach Ollama on your laptop. Public semantic analysis uses the optional configured Groq Free provider; local Ollama is for the development server. Never expose Ollama publicly to work around that boundary.

## Optional OpenAI provider

The server endpoint is retained for future use, but ENABLE_OPENAI defaults to false. To opt in separately, the owner must explicitly set ENABLE_OPENAI=true, OPENAI_API_KEY, and INVOICE_ANALYSIS_TOKEN and use the optional cloud button. It may consume paid API credits. It is not used by the free-demo tests. The committed Vercel configuration disables it.

Credentials stay server-only in the ignored .env.local file. They must never be placed in NEXT_PUBLIC variables. The configured key previously reached OpenAI but returned credit_balance_exhausted; successful live OpenAI extraction is not claimed.

## Tests and observed status

    pnpm test
    pnpm typecheck
    pnpm build
    pnpm start

With a server running on port 3000:

    pnpm test:free-demo
    pnpm test:browser

To test deployment without submitting a payment, set TEST_BASE_URL=https://invoice-shield-ai.vercel.app and run node scripts/public-check.cjs, then the browser/free-demo checks. TEST_SCREENSHOT_DIR selects a separate screenshot directory. node scripts/live-review-check.cjs tests genuine inference only when a real provider is configured; it never substitutes canned model output.

The free-demo browser test performs actual PNG/JPEG OCR and PDF extraction, checks fields against fictional fixtures, inspects suspicious findings, and asserts no cloud AI calls. Browser tests use installed Microsoft Edge by default; BROWSER_EXECUTABLE can select another Chromium browser.

See docs/VERIFICATION.md for actual results and remaining live-wallet/deployment checks. Unit tests use mocked RPC and local-model responses. They are not evidence that a live wallet signed a payment or that Ollama ran.

## Architecture and boundaries

Next.js App Router, TypeScript, Tailwind CSS, Radix Dialog, Lucide icons, PDF.js, Tesseract.js, Zod, Solana wallet adapter, and the Solana JavaScript SDK. Records live in localStorage; original documents live in IndexedDB. JSON export excludes original files. Clearing browser data removes history. There is no shared multi-user accounting backend.

The payment path checks the full Devnet genesis hash, builds a System Program transfer, verifies that the wallet-signed message matches the approved message, persists its signature before broadcasting, and verifies confirmation plus actual transfer details. Network errors can retry receipt lookup without creating another transaction. Cross-tab Web Locks, in-flight guards, and persisted pending records prevent accidental resubmission in one browser profile. They do not provide durable multi-user idempotency.

Confirmed records offer Reverify on Devnet. This rereads the same signature and matches sender, recipient, and lamports without asking the wallet to sign or sending another transfer. Browser-local history on localhost is separate from history on the Vercel hostname; export records before changing browsers or hostnames.

Upload limits: 4 MB, at most five PDF pages, English OCR. Layout variation and poor scans can cause missing or misread fields. Monetary rules currently use two-decimal rounding. Similarity and suspicious-request rules can generate false positives and miss altered invoices. A zero score does not establish safety or authenticity.

Signed but unbroadcast/failed transactions remain conservatively pending for inspection; the app offers no unsafe reset-and-pay-again shortcut. Public Devnet RPC is rate limited. Only on-curve wallet recipients are accepted. No custom contract, escrow, lending, yield, or real-funds settlement is implemented.

## Submission materials

- docs/DEMO.md: free two-minute script and judge questions.
- docs/DEPLOYMENT.md: free Vercel deployment checklist.
- docs/SUBMISSION.md: honest submission draft and award positioning.
- docs/AI-DISCLOSURE.md: development and runtime AI disclosure.
- docs/FREE-DEMO.md: local-model setup and fallback matrix.

![Dashboard with fictional sample data](docs/screenshots/dashboard.png)
![Real local OCR extraction](docs/screenshots/free-extraction.png)
![Suspicious invoice review](docs/screenshots/suspicious-review.png)

Original code is MIT licensed. Adapted wallet styling, PDF/OCR software, and OCR language data retain their respective licenses; see third-party/README.md.
