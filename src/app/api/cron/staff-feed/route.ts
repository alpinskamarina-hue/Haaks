import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/lang";
import { runStaffFeed } from "@/lib/staff-feed";
import { createServerAccountClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Every hour in the day: the digital employees bring new fitting jobs into their workers' chats.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const server = await createServerAccountClient();
  const result = await runStaffFeed(server, await siteUrl());
  return NextResponse.json(result);
}
