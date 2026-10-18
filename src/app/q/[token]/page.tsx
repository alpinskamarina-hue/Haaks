import type { Metadata } from "next";
import { acceptQuote } from "@/app/quotes-actions";
import { PrintButton } from "@/components/PrintButton";
import type { Profile } from "@/lib/documents";
import { euro } from "@/lib/orders";
import { lineTotal, quoteTotals, type Quote } from "@/lib/quotes";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offerte",
  robots: { index: false, follow: false },
};

const date = (value: string) =>
  new Date(value).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

// What the client sees: always in Dutch, printable, with an "Akkoord" button.
export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: quote } = await admin.from("quotes").select("*").eq("public_token", token).maybeSingle<Quote>();

  if (!quote) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">
        Deze offerte bestaat niet of is verwijderd.
      </main>
    );
  }

  const { data: worker } = await admin.from("profiles").select("*").eq("id", quote.user_id).single<Profile>();
  const sum = quoteTotals(quote.lines);
  const today = new Date().toISOString().slice(0, 10);
  const expired = !!quote.valid_until && quote.valid_until < today;
  const company = worker?.company_name || worker?.full_name || "";

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 print:px-0 print:py-0">
      {quote.status === "draft" && (
        <p className="rounded-lg bg-slate-100 p-3 text-center text-sm text-slate-700 print:hidden">
          Concept: deze offerte is nog niet verstuurd.
        </p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Offerte</p>
          <h1 className="text-2xl font-bold">{company}</h1>
          <div className="mt-1 text-sm text-slate-600">
            {worker?.business_address && <p>{worker.business_address}</p>}
            {worker?.city && !worker.business_address && <p>{worker.city}</p>}
            {worker?.phone && <p>Tel. {worker.phone}</p>}
            {worker?.business_email && <p>{worker.business_email}</p>}
            {worker?.kvk_number && <p>KvK {worker.kvk_number}</p>}
            {worker?.btw_number && <p>Btw-id {worker.btw_number}</p>}
          </div>
        </div>
        <PrintButton label="Afdrukken / PDF" />
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-slate-500">Voor</p>
          <p className="font-medium">{quote.client_name || "—"}</p>
          {quote.client_address && <p className="text-sm text-slate-600">{quote.client_address}</p>}
        </div>
        <dl className="grid grid-cols-2 gap-1 text-sm">
          <dt className="text-slate-500">Offertenummer</dt>
          <dd>{quote.number}</dd>
          <dt className="text-slate-500">Datum</dt>
          <dd>{date(quote.created_at)}</dd>
          {quote.valid_until && (
            <>
              <dt className="text-slate-500">Geldig tot</dt>
              <dd className={expired ? "text-red-700" : ""}>{date(quote.valid_until)}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{quote.title}</h2>
        {quote.intro && <p className="whitespace-pre-line text-slate-700">{quote.intro}</p>}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="p-3">Omschrijving</th>
              <th className="hidden p-3 text-right sm:table-cell">Aantal</th>
              <th className="hidden p-3 text-right sm:table-cell">Prijs</th>
              <th className="hidden p-3 text-right sm:table-cell">Btw</th>
              <th className="p-3 text-right">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line, i) => (
              <tr key={i} className="border-t border-slate-100 align-top">
                <td className="p-3">
                  {line.description}
                  <span className="mt-1 block text-xs text-slate-500 sm:hidden">
                    {Number(line.quantity).toLocaleString("nl-NL")} {line.unit} × {euro(line.unit_price)} · {line.vat_rate}% btw
                  </span>
                </td>
                <td className="hidden whitespace-nowrap p-3 text-right sm:table-cell">
                  {Number(line.quantity).toLocaleString("nl-NL")} {line.unit}
                </td>
                <td className="hidden whitespace-nowrap p-3 text-right sm:table-cell">{euro(line.unit_price)}</td>
                <td className="hidden p-3 text-right sm:table-cell">{line.vat_rate}%</td>
                <td className="whitespace-nowrap p-3 text-right">{euro(lineTotal(line))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto max-w-xs space-y-1 border-t border-slate-200 p-4 text-sm">
          <div className="flex justify-between">
            <dt>Totaal excl. btw</dt>
            <dd>{euro(sum.excl)}</dd>
          </div>
          {sum.vatLines.map((v) => (
            <div key={v.rate} className="flex justify-between text-slate-600">
              <dt>
                Btw {v.rate}% over {euro(v.base)}
              </dt>
              <dd>{euro(v.vat)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold">
            <dt>Totaal incl. btw</dt>
            <dd>{euro(sum.incl)}</dd>
          </div>
        </dl>
      </section>

      {quote.terms && (
        <section>
          <h3 className="mb-1 font-semibold">Voorwaarden</h3>
          <p className="whitespace-pre-line text-sm text-slate-700">{quote.terms}</p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 print:hidden">
        {quote.status === "accepted" ? (
          <p className="text-green-800">
            ✓ Akkoord gegeven door {quote.accepted_name}
            {quote.accepted_at ? ` op ${date(quote.accepted_at)}` : ""}.
          </p>
        ) : quote.status === "declined" ? (
          <p className="text-slate-600">Deze offerte is afgewezen.</p>
        ) : quote.status === "draft" ? (
          <p className="text-slate-600">Akkoord geven kan zodra de offerte is verstuurd.</p>
        ) : expired ? (
          <p className="text-slate-600">
            Deze offerte is verlopen. Neem contact op met {company || "de opdrachtnemer"} voor een nieuwe offerte.
          </p>
        ) : (
          <form action={acceptQuote.bind(null, token)} className="space-y-3">
            <h3 className="font-semibold">Akkoord met deze offerte?</h3>
            <label className="block text-sm font-medium">
              Uw naam
              <input
                name="name"
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3"
              />
            </label>
            <button className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white">
              Akkoord
            </button>
            <p className="text-xs text-slate-500">
              Met Akkoord geeft u opdracht voor het werk zoals hierboven beschreven, tegen de genoemde prijzen en
              voorwaarden.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
