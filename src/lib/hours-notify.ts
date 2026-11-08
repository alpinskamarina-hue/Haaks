import type { SupabaseClient } from "@supabase/supabase-js";
import { getHoursDict } from "@/lib/hours-i18n";
import { isoWeek } from "@/lib/hours";
import { isLang, type Lang } from "@/lib/i18n";
import { fillP } from "@/lib/project-i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// The company gave Akkoord on the hours, or not: tell the builder on the phone and in Telegram.
export async function notifyHoursDecided(
  server: SupabaseClient,
  a: { id: string; user_id: string; order_id: string; date_from: string; hours: number },
  ok: boolean,
  name: string,
  comment: string | null,
  site: string,
) {
  const { data: worker } = await server.from("profiles").select("language, telegram_chat_id").eq("id", a.user_id).maybeSingle();
  if (!worker) return;
  const hw = getHoursDict(isLang(worker.language) ? (worker.language as Lang) : "en");
  const vars = { name, n: isoWeek(a.date_from).week, h: Number(a.hours), comment: comment ?? "" };
  const title = ok ? hw.okTitle : hw.noTitle;
  const body = fillP(ok ? hw.okBody : hw.noBody, vars).trim();
  const path = `/dashboard/orders/${a.order_id}?tab=hours`;
  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", a.user_id)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title, body, url: path, tag: `hours-${a.id}` });
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && worker.telegram_chat_id) {
    await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(title)}</b>\n${esc(body)}`, { text: hw.tab, url: `${site}${path}` });
  }
}
