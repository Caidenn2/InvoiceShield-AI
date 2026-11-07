# Verification status

## Verified free workflow

- 61 unit tests pass across invoice validation/arithmetic/duplicates, local field mapping, suspicious payment requests, risk scoring, optional local-model endpoint validation, private diagnostics, cloud opt-in behavior, and payment safeguards.
- TypeScript passes and the Next.js production build succeeds with the local PDF/OCR assets prepared.
- Actual browser tests on fictional fixtures pass for PNG/JPEG OCR and PDF extraction. Vendor, reference, dates, subtotal, tax, total, and line items were checked against known values in the PNG fixture. PDF/JPEG vendor and total were also checked.
- Free-demo tests assert no OpenAI/cloud-analysis requests. Semantic AI is explicitly NOT RUN when Ollama is absent.
- Guided duplicate review detects the matching reference, changed payment details, and suspicious urgent instructions. High rule-based findings block payment.
- Desktop/mobile browser smoke checks pass for landing navigation, samples, upload preview, disabled cloud provider, manual entry, saving, reload persistence, and payment gating. The payment dialog closes before the separate wallet selector opens; opening and closing that selector was verified. No page errors or page-wide mobile overflow were observed at 390 x 844.
- Local development and production servers start successfully. GET / and /dashboard return 200.
- The configured .env.local contains both existing credential variables, is ignored by Git, and is not tracked. Exact-value scans found neither credential in tracked source or browser static assets. Values were not displayed.
- Read-only live Devnet identity and latest-blockhash RPC checks pass. The full genesis hash matches the pinned Devnet guard. Receipt readers now opt in to transaction version 1 supported by the locked SDK.
- The corrected builder's actual 0.001 test SOL message received a live Devnet fee quote of 5,000 lamports with its explicit budget and zero priority fee. This read-only check stopped before signing, persistence, or broadcast; it is not a successful transfer test.
- Payment tests cover wallet rejection, wallet-modified messages, persisted signatures before broadcast, failed confirmation, delayed lookup retries, transport-error recovery, and sender/recipient/amount matching. These are mocked-RPC tests, not live wallet approvals.

## External or optional checks still outstanding

- The owner reports successfully connecting Phantom on Devnet with 0.5 test SOL. Their 0.001 test SOL attempt was blocked by the exact-message guard before submission. A regression reproduced Phantom's documented fee-insertion behavior; explicit compute-budget instructions now prevent that implicit change while keeping the exact-message guard. A real payment and receipt still require the owner's retry and wallet approval.
- Read-only sampling of recent public transactions did not find a suitable direct transfer; it was not used to seed a receipt or presented as an InvoiceShield payment.
- Ollama was not installed/running. Optional semantic inference is not live-verified. The complete free demo does not depend on installing it.
- An earlier explicitly requested OpenAI call reached the provider but returned credit_balance_exhausted. The current free build disables OpenAI by default and requires no funding. Successful live OpenAI extraction is not claimed.
- GitHub push authorization, Vercel account/repository connection, free deployment, public URL checks, and final two-minute wallet rehearsal remain pending owner actions.

## Honest demo boundaries

Fictional samples contain prepared data. Loading them does not imply OCR or semantic analysis ran. Actual OCR tests are listed separately above. No successful blockchain receipt is preloaded. A score of zero is not a safety guarantee or a fraud probability.

Production-browser checks should be rerun after material application changes. A local build is not evidence that public deployment succeeded.
