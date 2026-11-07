# Two-minute demo: entirely free

Prerequisites: app running locally or on a free deployment, compatible wallet with Devnet test SOL, and an independently confirmed recipient. No paid API key or access token is needed. Rehearse the wallet steps; Devnet confirmation can take longer than the target video window. Never replace a delayed transaction with a fake success.

**0–15 seconds — Problem.** “A duplicate invoice can look ordinary. InvoiceShield gives small businesses a second pair of eyes before money moves and independent proof afterward.” Show the landing page, then open the workspace.

**15–40 seconds — Actual free extraction.** Upload normal.png and click Extract for free. “This is real text recognition on my device, with no paid API. The extracted values are editable; unknown values stay blank.” Show vendor, reference, totals, and line items. Save.

**40–65 seconds — Risk and evidence.** Select Catch a suspicious duplicate. “The invoice number matches an earlier record. Payment details changed, and the document demands an urgent transfer. These are deterministic findings with visible evidence. The score prioritizes review; it is not a fraud probability.” Show that payment is blocked. Identify the record as fictional sample data.

**65–80 seconds — Legitimate record.** Select Review a legitimate invoice. “The Nimbus Cloud sample has complete fields and consistent arithmetic. No detected issue is not a guarantee of authenticity. I still verify the recipient independently.” Connect the Devnet wallet.

**80–110 seconds — Real transfer.** Select Approve a real Devnet transfer, enter the recipient and 0.01 test SOL, explicitly confirm, and sign in the wallet. “This is a real Devnet transfer using test funds. It does not settle the invoice's USD value. The app never signs for me.” Wait for actual confirmation.

**110–120 seconds — Proof.** Open the verified receipt and Explorer. “The sender, recipient, and amount are checked against the blockchain. No invoice details go on-chain. Verify smarter. Pay faster. Prove everything.”

## AI explanation for judges

Local OCR performs neural text recognition. PDF text extraction and field mapping are distinct from semantic reasoning. Rules handle arithmetic, duplicates, changed details, and suspicious instructions. Optional Ollama can add a separately labeled semantic report when a local model is installed and has actually completed a request. If it is not available, say exactly that. Do not claim that rule-based findings came from a language model.

For an AI-track demonstration with Ollama, preinstall and warm the model before recording, run it on the local server, and show the returned report and model label. Its integration is not a claim of successful model inference until tested on the owner's computer.

## Judge questions

**Why Solana?** A wallet-approved Devnet System Program transfer produces independently inspectable payment evidence. There is no unnecessary custom contract.

**Does the app detect proven fraud?** No. It identifies review signals. Vendor identity and invoice authenticity require independent verification.

**What stops duplicates?** Rule checks compare browser history. Payment submission uses a persistent pending record, a cross-tab lock, and an in-flight guard. Production team use needs authenticated, durable records and server-enforced idempotency.

**Where is data stored?** In this browser. Original documents stay in IndexedDB. OCR runs locally; optional Ollama receives text on the same development computer. Only the approved transfer goes on-chain.

**What is free?** PDF reading, local OCR, rules, sample scenarios, optional local Ollama inference, and Devnet test funds. Public hosting requires an account that qualifies for the chosen free plan. OpenAI is disabled and unnecessary.
