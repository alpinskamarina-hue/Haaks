import type { SupabaseClient } from "@supabase/supabase-js";
import { shortName } from "@/lib/company-jobs";
import { feedText, type FeedItem } from "@/lib/feed";
import { fill } from "@/lib/feed-i18n";
import { isLang } from "@/lib/i18n";
import { getJobShareDict } from "@/lib/job-share-i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// Phone push and Telegram to one builder, in their own language.
async function tell(
  server: SupabaseClient,
  userId: string,
  itemId: string,
  site: string,
  path: string,
  tag: string,
  make: (t: ReturnType<typeof getJobShareDict>, title: string) => { title: string; body: string },
) {
  const [{ data: who }, { data: item }] = await Promise.all([
    server.from("profiles").select("language, telegram_chat_id").eq("id", userId).single(),
    server.from("feed_items").select("title, summary, translations").eq("id", itemId).single(),
  ]);
  if (!who || !item) return;
  const lang = isLang(who.language) ? who.language : "en";
  const t = getJobShareDict(lang);
  const { title, body } = make(t, feedText({ ...(item as FeedItem), translations: item.translations ?? {} }, lang).title);
  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", userId)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title, body, url: path, tag });
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && who.telegram_chat_id) {
    await sendTelegram(Number(who.telegram_chat_id), `<b>${esc(title)}</b>\n${esc(body)}`, { text: t.open, url: `${site}${path}` });
  }
}

// «Вам прислали заказ»: the job opens in the receiver's feed tab «Мне прислали».
export async function notifyJobShared(
  server: SupabaseClient,
  share: { id: string; toUser: string; itemId: string; fromName: string | null; note: string | null },
  site: string,
) {
  await tell(server, share.toUser, share.itemId, site, `/dashboard/leads/feed?received=1#job-${share.itemId}`, `share-${share.id}`, (t, title) => ({
    title: t.pushTitle,
    body: fill(t.pushBody, { name: shortName(share.fromName), title }) + (share.note ? `\n«${share.note}»` : ""),
  }));
}

// «Спасибо» from the receiver back to the sender.
export async function notifyShareThanks(server: SupabaseClient, thanks: { toUser: string; itemId: string; fromName: string | null }, site: string) {
  await tell(server, thanks.toUser, thanks.itemId, site, `/dashboard/leads/feed#job-${thanks.itemId}`, `thanks-${thanks.itemId}`, (t, title) => ({
    title: t.pushThanksTitle,
    body: fill(t.pushThanksBody, { name: shortName(thanks.fromName), title }),
  }));
}
