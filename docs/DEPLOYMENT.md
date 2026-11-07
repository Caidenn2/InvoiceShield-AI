# Free Vercel deployment

The app is prepared for a free personal Vercel deployment. Do not upgrade a plan, add paid services, or enable OpenAI for this demo.

1. Obtain owner authorization to push this repository to Caidenn2/InvoiceShield-AI. Connect the owner's GitHub repository to Vercel using the Vercel integration or account UI.
2. Choose the free personal plan only if the project/account qualifies. Stop if the provider requires a paid plan or payment authorization.
3. Import the repository root with the Next.js preset and Node 24. Install with pnpm install --frozen-lockfile and build with pnpm build. The build script copies PDF/OCR workers from installed packages. The English recognition data is already committed.
4. No secrets or environment variables are required for the free demo. vercel.json sets ENABLE_OPENAI=false. Do not upload the existing .env.local or configure the OpenAI key on the free deployment.
5. Deploy and record only the actual returned URL. The owner must choose public judging access or adjust deployment protection if necessary.
6. On the public HTTPS URL, upload fictional PNG, JPEG, and PDF invoices. Click Extract for free, review fields, save, reload, inspect duplicate/risk findings, and check mobile layout.
7. Connect a Devnet wallet, fund it with test SOL, confirm a recipient, approve a small transfer, and compare the receipt with Solana Explorer using cluster=devnet. Rehearse the two-minute demo.

## Runtime boundaries

Optional genuine semantic inference on the public site requires an eligible Groq Free account: add GROQ_API_KEY privately to the Vercel server environment and GROQ_FREE_PLAN_CONFIRMED=true only after checking Free status and leaving billing disabled. Redeploy, inspect /api/review availability, and run scripts/live-review-check.cjs with TEST_BASE_URL set to the public URL. Missing configuration is reported as NOT RUN; mocked tests do not count as live inference. No API key is bundled in client assets. Quota errors do not cause a paid upgrade or provider switch.

Browser extraction and rule-based review work on the public deployment without paid services. The server's localhost address is the hosting machine, not the visitor's laptop. Therefore Ollama analysis is deliberately unavailable on Vercel. Use the local development server for optional local semantic AI.

This remains a server-backed Next.js deployment with optional provider endpoints; no paid backend database is needed. History is browser-local and does not follow users across devices or hostnames. There is no shared team ledger.

Documents are capped at 4 MB and five PDF pages. This is below Vercel's documented 4.5 MB function payload limit, although the default extraction path reads files in the browser rather than uploading them to a function. English OCR model/worker assets are served statically. Avoid enabling telemetry or cloud integrations that incur charges.

## Account actions still required

- Authorize the repository push if it has not already been authorized.
- Install/connect Vercel and select a free eligible account/project.
- Approve the real Devnet transaction in the wallet.

Local builds do not prove a public deployment succeeded. Never invent a URL or claim an owner-approved payment occurred before it is confirmed.

References: https://vercel.com/docs/plans/hobby and https://vercel.com/docs/functions/limitations.
