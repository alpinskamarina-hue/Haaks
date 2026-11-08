import Link from "next/link";
import { notFound } from "next/navigation";
import { FirmOfferForm } from "@/components/FirmOfferForm";
import { readiness, type DocumentRow } from "@/lib/documents";
import { getFirmOfferDict } from "@/lib/firm-offer-i18n";
import { gistValues, lookupFirmEmail, offerLinks, offerTextNl, waNumber, type OfferProfile } from "@/lib/firm-offer";
import { getFirmsDict } from "@/lib/firms-i18n";
import { freeLeft, limitText } from "@/lib/free-limits";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/workspace";
import { getWorkerDict } from "@/lib/worker-profile-text";

type Firm = { id: string; name: string; phone: string | null; website: string | null; email: string | null; email_checked_at: string | null };

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

// «Предложить себя»: a ready Dutch intro to one firm, sent from the builder's own WhatsApp or mail.
export default async function FirmOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile, lang } = await loadWorkspace();
  const t = getFirmOfferDict(lang);
  const { data: firm } = await supabase
    .from("nearby_firms")
    .select("id, name, phone, website, email, email_checked_at")
    .eq("id", id)
    .maybeSingle<Firm>();
  if (!firm) notFound();

  let email = firm.email;
  if (!email && !firm.email_checked_at && firm.website) {
    email = await lookupFirmEmail(await createServerAccountClient(), firm);
  }

  const [{ data: docs }, quota, site] = await Promise.all([
    supabase.from("documents").select("*").eq("user_id", user.id).returns<DocumentRow[]>(),
    freeLeft(supabase, "job_reply"),
    siteUrl(),
  ]);
  const p = profile as unknown as OfferProfile;
  const links = offerLinks(p, site);
  const ready = readiness(profile, docs ?? []);
  const missing = [!ready.kvk_number && "KvK", !(ready.vca) && "VCA"].filter(Boolean).join(", ");
  const nlTrades = (p.trades ?? []).filter((x) => x !== "other").map((x) => (getWorkerDict("nl").trades as Record<string, string>)[x]?.toLowerCase());
  const subject = `Onderaannemer beschikbaar${nlTrades[0] ? `: ${nlTrades[0]}` : ""}${p.city ? ` (${p.city})` : ""}`;
  const lim = limitText(lang, "job_reply");

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <Link href="/dashboard/leads/firms" className="text-sm text-slate-500">
        ← {getFirmsDict(lang).title}
      </Link>
      <h1 className="text-2xl font-bold">{fill(t.title, { firm: firm.name })}</h1>

      {!links.passport ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {t.noPassport}{" "}
          <Link href="/dashboard/settings" className="font-semibold underline">
            ⚙
          </Link>
        </p>
      ) : missing ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {fill(t.missing, { list: missing })}{" "}
          <Link href="/dashboard/passport" className="font-semibold underline">
            {t.fixPassport}
          </Link>
        </p>
      ) : (
        <p className="text-sm font-medium text-green-700">{t.ready}</p>
      )}

      <div className="rounded-xl bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-200">
        <span className="font-semibold text-slate-800">{t.meaning}: </span>
        {t.gist(gistValues(p, lang))}
      </div>

      <FirmOfferForm
        firmId={firm.id}
        initial={offerTextNl(p, links)}
        subject={subject}
        wa={waNumber(firm.phone)}
        email={email}
        t={{
          edit: t.edit,
          whatsapp: t.whatsapp,
          email: t.email,
          copy: t.copy,
          copied: t.copied,
          noEmail: t.noEmail,
          error: t.error,
          limit: fill(lim.none, { h: quota.hours || 24 }),
        }}
      />
      {!quota.pro && <p className="text-center text-xs text-slate-400">{fill(lim.left, { n: quota.left })}</p>}
    </main>
  );
}
