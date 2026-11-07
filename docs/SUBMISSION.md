# Submission draft

## Inspiration

Small businesses lose time reviewing invoices and can accidentally pay duplicates or overlook incorrect charges. Payment records are also difficult to verify outside the tool that created them. InvoiceShield AI brings document interpretation, transparent checks, and blockchain transfer proof into one review workflow.

## What it does

Users upload invoice documents, review extracted or manually entered fields, inspect arithmetic and duplicate findings, and explicitly approve separately labeled test SOL payments through their own Solana wallet. A receipt is shown only after confirmation and matching sender, recipient, and amount against Solana Devnet data.

## How it was built

Next.js and TypeScript power the frontend and a small server-side extraction endpoint. OpenAI interprets documents with structured output. Zod validates fields. Deterministic rules check arithmetic, duplicates, changed payment details, and unusual values. Wallet adapter and the Solana JavaScript SDK support wallet-approved Devnet transfers. Browser storage keeps the hackathon implementation lightweight. Radix dialogs, Lucide icons, Tailwind, and a custom visual system support a consistent interface.

## Challenges

Separating AI interpretation from reliable calculations; preserving nulls for unknown fields; making a USD invoice and a test SOL transfer clearly distinct; preventing an RPC timeout from enabling accidental duplicate payment; and checking actual transfer details before issuing a receipt.

## Accomplishments

Implemented an integrated invoice review and Devnet transfer workflow with an accessible dialog foundation, fictional sample invoices, explicit fallback behavior when AI is unavailable, deterministic review tests, and mocked-RPC payment tests. Consult VERIFICATION.md before claiming live AI, wallet, payment, browser, or deployment success.

## What was learned

Prepared reflection topics for the developer to confirm in their own words: where deterministic checks are stronger than model inference, why confirmation is different from submission, how browser storage limits payment idempotency, and why transparent demo labeling matters. Do not present this draft as a claim of personal experience until reviewed.

## What is next

Authenticated team workspaces, durable payment intents with server-enforced idempotency, trusted vendor records, a private Devnet RPC provider, better currency-specific arithmetic, evaluation of AI extraction across varied documents, and an audited settlement design before considering real funds.

## Award positioning

Best Beginner Hack is the primary positioning: a useful, understandable workflow with clear technical boundaries. AI track claims require demonstrating real extraction with a configured API key. Overall positioning depends on a polished, verified public demo. Do not claim DeFi eligibility: this app currently implements invoice review and transfers, not lending, liquidity, yield, or another established DeFi protocol. Check the event’s actual criteria before selecting tracks. No award or eligibility is claimed here.

AI development assistance is disclosed in AI-DISCLOSURE.md. Add the actual deployment URL, final demo video, screenshots, and final tested commit before submission.
