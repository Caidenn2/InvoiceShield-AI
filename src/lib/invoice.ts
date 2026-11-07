import { z } from "zod";

const money = z.number().finite().min(0).max(1e12).nullable();
const text = z.string().max(500).nullable();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v);
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === v;
  }, "Invalid date")
  .nullable();
export const invoiceSchema = z.object({
  vendor: text,
  number: text,
  date,
  dueDate: date,
  subtotal: money,
  tax: money,
  total: money,
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  paymentDetails: text,
  items: z
    .array(
      z.object({
        description: z.string().max(500),
        quantity: z.number().finite().min(0).max(1e9).nullable(),
        unitPrice: money,
        amount: money,
      }),
    )
    .max(100),
  explanation: z.string().max(2000),
});
export type InvoiceData = z.infer<typeof invoiceSchema>;
export type Receipt = {
  signature: string;
  sender: string;
  recipient: string;
  lamports: number;
  slot: number;
  timestamp: number | null;
  network: "devnet";
};
export type PendingPayment = {
  signature: string;
  sender: string;
  recipient: string;
  lamports: number;
};
export type Invoice = InvoiceData & {
  id: string;
  createdAt: string;
  source: "sample" | "ai" | "manual";
  filename?: string;
  receipt?: Receipt;
  pending?: PendingPayment;
};
export type Finding = {
  severity: "high" | "medium" | "info";
  title: string;
  evidence: string;
  action: string;
};
export const blankInvoice: InvoiceData = {
  vendor: null,
  number: null,
  date: null,
  dueDate: null,
  subtotal: null,
  tax: null,
  total: null,
  currency: null,
  paymentDetails: null,
  items: [],
  explanation: "",
};
const norm = (v: string | null) =>
  (v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
export function review(invoice: InvoiceData, history: Invoice[]): Finding[] {
  const findings: Finding[] = [];
  const add = (
    severity: Finding["severity"],
    title: string,
    evidence: string,
    action: string,
  ) => findings.push({ severity, title, evidence, action });
  const missing = (
    [
      "vendor",
      "number",
      "date",
      "dueDate",
      "subtotal",
      "tax",
      "total",
      "currency",
    ] as const
  ).filter((k) => invoice[k] === null || invoice[k] === "");
  if (missing.length)
    add(
      "medium",
      "Missing information",
      missing.join(", "),
      "Complete the missing fields before approving.",
    );
  const cents = (n: number) => Math.round(n * 100);
  if (
    invoice.total !== null &&
    invoice.subtotal !== null &&
    invoice.tax !== null &&
    Math.abs(
      cents(invoice.subtotal) + cents(invoice.tax) - cents(invoice.total),
    ) > 1
  )
    add(
      "high",
      "Total does not add up",
      `Subtotal ${invoice.subtotal} + tax ${invoice.tax} differs from total ${invoice.total}.`,
      "Ask the vendor for a corrected invoice.",
    );
  if (
    invoice.items.length &&
    invoice.items.every((i) => i.amount !== null) &&
    invoice.subtotal !== null
  ) {
    const sum = invoice.items.reduce((s, i) => s + cents(i.amount!), 0);
    if (Math.abs(sum - cents(invoice.subtotal)) > 1)
      add(
        "high",
        "Line items do not match subtotal",
        `Line items total ${(sum / 100).toFixed(2)}; subtotal is ${invoice.subtotal}.`,
        "Review line items and subtotal.",
      );
  }
  invoice.items.forEach((i) => {
    if (
      i.quantity !== null &&
      i.unitPrice !== null &&
      i.amount !== null &&
      Math.abs(cents(i.quantity * i.unitPrice) - cents(i.amount)) > 1
    )
      add(
        "high",
        "Line item arithmetic mismatch",
        `${i.description}: quantity × unit price differs from amount.`,
        "Verify this line item.",
      );
  });
  const vendors = history.filter(
    (h) => norm(h.vendor) && norm(h.vendor) === norm(invoice.vendor),
  );
  for (const h of vendors) {
    if (norm(invoice.number) && norm(invoice.number) === norm(h.number))
      add(
        "high",
        "Potential duplicate",
        `Vendor and invoice number match ${h.number} (${h.id.slice(0, 8)}).${h.receipt ? " This record already has a confirmed payment." : ""}`,
        "Compare the original document. Do not pay twice.",
      );
    else if (
      invoice.total !== null &&
      h.total !== null &&
      invoice.currency === h.currency
    ) {
      const days =
        invoice.date && h.date
          ? Math.abs(Date.parse(invoice.date) - Date.parse(h.date)) / 86400000
          : Infinity;
      const similar = invoice.items.some((i) =>
        h.items.some(
          (j) =>
            norm(i.description) && norm(i.description) === norm(j.description),
        ),
      );
      if (
        Math.abs(invoice.total - h.total) <= Math.max(1, h.total * 0.02) &&
        (days <= 7 || similar)
      )
        add(
          "medium",
          "Similar invoice found",
          `${h.number}: same vendor, similar amount${days <= 7 ? " within 7 days" : ""}${similar ? " and matching line items" : ""}.`,
          "Compare invoice dates, services, and previous payments.",
        );
    }
    if (
      norm(invoice.paymentDetails) &&
      norm(h.paymentDetails) &&
      norm(invoice.paymentDetails) !== norm(h.paymentDetails)
    )
      add(
        "high",
        "Vendor payment details changed",
        `Payment details differ from ${h.number}.`,
        "Verify the change with a trusted vendor contact.",
      );
  }
  const amounts = vendors
    .filter((h) => h.total !== null && h.currency === invoice.currency)
    .map((h) => h.total!)
    .sort((a, b) => a - b);
  if (
    amounts.length >= 3 &&
    invoice.total !== null &&
    invoice.total > amounts[Math.floor(amounts.length / 2)] * 2
  )
    add(
      "medium",
      "Unusual invoice amount",
      "Total exceeds twice the median of this vendor’s previous invoices.",
      "Confirm the scope of work.",
    );
  if (invoice.date && invoice.dueDate && invoice.dueDate < invoice.date)
    add(
      "medium",
      "Due date precedes invoice date",
      `${invoice.dueDate} is before ${invoice.date}.`,
      "Confirm the payment terms.",
    );
  return findings;
}
export function status(findings: Finding[]) {
  return findings.some((f) => f.severity === "high")
    ? "Needs attention"
    : findings.length
      ? "Needs review"
      : "No issues detected";
}
export function formatMoney(value: number | null, currency: string | null) {
  if (value === null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ""}`;
  }
}
export function parseAIResponse(value: unknown): InvoiceData {
  return invoiceSchema.parse(value);
}
