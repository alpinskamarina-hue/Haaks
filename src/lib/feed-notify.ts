import type { SupabaseClient } from "@supabase/supabase-js";
import { escapeHtml, sendEmail } from "@/lib/email";
import { feedScore, feedText, sourceLabel, tradeLabel, workerRegions, workerTrades, type FeedItem } from "@/lib/feed";
import { fill, getFeedDict } from "@/lib/feed-i18n";
import { FIT_SCORE } from "@/lib/feed-server";
import { isLang, type Lang } from "@/lib/i18n";
import { sendTelegram } from "@/lib/telegram";

type Recipient = {
  id: string;
  language: string;
  trade: string | null;
  city: string | null;
  lead_regions: string | null;
  plan: "free" | "pro";
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
  const { data: rows, error } = await supabase.from("feed_items").select("*").returns<Row[]>();
  if (error) throw new Error(error.message);
  return (rows ?? [])
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

function fittingJobs(
  person: Pick<Recipient, "id" | "trade" | "city" | "lead_regions" | "plan">,
  items: RecentItem[],
  skip: Set<string>,
  now: number,
) {
  const trades = workerTrades(person.trade);
  const regions = workerRegions(person.lead_regions ?? person.city);
  return items
    .filter((item) => !skip.has(`${person.id}:${item.id}`))
    .filter((item) => person.plan === "pro" || now - item.published >= DAY)
    .map((item) => ({ item, score: feedScore(item, trades, regions) }))
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
      .select("id, language, trade, city, lead_regions, plan, feed_email, notify_email")
      .in("feed_email", modes)
      .not("notify_email", "is", null)
      .returns<Recipient[]>(),
    loadRecentItems(supabase, now),
  ]);
  if (peopleError) throw new Error(peopleError.message);

  const recipients = (people ?? []).filter((p) => mode === "daily" || p.plan === "pro");
  if (!recipients.length || !items.length) return { recipients: recipients.length, sent: 0, failed: 0 };
  const skip = await alreadyHandled(supabase, "email", recipients.map((p) => p.id));

  let sent = 0;
  let failed = 0;
  for (const person of recipients) {
    const pro = person.plan === "pro";
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
<p style="font-size:12px;color:#94a3b8;margin-top:24px">${escapeHtml(f.mailFooter)} <a href="${feedUrl}#notify" style="color:#94a3b8">${feedUrl}#notify</a></p>
</div></body></html>`;

  const text = [
    f.mailIntro,
    "",
    ...blocks.flatMap((b) => [`${b.title} (${b.score}%)`, b.meta.join(" · "), b.summary, ...(b.contact ? [b.contact] : []), ""]),
    ...(pro ? [] : [f.mailLocked, ""]),
    `${f.mailOpen}: ${feedUrl}`,
    "",
    `${f.mailFooter} ${feedUrl}#notify`,
  ].join("\n");

  return { subject, html, text };
}

type TelegramRecipient = Pick<Recipient, "id" | "language" | "trade" | "city" | "lead_regions" | "plan"> & {
  telegram_chat_id: number;
};

// Telegram alerts for Pro workers who linked the bot: each new fitting job once.
// Up to 3 jobs go as separate messages; more go as one list, so a worker is never flooded.
export async function sendFeedTelegram(supabase: SupabaseClient, siteUrl: string) {
  const now = Date.now();
  const [{ data: people, error }, items] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, language, trade, city, lead_regions, plan, telegram_chat_id")
      .eq("plan", "pro")
      .not("telegram_chat_id", "is", null)
      .returns<TelegramRecipient[]>(),
    loadRecentItems(supabase, now),
  ]);
  if (error) throw new Error(error.message);
  const recipients = people ?? [];
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
