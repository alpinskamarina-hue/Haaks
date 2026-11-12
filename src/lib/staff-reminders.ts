import type { SupabaseClient } from "@supabase/supabase-js";
import { isLang, type Lang } from "@/lib/i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

// Step 5c: reminders the digital employee sets («напомни в пятницу в 9 позвонить Jansen»).
const TZ = "Europe/Amsterdam";
// The staff cron runs once an hour, so a reminder goes out up to 30 minutes before or after its time.
const EARLY_MS = 30 * 60 * 1000;

const parts = (d: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "long", hourCycle: "h23" })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  ) as Record<string, string>;

// "2026-11-12 10:47, Thursday" in Dutch time, for the employee's prompt.
export function dutchNow(d = new Date()) {
  const p = parts(d);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}, ${p.weekday}`;
}

// "2026-11-14T09:00" in Dutch local time → the real moment (handles winter/summer time).
export function dutchLocalToDate(local: string): Date | null {
  const m = local.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Dutch offset at that moment: compare the same instant read back in Amsterdam time.
  const p = parts(new Date(asUtc));
  const back = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  const result = new Date(asUtc - (back - asUtc));
  return Number.isNaN(result.getTime()) ? null : result;
}

export const dutchTime = (iso: string) => {
  const p = parts(new Date(iso));
  return `${p.day}.${p.month} ${p.hour}:${p.minute}`;
};

const TITLE: Record<Lang, string> = {
  ru: "⏰ Напоминание",
  uk: "⏰ Нагадування",
  pl: "⏰ Przypomnienie",
  ro: "⏰ Memento",
  tr: "⏰ Hatırlatma",
  en: "⏰ Reminder",
  nl: "⏰ Herinnering",
};

type Due = { id: string; user_id: string; text: string };
type Person = { id: string; language: string | null; staff_lang: string | null; telegram_chat_id: number | string | null };

// Called by the hourly staff cron: sends every reminder that is due now.
export async function runStaffReminders(server: SupabaseClient, site: string) {
  const until = new Date(Date.now() + EARLY_MS).toISOString();
  const { data: due, error } = await server.from("staff_reminders").select("id, user_id, text").is("sent_at", null).lte("due_at", until).limit(300).returns<Due[]>();
  if (error) throw new Error(error.message);
  if (!due?.length) return { reminders: 0 };
  const ids = [...new Set(due.map((r) => r.user_id))];
  const [{ data: people }, { data: subs }] = await Promise.all([
    server.from("profiles").select("id, language, staff_lang, telegram_chat_id").in("id", ids).returns<Person[]>(),
    pushEnabled() ? server.from("push_subscriptions").select("endpoint, user_id, p256dh, auth").in("user_id", ids).returns<PushSubscriptionRow[]>() : Promise.resolve({ data: [] as PushSubscriptionRow[] }),
  ]);
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  let sent = 0;
  for (const r of due) {
    // Mark first, so a slow send never makes the same reminder go out twice.
    const { data: claimed } = await server.from("staff_reminders").update({ sent_at: new Date().toISOString() }).eq("id", r.id).is("sent_at", null).select("id");
    if (!claimed?.length) continue;
    const p = byId.get(r.user_id);
    const lang: Lang = isLang(p?.staff_lang) ? (p?.staff_lang as Lang) : isLang(p?.language) ? (p?.language as Lang) : "en";
    await server.from("staff_messages").insert({ user_id: r.user_id, role: "staff", body: `${TITLE[lang]}: ${r.text}` });
    for (const sub of (subs ?? []).filter((s) => s.user_id === r.user_id)) {
      await sendPush(sub, { title: TITLE[lang], body: r.text, url: "/dashboard/staff", tag: `staff-reminder-${r.id}` }).catch(() => null);
    }
    if (telegramEnabled() && p?.telegram_chat_id) {
      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      await sendTelegram(Number(p.telegram_chat_id), `<b>${TITLE[lang]}</b>\n${esc(r.text)}`, { text: "Haaks", url: `${site}/dashboard/staff` }).catch(() => null);
    }
    sent++;
  }
  return { reminders: sent };
}
