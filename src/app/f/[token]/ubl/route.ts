import { NextResponse } from "next/server";
import type { Profile } from "@/lib/documents";
import type { Invoice } from "@/lib/invoices";
import { createServerAccountClient } from "@/lib/supabase/server";
import { invoiceUbl } from "@/lib/ubl";

// The client's copy as a UBL e-invoice (a company books it straight into its accounting software).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = await createServerAccountClient();
  const { data: invoice } = await admin.from("invoices").select("*").eq("public_token", token).maybeSingle<Invoice>();
  if (!invoice || invoice.status === "draft") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [{ data: profile }, { data: original }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", invoice.user_id).single<Profile>(),
    invoice.credit_for
      ? admin.from("invoices").select("number, invoice_date").eq("id", invoice.credit_for).maybeSingle<{ number: string; invoice_date: string }>()
      : Promise.resolve({ data: null }),
  ]);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const xml = invoiceUbl(invoice, profile, { creditFor: original ? { number: original.number, date: original.invoice_date } : null });
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="Factuur ${invoice.number.replace(/[^\w.-]/g, "_")}.xml"`,
      "Cache-Control": "private, no-store",
    },
  });
}
