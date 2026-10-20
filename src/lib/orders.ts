import { dutchToday } from "./quotes";

export type Order = {
  id: string;
  user_id: string;
  title: string;
  client_name: string | null;
  address: string | null;
  status: "open" | "closed";
  created_at: string;
};

export type VatLine = { rate: number; base: number | null; vat: number };
export type ReceiptItem = { description: string; quantity: number | null; total: number | null };

export type Receipt = {
  id: string;
  user_id: string;
  order_id: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  store_name: string | null;
  store_city: string | null;
  receipt_number: string | null;
  purchased_on: string | null;
  total_incl_vat: number | null;
  total_excl_vat: number | null;
  vat_total: number | null;
  vat_lines: VatLine[];
  items: ReceiptItem[];
  addressed_to_company: boolean | null;
  ai_summary: string | null;
  ai_warnings: string[];
  ai_status: "pending" | "done" | "failed" | "skipped";
  created_at: string;
};

export type Totals = { incl: number; excl: number; vat: number; count: number };

// Supabase returns numeric columns as strings, so convert before adding.
const num = (v: number | string | null) => (v === null ? 0 : Number(v) || 0);

export function totals(receipts: Receipt[]): Totals {
  return receipts.reduce(
    (t, r) => ({
      incl: t.incl + num(r.total_incl_vat),
      excl: t.excl + num(r.total_excl_vat ?? (r.total_incl_vat !== null ? num(r.total_incl_vat) - num(r.vat_total) : null)),
      vat: t.vat + num(r.vat_total),
      count: t.count + 1,
    }),
    { incl: 0, excl: 0, vat: 0, count: 0 },
  );
}

export function euro(value: number | string | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value));
}

// Calendar quarter of a date, used for the quarterly VAT return.
export function quarterOf(date: Date) {
  const [year, month] = dutchToday(date).split("-").map(Number);
  const q = Math.floor((month - 1) / 3);
  const start = new Date(Date.UTC(year, q * 3, 1));
  const end = new Date(Date.UTC(year, q * 3 + 3, 1));
  return { label: `Q${q + 1} ${year}`, start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function inQuarter(receipt: Receipt, quarter: { start: string; end: string }) {
  const day = receipt.purchased_on ?? receipt.created_at.slice(0, 10);
  return day >= quarter.start && day < quarter.end;
}
