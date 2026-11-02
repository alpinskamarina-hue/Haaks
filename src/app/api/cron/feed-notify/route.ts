import { NextResponse, type NextRequest } from "next/server";
import { emailEnabled } from "@/lib/email";
import { sendFeedEmails, sendFeedTelegram } from "@/lib/feed-notify";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";
import { telegramEnabled } from "@/lib/telegram";

// Job alerts by e-mail and Telegram. Vercel Cron calls this once a day (vercel.json) with
// "Authorization: Bearer <CRON_SECRET>"; ?mode=instant is for the job collectors,
// which call it after new jobs come in. A channel that is not set up is skipped.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const mode = request.nextUrl.searchParams.get("mode") === "instant" ? "instant" : "daily";
  const supabase = await createServerAccountClient();
  const site = await siteUrl();
  const [email, telegram] = await Promise.all([
    emailEnabled() ? sendFeedEmails(supabase, mode, site) : "not set up: RESEND_API_KEY, EMAIL_FROM",
    telegramEnabled() ? sendFeedTelegram(supabase, site) : "not set up: TELEGRAM_BOT_TOKEN",
  ]);
  return NextResponse.json({ mode, email, telegram });
}
