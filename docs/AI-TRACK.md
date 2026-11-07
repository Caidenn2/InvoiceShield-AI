# AI Track research and implementation

## Official criteria

The [official MLH event page](https://events.mlh.com/events/15200-solana-hackathon) asks for projects in which AI and Solana each contribute substantive functionality. Its suggested directions include security explanations before transaction signing. The [AI Track prize page](https://www.mlh.com/events/solana-hackathon/challenges/01a1a70d-d26e-8f43-0b87-807e0a128bc0) describes the category as best use of AI. Neither page inspected specifies a mandatory model vendor or requires hosted rather than local inference. This is an interpretation of the published descriptions, not a guarantee of eligibility or an award.

InvoiceShield's intended fit is model-generated explanation of invoice patterns before a human-approved Solana payment, with independently checked transfer receipts afterward. OCR and deterministic rules are disclosed separately. A live language-model result must be demonstrated before claiming completed semantic AI functionality.

## Practical free hosted option

[Groq Free-plan limits](https://console.groq.com/docs/rate-limits) list openai/gpt-oss-20b at 30 requests/minute, 1,000/day, 8,000 tokens/minute, and 200,000/day at the time checked. Limits are account-specific and can change. [Groq billing documentation](https://console.groq.com/docs/billing-faqs) separates Free from the paid Developer tier; adding a payment method is part of an upgrade. The app does not upgrade plans. The owner must verify Free status and keep billing disabled; the app cannot remotely certify an account's billing tier.

The implementation pins that model, uses [strict structured outputs](https://console.groq.com/docs/structured-outputs), limits input and output, makes no tool calls, and returns quota errors instead of silently changing provider or paying for more usage. A conservative per-instance limiter and short identical-input cache reduce quota use. Published provider limits remain the hard account-level boundary. This capacity is reasonable for a short rehearsed demo, not a promise of unlimited public traffic.

Configure GROQ_API_KEY privately and GROQ_FREE_PLAN_CONFIRMED=true only after checking the plan. Never place a key in NEXT_PUBLIC variables, source files, demo recordings, or chat. Consent is required in the interface before sending invoice context to Groq. Use fictional data for judging.

Gemini also publishes free access for selected models, but access/quota depend on the account, project, region, and model. Adding a second hosted provider would add setup and testing uncertainty tonight, so it was not added. [Google's billing overview](https://ai.google.dev/gemini-api/docs/billing) documents its tier boundary.

## Local fallback and actual verification boundary

Ollama remains supported through loopback on the local development server. It is deliberately not accessed from Vercel. The checked computer has 8 GB RAM and approximately 516 MB free disk space. Ollama was not installed. The official portable Windows download checked was roughly 1.5 GB before extracting or downloading a model, so installing it now was not practical without first freeing space. No installer or model download was started.

The hosted integration and local fallback are covered by explicitly mocked unit tests. Those tests are not model inference. Run scripts/live-review-check.cjs against the configured deployment or local server to obtain a real report. If configuration is absent, it reports that no inference was attempted. The UI displays NOT RUN, provider/model/timestamp for actual results, and a cached-result label when no new inference occurred.

No live hosted model success is claimed until a Free-plan key is supplied and a request actually succeeds. No paid service, billing upgrade, private key, or recovery phrase is required by this implementation.
