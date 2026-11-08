import { NextResponse, type NextRequest } from "next/server";
import { sendHoursReminders } from "@/lib/hours-reminders";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

// Friday reminder to log the week's hours (vercel.json, 14:30 UTC = afternoon in the Netherlands).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createServerAccountClient();
  return NextResponse.json(await sendHoursReminders(supabase, await siteUrl()));
}
