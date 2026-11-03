import { NextResponse, type NextRequest } from "next/server";
import { collectFeed } from "@/lib/collect";
import { emailEnabled } from "@/lib/email";
import { sendFeedEmails, sendFeedTelegram } from "@/lib/feed-notify";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";
import { telegramEnabled } from "@/lib/telegram";

export const maxDuration = 60;

// The daily job collector (vercel.json), with "Authorization: Bearer <CRON_SECRET>".
// Optional for a manual run: ?since=YYYY-MM-DD, ?only=permits|tenders, ?cities=Rotterdam,Utrecht.
// New fitting jobs go out at once to Pro workers with instant e-mail or Telegram alerts.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = request.nextUrl.searchParams;
  const since = /^\d{4}-\d{2}-\d{2}$/.test(q.get("since") ?? "") ? q.get("since")! : undefined;
  const only = q.get("only") === "permits" || q.get("only") === "tenders" ? (q.get("only") as "permits" | "tenders") : undefined;
  const municipalities = q.get("cities")?.split(",").map((c) => c.trim()).filter(Boolean);

  const supabase = await createServerAccountClient();
  const result = await collectFeed(supabase, { since, only, municipalities });
  let alerts: unknown = "no new jobs";
  if (result.added > 0) {
    const site = await siteUrl();
    alerts = await Promise.all([
      emailEnabled() ? sendFeedEmails(supabase, "instant", site) : "e-mail not set up",
      telegramEnabled() ? sendFeedTelegram(supabase, site) : "Telegram not set up",
    ]);
  }
  return NextResponse.json({ ...result, alerts });
}
