import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { claudeEnabled } from "@/lib/env";
import { feedText, type FeedItem } from "@/lib/feed";
import { alreadyHandled, fittingJobs, loadRecentItems, MATCH_COLUMNS } from "@/lib/feed-notify";
import { LANG_NAMES, isLang, type Lang } from "@/lib/i18n";
import { planOf } from "@/lib/plans";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { dutchToday } from "@/lib/quotes";
import { staffOf } from "@/lib/staff";
import { getStaffDict } from "@/lib/staff-i18n";

// «Сотрудник работает с лентой», step 1: the digital employee of every Ultra worker brings new
// fitting jobs into the chat, each with why it fits and a ready Dutch reply. Nothing is sent
// to anyone without the worker's tap. Runs from a cron and from the «check now» button.
const MODEL = "claude-haiku-5-5";
let client: Anthropic | null = null;

const Card = z.object({ why: z.string(), draft_nl: z.string(), meaning: z.string() });

export type StaffJob = { title: string; kind: FeedItem["kind"]; source: FeedItem["source"]; city: string | null; budget: string | null; url: string | null };

type Worker = {
  id: string;
  language: string | null;
  trade: string | null;
  trades: string[] | null;
  city: string | null;
  lead_regions: string | null;
  home_lat: number | null;
  home_lng: number | null;
  travel_km: number | null;
  extra_cities: string[] | null;
  plan: string;
  plan_until: string | null;
  full_name: string | null;
  company_name: string | null;
  passport_enabled: boolean | null;
  passport_token: string | null;
  staff_face: number | null;
  staff_name: string | null;
  staff_formal: boolean | null;
  staff_style: string | null;
  staff_lang: string | null;
  staff_feed_max: number;
  staff_feed_kinds: string[];
};

async function draftCard(w: Worker, item: FeedItem, lang: Lang, passportUrl: string | null) {
  client ??= new Anthropic();
  const nl = feedText(item, "nl");
  const first = w.full_name?.split(" ")[0] ?? "";
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1200,
    output_config: { format: zodOutputFormat(Card) },
    system: [
      "You are the digital office employee of a self-employed construction worker (ZZP) in the Netherlands.",
      "You found a job in the job feed. Write: why = one or two short sentences for the worker on why this job fits and what to watch out for;",
      "draft_nl = a short, polite reply in Dutch from the worker in first person, ready to send to the client or company (max 600 characters):",
      "greet, say what you can do, propose to come and look or to call, ask at most two key questions, sign with the worker's first name.",
      "Never name a price, an hourly rate or a start date. Never invent experience, certificates or facts not given.",
      passportUrl ? `End with: "Mijn gegevens en certificaten: ${passportUrl}".` : "",
      `meaning = one line in ${LANG_NAMES[lang]} saying what the Dutch reply says. Write why and meaning in ${LANG_NAMES[lang]}.`,
    ].join(" "),
    messages: [
      {
        role: "user",
        content: [
          `Worker: ${w.full_name ?? "?"}${w.company_name ? ` (${w.company_name})` : ""}, first name ${first || "?"}. Trades: ${(w.trades ?? [w.trade]).filter(Boolean).join(", ") || "?"}. Home: ${w.city ?? "?"}.`,
          `Job kind: ${item.kind}, source: ${item.source ?? "?"}. City: ${item.city ?? "?"}. Timing: ${item.timing ?? "?"}. Budget: ${item.budget ?? "?"}.`,
          `Title: ${nl.title}`,
          `Description: ${nl.summary.slice(0, 2000)}`,
        ].join("\n"),
      },
    ],
  });
  return response.parsed_output ?? null;
}

const PUSH: Record<Lang, string> = {
  ru: "{name}: новые заказы для вас ({n})",
  uk: "{name}: нові замовлення для вас ({n})",
  pl: "{name}: nowe zlecenia dla Ciebie ({n})",
  ro: "{name}: lucrări noi pentru tine ({n})",
  tr: "{name}: size yeni işler ({n})",
  en: "{name}: new jobs for you ({n})",
  nl: "{name}: nieuwe klussen voor u ({n})",
};

export async function runStaffFeed(server: SupabaseClient, site: string, only?: { userId: string; limit: number }) {
  const now = Date.now();
  let query = server
    .from("profiles")
    .select(
      `id, language, ${MATCH_COLUMNS}, plan, plan_until, full_name, company_name, passport_enabled, passport_token, staff_face, staff_name, staff_formal, staff_style, staff_lang, staff_feed_max, staff_feed_kinds`,
    )
    .eq("plan", "ultra")
    .eq("staff_feed", true);
  if (only) query = query.eq("id", only.userId);
  const { data: people, error } = await query.returns<Worker[]>();
  if (error) throw new Error(error.message);
  const workers = (people ?? []).filter((p) => planOf(p) === "ultra");
  if (!workers.length) return { workers: 0, cards: 0 };

  const ids = workers.map((w) => w.id);
  const dayStart = new Date(`${dutchToday()}T00:00:00+01:00`).toISOString();
  const [items, skip, { data: today }, { data: subs }] = await Promise.all([
    loadRecentItems(server, now),
    alreadyHandled(server, "staff", ids),
    server.from("feed_notifications").select("user_id").eq("channel", "staff").gte("sent_at", dayStart).in("user_id", ids),
    pushEnabled() ? server.from("push_subscriptions").select("endpoint, user_id, p256dh, auth").in("user_id", ids).returns<PushSubscriptionRow[]>() : Promise.resolve({ data: [] as PushSubscriptionRow[] }),
  ]);
  const sentToday = new Map<string, number>();
  for (const r of today ?? []) sentToday.set(r.user_id, (sentToday.get(r.user_id) ?? 0) + 1);

  let cards = 0;
  for (const w of workers) {
    const room = only ? only.limit : Math.max(0, w.staff_feed_max - (sentToday.get(w.id) ?? 0));
    if (!room) continue;
    const jobs = fittingJobs(w, items, skip, now)
      .filter((j) => w.staff_feed_kinds.includes(j.item.kind))
      .slice(0, room);
    if (!jobs.length) continue;
    const settings = staffOf(w);
    const appLang: Lang = isLang(w.language) ? w.language : "en";
    const lang: Lang = isLang(settings.lang) ? settings.lang : appLang;
    const passportUrl = w.passport_enabled && w.passport_token ? `${site}/p/${w.passport_token}` : null;

    let made = 0;
    for (const { item } of jobs) {
      const feedItem = { ...item, locked: false, published_at: new Date(item.published).toISOString() } as FeedItem;
      const card = claudeEnabled() ? await draftCard(w, feedItem, lang, passportUrl).catch((e) => (console.error("staff-feed: AI failed", e instanceof Error ? e.message : e), null)) : null;
      const job: StaffJob = { title: feedText(feedItem, lang).title, kind: item.kind, source: item.source, city: item.city, budget: item.budget, url: item.source_url };
      const { error: insertError } = await server.from("staff_messages").insert({
        user_id: w.id,
        role: "staff",
        body: card ? `${card.why}\n\n${card.meaning}` : "",
        draft: card?.draft_nl.slice(0, 2000) ?? null,
        feed_item_id: item.id,
        job,
        job_status: "new",
      });
      if (insertError) {
        console.error("staff-feed: insert failed", insertError.message);
        continue;
      }
      await server.from("feed_notifications").insert({ user_id: w.id, item_id: item.id, channel: "staff" });
      made++;
    }
    cards += made;
    if (made && !only) {
      const text = PUSH[lang].replace("{name}", settings.name).replace("{n}", String(made));
      for (const sub of (subs ?? []).filter((s) => s.user_id === w.id)) {
        await sendPush(sub, { title: getStaffDict(lang).nav, body: text, url: "/dashboard/staff", tag: "staff-feed" }).catch(() => null);
      }
    }
  }
  return { workers: workers.length, cards };
}
