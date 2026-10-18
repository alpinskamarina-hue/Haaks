export const LINE_KINDS = ["labour", "material", "other"] as const;
export type LineKind = (typeof LINE_KINDS)[number];

export type QuoteLine = {
  kind: LineKind;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
};

export type Quote = {
  id: string;
  user_id: string;
  order_id: string | null;
  number: string;
  status: "draft" | "sent" | "accepted" | "declined";
  title: string;
  client_name: string | null;
  client_address: string | null;
  intro: string | null;
  terms: string | null;
  lines: QuoteLine[];
  work_description: string | null;
  photo_paths: string[];
  ai_notes: string[];
  valid_until: string | null;
  public_token: string;
  accepted_at: string | null;
  accepted_name: string | null;
  created_at: string;
  updated_at: string;
};

export const VAT_RATES = [21, 9, 0] as const;

export const MAX_QUOTE_PHOTOS = 8;
export const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"];

const round = (n: number) => Math.round(n * 100) / 100;

export function lineTotal(line: Pick<QuoteLine, "quantity" | "unit_price">) {
  return round((Number(line.quantity) || 0) * (Number(line.unit_price) || 0));
}

// Totals excluding VAT, VAT per rate, and the amount the client pays.
export function quoteTotals(lines: QuoteLine[]) {
  const byRate = new Map<number, { base: number; vat: number }>();
  let excl = 0;
  for (const line of lines) {
    const base = lineTotal(line);
    excl += base;
    const rate = Number(line.vat_rate) || 0;
    const entry = byRate.get(rate) ?? { base: 0, vat: 0 };
    entry.base = round(entry.base + base);
    entry.vat = round(entry.base * (rate / 100));
    byRate.set(rate, entry);
  }
  const vat = [...byRate.values()].reduce((sum, r) => sum + r.vat, 0);
  return {
    excl: round(excl),
    vatLines: [...byRate.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([rate, v]) => ({ rate, ...v })),
    vat: round(vat),
    incl: round(excl + vat),
  };
}

export const DEFAULT_TERMS_NL =
  "Prijzen zijn in euro's. Meerwerk wordt alleen uitgevoerd na overleg en wordt apart gefactureerd. " +
  "Betaling binnen 14 dagen na factuurdatum.";

export function addDays(days: number, from = new Date()) {
  return new Date(from.getTime() + days * 864e5).toISOString().slice(0, 10);
}

export const money = (v: unknown) => {
  const n = Number(typeof v === "string" ? v.replace(",", ".") : v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

export const short = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Validates lines coming from the browser or from the AI draft.
export function cleanLines(lines: unknown): QuoteLine[] {
  if (!Array.isArray(lines)) return [];
  return lines.slice(0, 100).map((l) => ({
    kind: (LINE_KINDS as readonly string[]).includes(l?.kind) ? l.kind : "other",
    description: short(l?.description, 2000),
    quantity: money(l?.quantity),
    unit: short(l?.unit, 20) || "stuk",
    unit_price: money(l?.unit_price),
    vat_rate: [21, 9, 0].includes(Number(l?.vat_rate)) ? Number(l.vat_rate) : 21,
  }));
}
