import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/lang";
import { runStaffFeed } from "@/lib/staff-feed";
import { runStaffReminders } from "@/lib/staff-reminders";
import { runStaffTips } from "@/lib/staff-tips";
import { createServerAccountClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Every hour in the day: the digital employees bring new fitting jobs into their workers' chats.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const server = await createServerAccountClient();
  const site = await siteUrl();
  // Reminders first: they are quick and must not wait for the job drafts.
  const reminders = await runStaffReminders(server, site).catch((e) => (console.error("staff reminders failed", e instanceof Error ? e.message : e), { reminders: -1 }));
  // Once a day (the 07:40 UTC run, morning in the Netherlands): the employee's suggestions for today.
  const tips = request.nextUrl.searchParams.get("run") === "7"
    ? await runStaffTips(server, site).catch((e) => (console.error("staff tips failed", e instanceof Error ? e.message : e), { tips: -1 }))
    : { tips: 0 };
  const result = await runStaffFeed(server, site);
  return NextResponse.json({ ...result, ...reminders, ...tips });
}
