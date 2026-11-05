import type { SupabaseClient } from "@supabase/supabase-js";
import { escapeHtml, sendEmail } from "@/lib/email";
import { feedScore, feedText, sourceLabel, tradeLabel, workerMatch, type FeedItem } from "@/lib/feed";
import { fill, getFeedDict } from "@/lib/feed-i18n";
import { FIT_SCORE } from "@/lib/feed-server";
import { isLang, type Lang } from "@/lib/i18n";
import { isPaid } from "@/lib/plans";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { sendTelegram } from "@/lib/telegram";

type Recipient = {
  id: string;
  language: string;
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
  feed_email: "daily" | "instant";
  notify_email: string;
};

type Row = Omit<FeedItem, "locked" | "published_at"> & {
  published_at: string | null;
  demo_age: string | null;
  expires_at: string | null;
  created_at: string;
};

const DAY = 24 * 60 * 60 * 1000;

// Postgres interval text such as "00:12:00" or "2 days 02:00:00" -> milliseconds.
function intervalMs(value: string | null) {
  if (!value) return 0;
  const days = Number(value.match(/(\d+) days?/)?.[1] ?? 0);
  const [h = "0", m = "0", s = "0"] = (value.match(/(\d+):(\d+):(\d+)/)?.slice(1) ?? []) as string[];
  return ((days * 24 + Number(h)) * 60 + Number(m)) * 60000 + Number(s) * 1000;
}

async function loadRecentItems(supabase: SupabaseClient, now: number) {
  // The whole country is collected now: read only the last days, page by page (1000 rows a page).
  const from = new Date(now - 4 * DAY).toISOString();
  const rows: Row[] = [];
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabase
      .from("feed_items")
      .select("*")
      .or(`published_at.gte.${from},published_at.is.null`)
      .order("created_at", { ascending: false })
      .range(page * 1000, page * 1000 + 999)
      .returns<Row[]>();
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return rows
    .map((row) => ({ ...row, published: row.published_at ? Date.parse(row.published_at) : now - intervalMs(row.demo_age) }))
    .filter((row) => now - row.published < 3 * DAY)
    // Expired jobs (and the old example jobs, switched off by setting expires_at) are never sent.
    .filter((row) => !row.expires_at || Date.parse(row.expires_at) > now);
}

type RecentItem = Awaited<ReturnType<typeof loadRecentItems>>[number];

// Jobs already sent on this channel, or hidden/taken by the worker: "user:item" keys.
async function alreadyHandled(supabase: SupabaseClient, channel: "email" | "telegram", ids: string[]) {
  const [{ data: done }, { data: actions }] = await Promise.all([
    supabase.from("feed_notifications").select("user_id, item_id").eq("channel", channel).in("user_id", ids),
    supabase.from("feed_actions").select("user_id, item_id").in("user_id", ids),
  ]);
  return new Set([...(done ?? []), ...(actions ?? [])].map((r) => `${r.user_id}:${r.item_id}`));
}

type MatchKeys = "trade" | "trades" | "city" | "lead_regions" | "home_lat" | "home_lng" | "travel_km" | "extra_cities";
const MATCH_COLUMNS = "trade, trades, city, lead_regions, home_lat, home_lng, travel_km, extra_cities";

function fittingJobs(
  person: Pick<Recipient, MatchKeys | "id" | "plan" | "plan_until">,
  items: RecentItem[],
  skip: Set<string>,
  now: number,
) {
  const match = workerMatch(person);
  return items
    .filter((item) => !skip.has(`${person.id}:${item.id}`))
    .filter((item) => isPaid(person) || now - item.published >= DAY)
    .map((item) => ({ item, score: feedScore(item, match) }))
    .filter((j) => j.score >= FIT_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

// E-mails new fitting jobs to every worker who switched alerts on.
// "daily": the digest from the daily cron. "instant": called after new jobs come in;
// only Pro workers with instant alerts get those.
// Each job goes to each worker once (feed_notifications), and a free worker only
// gets jobs older than 24 hours, without contacts, just like in the cabinet.
export async function sendFeedEmails(supabase: SupabaseClient, mode: "daily" | "instant", siteUrl: string) {
  const now = Date.now();
  const modes = mode === "daily" ? ["daily", "instant"] : ["instant"];
  const [{ data: people, error: peopleError }, items] = await Promise.all([
    supabase
      .from("profiles")
      .select(`id, language, ${MATCH_COLUMNS}, plan, plan_until, feed_email, notify_email`)
      .in("feed_email", modes)
      .not("notify_email", "is", null)
      .returns<Recipient[]>(),
    loadRecentItems(supabase, now),
  ]);
  if (peopleError) throw new Error(peopleError.message);

  const recipients = (people ?? []).filter((p) => mode === "daily" || isPaid(p));
  if (!recipients.length || !items.length) return { recipients: recipients.length, sent: 0, failed: 0 };
  const skip = await alreadyHandled(supabase, "email", recipients.map((p) => p.id));

  let sent = 0;
  let failed = 0;
  for (const person of recipients) {
    const pro = isPaid(person);
    const jobs = fittingJobs(person, items, skip, now);
    if (!jobs.length) continue;

    const lang: Lang = isLang(person.language) ? person.language : "en";
    const mail = feedEmail(
      jobs.map((j) => ({ ...j.item, locked: false, published_at: new Date(j.item.published).toISOString(), score: j.score })),
      lang,
      pro,
      siteUrl,
    );
    const result = await sendEmail({ to: person.notify_email, ...mail });
    if (!result.ok) {
      failed++;
      console.error("Feed e-mail failed", person.id, result.error);
      continue;
    }
    sent++;
    await supabase
      .from("feed_notifications")
      .insert(jobs.map((j) => ({ user_id: person.id, item_id: j.item.id, channel: "email" })));
  }
  return { recipients: recipients.length, sent, failed };
}

export function feedEmail(jobs: (FeedItem & { score: number })[], lang: Lang, pro: boolean, siteUrl: string) {
  const f = getFeedDict(lang);
  const feedUrl = `${siteUrl}/dashboard/leads/feed`;
  const first = feedText(jobs[0], lang).title;
  const subject = jobs.length === 1 ? fill(f.mailSubjectInstant, { title: first }) : fill(f.mailSubjectDaily, { n: jobs.length });

  const blocks = jobs.map((job) => {
    const { title, summary } = feedText(job, lang);
    const source = sourceLabel(job);
    const meta = [
      source,
      job.city && !source.includes(job.city) ? job.city : null,
      job.trades.map((t) => tradeLabel(t, lang)).join(", "),
      job.timing,
      job.budget,
      job.is_demo ? f.demoBadge : null,
    ].filter(Boolean) as string[];
    return { title, summary, meta, contact: pro ? job.contact : null, score: job.score };
  });

  const html = `<!doctype html><html lang="${lang}"><body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<p style="font-size:20px;font-weight:700;margin:0 0 4px"><span style="display:inline-block;background:#ea580c;color:#fff;border-radius:8px;padding:2px 9px;margin-right:6px">H</span>Haaks</p>
<p style="color:#475569;margin:12px 0 16px">${escapeHtml(f.mailIntro)}</p>
${blocks
  .map(
    (b) => `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-bottom:10px">
<p style="margin:0;font-size:12px;color:#64748b">${escapeHtml(b.meta.join(" · "))} · <b style="color:#166534">${b.score}%</b></p>
<p style="margin:6px 0 4px;font-weight:600">${escapeHtml(b.title)}</p>
<p style="margin:0;font-size:14px;color:#334155">${escapeHtml(b.summary)}</p>
${b.contact ? `<p style="margin:6px 0 0;font-size:14px;color:#475569">${escapeHtml(b.contact)}</p>` : ""}
</div>`,
  )
  .join("\n")}
${pro ? "" : `<p style="font-size:14px;color:#9a3412;margin:14px 0">${escapeHtml(f.mailLocked)}</p>`}
<p style="margin:18px 0"><a href="${feedUrl}" style="background:#ea580c;color:#fff;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:10px;display:inline-block">${escapeHtml(f.mailOpen)}</a></p>
<p style="font-size:12px;color:#94a3b8;margin-top:24px">${escapeHtml(f.mailFooter)} <a href="${siteUrl}/dashboard/settings#notify" style="color:#94a3b8">${siteUrl}/dashboard/settings#notify</a></p>
</div></body></html>`;

  const text = [
    f.mailIntro,
    "",
    ...blocks.flatMap((b) => [`${b.title} (${b.score}%)`, b.meta.join(" · "), b.summary, ...(b.contact ? [b.contact] : []), ""]),
    ...(pro ? [] : [f.mailLocked, ""]),
    `${f.mailOpen}: ${feedUrl}`,
    "",
    `${f.mailFooter} ${siteUrl}/dashboard/settings#notify`,
  ].join("\n");

  return { subject, html, text };
}

type TelegramRecipient = Pick<Recipient, MatchKeys | "id" | "language" | "plan" | "plan_until"> & {
  telegram_chat_id: number;
};

// Telegram alerts for Pro workers who linked the bot: each new fitting job once.
// Up to 3 jobs go as separate messages; more go as one list, so a worker is never flooded.
export async function sendFeedTelegram(supabase: SupabaseClient, siteUrl: string) {
  const now = Date.now();
  const [{ data: people, error }, items] = await Promise.all([
    supabase
      .from("profiles")
      .select(`id, language, ${MATCH_COLUMNS}, plan, plan_until, telegram_chat_id`)
      .in("plan", ["pro", "ultra"])
      .not("telegram_chat_id", "is", null)
      .returns<TelegramRecipient[]>(),
    loadRecentItems(supabase, now),
  ]);
  if (error) throw new Error(error.message);
  const recipients = (people ?? []).filter((p) => isPaid(p));
  if (!recipients.length || !items.length) return { recipients: recipients.length, sent: 0, failed: 0 };
  const skip = await alreadyHandled(supabase, "telegram", recipients.map((p) => p.id));
  const feedUrl = `${siteUrl}/dashboard/leads/feed`;

  let sent = 0;
  let failed = 0;
  for (const person of recipients) {
    const jobs = fittingJobs(person, items, skip, now);
    if (!jobs.length) continue;
    const lang: Lang = isLang(person.language) ? person.language : "en";
    const f = getFeedDict(lang);
    const texts = jobs.map((j) => telegramJob({ ...j.item, locked: false, published_at: "", score: j.score }, lang));
    const messages = texts.length <= 3 ? texts : [[`<b>${escapeHtml(fill(f.tgDigest, { n: texts.length }))}</b>`, ...texts].join("\n\n")];

    let ok = true;
    for (const text of messages) {
      const result = await sendTelegram(person.telegram_chat_id, text, { text: f.tgOpen, url: feedUrl });
      if (result.ok) continue;
      ok = false;
      console.error("Feed Telegram failed", person.id, result.status, result.error);
      // 403: the worker blocked the bot or deleted the chat. Stop sending there.
      if (result.status === 403) await supabase.rpc("unlink_telegram", { chat: person.telegram_chat_id });
      break;
    }
    if (!ok) {
      failed++;
      continue;
    }
    sent++;
    await supabase
      .from("feed_notifications")
      .insert(jobs.map((j) => ({ user_id: person.id, item_id: j.item.id, channel: "telegram" })));
  }
  return { recipients: recipients.length, sent, failed };
}

function telegramJob(job: FeedItem & { score: number }, lang: Lang) {
  const f = getFeedDict(lang);
  const { title, summary } = feedText(job, lang);
  const source = sourceLabel(job);
  const meta = [
    source,
    job.city && !source.includes(job.city) ? job.city : null,
    job.trades.map((t) => tradeLabel(t, lang)).join(", "),
    job.timing,
    job.budget,
    job.is_demo ? f.demoBadge : null,
  ].filter(Boolean) as string[];
  return [
    `🔨 <b>${escapeHtml(title)}</b> · ${job.score}%`,
    `<i>${escapeHtml(meta.join(" · "))}</i>`,
    escapeHtml(summary),
    ...(job.contact ? [`📞 ${escapeHtml(job.contact)}`] : []),
    ...(job.source_url ? [escapeHtml(job.source_url)] : []),
  ].join("\n");
}

type PushRecipient = Pick<Recipient, MatchKeys | "id" | "language" | "plan" | "plan_until"> & { feed_seen_at: string | null };

// Push notifications on the phone: new fitting jobs, once each, as one notification per
// worker ("4 new jobs for you"), with the number of unseen fitting jobs for the app icon.
// Free workers get jobs once they are 24 hours old, like everywhere else.
export async function sendFeedPush(supabase: SupabaseClient, siteUrl: string) {
  if (!pushEnabled()) return "not set up: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY";
  const now = Date.now();
  const { data: subs, error } = await supabase.from("push_subscriptions").select("endpoint, user_id, p256dh, auth").returns<PushSubscriptionRow[]>();
  if (error) throw new Error(error.message);
  const ids = [...new Set((subs ?? []).map((s) => s.user_id))];
  if (!ids.length) return { recipients: 0, sent: 0, failed: 0 };

  const [{ data: people, error: peopleError }, items, { data: done }, { data: actions }] = await Promise.all([
    supabase
      .from("profiles")
      .select(`id, language, ${MATCH_COLUMNS}, plan, plan_until, feed_seen_at`)
      .in("id", ids)
      .returns<PushRecipient[]>(),
    loadRecentItems(supabase, now),
    supabase.from("push_sent").select("user_id, item_id").in("user_id", ids),
    supabase.from("feed_actions").select("user_id, item_id").in("user_id", ids),
  ]);
  if (peopleError) throw new Error(peopleError.message);
  const skip = new Set([...(done ?? []), ...(actions ?? [])].map((r) => `${r.user_id}:${r.item_id}`));
  const feedUrl = `${siteUrl}/dashboard/leads/feed`;

  let sent = 0;
  let failed = 0;
  for (const person of people ?? []) {
    const jobs = fittingJobs(person, items, skip, now);
    if (!jobs.length) continue;
    const lang: Lang = isLang(person.language) ? person.language : "en";
    const f = getFeedDict(lang);
    // Unseen fitting jobs (since the worker last opened the feed) for the number on the icon.
    const seen = person.feed_seen_at ? Date.parse(person.feed_seen_at) : now - DAY;
    const match = workerMatch(person);
    const unseen = items.filter(
      (i) => Date.parse(i.created_at) > seen && feedScore(i, match) >= FIT_SCORE && !skip.has(`${person.id}:${i.id}`),
    ).length;
    const first = feedText({ ...jobs[0].item, locked: false, published_at: "" }, lang).title;
    const message = {
      title: "Haaks",
      body: jobs.length === 1 ? fill(f.pushOne, { title: first }) : fill(f.pushMany, { n: jobs.length, title: first }),
      url: feedUrl,
      count: Math.max(unseen, jobs.length),
    };
    let delivered = false;
    for (const sub of (subs ?? []).filter((s) => s.user_id === person.id)) {
      const result = await sendPush(sub, message);
      if (result.ok) delivered = true;
      else if (result.gone) await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      else console.error("Feed push failed", person.id, result.status);
    }
    if (!delivered) {
      failed++;
      continue;
    }
    sent++;
    await supabase.from("push_sent").insert(jobs.map((j) => ({ user_id: person.id, item_id: j.item.id })));
  }
  return { recipients: people?.length ?? 0, sent, failed };
}
