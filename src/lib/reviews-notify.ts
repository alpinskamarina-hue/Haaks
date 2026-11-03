import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lang } from "@/lib/i18n";
import { isLang } from "@/lib/i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { reviewerShort } from "@/lib/reviews";
import { getReviewsDict } from "@/lib/reviews-i18n";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const put = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// Tells the builder a client left a review: push to the phone and Telegram, where set up.
export async function notifyReview(server: SupabaseClient, reviewId: string, siteUrl: string) {
  const { data: review } = await server.from("reviews").select("worker_id, job_title, stars, reviewer_name").eq("id", reviewId).single();
  if (!review) return;
  const { data: worker } = await server.from("profiles").select("language, telegram_chat_id").eq("id", review.worker_id).single();
  if (!worker) return;
  const t = getReviewsDict(isLang(worker.language) ? (worker.language as Lang) : "en");
  const body = put(t.pushBody, { name: reviewerShort(review.reviewer_name), job: review.job_title, stars: String(review.stars) });
  const path = `/dashboard/reviews/${reviewId}`;

  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", review.worker_id)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title: t.pushTitle, body, url: path, tag: `review-${reviewId}` });
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && worker.telegram_chat_id) {
    await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(t.pushTitle)}</b>\n${esc(body)}`, { text: t.nav, url: `${siteUrl}${path}` });
  }
}
