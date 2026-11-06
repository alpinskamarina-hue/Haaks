import type { Metadata } from "next";
import { askAccountantQuestion } from "@/app/accountant-actions";
import { AccountantZip } from "@/components/AccountantZip";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import { SubmitButton } from "@/components/SubmitButton";
import { loadQuarter, quarterFromKey, vatDeadline } from "@/lib/accountant";
import { buildPack } from "@/lib/accountant-pack";
import { ANSWER_NL, QUESTION_KINDS, QUESTION_NL, type AnswerKind, type QuestionKind } from "@/lib/accountant-questions";
import type { Profile } from "@/lib/documents";
import { invoiceTotals } from "@/lib/invoices";
import { eur, nlDate } from "@/lib/invoice-pdf";
import { createServerAccountClient } from "@/lib/supabase/server";
import { toNum, type CarType } from "@/lib/trips";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administratie voor de boekhouder",
  robots: { index: false, follow: false },
};

const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const row = "flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0 [&>b]:shrink-0 [&>b]:whitespace-nowrap";

type Share = { id: string; user_id: string; quarter: string; expires_at: string; revoked_at: string | null };
type Question = {
  id: string;
  receipt_id: string | null;
  invoice_id: string | null;
  kind: QuestionKind;
  body: string | null;
  answer_kind: AnswerKind | null;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
};

// The accountant's view of one quarter, in Dutch, without an account: download everything, ask about a receipt or invoice.
export default async function AccountantSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ vraag?: string }>;
}) {
  const { token } = await params;
  const { vraag } = await searchParams;
  const server = await createServerAccountClient();
  const { data: share } = await server.from("accountant_shares").select("*").eq("token", token).maybeSingle<Share>();
  if (!share || share.revoked_at || new Date(share.expires_at) < new Date()) {
    return (
      <main lang="nl" className="mx-auto max-w-xl px-4 py-16 text-center text-slate-600">
        <HtmlLang lang="nl" />
        Deze link werkt niet meer. Vraag de ondernemer om een nieuwe link.
      </main>
    );
  }
  await server.rpc("accountant_share_opened", { p_token: token });
  const { data: profile } = await server.from("profiles").select("*").eq("id", share.user_id).single<Profile & { car_type?: CarType | null }>();
  if (!profile) return null;
  const q = quarterFromKey(share.quarter);
  const [d, { data: questionRows }] = await Promise.all([
    loadQuarter(server, share.user_id, q, profile.car_type ?? null),
    server.from("accountant_questions").select("*").eq("share_id", share.id).order("created_at").returns<Question[]>(),
  ]);
  const questions = questionRows ?? [];
  const pack = buildPack(d, profile, q);
  const paths = pack.receipts.map((r) => r.path);
  const { data: signed } = paths.length ? await server.storage.from("documents").createSignedUrls(paths, 60 * 60) : { data: [] };
  const urls: Record<string, string> = Object.fromEntries((signed ?? []).flatMap((x) => (x.path && x.signedUrl ? [[x.path, x.signedUrl]] : [])));
  const name = profile.company_name || profile.full_name || "";
  const label = `Kwartaal ${q.q} · ${q.year}`;
  const asked = (field: "receipt_id" | "invoice_id", id: string) => questions.filter((x) => x[field] === id);

  const Ask = ({ receiptId, invoiceId }: { receiptId: string | null; invoiceId: string | null }) => (
    <details className="mt-1">
      <summary className="cursor-pointer text-sm font-semibold text-orange-700">💬 Vraag stellen</summary>
      <form action={askAccountantQuestion.bind(null, token, receiptId, invoiceId)} className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3">
        <select name="kind" defaultValue={invoiceId ? "paid" : receiptId ? "business" : "other"} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base">
          {QUESTION_KINDS.filter((k) => (invoiceId ? ["paid", "what", "other"] : receiptId ? ["business", "what", "unreadable", "company", "other"] : ["other"]).includes(k)).map((k) => (
            <option key={k} value={k}>
              {QUESTION_NL[k]}
            </option>
          ))}
        </select>
        <textarea
          name="body"
          rows={2}
          maxLength={500}
          placeholder="Toelichting (optioneel, verplicht bij «Andere vraag»)"
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
        />
        <SubmitButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Versturen</SubmitButton>
      </form>
    </details>
  );
  const Thread = ({ list }: { list: Question[] }) =>
    list.length ? (
      <ul className="mt-1 space-y-1 text-sm">
        {list.map((x) => (
          <li key={x.id} className="rounded-lg bg-slate-50 px-2.5 py-1.5">
            <span className="text-slate-600">❓ {x.kind === "other" ? x.body : QUESTION_NL[x.kind]}</span>
            {x.kind !== "other" && x.body ? <span className="text-slate-500"> — {x.body}</span> : null}
            <br />
            {x.answered_at ? (
              <span className="text-green-800">
                ✓ {[x.answer_kind && ANSWER_NL[x.answer_kind], x.answer].filter(Boolean).join(" ")}
              </span>
            ) : (
              <span className="text-slate-400">Nog geen antwoord</span>
            )}
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <main lang="nl" className="min-h-screen bg-slate-50">
      <HtmlLang lang="nl" />
      <header className="flex items-center gap-2 bg-slate-900 px-4 py-3 text-white">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-600 text-sm font-bold">H</span>
        <span className="min-w-0 truncate font-semibold">
          {name}
          {profile.kvk_number ? ` · KvK ${profile.kvk_number}` : ""}
        </span>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <div>
          <h1 className="text-2xl font-bold">{label}</h1>
          <p className="text-sm text-slate-600">
            {profile.btw_number ? `Btw-id ${profile.btw_number} · ` : ""}Aangifte uiterlijk {nlDate(vatDeadline(q))}
          </p>
        </div>

        {vraag === "ok" && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">✓ Vraag verstuurd. De ondernemer krijgt een melding in de eigen taal.</p>}
        {vraag === "leeg" && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Schrijf bij «Andere vraag» een korte toelichting.</p>}
        {vraag === "fout" && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">Versturen lukte niet. Probeer het later opnieuw.</p>}

        <section className={card}>
          <div className={row}>
            <span>Verkoopfacturen · {d.invoices.length}</span>
            <b>{eur(d.sales.incl)}</b>
          </div>
          {d.sales.byRate.map(([rate, v]) => (
            <div key={rate} className={row}>
              <span>Btw {rate}% over {eur(v.base)}</span>
              <b>{eur(v.vat)}</b>
            </div>
          ))}
          {d.sales.reverse > 0 && (
            <div className={row}>
              <span>Omzet btw verlegd</span>
              <b>{eur(d.sales.reverse)}</b>
            </div>
          )}
          {d.sales.kor > 0 && (
            <div className={row}>
              <span>Omzet KOR</span>
              <b>{eur(d.sales.kor)}</b>
            </div>
          )}
          <div className={row}>
            <span>Inkoopbonnen · {d.receipts.length} · voorbelasting</span>
            <b>{eur(d.purchases.vat)}</b>
          </div>
          {d.trips.length > 0 && (
            <div className={row}>
              <span>Zakelijke kilometers · {d.trips.length} ritten</span>
              <b>{Math.round(d.km).toLocaleString("nl-NL")} km</b>
            </div>
          )}
          <div className={row}>
            <span className="font-semibold">{d.toPay >= 0 ? "Te betalen btw (schatting)" : "Terug te ontvangen (schatting)"}</span>
            <b>{eur(Math.abs(d.toPay))}</b>
          </div>
        </section>

        <AccountantZip pack={pack} urls={urls} label="⬇ Alles downloaden (ZIP)" busyLabel="⏳ Bezig…" errorLabel="Downloaden lukte niet. Probeer het opnieuw." />
        <p className="text-center text-xs text-slate-500">Facturen als PDF, foto&apos;s van bonnen, CSV-tabellen (puntkomma) en een btw-overzicht.</p>

        {d.invoices.length > 0 && (
          <section className={card}>
            <h2 className="mb-1 font-semibold">Verkoopfacturen</h2>
            <ul>
              {d.invoices.map((i) => (
                <li key={i.id} className="border-b border-slate-100 py-2.5 last:border-0">
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <b>{i.number}</b> · {nlDate(i.invoice_date)} · {i.client_name || "—"}
                      <span className="block text-xs text-slate-500">
                        {{ normal: "Btw", reverse: "Btw verlegd", kor: "KOR" }[i.vat_mode]} · {i.status === "paid" ? `Betaald ${nlDate(i.paid_at)}` : "Open"} ·{" "}
                        <a href={`/f/${i.public_token}`} target="_blank" rel="noopener" className="underline">
                          Bekijk
                        </a>
                      </span>
                    </span>
                    <b className="shrink-0">{eur(invoiceTotals(i.lines, i.vat_mode).incl)}</b>
                  </div>
                  <Thread list={asked("invoice_id", i.id)} />
                  <Ask receiptId={null} invoiceId={i.id} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {d.receipts.length > 0 && (
          <section className={card}>
            <h2 className="mb-1 font-semibold">Inkoopbonnen</h2>
            <ul>
              {d.receipts.map((r) => (
                <li key={r.id} className="border-b border-slate-100 py-2.5 last:border-0">
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <b>{r.store_name || "Bon"}</b> · {nlDate(r.purchased_on ?? r.created_at)}
                      <span className="block text-xs text-slate-500">
                        {r.vat_total !== null ? `btw ${eur(toNum(r.vat_total))}` : "bedrag niet gelezen"}
                        {r.addressed_to_company === false ? " · niet op bedrijfsnaam" : ""} ·{" "}
                        {urls[r.file_path] && (
                          <a href={urls[r.file_path]} target="_blank" rel="noopener" className="underline">
                            Foto
                          </a>
                        )}
                      </span>
                    </span>
                    <b className="shrink-0">{r.total_incl_vat !== null ? eur(toNum(r.total_incl_vat)) : "—"}</b>
                  </div>
                  <Thread list={asked("receipt_id", r.id)} />
                  <Ask receiptId={r.id} invoiceId={null} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="vragen" className={`${card} scroll-mt-4`}>
          <h2 className="mb-1 font-semibold">Algemene vraag</h2>
          <Thread list={questions.filter((x) => !x.receipt_id && !x.invoice_id)} />
          <Ask receiptId={null} invoiceId={null} />
        </section>

        <p className="text-center text-xs text-slate-500">
          Samengesteld door Haaks uit de administratie van de ondernemer. De ondernemer ziet uw vragen vertaald in de eigen taal en antwoordt hier.
        </p>
      </div>
      <PublicFooter />
    </main>
  );
}
