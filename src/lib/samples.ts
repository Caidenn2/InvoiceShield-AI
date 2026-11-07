import { Invoice } from "./invoice";
const base: Invoice = {
  id: "sample-normal",
  createdAt: "2026-11-06T10:00:00Z",
  source: "sample",
  vendor: "Forma Studio",
  number: "FRM-2026-104",
  date: "2026-11-02",
  dueDate: "2026-11-16",
  subtotal: 2400,
  tax: 192,
  total: 2592,
  currency: "USD",
  paymentDetails: "Forma Studio • account ending 2048",
  items: [
    {
      description: "Brand identity design",
      quantity: 1,
      unitPrice: 1800,
      amount: 1800,
    },
    {
      description: "Website art direction",
      quantity: 4,
      unitPrice: 150,
      amount: 600,
    },
  ],
  explanation:
    "Fictional sample invoice. Deterministic checks only; no AI model has run.",
};
export const samples: Invoice[] = [
  base,
  {
    ...base,
    id: "sample-cloud",
    vendor: "Nimbus Cloud",
    number: "NMB-0082",
    subtotal: 320,
    tax: 0,
    total: 320,
    paymentDetails: null,
    items: [
      {
        description: "Cloud infrastructure • October",
        quantity: 1,
        unitPrice: 320,
        amount: 320,
      },
    ],
  },
  {
    ...base,
    id: "sample-duplicate",
    number: "FRM-2026-104",
    filename: "forma-duplicate.pdf",
    paymentDetails:
      "Forma Studio • NEW wallet: 4Nd1mYf8P6a8v2xE7S6M2tK9o5wP3qR8u7zV6bC5dA4e",
    documentText:
      "URGENT payment required. Transfer immediately. Do not contact the old accounts team. Use the new wallet address.",
  },
  {
    ...base,
    id: "sample-near",
    number: "FRM-2026-105",
    date: "2026-11-03",
    subtotal: 2420,
    tax: 192,
    total: 2612,
    items: [
      {
        description: "Brand identity design",
        quantity: 1,
        unitPrice: 1820,
        amount: 1820,
      },
      {
        description: "Website art direction",
        quantity: 4,
        unitPrice: 150,
        amount: 600,
      },
    ],
  },
];
