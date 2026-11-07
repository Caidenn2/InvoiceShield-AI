# AI development and runtime disclosure

InvoiceShield AI was developed with OpenAI Codex assistance for architecture, code, design, tests, fictional assets, and documentation. The owner is responsible for reviewing the implementation and checking actual event rules.

## Runtime provenance

- PDF.js reads existing PDF text; it is not semantic AI.
- Tesseract.js runs a local OCR recognition model to turn images or scanned PDF pages into text. It does not decide whether an invoice is fraudulent.
- Explicit pattern mapping extracts fields from recognized text. Unknown values remain blank, and humans can correct them.
- Arithmetic, duplicate matching, changed payment details, unusual amounts, suspicious requests, embedded instructions, and review-priority scoring are deterministic rules. Their findings are labeled RULE-BASED.
- Optional Ollama inference can produce a separately labeled local semantic report. No report is shown as live unless the model actually returns validated output. Ollama was not installed/running on the development computer during verification; its endpoint integration is covered by mocked tests, not claimed as successful local inference.
- Optional Groq Free inference can explain a saved or uploaded invoice before payment. It uses the pinned openai/gpt-oss-20b model on Groq, not OpenAI's paid API. The owner must confirm a Free account with billing disabled, and the user must consent before sending document context. Provider, model, timestamp, and cache status distinguish actual prior model output from fresh inference and NOT RUN states. No live hosted inference is claimed until a configured request actually succeeds.
- Optional OpenAI extraction is retained but disabled by default and unnecessary for the free demo. A configured key previously returned an exhausted-credit error. Successful live OpenAI extraction is not claimed, and no funding is required for the current demo.

Fictional samples are labeled as samples. Loading them does not run OCR or AI. Real OCR/browser tests use project fixtures and make no cloud AI calls. Wallet unit tests use mocked RPC responses and ephemeral test keys; they do not prove a real payment happened.

The application never requests private keys, signs without the connected wallet, autonomously initiates payments, writes invoice details on-chain, or simulates a successful transfer as real. A receipt requires matching confirmed blockchain data. A live owner-approved payment and public deployment must be verified separately before judging readiness is declared.

AI and OCR can misread documents. Rule-based signals are not fraud verdicts. A zero risk score is not a guarantee of safety, and the score is not a fraud probability.
