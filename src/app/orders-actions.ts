"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { ACCEPTED_MIME } from "@/lib/documents";
import { cleanDate, extractReceipt } from "@/lib/extract";
import { isLang, type Lang } from "@/lib/i18n";
import { claudeEnabled } from "@/lib/env";
import { parseAmount, roundCents } from "@/lib/quotes";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function amount(formData: FormData, key: string) {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = parseAmount(raw);
  return Number.isFinite(value) ? roundCents(value) : null;
}

function refresh() {
  revalidatePath("/dashboard/orders", "layout");
}

// Only accept an order id that belongs to the signed-in worker.
async function ownOrderId(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  orderId: string | null,
) {
  if (!orderId) return null;
  const { data } = await supabase.from("orders").select("id").eq("id", orderId).maybeSingle();
  return data?.id ?? null;
}

export async function createOrder(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = text(formData, "title");
  if (!title) return;
  const { data: order } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      title,
      client_name: text(formData, "client_name"),
      address: text(formData, "address"),
    })
    .select("id")
    .single();
  // A new order becomes the current one, since that is where the next receipts belong.
  if (order) {
    await supabase.from("profiles").update({ current_order_id: order.id }).eq("id", user.id);
  }
  refresh();
}

export async function setCurrentOrder(orderId: string | null) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({ current_order_id: await ownOrderId(supabase, orderId) })
    .eq("id", user.id);
  refresh();
}

export async function setOrderStatus(orderId: string, status: "open" | "closed") {
  const { supabase, user } = await requireUser();
  await supabase.from("orders").update({ status }).eq("id", orderId);
  if (status === "closed") {
    await supabase
      .from("profiles")
      .update({ current_order_id: null })
      .eq("id", user.id)
      .eq("current_order_id", orderId);
  }
  refresh();
}

// Called after the browser has uploaded the receipt to the user's storage folder.
export async function addReceipt(input: {
  path: string;
  fileName: string;
  mimeType: string;
  orderId: string | null;
}) {
  const { supabase, user } = await requireUser();
  if (!input.path.startsWith(`${user.id}/`)) throw new Error("Invalid path");
  if (!ACCEPTED_MIME.includes(input.mimeType)) throw new Error("Unsupported file type");

  const { data: receipt, error } = await supabase
    .from("receipts")
    .insert({
      user_id: user.id,
      order_id: await ownOrderId(supabase, input.orderId),
      file_path: input.path,
      file_name: input.fileName.slice(0, 200),
      mime_type: input.mimeType,
    })
    .select("id")
    .single();
  if (error || !receipt) throw new Error(error?.message ?? "Insert failed");

  if (!claudeEnabled()) {
    await supabase.from("receipts").update({ ai_status: "skipped" }).eq("id", receipt.id);
    refresh();
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, company_name")
    .eq("id", user.id)
    .single();
  const lang: Lang = isLang(profile?.language) ? profile.language : "en";

  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from("documents")
      .download(input.path);
    if (downloadError || !blob) throw downloadError ?? new Error("Download failed");
    const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

    const result = await extractReceipt(
      { base64, mimeType: input.mimeType },
      profile?.company_name ?? null,
      lang,
    );
    if (!result) throw new Error("No result");

    await supabase
      .from("receipts")
      .update({
        store_name: result.store_name,
        store_city: result.store_city,
        receipt_number: result.receipt_number,
        purchased_on: cleanDate(result.purchased_on),
        total_incl_vat: result.total_incl_vat,
        total_excl_vat: result.total_excl_vat,
        vat_total: result.vat_total,
        vat_lines: result.vat_lines,
        items: result.items,
        addressed_to_company: result.addressed_to_company,
        ai_summary: result.summary,
        ai_warnings: result.warnings,
        ai_status: "done",
      })
      .eq("id", receipt.id);
  } catch (err) {
    console.error("Receipt extraction failed", err);
    await supabase.from("receipts").update({ ai_status: "failed" }).eq("id", receipt.id);
  }

  refresh();
}

export async function moveReceipt(formData: FormData) {
  const { supabase } = await requireUser();
  const id = text(formData, "id");
  if (!id) return;
  await supabase
    .from("receipts")
    .update({ order_id: await ownOrderId(supabase, text(formData, "order_id")) })
    .eq("id", id);
  refresh();
}

export async function updateReceipt(formData: FormData) {
  const { supabase } = await requireUser();
  const id = text(formData, "id");
  if (!id) return;
  await supabase
    .from("receipts")
    .update({
      store_name: text(formData, "store_name"),
      purchased_on: cleanDate(text(formData, "purchased_on")),
      total_incl_vat: amount(formData, "total_incl_vat"),
      vat_total: amount(formData, "vat_total"),
      total_excl_vat: null,
    })
    .eq("id", id);
  refresh();
}

export async function deleteReceipt(id: string) {
  const { supabase } = await requireUser();
  const { data: receipt } = await supabase.from("receipts").select("file_path").eq("id", id).single();
  if (!receipt) return;
  // Row first: if that fails, the file is still there for the receipt.
  const { error } = await supabase.from("receipts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.storage.from("documents").remove([receipt.file_path]);
  refresh();
}
