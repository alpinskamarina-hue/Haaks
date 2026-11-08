import { NextResponse, type NextRequest } from "next/server";
import { sendFirmReminders } from "@/lib/firm-reminders";
import { sendInvoiceReminders } from "@/lib/invoice-reminders";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

// Daily reminders to the builder about unpaid invoices, 7 and 14 days after the due date
// (vercel.json, 07:30 UTC = morning in the Netherlands), and firms that did not answer an offer in 5 days.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = await createServerAccountClient();
  const site = await siteUrl();
  const invoices = await sendInvoiceReminders(supabase, site);
  const firms = await sendFirmReminders(supabase, site);
  return NextResponse.json({ invoices, firms });
}
