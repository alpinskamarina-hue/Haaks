import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FirmAboutView, type AboutFirm as Firm } from "@/components/FirmAboutView";
import { FirmOfferState, type Offer } from "@/components/FirmOfferState";
import { distanceKm } from "@/lib/feed";
import { fill } from "@/lib/feed-i18n";
import { loadFirmAbout } from "@/lib/firm-about";
import { getFirmAboutDict, type FirmAboutDict } from "@/lib/firm-about-i18n";
import { getFirmOfferDict } from "@/lib/firm-offer-i18n";
import { mapsLink } from "@/lib/firms";
import { getFirmsDict } from "@/lib/firms-i18n";
import type { Lang } from "@/lib/i18n";
import { createServerAccountClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/workspace";


const button = "rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-semibold text-purple-800";
const box = "rounded-2xl border border-slate-200 bg-white p-4";

// «О компании»: a short card about one firm so the builder doesn't have to study its website.
export default async function FirmAboutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, lang } = await loadWorkspace();
  const t = getFirmAboutDict(lang);
  const f = getFirmsDict(lang);
  const o = getFirmOfferDict(lang);
  const [{ data: firm }, { data: offer }] = await Promise.all([
    supabase
      .from("nearby_firms")
      .select("id, place_id, name, address, phone, website, rating, review_count, lat, lng, categories, about, about_at")
      .eq("id", id)
      .maybeSingle<Firm>(),
    supabase.from("firm_offers").select("firm_id, channel, sent_at, outcome").eq("firm_id", id).maybeSingle<Offer>(),
  ]);
  if (!firm) notFound();

  const home = profile as { home_lat?: number | null; home_lng?: number | null };
  const km = distanceKm(firm, { lat: home.home_lat ?? null, lng: home.home_lng ?? null });
  const dateFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang, { day: "numeric", month: "short" });

  return (
    <main className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      <Link href="/dashboard/leads/firms" className="text-sm text-slate-500">
        ← {f.title}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{firm.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {[km != null ? `📍 ${fill(t.kmAway, { n: String(Math.round(km)) })}` : null, firm.address].filter(Boolean).join(" · ")}
        </p>
      </div>

      <Suspense fallback={<p className={`${box} animate-pulse text-slate-500`}>{t.loading}</p>}>
        <AboutBody firm={firm} lang={lang} t={t} />
      </Suspense>

      <FirmOfferState offer={offer ?? undefined} firmId={firm.id} o={o} dateFmt={dateFmt} />
      <div className="flex flex-wrap gap-2">
        {firm.website && (
          <a href={firm.website} target="_blank" rel="noopener noreferrer" className={button}>
            {f.site}
          </a>
        )}
        {firm.phone && (
          <a href={`tel:${firm.phone.replace(/\s/g, "")}`} className={button}>
            📞 {f.call}
          </a>
        )}
        <a href={mapsLink(firm)} target="_blank" rel="noopener noreferrer" className={button}>
          {f.map}
        </a>
      </div>
    </main>
  );
}

async function AboutBody({ firm, lang, t }: { firm: Firm; lang: Lang; t: FirmAboutDict }) {
  const about = await loadFirmAbout(await createServerAccountClient(), firm, lang);
  return <FirmAboutView firm={firm} about={about} lang={lang} t={t} />;
}
