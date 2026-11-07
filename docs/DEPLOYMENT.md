# Deploy to Vercel

1. Push the committed repository to `Caidenn2/InvoiceShield-AI` when the owner authorizes pushing. The project is configured for Next.js with a pnpm lockfile.
2. Sign in to Vercel and import that GitHub repository. Use the repository root, the detected Next.js preset, Node 24, `pnpm install --frozen-lockfile`, and `pnpm build`.
3. Add server-only environment variables: `OPENAI_API_KEY`, optional `OPENAI_MODEL` (default `gpt-4.1-mini`), and a strong private `INVOICE_ANALYSIS_TOKEN`. The token is required to enable paid AI extraction in production. Configure an OpenAI project spending cap as well. Do not paste secrets into the repository, browser console, or chat.
4. Deploy. Record only the actual URL returned by Vercel. Disable deployment protection for the judging URL if required; the owner should choose the desired public access setting.
5. On the HTTPS deployment, open `/` and `/dashboard`. Upload a fictional PNG and PDF, check AI extraction, correct a value, save it, reload, and confirm history persists. Repeat on a mobile-sized viewport.
6. Install/use a Wallet Standard compatible Solana wallet, switch it to Devnet, fund it with faucet test SOL, connect, verify the balance, confirm a recipient you control, and approve a small test transfer. Check the receipt against Solana Explorer with `cluster=devnet`.
7. Print the receipt and rehearse the two-minute demo using the deployed URL.

## Hosting constraints

This is a server-backed Next.js app. Do not use a static export: it would remove the AI endpoint. Uploads are limited to 4 MB to fit below [Vercel's documented 4.5 MB function payload limit](https://vercel.com/docs/functions/limitations). Use direct-to-object-storage uploads before supporting larger production documents. AI timeout is 45 seconds and the route declares a 60-second maximum; check the selected Vercel plan’s limits.

History is browser-local; Vercel redeploys do not provide a shared database. Changing hostname creates a different local workspace. Do not promise judges that records will follow them across devices.

## Required owner actions

- Provide the OpenAI key privately through `.env.local` or the Vercel environment UI.
- Authorize the GitHub push and Vercel account/repository connection.
- Approve the live Devnet transaction in the wallet. No private key or seed phrase is needed by this app or by Codex.

The local build is deployment preparation, not evidence of a successful public deployment.
