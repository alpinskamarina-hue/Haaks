"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { nextInvoiceNumber } from "@/lib/invoices";
import { cleanItems, toInvoiceLines, type MaterialList } from "@/lib/materials";
import { fetchProductInfo } from "@/lib/materials-fetch";
import { addDays, short, type QuoteLine } from "@/lib/quotes";
import { createServerAccountClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/dashboard/materials", "layout");
  revalidatePath("/dashboard/orders", "layout");
}

export async function createMaterialList(formData: FormData) {
  const { supabase, user } = await requireUser();
  const orderId = short(formData.get("order_id"), 64) || null;
  const title = short(formData.get("title"), 200);
  const { data: order } = orderId
    ? await supabase.from("orders").select("id, title, client_name").eq("id", orderId).maybeSingle()
    : { data: null };
  const { data: list, error } = await supabase
    .from("material_lists")
    .insert({
      user_id: user.id,
      order_id: order?.id ?? null,
      title: title || order?.title || "Materialen",
      client_name: order?.client_name ?? null,
    })
    .select("id")
    .single();
  if (error || !list) throw new Error(error?.message ?? "Insert failed");
  refresh();
  redirect(`/dashboard/materials/${list.id}`);
}

// Name, photo and price from a shop link pasted by the worker.
export async function lookupProduct(url: string) {
  await requireUser();
  const clean = short(url, 1000);
  if (!/^https?:\/\//i.test(clean)) return { title: null, image: null, price: null, store: null };
  return fetchProductInfo(clean);
}

export async function saveMaterialList(id: string, data: { title: string; client_name: string | null; items: unknown }) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("material_lists")
    .update({
      title: short(data.title, 200) || "Materialen",
      client_name: short(data.client_name, 200) || null,
      items: cleanItems(data.items),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("Material list save failed", error);
    return { ok: false as const };
  }
  refresh();
  return { ok: true as const };
}

export async function markMaterialListSent(id: string) {
  const { supabase } = await requireUser();
  await supabase
    .from("material_lists")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");
  refresh();
}

export async function deleteMaterialList(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("material_lists").delete().eq("id", id);
  refresh();
  redirect("/dashboard/materials");
}

// Puts the products on the draft invoice of the same job, or starts a new draft invoice.
export async function addMaterialsToInvoice(id: string) {
  const { supabase, user } = await requireUser();
  const { data: list } = await supabase.from("material_lists").select("*").eq("id", id).maybeSingle<MaterialList>();
  if (!list || !list.items.length) return;

  if (list.invoice_id) {
    const { data: linked } = await supabase.from("invoices").select("id").eq("id", list.invoice_id).maybeSingle();
    if (linked) redirect(`/dashboard/invoices/${linked.id}`);
  }

  const lines = toInvoiceLines(list.items);
  const { data: draft } = list.order_id
    ? await supabase
        .from("invoices")
        .select("id, lines")
        .eq("order_id", list.order_id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; lines: QuoteLine[] }>()
    : { data: null };

  let invoiceId: string;
  if (draft) {
    const { error } = await supabase
      .from("invoices")
      .update({ lines: [...draft.lines, ...lines], updated_at: new Date().toISOString() })
      .eq("id", draft.id);
    if (error) throw new Error(error.message);
    invoiceId = draft.id;
  } else {
    const [{ data: numbers }, { data: order }] = await Promise.all([
      supabase.from("invoices").select("number").eq("user_id", user.id),
      list.order_id
        ? supabase.from("orders").select("address").eq("id", list.order_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const { data: previous } = list.client_name
      ? await supabase
          .from("invoices")
          .select("client_address, client_kvk, client_btw, vat_mode")
          .eq("user_id", user.id)
          .eq("client_name", list.client_name)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        order_id: list.order_id,
        number: nextInvoiceNumber((numbers ?? []).map((n) => n.number)),
        vat_mode: previous?.vat_mode ?? "normal",
        invoice_date: addDays(0),
        due_date: addDays(14),
        project_address: order?.address ?? null,
        client_name: list.client_name,
        client_address: previous?.client_address ?? null,
        client_kvk: previous?.client_kvk ?? null,
        client_btw: previous?.client_btw ?? null,
        lines,
      })
      .select("id")
      .single();
    if (error || !invoice) throw new Error(error?.message ?? "Insert failed");
    invoiceId = invoice.id;
  }

  await supabase.from("material_lists").update({ invoice_id: invoiceId }).eq("id", id);
  refresh();
  revalidatePath("/dashboard/invoices", "layout");
  redirect(`/dashboard/invoices/${invoiceId}`);
}

// The client on the public link: no login, the token is the only key.
export async function acceptMaterialList(token: string, formData: FormData) {
  const name = short(formData.get("name"), 200);
  const buyer = formData.get("buyer") === "client" ? "client" : "worker";
  if (!name) return;
  const admin = await createServerAccountClient();
  await admin
    .from("material_lists")
    .update({ status: "accepted", buyer, accepted_at: new Date().toISOString(), accepted_name: name })
    .eq("public_token", token)
    .eq("status", "sent");
  revalidatePath(`/m/${token}`);
}
