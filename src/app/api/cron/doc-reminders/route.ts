import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/lang";
import { sendDocReminders } from "@/lib/passport-notify";
import { createServerAccountClient } from "@/lib/supabase/server";

// Daily reminders about passport documents that are about to expire (vercel.json, 07:00 UTC).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createServerAccountClient();
  return NextResponse.json(await sendDocReminders(supabase, await siteUrl()));
}
