import { NextResponse, type NextRequest } from "next/server";
import { sendInvoiceReminders } from "@/lib/invoice-reminders";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

// Daily reminders to the builder about unpaid invoices, 7 and 14 days after the due date
// (vercel.json, 07:30 UTC = morning in the Netherlands).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createServerAccountClient();
  return NextResponse.json(await sendInvoiceReminders(supabase, await siteUrl()));
}
