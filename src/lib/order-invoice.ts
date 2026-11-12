import type { SupabaseClient } from "@supabase/supabase-js";
import { dutchRange, groupByWeek, type HourRow } from "@/lib/hours";
import { nextInvoiceNumber } from "@/lib/invoices";
import { addDays, cleanLines, type QuoteLine } from "@/lib/quotes";

const PAYMENT_DAYS = 14;

// A draft invoice from one order: all hours not on an invoice yet (one line per week,
// "Werkzaamheden week 45 (3–7 nov): <order>", hours × the order's rate) and, when asked,
// the receipts not on an invoice yet as materials. A fixed-price order (fixed_price) bills
// "Aanneemsom: <order>" once instead of the hours; its hours are only for the worker's records.
// Returns the new invoice id, or null when there is nothing to bill (or hours without a rate).
export async function createOrderInvoice(
  supabase: SupabaseClient,
  userId: string,
  orderId: string,
  opts: { receipts: boolean; markupPercent?: number } = { receipts: false },
): Promise<string | null> {
  const [{ data: order }, { data: rows }, { data: receipts }, { data: numbers }] = await Promise.all([
    supabase.from("orders").select("id, title, client_name, address, hourly_rate, fixed_price, fixed_invoice_id").eq("id", orderId).eq("user_id", userId).maybeSingle(),
    supabase.from("order_hours").select("id, work_date, hours, note, invoice_id, approval_id").eq("order_id", orderId).is("invoice_id", null).returns<HourRow[]>(),
    opts.receipts
      ? supabase.from("receipts").select("id, store_name, purchased_on, total_excl_vat").eq("order_id", orderId).is("invoice_id", null).returns<{ id: string; store_name: string | null; purchased_on: string | null; total_excl_vat: number | null }[]>()
      : Promise.resolve({ data: [] as { id: string; store_name: string | null; purchased_on: string | null; total_excl_vat: number | null }[] }),
    supabase.from("invoices").select("number").eq("user_id", userId),
  ]);
  if (!order) return null;
  const rate = Number(order.hourly_rate);
  const fixedPrice = Number(order.fixed_price) > 0 ? Math.round(Number(order.fixed_price) * 100) / 100 : null;
  const fixedDue = fixedPrice !== null && !order.fixed_invoice_id;
  const hours = fixedPrice !== null ? [] : (rows ?? []);
  if (hours.length && !(rate > 0)) return null;
  const bills = (receipts ?? []).filter((r) => Number(r.total_excl_vat) > 0);
  if (!fixedDue && !hours.length && !bills.length) return null;

  const weeks = groupByWeek(hours).reverse();
  // Weeks the company fully approved say so on the invoice line: "(akkoord P. de Vries)".
  const approvalIds = [...new Set(hours.map((r) => r.approval_id).filter((x): x is string => !!x))];
  const { data: approved } = approvalIds.length
    ? await supabase.from("hour_approvals").select("id, decided_name").in("id", approvalIds).eq("status", "approved")
    : { data: [] as { id: string; decided_name: string | null }[] };
  const approver = new Map((approved ?? []).map((a) => [a.id, a.decided_name]));
  const akkoord = (w: (typeof weeks)[number]) => {
    const names = new Set(w.rows.map((r) => (r.approval_id ? approver.get(r.approval_id) : undefined)));
    const [only] = [...names];
    return names.size === 1 && only ? ` (akkoord ${only})` : "";
  };
  const factor = 1 + Math.max(0, Math.min(100, opts.markupPercent ?? 0)) / 100;
  const date = (d: string | null) => (d ? ` ${d.split("-").reverse().join("-")}` : "");
  const lines: QuoteLine[] = cleanLines([
    ...(fixedDue ? [{ kind: "labour" as const, description: `Aanneemsom: ${order.title}`, quantity: 1, unit: "post", unit_price: fixedPrice, vat_rate: 21 }] : []),
    ...weeks.map((w) => ({
      kind: "labour" as const,
      description: `Werkzaamheden week ${w.week} (${dutchRange(w.from, w.to)}): ${order.title}${akkoord(w)}`,
      quantity: w.hours,
      unit: "uur",
      unit_price: rate,
      vat_rate: 21,
    })),
    ...bills.map((r) => ({
      kind: "material" as const,
      description: `Materialen${r.store_name ? ` ${r.store_name}` : ""}${date(r.purchased_on)}`,
      quantity: 1,
      unit: "post",
      unit_price: Math.round(Number(r.total_excl_vat) * factor * 100) / 100,
      vat_rate: 21,
    })),
  ]);

  // A repeat client: take over their company details and the btw choice (often btw verlegd).
  const { data: previous } = order.client_name
    ? await supabase
        .from("invoices")
        .select("client_address, client_kvk, client_btw, client_email, vat_mode")
        .eq("user_id", userId)
        .eq("client_name", order.client_name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      order_id: order.id,
      number: nextInvoiceNumber((numbers ?? []).map((n) => n.number)),
      vat_mode: previous?.vat_mode ?? "normal",
      invoice_date: addDays(0),
      due_date: addDays(PAYMENT_DAYS),
      work_period: weeks.length ? dutchRange(weeks[0].from, weeks[weeks.length - 1].to) : null,
      project_address: order.address,
      client_name: order.client_name,
      client_address: previous?.client_address ?? null,
      client_kvk: previous?.client_kvk ?? null,
      client_btw: previous?.client_btw ?? null,
      client_email: previous?.client_email ?? null,
      lines,
    })
    .select("id")
    .single();
  if (error || !invoice) throw new Error(error?.message ?? "Insert failed");

  if (fixedDue) await supabase.from("orders").update({ fixed_invoice_id: invoice.id }).eq("id", order.id).eq("user_id", userId);
  if (hours.length) await supabase.from("order_hours").update({ invoice_id: invoice.id }).in("id", hours.map((r) => r.id)).eq("user_id", userId);
  if (bills.length) await supabase.from("receipts").update({ invoice_id: invoice.id }).in("id", bills.map((r) => r.id)).eq("user_id", userId);
  return invoice.id;
}
