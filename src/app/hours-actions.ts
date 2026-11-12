"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createOrderInvoice } from "@/lib/order-invoice";
import { addDays } from "@/lib/quotes";

const refresh = (orderId: string) => {
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard");
};
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

// Only hours not on an invoice and not sent to the company yet can be removed.
export async function deleteHours(id: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("order_hours")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .is("invoice_id", null)
    .is("approval_id", null)
    .select("order_id")
    .maybeSingle();
  if (data) refresh(data.order_id);
}

// A draft invoice from all hours of this order that are not on an invoice yet (see createOrderInvoice).
export async function invoiceFromHours(orderId: string) {
  const { supabase, user } = await requireUser();
  const id = await createOrderInvoice(supabase, user.id, orderId);
  if (!id) return;
  revalidatePath("/dashboard/invoices", "layout");
  refresh(orderId);
  redirect(`/dashboard/invoices/${id}`);
}

// Sends the not yet approved hours of one week (Monday..Sunday) to the company: a request with a
// snapshot of the days; the hours are linked to it. The page then shows the link to send.
export async function sendHoursForApproval(orderId: string, from: string, to: string) {
  const { supabase, user } = await requireUser();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return;
  const { data: rows } = await supabase
    .from("order_hours")
    .select("id, work_date, hours, note")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .is("approval_id", null)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date")
    .returns<{ id: string; work_date: string; hours: number; note: string | null }[]>();
  if (!rows?.length) return;
  const hours = Math.round(rows.reduce((x, r) => x + Number(r.hours), 0) * 100) / 100;
  const { data: approval, error } = await supabase
    .from("hour_approvals")
    .insert({
      user_id: user.id,
      order_id: orderId,
      date_from: rows[0].work_date,
      date_to: rows[rows.length - 1].work_date,
      hours,
      lines: rows.map((r) => ({ work_date: r.work_date, hours: Number(r.hours), note: r.note })),
    })
    .select("id")
    .single();
  if (error || !approval) throw new Error(error?.message ?? "Insert failed");
  await supabase.from("order_hours").update({ approval_id: approval.id }).in("id", rows.map((r) => r.id)).eq("user_id", user.id);
  refresh(orderId);
}
