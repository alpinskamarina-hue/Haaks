import type { SupabaseClient } from "@supabase/supabase-js";
import { getFirmOfferDict } from "@/lib/firm-offer-i18n";
import { isLang, type Lang } from "@/lib/i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

type Due = { offer_id: string; user_id: string; firm_id: string; firm_name: string };
type Worker = { id: string; language: string | null; telegram_chat_id: number | null };

// Daily: a firm the builder offered themselves to has not answered for 5 days → one push/Telegram
// «… не ответила, позвоните или напишите ещё раз». The database picks each offer once (take_firm_reminders).
export async function sendFirmReminders(server: SupabaseClient, site: string) {
  const { data, error } = await server.rpc("take_firm_reminders");
  if (error) return { error: error.message };
  const due = (data ?? []) as Due[];
  if (!due.length) return { due: 0, sent: 0 };
  const { data: workers } = await server
    .from("profiles")
    .select("id, language, telegram_chat_id")
    .in("id", [...new Set(due.map((d) => d.user_id))])
    .returns<Worker[]>();
  const byId = new Map((workers ?? []).map((w) => [w.id, w]));
  let sent = 0;
  for (const d of due) {
    const worker = byId.get(d.user_id);
    if (!worker) continue;
    const o = getFirmOfferDict(isLang(worker.language) ? (worker.language as Lang) : "en");
    const title = o.reminderTitle.replace("{firm}", d.firm_name);
    const body = o.reminderBody;
    const path = "/dashboard/leads/firms";
    let ok = false;
    if (pushEnabled()) {
      const { data: subs } = await server
        .from("push_subscriptions")
        .select("endpoint, user_id, p256dh, auth")
        .eq("user_id", d.user_id)
        .returns<PushSubscriptionRow[]>();
      for (const sub of subs ?? []) {
        const result = await sendPush(sub, { title, body, url: path, tag: `firm-offer-${d.offer_id}` });
        if (result.ok) ok = true;
        if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
    if (telegramEnabled() && worker.telegram_chat_id) {
      await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(title)}</b>\n${esc(body)}`, { text: o.offer, url: `${site}${path}` });
      ok = true;
    }
    if (ok) sent++;
  }
  return { due: due.length, sent };
}
