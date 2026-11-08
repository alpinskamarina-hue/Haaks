import { NextResponse } from "next/server";
import type { Profile } from "@/lib/documents";
import type { Invoice } from "@/lib/invoices";
import { createClient } from "@/lib/supabase/server";
import { invoiceUbl } from "@/lib/ubl";

// The builder's own invoice as a UBL e-invoice, for the accountant's software.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).eq("user_id", user.id).maybeSingle<Invoice>();
  if (!invoice || invoice.status === "draft") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [{ data: profile }, { data: original }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    invoice.credit_for
      ? supabase.from("invoices").select("number, invoice_date").eq("id", invoice.credit_for).maybeSingle<{ number: string; invoice_date: string }>()
      : Promise.resolve({ data: null }),
  ]);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const xml = invoiceUbl(invoice, profile, { creditFor: original ? { number: original.number, date: original.invoice_date } : null });
  const number = invoice.number;
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="Factuur ${number.replace(/[^\w.-]/g, "_")}.xml"`,
      "Cache-Control": "private, no-store",
    },
  });
}
