import { quoteTotals, type QuoteLine } from "./quotes";

export const VAT_MODES = ["normal", "reverse", "kor"] as const;
export type VatMode = (typeof VAT_MODES)[number];

export type Invoice = {
  id: string;
  user_id: string;
  order_id: string | null;
  quote_id: string | null;
  number: string;
  status: "draft" | "sent" | "paid";
  vat_mode: VatMode;
  invoice_date: string;
  due_date: string | null;
  work_period: string | null;
  project_address: string | null;
  client_name: string | null;
  client_address: string | null;
  client_kvk: string | null;
  client_btw: string | null;
  lines: QuoteLine[];
  notes: string | null;
  public_token: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

// With btw verlegd or KOR the worker charges no btw at all, whatever the line rates say.
export function invoiceTotals(lines: QuoteLine[], mode: VatMode) {
  const totals = quoteTotals(lines);
  if (mode === "normal") return totals;
  return { excl: totals.excl, vatLines: [], vat: 0, incl: totals.excl };
}

// Next number in the worker's own sequence: 2026-009 after 2026-008, 2026-10 after 2026-09.
export function nextInvoiceNumber(existing: string[], year = new Date().getFullYear()) {
  let max = 0;
  let width = 3;
  for (const number of existing) {
    const match = number.match(new RegExp(`^${year}-(\\d+)$`));
    if (match && Number(match[1]) >= max) {
      max = Number(match[1]);
      width = match[1].length;
    }
  }
  return `${year}-${String(max + 1).padStart(width, "0")}`;
}

// Dutch notes printed at the bottom of the invoice.
export function vatNote(invoice: Pick<Invoice, "vat_mode" | "client_name" | "client_btw">) {
  if (invoice.vat_mode === "reverse") {
    return (
      `Btw verlegd naar ${invoice.client_name ?? "de opdrachtgever"}` +
      (invoice.client_btw ? `, btw-nummer ${invoice.client_btw}` : "") +
      " (verleggingsregeling art. 12 lid 5 Wet OB)."
    );
  }
  if (invoice.vat_mode === "kor") return "Geen btw berekend in verband met de kleineondernemersregeling (KOR).";
  return null;
}
