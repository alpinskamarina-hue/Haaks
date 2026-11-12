import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { invoiceTotals } from "@/lib/invoices";
import { addDays, quoteTotals } from "@/lib/quotes";

// Step 3 of «Сотрудник сам заполняет данные»: orders (jobs). The employee prepares a new order,
// hours or a receipt for an order as a card; only the worker's tap saves it. order_details only reads.
export const STAFF_ORDER_TOOLS: Anthropic.Tool[] = [
  {
    name: "prepare_order",
    description: "Prepare a NEW order (job) from what the worker said. Shown as a card with a «Create order» button.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short job title in the worker's words, e.g. «Badkamer renovatie» or «ремонт ванной»" },
        client_name: { type: ["string", "null"] },
        address: { type: ["string", "null"], description: "Street, number, town" },
        hourly_rate: { type: ["number", "null"], description: "€ per hour excl. btw, only if said" },
      },
      required: ["title"],
    },
  },
  {
    name: "prepare_order_hours",
    description: "Prepare worked hours for an EXISTING order (find it with find_orders first; use its id from the page path). Shown as a card with an «Add» button.",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        entries: {
          type: "array",
          items: { type: "object", properties: { work_date: { type: "string", description: "YYYY-MM-DD (Dutch date; «сегодня» = today)" }, hours: { type: "number" }, note: { type: ["string", "null"] } }, required: ["work_date", "hours"] },
        },
      },
      required: ["order_id", "entries"],
    },
  },
  {
    name: "prepare_order_receipt",
    description: "Prepare adding the receipt on the worker's latest photo to an EXISTING order (find it with find_orders first). Shown as a card with an «Add» button; Haaks reads the receipt after that.",
    input_schema: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] },
  },
  {
    name: "prepare_order_invoice",
    description: "Prepare a DRAFT invoice from an EXISTING order (find it with find_orders first): all hours not invoiced yet (per week × the order's rate) and, if wanted, the receipts not invoiced yet as materials. Shown as a card with a «Create draft» button; the worker checks and sends the invoice themselves.",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string" },
        include_receipts: { type: "boolean", description: "Bill the order's receipts as materials (default true)" },
        markup_percent: { type: ["number", "null"], description: "Only if the worker says so: % added to material costs" },
      },
      required: ["order_id"],
    },
  },
  {
    name: "order_details",
    description: "Read one order: hours (total and not yet invoiced), receipts, quotes and invoices linked to it. Read-only.",
    input_schema: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] },
  },
];

export type StaffOrderChange =
  | { type: "order"; kind: "new"; title: string; client_name: string | null; address: string | null; hourly_rate: number | null }
  | { type: "order"; kind: "hours"; order_id: string; order_title: string; entries: { work_date: string; hours: number; note: string | null }[] }
  | { type: "order"; kind: "receipt"; order_id: string; order_title: string; image_path: string }
  | { type: "order"; kind: "invoice"; order_id: string; order_title: string; client_name: string | null; hours: number; rate: number | null; receipts: number; materials: number; include_receipts: boolean; markup_percent: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.replace(/\s+/g, " ").trim().slice(0, max) : null);

export function cleanEntries(raw: unknown) {
  return (Array.isArray(raw) ? raw : [])
    .flatMap((e) => {
      const r = (e ?? {}) as Record<string, unknown>;
      const date = typeof r.work_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.work_date) && !Number.isNaN(Date.parse(r.work_date)) ? r.work_date : null;
      const hours = Math.round(Number(r.hours) * 4) / 4;
      // Not more than a week ahead: a typo in the year should not land in 2062.
      return date && date <= addDays(7) && hours > 0 && hours <= 24 ? [{ work_date: date, hours, note: str(r.note, 200) }] : [];
    })
    .slice(0, 31);
}

async function ownOrder(supabase: SupabaseClient, userId: string, id: unknown) {
  if (typeof id !== "string" || !UUID.test(id)) return null;
  const { data } = await supabase.from("orders").select("id, title").eq("id", id).eq("user_id", userId).maybeSingle<{ id: string; title: string }>();
  return data;
}

// Runs one order tool: returns the text for the model and, for prepare_*, the card.
export async function runOrderTool(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  raw: unknown,
  photo: string | null,
): Promise<{ text: string; card?: StaffOrderChange }> {
  const a = (raw ?? {}) as Record<string, unknown>;
  if (name === "prepare_order") {
    const title = str(a.title, 120);
    if (!title) return { text: "No title. Ask the worker what the job is." };
    const rate = Number(a.hourly_rate);
    const card: StaffOrderChange = { type: "order", kind: "new", title, client_name: str(a.client_name, 120), address: str(a.address, 200), hourly_rate: rate > 0 && rate < 1000 ? Math.round(rate * 100) / 100 : null };
    return { text: "New-order card prepared under your answer with a «Create order» button; nothing is created until they tap it.", card };
  }
  const order = await ownOrder(supabase, userId, a.order_id);
  if (!order) return { text: "Order not found. Use find_orders and pass the id from its page path (/dashboard/orders/<id>)." };
  if (name === "prepare_order_hours") {
    const entries = cleanEntries(a.entries);
    if (!entries.length) return { text: "No valid hours (date YYYY-MM-DD, not more than a week ahead; 0.25–24 hours). Ask again." };
    return { text: `Hours card for «${order.title}» prepared with an «Add» button; nothing is saved until they tap it.`, card: { type: "order", kind: "hours", order_id: order.id, order_title: order.title, entries } };
  }
  if (name === "prepare_order_receipt") {
    if (!photo) return { text: "There is no photo in this talk. Ask the worker to send a photo of the receipt here (📎)." };
    return { text: `Receipt card for «${order.title}» prepared with an «Add» button; Haaks reads the amounts after they tap it.`, card: { type: "order", kind: "receipt", order_id: order.id, order_title: order.title, image_path: photo } };
  }
  if (name === "prepare_order_invoice") {
    const include = a.include_receipts !== false;
    const markup = Number(a.markup_percent);
    const [{ data: full }, { data: hours }, { data: receipts }] = await Promise.all([
      supabase.from("orders").select("client_name, hourly_rate").eq("id", order.id).single(),
      supabase.from("order_hours").select("hours").eq("order_id", order.id).is("invoice_id", null),
      supabase.from("receipts").select("total_excl_vat").eq("order_id", order.id).is("invoice_id", null),
    ]);
    const h = (hours ?? []).reduce((s, r) => s + Number(r.hours), 0);
    const rec = include ? (receipts ?? []).filter((r) => Number(r.total_excl_vat) > 0) : [];
    const rate = Number(full?.hourly_rate) > 0 ? Number(full?.hourly_rate) : null;
    if (!h && !rec.length) return { text: "This order has no hours or receipts that are not invoiced yet. Ask what to bill, or use prepare_invoice with lines." };
    if (h && !rate) return { text: "The order has no hourly rate. Ask the worker for the rate (€ per hour), then use prepare_order_invoice again after they set it on the order page /dashboard/orders/" + order.id };
    const card: StaffOrderChange = {
      type: "order", kind: "invoice", order_id: order.id, order_title: order.title, client_name: full?.client_name ?? null,
      hours: h, rate, receipts: rec.length, materials: Math.round(rec.reduce((s, r) => s + Number(r.total_excl_vat), 0) * 100) / 100,
      include_receipts: include, markup_percent: markup > 0 && markup <= 100 ? markup : 0,
    };
    return { text: `Invoice card prepared: ${h} hours × € ${rate ?? 0}, ${rec.length} receipts as materials € ${card.materials} excl. btw${card.markup_percent ? ` + ${card.markup_percent}%` : ""}. The worker taps «Create draft», then checks and sends it themselves.`, card };
  }
  if (name === "order_details") {
    const [{ data: full }, { data: hours }, { data: receipts }, { data: quotes }, { data: invoices }] = await Promise.all([
      supabase.from("orders").select("title, client_name, address, status, hourly_rate, created_at").eq("id", order.id).single(),
      supabase.from("order_hours").select("hours, invoice_id").eq("order_id", order.id),
      supabase.from("receipts").select("store_name, total_incl_vat, purchased_on").eq("order_id", order.id),
      supabase.from("quotes").select("id, number, status, lines").eq("order_id", order.id),
      supabase.from("invoices").select("id, number, status, lines, vat_mode").eq("order_id", order.id),
    ]);
    const sum = (rows: { hours: number }[]) => rows.reduce((s, r) => s + Number(r.hours), 0);
    const h = hours ?? [];
    const rec = receipts ?? [];
    return {
      text: [
        `Order «${full?.title}»${full?.client_name ? ` for ${full.client_name}` : ""}${full?.address ? `, ${full.address}` : ""}, ${full?.status}, rate ${full?.hourly_rate ? `€ ${full.hourly_rate}/h` : "not set"} → /dashboard/orders/${order.id}`,
        `Hours: ${sum(h)} total, ${sum(h.filter((r) => !r.invoice_id))} not invoiced yet.`,
        `Receipts: ${rec.length}, € ${rec.reduce((s, r) => s + (Number(r.total_incl_vat) || 0), 0).toFixed(2)} incl. btw${rec.length ? ": " + rec.slice(0, 8).map((r) => `${r.store_name ?? "?"} ${r.purchased_on ?? ""} € ${r.total_incl_vat ?? "?"}`).join("; ") : ""}.`,
        `Quotes: ${(quotes ?? []).map((q) => `#${q.number} ${q.status} € ${quoteTotals(q.lines).incl.toFixed(2)} → /dashboard/quotes/${q.id}`).join("; ") || "none"}.`,
        `Invoices: ${(invoices ?? []).map((i) => `#${i.number} ${i.status} € ${invoiceTotals(i.lines, i.vat_mode).incl.toFixed(2)} → /dashboard/invoices/${i.id}`).join("; ") || "none"}.`,
      ].join("\n"),
    };
  }
  return { text: "Unknown tool." };
}
