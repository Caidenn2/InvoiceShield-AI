# Two-minute demo: entirely free

Prerequisites: app running locally or on a free deployment, compatible wallet with Devnet test SOL, and an independently confirmed recipient. No paid API key or access token is needed. Rehearse the wallet steps; Devnet confirmation can take longer than the target video window. Never replace a delayed transaction with a fake success.

**0–15 seconds — Problem.** “A duplicate invoice can look ordinary. InvoiceShield gives small businesses a second pair of eyes before money moves and independent proof afterward.” Show the landing page, then open the workspace.

**15–40 seconds — Actual free extraction.** Upload normal.png and click Extract for free. “This is real text recognition on my device, with no paid API. The extracted values are editable; unknown values stay blank.” Show vendor, reference, totals, and line items. Save.

**40–70 seconds — Risk, evidence, and genuine AI.** Select Catch a suspicious duplicate. “The rules found a matching reference, changed payment details, and urgency. Now I explicitly request a language-model explanation before signing.” With a genuinely configured provider, consent and choose Explain risks with AI, wait for the actual result, and show its provider/model/time and supporting evidence. If no model is configured or inference fails, say so and show NOT RUN. Never replace it with a canned response. Identify the invoice as fictional.

**65–80 seconds — Legitimate record.** Select Review a legitimate invoice. “The Nimbus Cloud sample has complete fields and consistent arithmetic. No detected issue is not a guarantee of authenticity. I still verify the recipient independently.” Connect the Devnet wallet.

**80–110 seconds — Independent proof.** Prefer the receipt for a previously confirmed Devnet transfer and choose Reverify on Devnet. “This checks the same on-chain transfer again without another payment or wallet signature.” Show the matching addresses, test SOL amount, and Explorer link. If recording a fresh transfer instead, obtain explicit owner approval first, confirm the recipient/amount, and sign in the wallet. Test SOL does not settle the invoice's USD value. Never substitute a fake confirmation.

**110–120 seconds — Proof.** Open the verified receipt and Explorer. “The sender, recipient, and amount are checked against the blockchain. No invoice details go on-chain. Verify smarter. Pay faster. Prove everything.”

## AI explanation for judges

Local OCR performs neural text recognition. PDF text extraction and field mapping are distinct from semantic reasoning. Rules handle arithmetic, duplicates, changed details, and suspicious instructions. Optional Ollama can add a separately labeled semantic report when a local model is installed and has actually completed a request. If it is not available, say exactly that. Do not claim that rule-based findings came from a language model.

For AI-track recording, test the genuine Groq Free response beforehand or install and warm Ollama on a local server with enough free disk. Show the actual returned model report. Integration tests with mocked responses are not evidence of successful real inference. See AI-TRACK.md for the official category descriptions and sources.

## Judge questions

**Why Solana?** A wallet-approved Devnet System Program transfer produces independently inspectable payment evidence. There is no unnecessary custom contract.

**Does the app detect proven fraud?** No. It identifies review signals. Vendor identity and invoice authenticity require independent verification.

**What stops duplicates?** Rule checks compare browser history. Payment submission uses a persistent pending record, a cross-tab lock, and an in-flight guard. Production team use needs authenticated, durable records and server-enforced idempotency.

**Where is data stored?** In this browser. Original documents stay in IndexedDB. OCR runs locally; optional Ollama receives text on the same development computer. Only the approved transfer goes on-chain.

**What is free?** PDF reading, local OCR, rules, sample scenarios, optional local Ollama inference, and Devnet test funds. Public hosting requires an account that qualifies for the chosen free plan. OpenAI is disabled and unnecessary.
