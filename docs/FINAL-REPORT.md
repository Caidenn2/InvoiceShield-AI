# Final technical verification report

Public URL: https://invoice-shield-ai.vercel.app/

Tested application commit: 637ac0be693fec105054a421d2a7d3916e46028b. The public /api/health endpoint matched this GitHub commit. This report distinguishes a software failure from an unverified requirement; FAIL (unverified) means the required live evidence is absent, not necessarily that the code is broken.

## Public website checks

| Requirement                             | Result                 | Evidence / remaining action                                                                                                                                                                                                                                                                                       |
| --------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public homepage and dashboard           | PASS                   | Real headless Microsoft Edge loaded both without authentication; HTTP 200.                                                                                                                                                                                                                                        |
| Legitimate sample risk score            | PASS                   | Nimbus Cloud sample produced 0/100 with no rule findings.                                                                                                                                                                                                                                                         |
| Suspicious and duplicate warnings       | PASS                   | Suspicious sample produced 100/100; duplicate reference, changed payment details, and urgent-request findings appeared. Payment was blocked.                                                                                                                                                                      |
| Deployed PNG/JPEG OCR                   | PASS                   | Real browser-local OCR read fictional fixtures; expected fields matched. No cloud AI calls were made.                                                                                                                                                                                                             |
| Deployed PDF extraction                 | PASS                   | A real PDF fixture generated from the fictional invoice was processed in the deployed browser; vendor and total matched.                                                                                                                                                                                          |
| Phantom connects on public Devnet site  | FAIL — unverified      | Automated Edge uses an isolated profile without the owner's Phantom extension. Wallet-selector opening/closing and disconnected payment gating passed. The owner previously reported localhost connection; public-domain permission must be confirmed manually. No wallet signature was requested by these tests. |
| Recipient and amount validation         | PASS                   | Malformed recipient, zero amount, and amount above 1 test SOL show inline errors; valid format is accepted and signing stays gated without wallet/consent. Additional unit tests check same-wallet recipients and exact conversion.                                                                               |
| Reverify a previously confirmed receipt | FAIL — unverified live | Added Reverify on Devnet for confirmed records. It only rereads and matches the saved signature; it never signs or broadcasts. Unit tests cover confirmation and matching. An owner public signature or manual check in the owner's stored browser record is still needed for a live chain check.                 |
| Desktop and mobile layout               | PASS                   | 1440px desktop and 390px mobile viewport checks; no page-wide overflow or page errors. This is viewport testing, not a physical-phone test.                                                                                                                                                                       |
| No new payment                          | PASS                   | Public test guard recorded zero payment submissions. No owner-wallet signing or new transfer was initiated.                                                                                                                                                                                                       |

Commands used against the deployed URL: scripts/public-check.cjs, scripts/free-demo-check.cjs, and scripts/browser-check.cjs with TEST_BASE_URL and separate screenshot output. Detailed machine output and screenshots are in ignored test-results/public.

## Genuine semantic AI

| Requirement                       | Result                                    | Evidence / remaining action                                                                                                                                                                                                                                                             |
| --------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual AI Track research          | PASS                                      | Primary MLH event and category pages checked; see AI-TRACK.md. No award/eligibility guarantee is claimed.                                                                                                                                                                               |
| Free hosted inference path        | PASS — implementation                     | Groq Free path uses a pinned supported model, strict schema, bounded context/output, explicit owner Free-plan confirmation, consent, quota errors, and cache provenance. No paid SDK/dependency was added.                                                                              |
| Genuine model inference completed | FAIL — blocked                            | Both deployment and local availability report no configured free provider. The genuine-inference test stopped before a provider call. No generated result, reasoning quality, or live provider success is claimed.                                                                      |
| Local Ollama fallback             | PASS — integration; FAIL — live execution | Loopback-only fallback is implemented and unit tested with explicitly mocked responses. Ollama is absent. Approximately 516 MB free disk is insufficient for the checked portable Windows download of roughly 1.5 GB plus extraction/model files. No download or install was attempted. |
| Honest rules/model labels         | PASS                                      | Rule-based findings and score remain separate. Missing model shows NOT RUN. Actual reports require validated provider/model/time. Identical-input cached output explicitly says no new inference ran. Mocked tests are not presented as live inference.                                 |

## Build, tests, source, and secrets

- PASS: 78 automated unit tests across nine files. Provider and wallet tests using mocks are explicitly identified as such.
- PASS: TypeScript and production build.
- PASS: Local production browser suites and deployed browser suites.
- PASS: .env.local is ignored and untracked. Exact-value scans found no configured credential in tracked files or browser static assets. No secret values were printed.
- PASS: application changes committed and pushed to Caidenn2/InvoiceShield-AI; deployed code commit was checked against /api/health.
- PASS: OpenAI paid extraction remains disabled. No billing upgrade or paid service was introduced.

## Essential manual actions

1. For real hosted AI, create/use an eligible Groq Free account without paid billing, store GROQ_API_KEY privately in Vercel and .env.local, and set GROQ_FREE_PLAN_CONFIRMED=true only after confirming Free status. Redeploy after changing production environment variables. Then run scripts/live-review-check.cjs against the public URL and inspect a real report in the browser. Do not paste the key into chat or commit it. If an account requires payment, stop and use local Ollama after freeing disk space instead.
2. Open the public dashboard in the normal browser containing Phantom, switch Phantom to Devnet, connect, and confirm the displayed address/balance. No payment is needed to check connection.
3. Open a previously confirmed receipt and choose Reverify on Devnet, or provide only its public signature for read-only investigation. Localhost and Vercel browser storage are separate. Do not send another transfer to populate a new browser's history.

The public core workflow is verified. Full AI-track/live-wallet acceptance is not declared complete while these live checks are outstanding.
