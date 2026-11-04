"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { aiAllowed } from "@/lib/free-limits";
import { isPaid } from "@/lib/plans";
import { analyzeLead } from "@/lib/extract";
import { feedScore, feedText, tradeLabel, workerMatch, type FeedItem } from "@/lib/feed";
import { isLang, type Lang } from "@/lib/i18n";
import { siteUrl } from "@/lib/lang";
import { replyTemplate } from "@/lib/leads";
import { short } from "@/lib/quotes";
import { CATALOG_DAYS } from "@/lib/job-replies";
import { getFeedDict } from "@/lib/feed-i18n";
import { sendPush, type PushSubscriptionRow } from "@/lib/push";
import { botUsername, ensureWebhook, telegramEnabled } from "@/lib/telegram";
import { loadWorkspace } from "@/lib/workspace";

function refresh() {
  revalidatePath("/dashboard", "layout");
}

export async function hideFeedItem(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("feed_actions").upsert({ user_id: user.id, item_id: id, action: "hidden" });
  refresh();
}

export async function unhideFeedItem(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("feed_actions").delete().eq("user_id", user.id).eq("item_id", id).eq("action", "hidden");
  refresh();
}

// Free plan: open one card in full. The database checks the limit of free opens.
export async function unlockFeedItem(id: string) {
  const { supabase } = await requireUser();
  await supabase.rpc("unlock_feed_item", { p_item: id });
  refresh();
}

// "Reply" to a company job: the company sees the worker's profile; contacts open when it accepts.
export async function replyToCompanyJob(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("reply_to_job", { p_item: id });
  if (error) console.error("Reply to company job failed", error.message);
  refresh();
}

// "Reply": the job becomes one of the worker's leads, with a Dutch reply, and the lead page opens.
export async function takeFeedItem(id: string) {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("user_id", user.id)
    .eq("feed_item_id", id)
    .maybeSingle();
  if (existing) redirect(`/dashboard/leads/${existing.id}`);

  // Through feed_for_me(), so a free worker cannot take a job that is still locked for them.
  const [{ data }, { data: places }] = await Promise.all([
    supabase.rpc("feed_for_me").eq("id", id),
    supabase.rpc("feed_places").eq("id", id),
  ]);
  const row = ((data ?? []) as FeedItem[]).find((i) => i.id === id);
  const place = ((places ?? []) as Pick<FeedItem, "id" | "lat" | "lng" | "region">[]).find((p) => p.id === id);
  const item = row && { ...row, ...place };
  if (!item || item.locked || !item.source) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, full_name, company_name, trade, trades, city, lead_regions, home_lat, home_lng, travel_km, extra_cities, passport_token, passport_enabled")
    .eq("id", user.id)
    .single();
  const lang: Lang = isLang(profile?.language) ? profile.language : "en";
  const passportUrl = profile?.passport_enabled ? `${await siteUrl()}/p/${profile.passport_token}` : null;
  const name = profile?.company_name || profile?.full_name || null;
  const { title, summary } = feedText(item, lang);
  const original = [item.title, item.summary, item.city, item.timing, item.budget].filter(Boolean).join("\n");

  let reply = replyTemplate({ name, passportUrl });
  let reason: string | null = null;
  let aiStatus: "done" | "skipped" = "skipped";
  if (await aiAllowed(supabase)) {
    try {
      const result = await analyzeLead({
        text: original,
        image: null,
        worker: {
          name,
          trade: profile?.trade ?? null,
          city: profile?.city ?? null,
          regions: profile?.lead_regions ?? null,
        },
        passportUrl,
        lang,
      });
      if (result?.reply_nl) {
        reply = result.reply_nl;
        reason = result.match_reason;
        aiStatus = "done";
      }
    } catch (err) {
      console.error("Reply for feed job failed", err);
    }
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      user_id: user.id,
      source: item.source,
      source_name: item.source_name,
      source_url: item.source_url,
      raw_text: short(original, 8000),
      ai_status: aiStatus,
      is_job: true,
      title: short(title, 200),
      summary,
      trade: item.trades.map((tr) => tradeLabel(tr, lang)).join(", ") || null,
      city: item.city,
      client_contact: item.contact,
      timing: item.timing,
      match_score: feedScore(item, workerMatch(profile)),
      match_reason: reason,
      reply_nl: reply,
      feed_item_id: item.id,
    })
    .select("id")
    .single();
  if (error || !lead) {
    console.error("Lead from feed failed", error);
    return;
  }
  await supabase.from("feed_actions").upsert({ user_id: user.id, item_id: id, action: "taken" });
  refresh();
  redirect(`/dashboard/leads/${lead.id}`);
}

export async function saveFeedNotifications(formData: FormData) {
  const { supabase, user } = await requireUser();
  const mode = String(formData.get("feed_email") ?? "off");
  const { data: profile } = await supabase.from("profiles").select("plan, plan_until").eq("id", user.id).single();
  const allowed = isPaid(profile) ? ["off", "daily", "instant"] : ["off", "daily"];
  const email = short(formData.get("notify_email"), 200).trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  await supabase
    .from("profiles")
    .update({
      feed_email: allowed.includes(mode) && (mode === "off" || validEmail || user.email) ? mode : "off",
      notify_email: validEmail ?? user.email ?? null,
    })
    .eq("id", user.id);
  refresh();
  redirect("/dashboard/settings?saved=1#notify");
}

// Saves a one-time code and opens the Haaks bot with it; the bot links the chat (api/telegram/webhook).
export async function connectTelegram() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("plan, plan_until").eq("id", user.id).single();
  if (!isPaid(profile) || !telegramEnabled()) redirect("/dashboard/settings#telegram");
  const code = randomBytes(16).toString("hex");
  const { error } = await supabase.from("profiles").update({ telegram_link_code: code }).eq("id", user.id);
  if (error) {
    console.error("Telegram link code failed", error);
    redirect("/dashboard/settings#telegram");
  }
  await ensureWebhook(await siteUrl());
  redirect(`https://t.me/${await botUsername()}?start=${code}`);
}

export async function disconnectTelegram() {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ telegram_chat_id: null, telegram_link_code: null }).eq("id", user.id);
  refresh();
  redirect("/dashboard/settings#telegram");
}

// Push notifications: the phone's subscription, saved for the signed-in worker.
export async function savePushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const { supabase, user } = await requireUser();
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, user_id: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
  if (error) console.error("Saving push subscription failed", error);
  return { ok: !error };
}

export async function removePushSubscription(endpoint: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
  return { ok: true };
}

// "Check": a test notification to the worker's own phones.
export async function sendTestPush() {
  const { supabase, user, lang } = await loadWorkspace();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, user_id, p256dh, auth")
    .eq("user_id", user.id)
    .returns<PushSubscriptionRow[]>();
  const f = getFeedDict(lang);
  let ok = false;
  for (const sub of subs ?? []) {
    const result = await sendPush(sub, { title: "Haaks", body: f.pushTestBody, url: `${await siteUrl()}/dashboard/leads/feed`, tag: "haaks-test" });
    if (result.ok) ok = true;
    else if (result.gone) await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  }
  return { ok };
}

// "Looking for work": the builder shows or hides their profile in the company catalog.
// "Looking for work": on (or extended) for 30 days, then it switches itself off.
export async function setInCatalog(on: boolean) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({ in_catalog: on, catalog_until: on ? new Date(Date.now() + CATALOG_DAYS * 24 * 60 * 60 * 1000).toISOString() : null })
    .eq("id", user.id);
  refresh();
}

// A builder reports a job in the feed, or a company reports a builder card.
export async function reportTarget(formData: FormData) {
  const { supabase } = await requireUser();
  const kind = formData.get("kind") === "worker" ? "worker" : "job";
  const { error } = await supabase.rpc("report", {
    p_kind: kind,
    p_target: String(formData.get("target")),
    p_reason: String(formData.get("reason") ?? "other"),
  });
  if (error) console.error("Report failed", error.message);
  revalidatePath(kind === "worker" ? "/company/builders" : "/dashboard/leads/feed");
}

// The builder accepts or declines a company's invitation; accepting opens contacts on both sides.
export async function decideInvite(id: string, accept: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("decide_invite", { p_invite: id, p_accept: accept });
  if (error) console.error("Deciding an invitation failed", error.message);
  refresh();
}
