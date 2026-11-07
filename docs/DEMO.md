# 110-second demo script

Rehearse on the deployed URL with a funded Devnet wallet, a recipient wallet address you independently confirmed, and AI already configured. Have the access token ready. Do not record private wallet information or the API key. If these prerequisites are unavailable, describe the limitation honestly rather than replacing a live transaction with a fake success.

**0–15 seconds — Problem.** “A duplicate invoice can look completely ordinary. InvoiceShield AI gives small businesses a second pair of eyes before money moves, and verifiable proof afterward.” Open the landing page and launch the workspace.

**15–40 seconds — Real extraction.** Upload `public/samples/normal.png`, select Extract with AI, and show the populated fields. “AI reads the document; I review what it extracted. Unknown fields stay blank.” Save the record. If no AI key is available, say “AI is not configured in this demo; these fields are manually entered,” and use the deterministic path explicitly.

**40–60 seconds — Duplicates.** Upload `exact-duplicate.png` using AI, save, and open the duplicate finding. “The vendor and invoice number match an earlier record. This check works without AI and blocks payment.” If time is short, use loaded fictional samples and clearly identify them.

**60–75 seconds — Clean invoice.** Open the clean fictional Nimbus Cloud sample. “Here the fields and arithmetic agree. This is a review aid, not a guarantee of authenticity.” Select Review test payment and connect the wallet.

**75–100 seconds — Actual Devnet transfer.** Enter the confirmed recipient and 0.01 test SOL, approve the explicit confirmation, then sign in the wallet. “The invoice is in USD, but this is a separate test SOL demonstration. It does not settle the dollar invoice.” Wait for real confirmation. Allow additional time if Devnet RPC is slow; never substitute a fake confirmation.

**100–110 seconds — Proof.** Show the receipt and Explorer. “InvoiceShield checks the confirmed transfer’s sender, recipient, and amount against what I approved. No invoice details are written on-chain. Verify smarter. Pay faster. Prove everything.”

## Judge questions

**Why Solana?** The payment is a real Devnet System Program transfer. Its confirmation and transfer data can be checked independently of the application. There is no unnecessary custom contract.

**What is AI doing?** Interpreting PDF/image content and explaining extraction uncertainties. Arithmetic and duplicate rules are deterministic. AI never authorizes payments.

**What is stored?** Records in this browser’s localStorage, originals in IndexedDB. Only a SOL transfer goes on-chain. A future team product needs authenticated, durable storage.

**What prevents paying twice?** A persisted pending record, a per-browser cross-tab lock, and an in-flight guard. This is accidental-duplicate protection in a single browser, not a shared accounting ledger.

**Does a receipt prove an invoice is legitimate?** No. It proves a matching transfer occurred on Devnet. Business identity and invoice authenticity still require human verification.
