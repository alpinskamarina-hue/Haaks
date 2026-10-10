"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cleanDate } from "@/lib/extract";
import { nextInvoiceNumber, VAT_MODES, type Invoice, type VatMode } from "@/lib/invoices";
import type { Receipt } from "@/lib/orders";
import { addDays, cleanLines, short, type Quote, type QuoteLine } from "@/lib/quotes";

function refresh() {
  revalidatePath("/dashboard/invoices", "layout");
  revalidatePath("/dashboard/orders", "layout");
  revalidatePath("/dashboard/quotes", "layout");
}

const PAYMENT_DAYS = 14;

// Starts a draft invoice, prefilled from an accepted quote or from an order and its receipts.
export async function createInvoice(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = short(formData.get("order_id"), 64) || null;
  const quoteId = short(formData.get("quote_id"), 64) || null;
  const withReceipts = formData.get("with_receipts") === "on";

  const [{ data: profile }, { data: numbers }] = await Promise.all([
    supabase.from("profiles").select("hourly_rate").eq("id", user.id).single(),
    supabase.from("invoices").select("number").eq("user_id", user.id),
  ]);

  const { data: quote } = quoteId
    ? await supabase.from("quotes").select("*").eq("id", quoteId).maybeSingle<Quote>()
    : { data: null };
  const effectiveOrderId = quote?.order_id ?? orderId;
  const { data: order } = effectiveOrderId
    ? await supabase.from("orders").select("id, title, client_name, address").eq("id", effectiveOrderId).maybeSingle()
    : { data: null };

  let lines: QuoteLine[] = quote?.lines ?? [
    {
      kind: "labour",
      description: order ? `Uitgevoerde werkzaamheden: ${order.title}` : "Uitgevoerde werkzaamheden",
      quantity: 1,
      unit: "uur",
      unit_price: Number(profile?.hourly_rate) || 0,
      vat_rate: 21,
    },
  ];

  // Materials bought for this order, at cost excluding btw.
  if (order && withReceipts && !quote) {
    const { data: receipts } = await supabase
      .from("receipts")
      .select("*")
      .eq("order_id", order.id)
      .order("purchased_on")
      .returns<Receipt[]>();
    for (const r of receipts ?? []) {
      const excl =
        r.total_excl_vat !== null
          ? Number(r.total_excl_vat)
          : r.total_incl_vat !== null
            ? Number(r.total_incl_vat) - Number(r.vat_total ?? 0)
            : null;
      if (!excl) continue;
      lines.push({
        kind: "material",
        description: ["Materialen", r.store_name, r.purchased_on].filter(Boolean).join(" "),
        quantity: 1,
        unit: "stuk",
        unit_price: Math.round(excl * 100) / 100,
        vat_rate: 21,
      });
    }
  }
  lines = cleanLines(lines);

  const clientName = quote?.client_name ?? order?.client_name ?? null;
  // A repeat client: take over their company details and the btw choice from the last invoice.
  const { data: previous } = clientName
    ? await supabase
        .from("invoices")
        .select("client_address, client_kvk, client_btw, vat_mode")
        .eq("user_id", user.id)
        .eq("client_name", clientName)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      order_id: order?.id ?? null,
      quote_id: quote?.id ?? null,
      number: nextInvoiceNumber((numbers ?? []).map((n) => n.number)),
      vat_mode: previous?.vat_mode ?? "normal",
      invoice_date: addDays(0),
      due_date: addDays(PAYMENT_DAYS),
      project_address: order?.address ?? quote?.client_address ?? null,
      client_name: clientName,
      client_address: previous?.client_address ?? quote?.client_address ?? null,
      client_kvk: previous?.client_kvk ?? null,
      client_btw: previous?.client_btw ?? null,
      lines,
    })
    .select("id")
    .single();
  if (error || !invoice) throw new Error(error?.message ?? "Insert failed");

  refresh();
  redirect(`/dashboard/invoices/${invoice.id}`);
}

export async function saveInvoice(
  id: string,
  data: Pick<
    Invoice,
    | "number"
    | "vat_mode"
    | "invoice_date"
    | "due_date"
    | "work_period"
    | "project_address"
    | "client_name"
    | "client_address"
    | "client_kvk"
    | "client_btw"
    | "lines"
    | "notes"
  >,
) {
  const { supabase } = await requireUser();
  const mode: VatMode = (VAT_MODES as readonly string[]).includes(data.vat_mode) ? data.vat_mode : "normal";
  await supabase
    .from("invoices")
    .update({
      number: short(data.number, 40) || "—",
      vat_mode: mode,
      invoice_date: cleanDate(data.invoice_date) ?? addDays(0),
      due_date: cleanDate(data.due_date),
      work_period: short(data.work_period, 200) || null,
      project_address: short(data.project_address, 300) || null,
      client_name: short(data.client_name, 200) || null,
      client_address: short(data.client_address, 300) || null,
      client_kvk: short(data.client_kvk, 20).replace(/\s/g, "") || null,
      client_btw: short(data.client_btw, 20).replace(/\s/g, "").toUpperCase() || null,
      lines: cleanLines(data.lines),
      notes: short(data.notes, 2000) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  refresh();
}

export async function setInvoiceStatus(id: string, status: Invoice["status"]) {
  const { supabase } = await requireUser();
  if (!["draft", "sent", "paid"].includes(status)) return;
  await supabase
    .from("invoices")
    .update({
      status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  refresh();
}

export async function deleteInvoice(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("invoices").delete().eq("id", id);
  refresh();
  redirect("/dashboard/invoices");
}

