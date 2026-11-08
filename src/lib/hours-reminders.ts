import type { SupabaseClient } from "@supabase/supabase-js";
import { getHoursDict } from "@/lib/hours-i18n";
import { isLang, type Lang } from "@/lib/i18n";
import { fillP } from "@/lib/project-i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

type Due = { user_id: string; order_id: string; title: string };
type Worker = { id: string; language: string | null; telegram_chat_id: number | null };

// Friday afternoon: builders with an open order that had hours lately but none this week get one push
// and Telegram message «внесите часы за неделю», opening the «Часы» tab of that order.
// The database picks the orders and logs each builder once per week (take_hours_reminders).
export async function sendHoursReminders(server: SupabaseClient, site: string) {
  const { data, error } = await server.rpc("take_hours_reminders");
  if (error) return { error: error.message };
  const due = (data ?? []) as Due[];
  if (!due.length) return { builders: 0, sent: 0 };

  const byUser = new Map<string, Due[]>();
  for (const d of due) byUser.set(d.user_id, [...(byUser.get(d.user_id) ?? []), d]);
  const { data: workers } = await server
    .from("profiles")
    .select("id, language, telegram_chat_id")
    .in("id", [...byUser.keys()])
    .returns<Worker[]>();

  let sent = 0;
  for (const worker of workers ?? []) {
    const orders = byUser.get(worker.id) ?? [];
    if (!orders.length) continue;
    const hw = getHoursDict(isLang(worker.language) ? (worker.language as Lang) : "en");
    const title = hw.remindTitle;
    const body = [fillP(hw.remindBody, { title: orders[0].title }), orders.length > 1 ? fillP(hw.remindMore, { n: orders.length - 1 }) : ""]
      .filter(Boolean)
      .join(" ");
    const path = `/dashboard/orders/${orders[0].order_id}?tab=hours`;
    let ok = false;
    if (pushEnabled()) {
      const { data: subs } = await server
        .from("push_subscriptions")
        .select("endpoint, user_id, p256dh, auth")
        .eq("user_id", worker.id)
        .returns<PushSubscriptionRow[]>();
      for (const sub of subs ?? []) {
        const result = await sendPush(sub, { title, body, url: path, tag: "hours-week" });
        if (result.ok) ok = true;
        if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
    if (telegramEnabled() && worker.telegram_chat_id) {
      await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(title)}</b>\n${esc(body)}`, { text: hw.tab, url: `${site}${path}` });
      ok = true;
    }
    if (ok) sent++;
  }
  return { builders: byUser.size, sent };
}
