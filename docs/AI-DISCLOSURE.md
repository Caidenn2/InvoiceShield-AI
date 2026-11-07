# AI development disclosure

InvoiceShield AI was developed with OpenAI Codex assistance for application architecture, code, interface design, deterministic checks, Solana integration, tests, documentation, and fictional demo assets. The project owner is responsible for reviewing the implementation and complying with the event’s actual submission rules.

At runtime, optional OpenAI Responses API document extraction interprets uploaded invoices and returns schema-validated fields and uncertainty explanations. AI is not used to sign or initiate transfers. Required-field checks, arithmetic, duplicate heuristics, and receipt matching are deterministic code. Sample data and manual entry do not imply an AI model ran.

AI-generated code and extraction results may contain errors. The verification report does not establish authenticity or prove fraud. Human review, recipient verification, and wallet approval remain necessary.

Live AI behavior is unverified until a configured API key is used successfully with a real sample upload. Live blockchain behavior is unverified until an owner-approved Devnet payment is confirmed and its receipt is inspected. Tests using mocked RPC responses are identified as unit tests.
