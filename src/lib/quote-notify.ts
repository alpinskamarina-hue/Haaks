import type { SupabaseClient } from "@supabase/supabase-js";
import { isLang, type Lang } from "@/lib/i18n";
import { euro } from "@/lib/orders";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { quoteTotals, type QuoteLine } from "@/lib/quotes";
import { fill, getQuotesDict } from "@/lib/quotes-i18n";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// The client opened the quote link for the first time: tell the builder on their phone and in Telegram.
export async function notifyQuoteViewed(server: SupabaseClient, quoteId: string, siteUrl: string) {
  const { data: quote } = await server.from("quotes").select("user_id, title, client_name, lines").eq("id", quoteId).single();
  if (!quote) return;
  const { data: worker } = await server.from("profiles").select("language, telegram_chat_id").eq("id", quote.user_id).single();
  if (!worker) return;
  const q = getQuotesDict(isLang(worker.language) ? (worker.language as Lang) : "en");
  const body = fill(q.pushBody, {
    client: quote.client_name || q.client,
    title: quote.title,
    sum: euro(quoteTotals((quote.lines ?? []) as QuoteLine[]).incl),
  });
  const path = `/dashboard/quotes/${quoteId}`;

  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", quote.user_id)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title: q.pushTitle, body, url: path, tag: `quote-${quoteId}` });
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && worker.telegram_chat_id) {
    await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(q.pushTitle)}</b>\n${esc(body)}`, { text: q.stepsTitle, url: `${siteUrl}${path}` });
  }
}
