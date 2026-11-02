import { NextResponse, type NextRequest } from "next/server";
import { emailEnabled } from "@/lib/email";
import { sendFeedEmails } from "@/lib/feed-notify";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

// Job alerts by e-mail. Vercel Cron calls this once a day (vercel.json) with
// "Authorization: Bearer <CRON_SECRET>"; ?mode=instant is for the job collectors,
// which call it after new jobs come in.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!emailEnabled()) {
    return NextResponse.json({ error: "E-mail is not set up: RESEND_API_KEY and EMAIL_FROM" }, { status: 503 });
  }
  const mode = request.nextUrl.searchParams.get("mode") === "instant" ? "instant" : "daily";
  const result = await sendFeedEmails(await createServerAccountClient(), mode, await siteUrl());
  return NextResponse.json({ mode, ...result });
}
