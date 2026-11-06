import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccountantDict } from "@/lib/accountant-i18n";
import { questionTexts, type QuestionKind } from "@/lib/accountant-questions";
import { isLang, type Lang } from "@/lib/i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// The accountant asked something: tell the builder on the phone and in Telegram, in their language.
export async function notifyAccountantQuestion(server: SupabaseClient, questionId: string, siteUrl: string) {
  const { data: question } = await server.from("accountant_questions").select("user_id, kind, body").eq("id", questionId).single();
  if (!question) return;
  const { data: worker } = await server.from("profiles").select("language, telegram_chat_id").eq("id", question.user_id).single();
  if (!worker) return;
  const lang: Lang = isLang(worker.language) ? (worker.language as Lang) : "en";
  const a = getAccountantDict(lang);
  const kind = question.kind as QuestionKind;
  const body = kind === "other" ? String(question.body ?? "") : questionTexts(lang).q[kind];
  const path = "/dashboard/accountant#vragen";

  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", question.user_id)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title: a.questionsTitle, body, url: path, tag: `acc-q-${questionId}` });
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && worker.telegram_chat_id) {
    await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(a.questionsTitle)}</b>\n${esc(body)}`, { text: a.send, url: `${siteUrl}${path}` });
  }
}
