"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { analyzeLead } from "@/lib/extract";
import { isLang, type Lang } from "@/lib/i18n";
import { siteUrl } from "@/lib/lang";
import type { FeedItem } from "@/lib/feed";
import { findContact, replyTemplate, type Lead } from "@/lib/leads";
import { createQuoteDraft } from "@/lib/quote-draft";
import { PHOTO_MIME, short } from "@/lib/quotes";
import { aiAllowed } from "@/lib/free-limits";

function refresh() {
  revalidatePath("/dashboard", "layout");
}

// The worker pastes a post from a group or chat (text and/or screenshot); Claude reads it.
export async function addLead(input: {
  text: string;
  image: { path: string; mimeType: string } | null;
}): Promise<{ id: string } | { error: true }> {
  const { supabase, user } = await requireUser();
  const text = short(input.text, 8000);
  const image =
    input.image && input.image.path.startsWith(`${user.id}/leads/`) && PHOTO_MIME.includes(input.image.mimeType)
      ? input.image
      : null;
  if (!text && !image) return { error: true };

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({ user_id: user.id, source: "manual", raw_text: text, image_path: image?.path ?? null })
    .select("id")
    .single();
  if (error || !lead) {
    console.error("Lead insert failed", error);
    return { error: true };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, full_name, company_name, trade, city, lead_regions, passport_token, passport_enabled")
    .eq("id", user.id)
    .single();
  const lang: Lang = isLang(profile?.language) ? profile.language : "en";
  const passportUrl = profile?.passport_enabled ? `${await siteUrl()}/p/${profile.passport_token}` : null;

  if (!(await aiAllowed(supabase))) {
    // No AI yet: still give the worker a contact and a ready Dutch reply.
    await supabase
      .from("leads")
      .update({
        ai_status: "skipped",
        title: short(text.split("\n").find((line) => line.trim()), 80) || null,
        client_contact: findContact(text),
        reply_nl: replyTemplate({ name: profile?.company_name || profile?.full_name || null, passportUrl }),
      })
      .eq("id", lead.id);
    refresh();
    return { id: lead.id };
  }

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
      passportUrl,
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
  if (!["new", "replied", "quoted", "won", "dismissed"].includes(status)) return;
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
  redirect("/dashboard/leads/feed");
}

// The client said yes to talking: the lead becomes an order and the worker goes straight to a quote for it.
// "Make offer": a draft quote filled from the job itself (title, city, client, the post),
// at the worker's hourly rate. The lead keeps a link to it and follows its status.
export async function leadToQuote(id: string) {
  const { supabase, user } = await requireUser();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).single<Lead>();
  if (!lead) return;
  if (lead.quote_id) {
    const { data: existing } = await supabase.from("quotes").select("id").eq("id", lead.quote_id).maybeSingle();
    if (existing) redirect(`/dashboard/quotes/${existing.id}`);
  }

  const { data: profile } = await supabase.from("profiles").select("language, hourly_rate").eq("id", user.id).single();
  const lang: Lang = isLang(profile?.language) ? profile.language : "en";
  const description = [lead.summary, lead.raw_text]
    .map((text) => (text ?? "").trim())
    .filter((text, i, all) => text && all.indexOf(text) === i)
    .join("\n\n");
  // A job from the feed has its title and summary in Dutch; the lead keeps the worker's
  // language. The client reads the offer, so it takes the Dutch ones.
  let dutch: { title: string | null; summary: string | null } | null = null;
  if (lead.feed_item_id) {
    const { data: items } = await supabase.rpc("feed_for_me");
    const item = ((items ?? []) as FeedItem[]).find((i) => i.id === lead.feed_item_id);
    if (item && !item.locked) dutch = { title: item.title, summary: item.summary };
  }
  const quoteId = await createQuoteDraft(supabase, user.id, lang, {
    orderId: lead.order_id,
    title: short(dutch?.title ?? lead.title, 200) || null,
    intro: dutch?.summary ?? null,
    clientName: lead.client_name,
    address: lead.city,
    description: short(description, 4000),
    photos: [],
    hourlyRate: Number(profile?.hourly_rate) || 0,
    vatRate: 21,
  });
  await supabase.from("leads").update({ quote_id: quoteId }).eq("id", id);
  refresh();
  revalidatePath("/dashboard/quotes", "layout");
  redirect(`/dashboard/quotes/${quoteId}`);
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
