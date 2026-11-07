# Free demo and optional local AI

## Zero paid-service requirements

Run pnpm install --frozen-lockfile followed by pnpm dev. The app prepares its own PDF and OCR workers and serves the included English recognition data. The default extraction runs entirely in the browser. No OpenAI key, token, paid OCR endpoint, or hosted language model is needed.

If local OCR cannot read a document, paste its text into Read or correct document text, choose Map text to fields, and correct the values manually. Guided fictional scenarios work even when OCR or semantic AI is unavailable. Their labels never imply a model ran.

## Optional Ollama setup

Ollama was not found on the development computer. Installation/model download was kept outside the critical demo path. To add semantic AI later:

1. Download Ollama for Windows from https://ollama.com/download/windows. Run the installer yourself if Windows requests permission.
2. Open a terminal and run: ollama pull qwen2.5:1.5b.
3. Start Ollama if it is not already running: ollama serve.
4. Set OLLAMA_MODEL=qwen2.5:1.5b in the ignored .env.local file only if you want to state the default explicitly. Restart the local app.
5. Upload/extract a document. Analyze with Ollama becomes available when the local app detects that model. Wait for the actual model response, inspect it, and save. The receipt and rule-based score remain independent of semantic AI.

The model download is approximately 986 MB according to its model listing. A smaller qwen2.5:0.5b variant is approximately 398 MB and may run on constrained machines with weaker reasoning. Model performance and memory needs must be checked on the actual computer. The integration has a 45-second request timeout and leaves rule-based review usable if inference fails.

Do not expose Ollama on the public internet. The app only calls the loopback service at 127.0.0.1:11434. A Vercel deployment cannot access a model on your laptop; public hosted demos retain free local OCR and rules and clearly report semantic AI as unavailable.

## Fallback matrix

| Capability           | Default free path                    | If unavailable                                         |
| -------------------- | ------------------------------------ | ------------------------------------------------------ |
| PDF text             | Browser PDF.js                       | Render scanned page and use local OCR; or manual entry |
| PNG/JPEG/scanned PDF | Browser Tesseract model              | Paste text or enter fields                             |
| Invoice risk         | Deterministic checks                 | Correct missing fields; rules need no model            |
| Semantic analysis    | Optional local Ollama                | Explicit NOT RUN label; no fabricated model report     |
| Blockchain payment   | Real wallet-approved Devnet transfer | Show pending/error; never fake success                 |
| Public demo          | Eligible free Vercel account         | Local demo while account authorization is pending      |

## What can be claimed

Claim live OCR only after actually extracting a document. Claim live semantic AI only after an installed model returns a report. Claim a completed payment only after real wallet approval, RPC confirmation, and transfer matching. The included demo data is fictional; no successful receipt is seeded.

Official references: https://ollama.com/library/qwen2.5, https://docs.ollama.com/api/generate, https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md, https://mozilla.github.io/pdf.js/examples/.
