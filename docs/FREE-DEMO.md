# Free demo and genuine semantic inference

## Zero paid-service requirements

Run pnpm install --frozen-lockfile followed by pnpm dev. The app prepares its own PDF and OCR workers and serves the included English recognition data. The default extraction runs entirely in the browser. No OpenAI key, token, paid OCR endpoint, or hosted language model is needed.

If local OCR cannot read a document, paste its text into Read or correct document text, choose Map text to fields, and correct the values manually. Guided fictional scenarios work even when OCR or semantic AI is unavailable. Their labels never imply a model ran.

## Preferred public AI: Groq Free plan

Use an eligible Free account at https://console.groq.com/ with no paid billing enabled. Store GROQ_API_KEY only in the ignored .env.local and Vercel server environment. Set GROQ_FREE_PLAN_CONFIRMED=true only after checking that the account is on Free; the app cannot inspect billing status itself. Leave ENABLE_OPENAI=false. Redeploy after changing production environment variables.

Open an invoice and choose Explain risks with AI. The hosted path requires explicit consent to send invoice text, fields, up to eight history summaries, and rule evidence to Groq. The model returns a separate explanation with provider, model, timestamp, and advisory findings. It does not alter the rule-based score, approve a payment, or verify vendor identity. Rate/quota failures leave the rules usable. Reused model output is labeled cached; it is not presented as fresh inference.

The live check is node scripts/live-review-check.cjs with TEST_BASE_URL set to the deployment. It uses fictional input and refuses to report success when no provider is configured. Unit tests of this path use mocked provider responses and are not a real inference demonstration. See AI-TRACK.md for actual event criteria, provider limits, and research sources.

## Optional Ollama fallback

Ollama was not found on the development computer. Installation/model download was kept outside the critical demo path. To add semantic AI later:

1. Download Ollama for Windows from https://ollama.com/download/windows. Run the installer yourself if Windows requests permission.
2. Open a terminal and run: ollama pull qwen2.5:1.5b.
3. Start Ollama if it is not already running: ollama serve.
4. Set OLLAMA_MODEL=qwen2.5:1.5b in the ignored .env.local file only if you want to state the default explicitly. Restart the local app.
5. Upload/extract or open a saved invoice. Explain risks with AI becomes available when the local app detects that model and no hosted provider is selected. Wait for the actual model response, inspect it, and save. The receipt and rule-based score remain independent of semantic AI.

The model download is approximately 986 MB according to its model listing. A smaller qwen2.5:0.5b variant is approximately 398 MB and may run on constrained machines with weaker reasoning. Model performance and memory needs must be checked on the actual computer. The integration has a 45-second request timeout and leaves rule-based review usable if inference fails.

Do not expose Ollama on the public internet. The app only calls the loopback service at 127.0.0.1:11434. A Vercel deployment cannot access a model on your laptop; public semantic inference needs the optional Groq configuration. Without it, public OCR/rules remain functional and semantic AI is marked NOT RUN. The checked computer currently lacks sufficient free disk for the portable Ollama distribution and model; free space before attempting installation.

## Fallback matrix

| Capability           | Default free path                    | If unavailable                                         |
| -------------------- | ------------------------------------ | ------------------------------------------------------ |
| PDF text             | Browser PDF.js                       | Render scanned page and use local OCR; or manual entry |
| PNG/JPEG/scanned PDF | Browser Tesseract model              | Paste text or enter fields                             |
| Invoice risk         | Deterministic checks                 | Correct missing fields; rules need no model            |
| Semantic analysis    | Optional Groq Free or local Ollama   | Explicit NOT RUN label; no fabricated model report     |
| Blockchain payment   | Real wallet-approved Devnet transfer | Show pending/error; never fake success                 |
| Public demo          | Eligible free Vercel account         | Local demo while account authorization is pending      |

## What can be claimed

Claim live OCR only after actually extracting a document. Claim live semantic AI only after an installed model returns a report. Claim a completed payment only after real wallet approval, RPC confirmation, and transfer matching. The included demo data is fictional; no successful receipt is seeded.

Official references: https://ollama.com/library/qwen2.5, https://docs.ollama.com/api/generate, https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md, https://mozilla.github.io/pdf.js/examples/.
