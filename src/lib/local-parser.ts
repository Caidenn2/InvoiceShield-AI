import { blankInvoice, InvoiceData } from "./invoice";
export function parseInvoiceText(text: string): InvoiceData {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const pick = (expression: RegExp) =>
    text.match(expression)?.[1]?.trim() || null;
  const amount = (label: string) => {
    const raw = pick(
      new RegExp(
        `(?:^|\\n)\\s*${label}\\s*(?:USD|EUR|GBP)?\\s*[:$€£-]?\\s*(?:USD|EUR|GBP)?\\s*([$€£]?[\\d,]+(?:\\.\\d{1,2})?)(?:\\s|$)`,
        "i",
      ),
    );
    if (!raw) return null;
    const value = Number(raw.replace(/[$€£,]/g, ""));
    return Number.isFinite(value) ? value : null;
  };
  const iso = (value: string | null) =>
    value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  const vendor =
    pick(/(?:^|\n)\s*(?:vendor|from)\s*:\s*([^\n]+)/i) ||
    lines.find(
      (l) =>
        !/^(?:[A-Z.]?\s*)?invoice\b|fictional|not payable|^[A-Z]\.?$/i.test(
          l,
        ) && !/^[A-Z.]{0,2}INVOICE$/i.test(l.replace(/\s/g, "")),
    ) ||
    null;
  const number =
    pick(
      /(?:invoice\s*(?:number|no\.?|#|reference))\s*[:#]?\s*((?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{2,})/i,
    ) || pick(/\b([A-Z]{2,6}-\d{4}-\d{2,6})\b/);
  const dates = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];
  const date =
    iso(pick(/(?:issued|invoice date|date)\s*:?\s*(\d{4}-\d{2}-\d{2})/i)) ||
    (/issued|invoice date/i.test(text) ? iso(dates[0] || null) : null);
  const dueDate =
    iso(pick(/(?:due(?: date)?)\s*:?\s*(\d{4}-\d{2}-\d{2})/i)) ||
    (/\bdue\b/i.test(text) ? iso(dates[1] || null) : null);
  const currency = pick(/\b(USD|EUR|GBP|CAD|AUD|JPY|CHF)\b/);
  const items: InvoiceData["items"] = [];
  for (const line of lines) {
    const m = line.match(
      /^(.+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/,
    );
    if (m && !/subtotal|total|tax/i.test(m[1]))
      items.push({
        description: m[1].trim(),
        quantity: Number(m[2]),
        unitPrice: Number(m[3].replace(/,/g, "")),
        amount: Number(m[4].replace(/,/g, "")),
      });
  }
  return {
    ...blankInvoice,
    vendor,
    number,
    date,
    dueDate,
    subtotal: amount("subtotal"),
    tax: amount("tax"),
    total: amount("total(?: due)?"),
    currency,
    items,
    paymentDetails: pick(/(?:printed )?payment details\s*:\s*([^\n]+)/i),
    explanation:
      "Extracted locally from document text with explicit field patterns. Unknown values remain blank. Review OCR and field mapping; no semantic AI model ran.",
  };
}
