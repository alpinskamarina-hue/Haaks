import type { Metadata } from "next";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import { CopyButton } from "@/components/CopyButton";
import { PrintButton } from "@/components/PrintButton";
import QRCode from "qrcode";
import type { Profile } from "@/lib/documents";
import { invoiceTotals, vatNote, type Invoice } from "@/lib/invoices";
import { euro } from "@/lib/orders";
import { lineTotal } from "@/lib/quotes";
import { after } from "next/server";
import { notifyInvoiceViewed } from "@/lib/invoice-notify";
import { siteUrl } from "@/lib/lang";
import { createClient, createServerAccountClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Factuur",
  robots: { index: false, follow: false },
};

const date = (value: string) => new Date(value).toLocaleDateString("nl-NL");
const qty = (n: number) => Number(n).toLocaleString("nl-NL");

// The invoice as the client receives it: Dutch, A4-friendly, saved as PDF through the print dialog.
export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ b?: string }>;
}) {
  const { token } = await params;
  const { b: fromAccountant } = await searchParams;
  const admin = await createServerAccountClient();
  const { data: invoice } = await admin
    .from("invoices")
    .select("*")
    .eq("public_token", token)
    .maybeSingle<Invoice>();

  if (!invoice) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">
        Deze factuur bestaat niet of is verwijderd.
      </main>
    );
  }

  // First time the client opens a sent invoice: mark it and tell the builder.
  // The builder's own look and the accountant's link (?b=1) do not count.
  if (invoice.status === "sent" && !invoice.viewed_at && !fromAccountant) {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (user?.id !== invoice.user_id) {
      const { data: firstView } = await admin.rpc("invoice_viewed", { p_token: token });
      if (firstView) {
        const site = await siteUrl();
        after(() => notifyInvoiceViewed(admin, firstView as string, site).catch((err) => console.error("Invoice view notify failed", err)));
      }
    }
  }

  const { data: worker } = await admin.from("profiles").select("*").eq("id", invoice.user_id).single<Profile>();
  const sum = invoiceTotals(invoice.lines, invoice.vat_mode);
  const company = worker?.company_name || worker?.full_name || "";
  const note = vatNote(invoice);
  const isCredit = !!invoice.credit_for;
  const isCredited = !!invoice.credited_by;
  // The invoice a credit note cancels, or the credit note and new invoice that replaced this one.
  const [{ data: cancelled }, { data: credit }, { data: replacement }] = await Promise.all([
    isCredit
      ? admin.from("invoices").select("number, public_token").eq("id", invoice.credit_for!).maybeSingle<{ number: string; public_token: string }>()
      : Promise.resolve({ data: null }),
    isCredited
      ? admin.from("invoices").select("number, public_token").eq("id", invoice.credited_by!).maybeSingle<{ number: string; public_token: string }>()
      : Promise.resolve({ data: null }),
    isCredited
      ? admin.from("invoices").select("number, public_token, status").eq("replaces", invoice.id).neq("status", "draft").limit(1).maybeSingle<{ number: string; public_token: string; status: string }>()
      : Promise.resolve({ data: null }),
  ]);
  const iban = (worker?.iban ?? "").replace(/\s/g, "").toUpperCase();
  const payable = !isCredit && !isCredited && invoice.status !== "paid" && sum.incl > 0;
  const overdue = invoice.status === "sent" && !!invoice.due_date && invoice.due_date < new Date().toISOString().slice(0, 10);
  // SEPA payment QR (EPC "BCD"): bank apps that support it fill in name, IBAN, amount and reference.
  const qr =
    payable && iban
      ? await QRCode.toString(["BCD", "002", "1", "SCT", "", company.slice(0, 70), iban, `EUR${sum.incl.toFixed(2)}`, "", "", invoice.number].join("\n"), {
          type: "svg",
          margin: 1,
          errorCorrectionLevel: "M",
        })
      : null;

  return (
    <main lang="nl" className="mx-auto max-w-3xl space-y-8 bg-white px-4 py-6 text-[15px] print:max-w-none print:px-0 print:py-0">
      <HtmlLang lang="nl" />
      {invoice.status === "draft" && (
        <p className="rounded-lg bg-slate-100 p-3 text-center text-sm text-slate-700 print:hidden">
          Concept: deze factuur is nog niet verstuurd.
        </p>
      )}

      {isCredited && (
        <p className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-900 print:hidden">
          Deze factuur is gecrediteerd
          {credit && (
            <>
              {" "}met{" "}
              <a href={`/f/${credit.public_token}`} className="underline">
                creditfactuur {credit.number}
              </a>
            </>
          )}
          {replacement && (
            <>
              {" "}en vervangen door{" "}
              <a href={`/f/${replacement.public_token}`} className="font-semibold underline">
                factuur {replacement.number}
              </a>
            </>
          )}
          . U hoeft deze factuur niet te betalen.
        </p>
      )}

      {payable && (
        <section className="rounded-2xl border border-slate-200 p-4 text-center shadow-sm print:hidden">
          <p className="text-sm text-slate-600">
            Factuur {invoice.number}
            {invoice.client_name ? ` · ${invoice.client_name}` : ""}
          </p>
          <p className="mt-1 text-3xl font-bold">{euro(sum.incl)}</p>
          {invoice.due_date && (
            <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ${overdue ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>
              {overdue ? "Vervallen op" : "Te betalen vóór"} {date(invoice.due_date)}
            </p>
          )}
          {qr && (
            <>
              <div className="mx-auto mt-3 w-44" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="text-xs text-slate-500">Scan met uw bank-app</p>
            </>
          )}
          <dl className="mt-3 space-y-2 text-left text-sm">
            {[
              iban ? ["IBAN", worker?.iban ?? iban, iban] : null,
              ["Ten name van", company, company],
              ["Omschrijving", invoice.number, invoice.number],
              ["Bedrag", euro(sum.incl), sum.incl.toFixed(2).replace(".", ",")],
            ]
              .filter((x): x is string[] => !!x)
              .map(([k, shown, copy]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-xs text-slate-500">{k}</span>
                    <b className="break-all">{shown}</b>
                  </span>
                  <CopyButton value={copy!} label="kopieer" />
                </div>
              ))}
          </dl>
        </section>
      )}

      <header className="flex items-start justify-between gap-4 border-b border-slate-300 pb-6">
        <h1 className="text-3xl font-bold tracking-wide text-slate-900">{isCredit ? "CREDITFACTUUR" : "FACTUUR"}</h1>
        <PrintButton label="Afdrukken / PDF" />
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="text-sm leading-relaxed">
          <p className="mb-1 font-bold uppercase">{invoice.client_name || "—"}</p>
          {invoice.client_address && <p className="whitespace-pre-line">{invoice.client_address}</p>}
          {invoice.client_kvk && <p>KvK: {invoice.client_kvk}</p>}
          {invoice.client_btw && <p>Btw-id: {invoice.client_btw}</p>}
        </div>
        <div className="text-sm leading-relaxed">
          <p className="mb-1 font-bold">{company}</p>
          {worker?.business_address && <p>{worker.business_address}</p>}
          {worker?.kvk_number && <p>KvK: {worker.kvk_number}</p>}
          {worker?.btw_number && <p>Btw-id: {worker.btw_number}</p>}
          {worker?.iban && <p>IBAN: {worker.iban}</p>}
          {worker?.phone && <p>Tel: {worker.phone}</p>}
          {worker?.business_email && <p>E-mail: {worker.business_email}</p>}
        </div>
      </section>

      <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="font-semibold">Factuurnummer:</dt>
          <dd>{invoice.number}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold">Factuurdatum:</dt>
          <dd>{date(invoice.invoice_date)}</dd>
        </div>
        {invoice.due_date && (
          <div className="flex gap-2">
            <dt className="font-semibold">Vervaldatum:</dt>
            <dd>{date(invoice.due_date)}</dd>
          </div>
        )}
        {invoice.work_period && (
          <div className="flex gap-2">
            <dt className="font-semibold">Periode:</dt>
            <dd>{invoice.work_period}</dd>
          </div>
        )}
      </dl>

      <section>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-left text-white [print-color-adjust:exact]">
              <th className="p-3 font-semibold">Omschrijving</th>
              <th className="hidden p-3 text-right font-semibold sm:table-cell">Aantal x tarief</th>
              {invoice.vat_mode === "normal" && (
                <th className="hidden p-3 text-right font-semibold sm:table-cell">Btw</th>
              )}
              <th className="p-3 text-right font-semibold">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, i) => (
              <tr key={i} className="border-b border-slate-200 align-top">
                <td className="p-3">
                  {i === 0 && invoice.project_address && (
                    <p className="mb-1 font-semibold">Projectadres: {invoice.project_address}</p>
                  )}
                  <p className="whitespace-pre-line">{line.description}</p>
                  <p className="mt-1 text-xs text-slate-500 sm:hidden">
                    {qty(line.quantity)} {line.unit} x {euro(line.unit_price)}
                    {invoice.vat_mode === "normal" ? ` · ${line.vat_rate}% btw` : ""}
                  </p>
                </td>
                <td className="hidden whitespace-nowrap p-3 text-right sm:table-cell">
                  {qty(line.quantity)} {line.unit} x {euro(line.unit_price)}
                </td>
                {invoice.vat_mode === "normal" && (
                  <td className="hidden p-3 text-right sm:table-cell">{line.vat_rate}%</td>
                )}
                <td className="whitespace-nowrap p-3 text-right font-semibold">{euro(lineTotal(line))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotaal (excl. btw)</dt>
            <dd>{euro(sum.excl)}</dd>
          </div>
          {invoice.vat_mode === "normal" ? (
            sum.vatLines.map((v) => (
              <div key={v.rate} className="flex justify-between">
                <dt>
                  Btw {v.rate}% over {euro(v.base)}
                </dt>
                <dd>{euro(v.vat)}</dd>
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <dt>{invoice.vat_mode === "reverse" ? "Btw verlegd" : "Btw (KOR)"}</dt>
              <dd>{euro(0)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-800 pt-2 text-base font-bold">
            <dt>{isCredit ? "Totaal creditering" : "Te betalen"}</dt>
            <dd>{euro(sum.incl)}</dd>
          </div>
        </dl>
      </section>

      <footer className="space-y-1 border-t border-slate-300 pt-4 text-xs text-slate-700">
        {isCredit ? (
          <p className="font-semibold">
            Creditering van factuur {cancelled?.number ?? ""}. Dit bedrag wordt verrekend; u hoeft niets te betalen.
          </p>
        ) : isCredited ? (
          <p className="font-semibold">Deze factuur is gecrediteerd{credit ? ` met creditfactuur ${credit.number}` : ""}.</p>
        ) : invoice.status === "paid" ? (
          <p className="font-semibold text-green-800">Deze factuur is betaald. Dank u wel.</p>
        ) : (
          <p>
            Gelieve {euro(sum.incl)}
            {invoice.due_date ? ` vóór ${date(invoice.due_date)}` : ""} te betalen
            {worker?.iban ? ` op rekeningnummer ${worker.iban} t.n.v. ${company}` : ""}, onder vermelding van
            factuurnummer {invoice.number}.
          </p>
        )}
        {note && <p>{note}</p>}
        {invoice.notes && !isCredit && <p className="whitespace-pre-line">{invoice.notes}</p>}
        <p className="pt-2">{company}</p>
      </footer>
      <PublicFooter />
    </main>
  );
}
