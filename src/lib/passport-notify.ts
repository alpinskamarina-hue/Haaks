import type { SupabaseClient } from "@supabase/supabase-js";
import { getDict, isLang, type Lang } from "@/lib/i18n";
import { getPassportNotifyDict } from "@/lib/passport-notify-i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { dutchToday } from "@/lib/quotes";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const LOCALES: Record<Lang, string> = { pl: "pl-PL", ro: "ro-RO", uk: "uk-UA", ru: "ru-RU", tr: "tr-TR", en: "en-GB", nl: "nl-NL" };
const PATH = "/dashboard/passport";

type Worker = { id: string; language: string | null; telegram_chat_id: number | null };

// Phone push to every device of the builder, plus Telegram when it is connected.
async function tell(server: SupabaseClient, worker: Worker, site: string, msg: { title: string; body: string; tag: string; button: string }) {
  let sent = false;
  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", worker.id)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title: msg.title, body: msg.body, url: PATH, tag: msg.tag });
      if (result.ok) sent = true;
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && worker.telegram_chat_id) {
    await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(msg.title)}</b>\n${esc(msg.body)}`, { text: msg.button, url: `${site}${PATH}` });
    sent = true;
  }
  return sent;
}

const langOf = (w: Worker): Lang => (isLang(w.language) ? w.language : "en");

// Daily: documents that expire in 30 days, in 7 days, or expired in the last days get one message
// per stage. A document uploaded already close to its end gets only the stage it is in.
export async function sendDocReminders(server: SupabaseClient, site: string) {
  const today = dutchToday();
  const day = (offset: number) => new Date(Date.parse(`${today}T00:00:00Z`) + offset * 864e5).toISOString().slice(0, 10);
  const { data: docs } = await server
    .from("documents")
    .select("id, user_id, doc_type, expires_on")
    .gte("expires_on", day(-2))
    .lte("expires_on", day(30))
    .limit(2000);
  if (!docs?.length) return { checked: 0, sent: 0 };

  const ids = docs.map((d) => d.id as string);
  const { data: done } = await server.from("doc_reminders").select("document_id, stage").in("document_id", ids);
  const already = new Set((done ?? []).map((r) => `${r.document_id}:${r.stage}`));
  const { data: workers } = await server
    .from("profiles")
    .select("id, language, telegram_chat_id")
    .in("id", [...new Set(docs.map((d) => d.user_id as string))])
    .returns<Worker[]>();
  const byId = new Map((workers ?? []).map((w) => [w.id, w]));

  let sent = 0;
  for (const doc of docs) {
    const left = Math.round((Date.parse(`${doc.expires_on}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5);
    const stage = left <= 0 ? 0 : left <= 7 ? 7 : 30;
    const worker = byId.get(doc.user_id as string);
    if (!worker || already.has(`${doc.id}:${stage}`)) continue;
    // Log first, so a failed or slow send never turns into a second message tomorrow.
    const { error } = await server.from("doc_reminders").insert({ document_id: doc.id, stage });
    if (error) continue;
    const lang = langOf(worker);
    const t = getPassportNotifyDict(lang);
    const docName = getDict(lang)[`docType_${doc.doc_type as "vca"}`] ?? doc.doc_type;
    const date = new Intl.DateTimeFormat(LOCALES[lang], { day: "numeric", month: "long", timeZone: "UTC" }).format(
      new Date(`${doc.expires_on}T00:00:00Z`),
    );
    const ok = await tell(server, worker, site, {
      title: fill(stage === 0 ? t.todayTitle : t.soonTitle, { doc: docName }),
      body: stage === 0 ? t.todayBody : fill(t.soonBody, { date, n: left }),
      tag: `doc-${doc.id}`,
      button: t.open,
    });
    if (ok) sent++;
  }
  return { checked: docs.length, sent };
}

// Whether an opening now should ring the builder's phone: at most one message per 6 hours, so a
// contractor clicking around does not ring it ten times. Call before logging the new view.
export async function passportViewDue(server: SupabaseClient, profileId: string) {
  const { data: last } = await server
    .from("passport_views")
    .select("viewed_at")
    .eq("profile_id", profileId)
    .order("viewed_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ viewed_at: string }>();
  return !last || Date.now() - Date.parse(last.viewed_at) >= 6 * 3600e3;
}

// The passport link was opened by someone else.
export async function notifyPassportViewed(server: SupabaseClient, profileId: string, site: string) {
  const { data: worker } = await server.from("profiles").select("id, language, telegram_chat_id").eq("id", profileId).maybeSingle<Worker>();
  if (!worker) return false;
  const t = getPassportNotifyDict(langOf(worker));
  return tell(server, worker, site, { title: t.viewTitle, body: t.viewBody, tag: "passport-view", button: t.open });
}
