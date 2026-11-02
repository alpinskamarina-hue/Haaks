import { NextResponse, type NextRequest } from "next/server";
import { fill, getFeedDict } from "@/lib/feed-i18n";
import { isLang, type Lang } from "@/lib/i18n";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";
import { sendTelegram, telegramEnabled, webhookSecret } from "@/lib/telegram";

type Update = {
  message?: {
    text?: string;
    chat?: { id: number; type: string };
    from?: { language_code?: string };
  };
};

// Messages to the Haaks bot. Telegram signs each call with the secret set in ensureWebhook().
// "/start <code>" links the chat to the worker who pressed "Connect Telegram"; "/stop" unlinks it.
export async function POST(request: NextRequest) {
  if (!telegramEnabled() || request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const update = (await request.json().catch(() => ({}))) as Update;
  const message = update.message;
  const chat = message?.chat;
  // Always answer 200, or Telegram keeps re-sending the same update.
  if (!chat || chat.type !== "private") return NextResponse.json({ ok: true });

  const text = (message.text ?? "").trim();
  const code = text.match(/^\/start\s+([A-Za-z0-9_-]{16,64})$/)?.[1];
  const guess = (message.from?.language_code ?? "").slice(0, 2);
  let lang: Lang = isLang(guess) ? guess : "en";
  const feedUrl = `${await siteUrl()}/dashboard/leads/feed`;
  const supabase = await createServerAccountClient();

  let reply: string;
  if (code) {
    const { data: worker, error } = await supabase.rpc("link_telegram", { code, chat: chat.id });
    if (error) console.error("link_telegram failed", error.message);
    if (worker) {
      const { data: profile } = await supabase.from("profiles").select("language").eq("id", worker).maybeSingle();
      if (isLang(profile?.language)) lang = profile.language;
      reply = getFeedDict(lang).tgLinked;
    } else {
      reply = fill(getFeedDict(lang).tgBadCode, { url: feedUrl });
    }
  } else if (/^\/stop\b/.test(text)) {
    await supabase.rpc("unlink_telegram", { chat: chat.id });
    reply = fill(getFeedDict(lang).tgStopped, { url: feedUrl });
  } else {
    reply = fill(getFeedDict(lang).tgHelp, { url: feedUrl });
  }
  await sendTelegram(chat.id, reply);
  return NextResponse.json({ ok: true });
}
