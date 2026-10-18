"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { analyzeLead } from "@/lib/extract";
import { isLang, type Lang } from "@/lib/i18n";
import { siteUrl } from "@/lib/lang";
import type { Lead } from "@/lib/leads";
import { PHOTO_MIME, short } from "@/lib/quotes";

function refresh() {
  revalidatePath("/dashboard", "layout");
}

// The worker pastes a post from a group or chat (text and/or screenshot); Claude reads it.
export async function addLead(input: { text: string; image: { path: string; mimeType: string } | null }) {
  const { supabase, user } = await requireUser();
  const text = short(input.text, 8000);
  const image =
    input.image && input.image.path.startsWith(`${user.id}/leads/`) && PHOTO_MIME.includes(input.image.mimeType)
      ? input.image
      : null;
  if (!text && !image) throw new Error("Empty lead");

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({ user_id: user.id, source: "manual", raw_text: text, image_path: image?.path ?? null })
    .select("id")
    .single();
  if (error || !lead) throw new Error(error?.message ?? "Insert failed");

  if (!process.env.ANTHROPIC_API_KEY) {
    await supabase.from("leads").update({ ai_status: "skipped" }).eq("id", lead.id);
    refresh();
    return { id: lead.id };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, full_name, company_name, trade, city, lead_regions, passport_token, passport_enabled")
    .eq("id", user.id)
    .single();
  const lang: Lang = isLang(profile?.language) ? profile.language : "en";

  try {
    let file = null;
    if (image) {
      const { data: blob, error: downloadError } = await supabase.storage.from("documents").download(image.path);
      if (downloadError || !blob) throw downloadError ?? new Error("Download failed");
      file = { base64: Buffer.from(await blob.arrayBuffer()).toString("base64"), mimeType: image.mimeType };
    }
    const result = await analyzeLead({
      text,
      image: file,
      worker: {
        name: profile?.company_name ?? profile?.full_name ?? null,
        trade: profile?.trade ?? null,
        city: profile?.city ?? null,
        regions: profile?.lead_regions ?? null,
      },
      passportUrl: profile?.passport_enabled ? `${await siteUrl()}/p/${profile.passport_token}` : null,
      lang,
    });
    if (!result) throw new Error("No result");
    await supabase
      .from("leads")
      .update({
        ...result,
        match_score: Math.max(0, Math.min(100, Math.round(result.match_score))),
        status: result.is_job ? "new" : "dismissed",
        ai_status: "done",
      })
      .eq("id", lead.id);
  } catch (err) {
    console.error("Lead analysis failed", err);
    await supabase.from("leads").update({ ai_status: "failed" }).eq("id", lead.id);
  }

  refresh();
  return { id: lead.id };
}

export async function setLeadStatus(id: string, status: Lead["status"]) {
  const { supabase } = await requireUser();
  if (!["new", "replied", "won", "dismissed"].includes(status)) return;
  await supabase.from("leads").update({ status }).eq("id", id);
  refresh();
}

export async function deleteLead(id: string) {
  const { supabase } = await requireUser();
  const { data: lead } = await supabase.from("leads").select("image_path").eq("id", id).single();
  if (!lead) return;
  if (lead.image_path) await supabase.storage.from("documents").remove([lead.image_path]);
  await supabase.from("leads").delete().eq("id", id);
  refresh();
  redirect("/dashboard/leads");
}

// The client said yes to talking: the lead becomes an order and the worker goes straight to a quote for it.
export async function leadToQuote(id: string) {
  const { supabase, user } = await requireUser();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).single<Lead>();
  if (!lead) return;

  let orderId = lead.order_id;
  if (!orderId) {
    const { data: order } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        title: short(lead.title, 200) || "Nieuwe opdracht",
        client_name: lead.client_name,
        address: lead.city,
      })
      .select("id")
      .single();
    orderId = order?.id ?? null;
  }
  await supabase.from("leads").update({ status: "won", order_id: orderId }).eq("id", id);
  refresh();
  redirect(orderId ? `/dashboard/quotes?order=${orderId}` : "/dashboard/quotes");
}

export async function saveLeadRegions(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({
      trade: short(formData.get("trade"), 100) || null,
      lead_regions: short(formData.get("lead_regions"), 300) || null,
    })
    .eq("id", user.id);
  refresh();
}
