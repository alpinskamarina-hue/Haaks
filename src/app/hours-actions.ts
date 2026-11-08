"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dutchRange, groupByWeek, type HourRow } from "@/lib/hours";
import { nextInvoiceNumber } from "@/lib/invoices";
import { addDays, cleanLines, type QuoteLine } from "@/lib/quotes";

const PAYMENT_DAYS = 14;
const refresh = (orderId: string) => revalidatePath(`/dashboard/orders/${orderId}`);
const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
};

// The hourly rate for this order (the profile rate is only the starting value).
export async function setOrderRate(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = String(formData.get("order_id") ?? "");
  const rate = num(formData.get("rate"));
  if (!orderId || !(rate >= 0 && rate <= 1000)) return;
  await supabase.from("orders").update({ hourly_rate: Math.round(rate * 100) / 100 }).eq("id", orderId).eq("user_id", user.id);
  refresh(orderId);
}

export async function addHours(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = String(formData.get("order_id") ?? "");
  const date = String(formData.get("work_date") ?? "");
  const hours = num(formData.get("hours"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 200) || null;
  if (!orderId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(hours > 0 && hours <= 24)) return;
  // Not more than a few days into the future: a typo in the year should not land in 2062.
  if (date > addDays(7)) return;
  const { error } = await supabase
    .from("order_hours")
    .insert({ user_id: user.id, order_id: orderId, work_date: date, hours: Math.round(hours * 4) / 4, note });
  if (error) throw error;
  refresh(orderId);
}

// Only hours not on an invoice yet can be removed.
export async function deleteHours(id: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("order_hours")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .is("invoice_id", null)
    .select("order_id")
    .maybeSingle();
  if (data) refresh(data.order_id);
}

// A draft invoice from all hours of this order that are not on an invoice yet: one line per week,
// "Werkzaamheden week 45 (3–7 nov): <order>", hours × the order's rate.
export async function invoiceFromHours(orderId: string) {
  const { supabase, user } = await requireUser();
  const [{ data: order }, { data: rows }, { data: numbers }] = await Promise.all([
    supabase.from("orders").select("id, title, client_name, address, hourly_rate").eq("id", orderId).eq("user_id", user.id).maybeSingle(),
    supabase.from("order_hours").select("id, work_date, hours, note, invoice_id").eq("order_id", orderId).is("invoice_id", null).returns<HourRow[]>(),
    supabase.from("invoices").select("number").eq("user_id", user.id),
  ]);
  const rate = Number(order?.hourly_rate);
  if (!order || !rows?.length || !(rate > 0)) return;

  const weeks = groupByWeek(rows).reverse();
  const lines: QuoteLine[] = cleanLines(
    weeks.map((w) => ({
      kind: "labour",
      description: `Werkzaamheden week ${w.week} (${dutchRange(w.from, w.to)}): ${order.title}`,
      quantity: w.hours,
      unit: "uur",
      unit_price: rate,
      vat_rate: 21,
    })),
  );

  // A repeat client: take over their company details and the btw choice (often btw verlegd).
  const { data: previous } = order.client_name
    ? await supabase
        .from("invoices")
        .select("client_address, client_kvk, client_btw, client_email, vat_mode")
        .eq("user_id", user.id)
        .eq("client_name", order.client_name)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const first = weeks[0].from;
  const last = weeks[weeks.length - 1].to;
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      order_id: order.id,
      number: nextInvoiceNumber((numbers ?? []).map((n) => n.number)),
      vat_mode: previous?.vat_mode ?? "normal",
      invoice_date: addDays(0),
      due_date: addDays(PAYMENT_DAYS),
      work_period: dutchRange(first, last),
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

  await supabase.from("order_hours").update({ invoice_id: invoice.id }).in("id", rows.map((r) => r.id)).eq("user_id", user.id);
  revalidatePath("/dashboard/invoices", "layout");
  refresh(orderId);
  redirect(`/dashboard/invoices/${invoice.id}`);
}
