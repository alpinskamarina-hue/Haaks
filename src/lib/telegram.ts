import { createHash } from "node:crypto";

// Telegram bot for job alerts. Only TELEGRAM_BOT_TOKEN (from @BotFather) is needed:
// the webhook secret is derived from it and the bot's name is asked from Telegram.

export function telegramEnabled() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

// Telegram sends this back in the X-Telegram-Bot-Api-Secret-Token header of every update.
export function webhookSecret() {
  return createHash("sha256").update(`haaks-webhook:${process.env.TELEGRAM_BOT_TOKEN}`).digest("hex").slice(0, 48);
}

export async function callTelegram<T = unknown>(method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
  return { ok: Boolean(data.ok), status: response.status, result: data.result, error: data.description };
}

let username: string | undefined;

export async function botUsername() {
  if (!username) {
    const me = await callTelegram<{ username: string }>("getMe", {});
    if (!me.ok || !me.result) throw new Error(`Telegram getMe failed: ${me.error}`);
    username = me.result.username;
  }
  return username;
}

// Points the bot at this site. Cheap and safe to repeat, so it runs on each "Connect".
export async function ensureWebhook(siteUrl: string) {
  if (!siteUrl.startsWith("https://")) return;
  const result = await callTelegram("setWebhook", {
    url: `${siteUrl}/api/telegram/webhook`,
    secret_token: webhookSecret(),
    allowed_updates: ["message"],
  });
  if (!result.ok) console.error("Telegram setWebhook failed", result.error);
}

export async function sendTelegram(chatId: number, text: string, button?: { text: string; url: string }) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(button && button.url.startsWith("https://")
      ? { reply_markup: { inline_keyboard: [[{ text: button.text, url: button.url }]] } }
      : {}),
  });
}
