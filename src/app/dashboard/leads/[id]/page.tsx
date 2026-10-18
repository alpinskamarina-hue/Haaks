import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteLead, leadToQuote, setLeadStatus } from "@/app/leads-actions";
import { CopyButton } from "@/components/CopyButton";
import { emailLink, scoreColor, SOURCE_LABELS, whatsappLink, type Lead } from "@/lib/leads";
import { loadWorkspace, signedUrls } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, t } = await loadWorkspace();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).maybeSingle<Lead>();
  if (!lead) notFound();

  const image = lead.image_path ? (await signedUrls(supabase, [lead.image_path])).get(lead.image_path) : null;
  const wa = whatsappLink(lead.client_contact, lead.reply_nl);
  const mail = emailLink(lead.client_contact, lead.title ?? "Uw klus", lead.reply_nl);
  const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm";
  const facts: [string, string | null][] = [
    [t.city, lead.city],
    [t.leadTrade, lead.trade],
    [t.leadTiming, lead.timing],
    [t.clientName, lead.client_name],
    [t.leadContact, lead.client_contact],
  ];

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href="/dashboard/leads" className="text-sm text-slate-600 underline">
        ← {t.leadsTitle}
      </Link>

      <section className={card}>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
            {lead.source === "manual" ? t.leadSourceManual : (lead.source_name ?? SOURCE_LABELS[lead.source])}
          </span>
          {lead.source_url && (
            <a href={lead.source_url} target="_blank" className="underline">
              {t.leadOriginal}
            </a>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold">{lead.title ?? t.leadsTitle}</h1>
        {lead.match_score !== null && (
          <p className="mt-2 flex items-start gap-2 text-sm">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${scoreColor(lead.match_score)}`}>
              {lead.match_score}%
            </span>
            <span className="text-slate-600">{lead.match_reason}</span>
          </p>
        )}
        {lead.summary && <p className="mt-3 text-slate-800">{lead.summary}</p>}
        {lead.ai_status === "skipped" && <p className="mt-3 text-sm text-amber-700">{t.aiUnavailable}</p>}
        {lead.ai_status === "failed" && <p className="mt-3 text-sm text-amber-700">{t.leadFailed}</p>}
        {lead.is_job === false && <p className="mt-3 text-sm text-slate-600">{t.leadNotJob}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {facts
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <form action={leadToQuote.bind(null, lead.id)}>
            <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
              {t.leadMakeQuote}
            </button>
          </form>
          {lead.status !== "replied" && (
            <form action={setLeadStatus.bind(null, lead.id, "replied")}>
              <button className={button}>{t.leadMarkReplied}</button>
            </form>
          )}
          {lead.status !== "dismissed" ? (
            <form action={setLeadStatus.bind(null, lead.id, "dismissed")}>
              <button className={button}>{t.leadDismiss}</button>
            </form>
          ) : (
            <form action={setLeadStatus.bind(null, lead.id, "new")}>
              <button className={button}>{t.leadRestore}</button>
            </form>
          )}
          <form action={deleteLead.bind(null, lead.id)}>
            <button className={`${button} text-red-700`}>{t.delete}</button>
          </form>
        </div>
      </section>

      {lead.reply_nl && (
        <section className={card}>
          <h2 className="font-semibold">{t.leadReplyTitle}</h2>
          <p className="mb-3 text-sm text-slate-600">{t.leadReplyHint}</p>
          <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm">{lead.reply_nl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton value={lead.reply_nl} label={t.copyText} />
            {wa && (
              <a href={wa} target="_blank" className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white">
                WhatsApp
              </a>
            )}
            {mail && (
              <a href={mail} className={button}>
                E-mail
              </a>
            )}
          </div>
        </section>
      )}

      <section className={card}>
        <details>
          <summary className="cursor-pointer font-semibold">{t.leadOriginal}</summary>
          {lead.raw_text && <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{lead.raw_text}</p>}
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="mt-3 max-h-96 rounded-lg" />
          )}
        </details>
      </section>
    </main>
  );
}
