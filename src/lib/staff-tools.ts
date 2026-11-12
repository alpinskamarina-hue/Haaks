import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { invoiceTotals, VAT_MODES, type Invoice, type VatMode } from "@/lib/invoices";
import { cleanLines, dutchToday, quoteTotals, type QuoteLine } from "@/lib/quotes";

// Step 5a: the digital employee looks things up in the worker's own invoices, quotes and orders.
// Step 5b: it prepares a draft invoice or quote as a card; only the worker's tap creates it.
const LIMIT = 15;
const euro = (n: number) => `€ ${n.toFixed(2)}`;
const like = (s: string) => `%${s.replace(/[%_,()]/g, " ").trim()}%`;

export const STAFF_TOOLS: Anthropic.Tool[] = [
  {
    name: "find_invoices",
    description:
      "Search the worker's own invoices in Haaks. Use for questions like «which invoices are unpaid?», «what did I bill Jansen?», «overdue invoices». Returns number, client, amount incl. btw, dates, status and the page path.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["unpaid", "overdue", "paid", "draft", "all"], description: "unpaid = sent and not paid; overdue = unpaid and past the due date" },
        client: { type: "string", description: "Part of the client name, optional" },
        from: { type: "string", description: "Invoice date from, YYYY-MM-DD, optional" },
        to: { type: "string", description: "Invoice date to, YYYY-MM-DD, optional" },
      },
    },
  },
  {
    name: "find_quotes",
    description: "Search the worker's own quotes (offertes) in Haaks. Use for «which quotes have no answer?», «did Jansen accept?». Returns number, title, client, amount, status, sent/opened dates and the page path.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["draft", "sent", "accepted", "declined", "all"] },
        client: { type: "string", description: "Part of the client name, optional" },
      },
    },
  },
  {
    name: "find_orders",
    description: "Search the worker's own orders (jobs) in Haaks. Returns title, client, address, status and the page path.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "closed", "all"] },
        client: { type: "string", description: "Part of the client name, optional" },
      },
    },
  },
];


const LINE_SCHEMA = {
  type: "array",
  description: "Lines for the client, descriptions in Dutch. Prices excl. btw.",
  items: {
    type: "object",
    properties: {
      description: { type: "string", description: "Dutch, e.g. «Tegels leggen badkamer»" },
      quantity: { type: "number" },
      unit: { type: "string", description: "uur, dag, m², m, stuk" },
      unit_price: { type: "number", description: "Euro per unit, excl. btw" },
      vat_rate: { type: "number", enum: [21, 9, 0] },
      kind: { type: "string", enum: ["labour", "material", "other"] },
    },
    required: ["description", "quantity", "unit", "unit_price"],
  },
} as const;

export const STAFF_DRAFT_TOOLS: Anthropic.Tool[] = [
  {
    name: "prepare_invoice",
    description:
      "Prepare a DRAFT invoice for the worker to check. It is shown as a card with a «Create» button; nothing is created or sent until the worker taps it. Use when the worker asks to make/write an invoice. Ask first if the client or the amount is unclear.",
    input_schema: {
      type: "object",
      properties: {
        client_name: { type: "string" },
        client_email: { type: "string" },
        client_address: { type: "string" },
        vat_mode: { type: "string", enum: ["normal", "reverse", "kor"], description: "reverse = btw verlegd (subcontractor for a construction company); kor = small business scheme; else normal" },
        lines: LINE_SCHEMA,
      },
      required: ["client_name", "lines"],
    },
  },
  {
    name: "prepare_quote",
    description:
      "Prepare a DRAFT quote (offerte) for the worker to check. It is shown as a card with a «Create» button; nothing is created or sent until the worker taps it. Use when the worker asks to make a quote/offer.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short Dutch title, e.g. «Badkamer betegelen»" },
        client_name: { type: "string" },
        client_address: { type: "string" },
        intro: { type: "string", description: "One or two Dutch sentences for the client" },
        lines: LINE_SCHEMA,
      },
      required: ["title", "lines"],
    },
  },
];

export type StaffDraft = {
  type: "invoice" | "quote";
  title: string | null;
  client_name: string | null;
  client_email: string | null;
  client_address: string | null;
  intro: string | null;
  vat_mode: VatMode;
  lines: QuoteLine[];
};

// Turns the model's tool input into a clean draft (or null when there is nothing usable).
export function toStaffDraft(name: string, raw: unknown): StaffDraft | null {
  const a = (raw ?? {}) as Record<string, unknown>;
  const lines = cleanLines(a.lines).filter((l) => l.description && l.quantity > 0);
  if (!lines.length) return null;
  const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  return {
    type: name === "prepare_quote" ? "quote" : "invoice",
    title: text(a.title, 200),
    client_name: text(a.client_name, 200),
    client_email: text(a.client_email, 200),
    client_address: text(a.client_address, 300),
    intro: text(a.intro, 1500),
    vat_mode: (VAT_MODES as readonly string[]).includes(String(a.vat_mode)) ? (a.vat_mode as VatMode) : "normal",
    lines,
  };
}

type Args = { status?: string; client?: string; from?: string; to?: string };
const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function runStaffTool(supabase: SupabaseClient, userId: string, name: string, raw: unknown): Promise<string> {
  const a = (raw ?? {}) as Args;
  const client = a.client?.trim() ? like(a.client) : null;

  if (name === "find_invoices") {
    let q = supabase
      .from("invoices")
      .select("id, number, status, lines, vat_mode, invoice_date, due_date, paid_at, client_name")
      .eq("user_id", userId)
      .order("invoice_date", { ascending: false })
      .limit(LIMIT);
    const today = dutchToday();
    if (a.status === "unpaid") q = q.eq("status", "sent");
    if (a.status === "overdue") q = q.eq("status", "sent").lt("due_date", today);
    if (a.status === "paid" || a.status === "draft") q = q.eq("status", a.status);
    if (client) q = q.ilike("client_name", client);
    if (isDate(a.from)) q = q.gte("invoice_date", a.from as string);
    if (isDate(a.to)) q = q.lte("invoice_date", a.to as string);
    const { data } = await q.returns<(Pick<Invoice, "number" | "status" | "lines" | "vat_mode" | "invoice_date" | "due_date" | "client_name"> & { id: string; paid_at: string | null })[]>();
    const rows = data ?? [];
    if (!rows.length) return "No invoices found.";
    const total = rows.reduce((s, i) => s + invoiceTotals(i.lines, i.vat_mode).incl, 0);
    return [
      `${rows.length} invoice(s)${rows.length === LIMIT ? " (showing the newest 15)" : ""}, together ${euro(total)} incl. btw:`,
      ...rows.map((i) => {
        const overdue = i.status === "sent" && i.due_date && i.due_date < today ? ", OVERDUE" : "";
        return `- #${i.number} ${i.client_name ?? "?"} ${euro(invoiceTotals(i.lines, i.vat_mode).incl)}, ${i.status}${overdue}, date ${i.invoice_date}${i.due_date ? `, due ${i.due_date}` : ""}${i.paid_at ? `, paid ${i.paid_at.slice(0, 10)}` : ""} → /dashboard/invoices/${i.id}`;
      }),
    ].join("\n");
  }

  if (name === "find_quotes") {
    let q = supabase
      .from("quotes")
      .select("id, number, title, status, lines, client_name, sent_at, viewed_at, accepted_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    if (a.status && a.status !== "all") q = q.eq("status", a.status);
    if (client) q = q.ilike("client_name", client);
    const { data } = await q.returns<{ id: string; number: string; title: string | null; status: string; lines: QuoteLine[]; client_name: string | null; sent_at: string | null; viewed_at: string | null; accepted_at: string | null; created_at: string }[]>();
    const rows = data ?? [];
    if (!rows.length) return "No quotes found.";
    return [
      `${rows.length} quote(s)${rows.length === LIMIT ? " (showing the newest 15)" : ""}:`,
      ...rows.map(
        (r) =>
          `- #${r.number} ${r.title ?? ""} for ${r.client_name ?? "?"} ${euro(quoteTotals(r.lines).incl)}, ${r.status}${r.sent_at ? `, sent ${r.sent_at.slice(0, 10)}` : ""}${r.viewed_at ? `, opened by client ${r.viewed_at.slice(0, 10)}` : r.sent_at ? ", not opened yet" : ""}${r.accepted_at ? `, accepted ${r.accepted_at.slice(0, 10)}` : ""} → /dashboard/quotes/${r.id}`,
      ),
    ].join("\n");
  }

  if (name === "find_orders") {
    let q = supabase.from("orders").select("id, title, client_name, address, status, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(LIMIT);
    if (a.status === "open" || a.status === "closed") q = q.eq("status", a.status);
    if (client) q = q.ilike("client_name", client);
    const { data } = await q;
    const rows = data ?? [];
    if (!rows.length) return "No orders found.";
    return [
      `${rows.length} order(s):`,
      ...rows.map((o) => `- ${o.title} for ${o.client_name ?? "?"}${o.address ? `, ${o.address}` : ""}, ${o.status}, since ${String(o.created_at).slice(0, 10)} → /dashboard/orders/${o.id}`),
    ].join("\n");
  }

  return "Unknown tool.";
}
