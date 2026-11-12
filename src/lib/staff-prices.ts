import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanLines, type QuoteLine } from "@/lib/quotes";

// The employee changes prices on request: an order's hourly rate, or the lines (price, quantity,
// text) of a quote that is not accepted yet or of a DRAFT invoice. Shown as a card with old → new;
// only the worker's tap changes anything.
export const STAFF_PRICE_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_lines",
    description: "Read the numbered lines (description, quantity, unit, price, btw) of one quote or invoice, before changing them. Use the id from find_quotes / find_invoices / order_details page paths.",
    input_schema: { type: "object", properties: { kind: { type: "string", enum: ["quote", "invoice"] }, id: { type: "string" } }, required: ["kind", "id"] },
  },
  {
    name: "prepare_price_change",
    description:
      "Prepare a change the worker asked for: target order_rate (an order's hourly rate; id = order id) or quote / invoice lines (id = quote or invoice id; call get_lines first). Only quotes not accepted yet and DRAFT invoices can change. Shown as a card with old → new and a «Change» button; nothing changes until they tap it.",
    input_schema: {
      type: "object",
      properties: {
        target: { type: "string", enum: ["order_rate", "quote", "invoice"] },
        id: { type: "string" },
        hourly_rate: { type: "number", description: "order_rate: new € per hour excl. btw" },
        changes: {
          type: "array",
          description: "quote/invoice: changes to existing lines by their number from get_lines",
          items: {
            type: "object",
            properties: {
              line: { type: "number", description: "Line number from get_lines (1 = first)" },
              unit_price: { type: "number", description: "New price per unit excl. btw" },
              quantity: { type: "number" },
              description: { type: "string", description: "New text, in Dutch" },
              remove: { type: "boolean" },
            },
            required: ["line"],
          },
        },
        add_lines: {
          type: "array",
          description: "quote/invoice: new lines (Dutch text)",
          items: {
            type: "object",
            properties: { description: { type: "string" }, quantity: { type: "number" }, unit: { type: "string" }, unit_price: { type: "number" }, kind: { type: "string", enum: ["labour", "material", "other"] }, vat_rate: { type: "number", enum: [21, 9, 0] } },
            required: ["description", "quantity", "unit_price"],
          },
        },
      },
      required: ["target", "id"],
    },
  },
];

export type PriceRow = { label: string; before: string | null; after: string | null };
export type StaffPriceChange =
  | { type: "prices"; target: "order_rate"; id: string; title: string; old_rate: number | null; new_rate: number; rows: PriceRow[] }
  | { type: "prices"; target: "quote" | "invoice"; id: string; title: string; old_lines: QuoteLine[]; new_lines: QuoteLine[]; rows: PriceRow[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const euro = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;
const lineText = (l: QuoteLine) => `${l.quantity} ${l.unit} × ${euro(l.unit_price)} = ${euro(l.quantity * l.unit_price)}`;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

async function loadDoc(supabase: SupabaseClient, userId: string, kind: "quote" | "invoice", id: string) {
  const { data } = await supabase
    .from(kind === "quote" ? "quotes" : "invoices")
    .select("id, number, status, client_name, lines")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<{ id: string; number: string; status: string; client_name: string | null; lines: QuoteLine[] }>();
  return data;
}
const editable = (kind: "quote" | "invoice", status: string) => (kind === "quote" ? status === "draft" || status === "sent" : status === "draft");

export async function runPriceTool(supabase: SupabaseClient, userId: string, name: string, raw: unknown): Promise<{ text: string; card?: StaffPriceChange }> {
  const a = (raw ?? {}) as Record<string, unknown>;
  const id = typeof a.id === "string" && UUID.test(a.id) ? a.id : null;
  if (!id) return { text: "No valid id. Use find_quotes, find_invoices or find_orders and take the id from the page path." };

  if (name === "get_lines") {
    const kind = a.kind === "invoice" ? "invoice" : "quote";
    const doc = await loadDoc(supabase, userId, kind, id);
    if (!doc) return { text: "Not found." };
    return {
      text: [
        `${kind} #${doc.number} for ${doc.client_name ?? "?"}, status ${doc.status}${editable(kind, doc.status) ? "" : " (cannot be changed: " + (kind === "invoice" ? "only draft invoices; a sent invoice is corrected with «Corrigeren» on its page" : "already accepted or declined") + ")"}:`,
        ...doc.lines.map((l, i) => `${i + 1}. ${l.description} | ${l.quantity} ${l.unit} × € ${l.unit_price} | btw ${l.vat_rate}% | ${l.kind}`),
      ].join("\n"),
    };
  }

  if (a.target === "order_rate") {
    const rate = num(a.hourly_rate);
    if (rate === null || rate <= 0 || rate >= 1000) return { text: "Give the new hourly rate in € (0–1000)." };
    const { data: order } = await supabase.from("orders").select("id, title, hourly_rate").eq("id", id).eq("user_id", userId).maybeSingle<{ id: string; title: string; hourly_rate: number | null }>();
    if (!order) return { text: "Order not found." };
    const newRate = Math.round(rate * 100) / 100;
    return {
      text: `Card prepared: hourly rate of «${order.title}» € ${order.hourly_rate ?? "—"} → € ${newRate}. Hours already on an invoice keep the old rate. Nothing changes until they tap it.`,
      card: { type: "prices", target: "order_rate", id: order.id, title: order.title, old_rate: order.hourly_rate, new_rate: newRate, rows: [{ label: "€ / uur", before: order.hourly_rate ? euro(Number(order.hourly_rate)) : null, after: euro(newRate) }] },
    };
  }

  const kind = a.target === "invoice" ? "invoice" : a.target === "quote" ? "quote" : null;
  if (!kind) return { text: "Unknown target." };
  const doc = await loadDoc(supabase, userId, kind, id);
  if (!doc) return { text: "Not found." };
  if (!editable(kind, doc.status))
    return { text: kind === "invoice" ? "This invoice is already sent or paid, so it cannot be changed. Tell the worker to open it and use «Corrigeren» (a credit invoice and a new one)." : "This quote is already accepted or declined; make a new quote instead." };

  const old = cleanLines(doc.lines);
  const next = old.map((l) => ({ ...l }));
  const removed = new Set<number>();
  const rows: PriceRow[] = [];
  for (const c of Array.isArray(a.changes) ? a.changes : []) {
    const ch = (c ?? {}) as Record<string, unknown>;
    const i = Number(ch.line) - 1;
    if (!Number.isInteger(i) || i < 0 || i >= next.length) return { text: `Line ${ch.line} does not exist; use get_lines.` };
    if (ch.remove === true) {
      removed.add(i);
      continue;
    }
    const price = num(ch.unit_price);
    const qty = num(ch.quantity);
    if (price !== null) next[i].unit_price = price;
    if (qty !== null) next[i].quantity = qty;
    if (typeof ch.description === "string" && ch.description.trim()) next[i].description = ch.description.trim();
  }
  const added = cleanLines((Array.isArray(a.add_lines) ? a.add_lines : []).map((l) => ({ kind: "other", unit: "stuk", vat_rate: 21, ...(l as object) }))).filter((l) => l.description && l.unit_price >= 0);
  const final = cleanLines([...next.filter((_, i) => !removed.has(i)), ...added]);
  old.forEach((l, i) => {
    if (removed.has(i)) rows.push({ label: l.description, before: lineText(l), after: null });
    else if (JSON.stringify(l) !== JSON.stringify(cleanLines([next[i]])[0])) {
      const n = cleanLines([next[i]])[0];
      rows.push({ label: n.description, before: lineText(l), after: lineText(n) });
    }
  });
  for (const l of added) rows.push({ label: l.description, before: null, after: lineText(l) });
  if (!rows.length) return { text: "Nothing would change. Ask what exactly to change." };
  if (!final.length) return { text: "A quote or invoice needs at least one line." };
  const title = `${kind === "quote" ? "Offerte" : "Factuur"} #${doc.number}${doc.client_name ? ` · ${doc.client_name}` : ""}`;
  return {
    text: `Card prepared for ${title}: ${rows.length} line change(s). Nothing changes until they tap «Change».${kind === "quote" && doc.status === "sent" ? " The quote is already sent: the client sees the new prices on the same link." : ""}`,
    card: { type: "prices", target: kind, id: doc.id, title, old_lines: old, new_lines: final, rows },
  };
}
