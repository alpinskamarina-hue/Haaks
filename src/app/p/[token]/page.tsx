import type { Metadata } from "next";
import { HtmlLang } from "@/components/HtmlLang";
import { PassportPack } from "@/components/PassportPack";
import { PublicFooter } from "@/components/PublicFooter";
import { headers } from "next/headers";
import Link from "next/link";
import {
  docStatus,
  kvkSearchUrl,
  VCA_REGISTER_URL,
  VIES_URL,
  type DocumentRow,
  type Profile,
} from "@/lib/documents";
import { getPassportDict, type PassportDict } from "@/lib/i18n";
import { createServerAccountClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/lang";
import { packProps } from "@/lib/passport-pack";
import { PACK_TEXT } from "@/lib/passport-plus-i18n";
import { dutchToday } from "@/lib/quotes";
import { withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { describeProfile, getWorkerDict, PUBLIC_PROFILE } from "@/lib/worker-profile-text";
import { WorkCard } from "@/components/WorkCard";
import type { Work } from "@/lib/works";
import { PUBLIC_WORKS } from "@/lib/works-i18n";
import { RatingSummary } from "@/components/RatingSummary";
import { ReviewCard } from "@/components/ReviewCard";
import { Stars } from "@/components/Stars";
import { ratingSummary, ratingText, type Review } from "@/lib/reviews";
import { getReviewsDict, PUBLIC_REVIEWS } from "@/lib/reviews-i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ZZP-paspoort",
  robots: { index: false, follow: false },
};

const SIGNED_URL_SECONDS = 10 * 60;

export default async function PassportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const lang = (await searchParams).lang === "en" ? "en" : "nl";
  const t = getPassportDict(lang);

  const admin = await createServerAccountClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("passport_token", token)
    .eq("passport_enabled", true)
    .maybeSingle<Profile>();

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">{t.notFound}</main>
    );
  }

  const { data: docs } = await admin
    .from("documents")
    .select("*")
    .eq("user_id", profile.id)
    .eq("show_in_passport", true)
    .order("doc_type")
    .returns<DocumentRow[]>();
  const documents = docs ?? [];

  const { data: workRows } = await admin
    .from("works")
    .select("*")
    .eq("user_id", profile.id)
    .order("done_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<Work[]>();
  const works = workRows ?? [];
  const { data: reviewRows } = await admin
    .from("reviews")
    .select("*")
    .eq("worker_id", profile.id)
    .eq("status", "submitted")
    .eq("held", false)
    .lte("publish_at", new Date().toISOString())
    .order("submitted_at", { ascending: false })
    .limit(50)
    .returns<Review[]>();
  const rating = ratingSummary(reviewRows ?? []);
  const pr = PUBLIC_REVIEWS[lang];
  const rvCriteria = getReviewsDict(lang).criteria;

  const worker = withDefaults(profile as unknown as Partial<WorkerProfile>);
  const avatarPath = (profile as { avatar_path?: string | null }).avatar_path ?? null;
  const paths = [
    ...documents.map((d) => d.file_path),
    ...worker.work_photos,
    ...works.flatMap((x) => [...x.photos_after, ...x.photos_before]),
    ...(avatarPath ? [avatarPath] : []),
  ];
  const signed = paths.length
    ? (await admin.storage.from("documents").createSignedUrls(paths, SIGNED_URL_SECONDS)).data ?? []
    : [];
  const urlByPath = new Map(
    signed.flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])),
  );

  await admin.from("passport_views").insert({
    profile_id: profile.id,
    user_agent: (await headers()).get("user-agent")?.slice(0, 300) ?? null,
  });

  const hasVca = documents.some((d) => d.doc_type === "vca");
  const pack = documents.length
    ? await packProps({ profile, documents, urlOf: (p) => urlByPath.get(p), passportUrl: `${await siteUrl()}/p/${token}`, lang })
    : null;

  return (
    <main lang={lang} className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <HtmlLang lang={lang} />
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">{t.title}</p>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link href="?lang=nl" className={lang === "nl" ? "font-bold" : "text-slate-500"}>
            NL
          </Link>
          <Link href="?lang=en" className={lang === "en" ? "font-bold" : "text-slate-500"}>
            EN
          </Link>
        </nav>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          {avatarPath && urlByPath.get(avatarPath) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlByPath.get(avatarPath)} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name ?? profile.company_name ?? "—"}</h1>
            {rating.showAverage && rating.avg !== null ? (
              <a href="#reviews" className="flex flex-wrap items-center gap-x-1.5 text-sm">
                <Stars value={rating.avg} className="text-lg" />
                <b>{ratingText(rating.avg)}</b>
                <span className="whitespace-nowrap text-slate-500">· {pr.count.replace("{n}", String(rating.n))}</span>
              </a>
            ) : (
              <p className="text-sm text-sky-700">🆕 {pr.newcomer}</p>
            )}
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <Row label={t.company} value={profile.company_name} />
          <Row label={t.trade} value={profile.trade} />
          <Row label={t.city} value={profile.city} />
          <Row label={t.phone} value={profile.phone} />
          <Row label={t.kvk} value={profile.kvk_number} />
          <Row label={t.btw} value={profile.btw_number} />
        </dl>
        <div className="mt-4 flex flex-col gap-1 text-sm">
          {profile.kvk_number && (
            <a className="text-blue-700 underline" href={kvkSearchUrl(profile.kvk_number)} target="_blank" rel="noopener">
              {t.checkKvk} ↗
            </a>
          )}
          {profile.btw_number && (
            <a className="text-blue-700 underline" href={VIES_URL} target="_blank" rel="noopener">
              {t.checkVies} ↗
            </a>
          )}
          {hasVca && (
            <a className="text-blue-700 underline" href={VCA_REGISTER_URL} target="_blank" rel="noopener">
              {t.checkVca} ↗
            </a>
          )}
        </div>
      </section>

      <WorkerBlock worker={worker} lang={lang} photoUrls={worker.work_photos.flatMap((p) => urlByPath.get(p) ?? [])} />

      {rating.n > 0 && (
        <section id="reviews" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">
            {pr.reviews} · {rating.n}
          </h2>
          <RatingSummary summary={rating} criteria={rvCriteria} averageText={getReviewsDict(lang).average} newcomerText={pr.newcomer} />
          <div className="space-y-3">
            {rating.published.map((x) => (
              <ReviewCard
                key={x.id}
                review={x}
                lang={lang}
                criteria={rvCriteria}
                replyLabel={pr.reply.replace("{name}", (profile.full_name ?? "").split(" ")[0] || "ZZP")}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500">✓ {pr.verified}</p>
        </section>
      )}

      {works.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            {PUBLIC_WORKS[lang].title} · {works.length}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {works.map((x) => (
              <WorkCard
                key={x.id}
                work={x}
                lang={lang}
                trade={x.trade ? (getWorkerDict(lang).trades as Record<string, string>)[x.trade] ?? null : null}
                urls={urlByPath}
                labels={{ before: PUBLIC_WORKS[lang].before, after: PUBLIC_WORKS[lang].after }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">{t.documents}</h2>
        {pack && (
          <div className="mb-4">
            <PassportPack
              {...pack}
              label={PACK_TEXT[lang].button}
              busyLabel={lang === "nl" ? "PDF wordt gemaakt…" : "Making the PDF…"}
              errorLabel={lang === "nl" ? "Dat lukte niet. Vernieuw de pagina en probeer het opnieuw." : "That did not work. Refresh the page and try again."}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            />
          </div>
        )}
        <ul className="space-y-3">
          {documents.map((doc) => (
            <PassportDocument key={doc.id} doc={doc} t={t} url={urlByPath.get(doc.file_path)} />
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500">{t.disclaimer}</p>
      <PublicFooter />
    </main>
  );
}

// What the worker said about their trades, area, languages, transport and tools.
function WorkerBlock({ worker, lang, photoUrls }: { worker: WorkerProfile; lang: "nl" | "en"; photoUrls: string[] }) {
  const pt = PUBLIC_PROFILE[lang];
  const d = describeProfile(worker, getWorkerDict(lang), lang);
  const rate = Number(worker.hourly_rate) > 0 ? Number(worker.hourly_rate) : null;
  const today = dutchToday();
  const from = worker.available_from;
  const availability =
    from && from > today
      ? pt.availableFrom.replace(
          "{d}",
          new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(
            new Date(`${from}T00:00:00Z`),
          ),
        )
      : worker.available
        ? pt.available
        : null;
  const transport = d.transport && worker.vehicle !== "none" && worker.licences.length
    ? `${getWorkerDict(lang).vehicle[worker.vehicle as "car" | "van"]} · ${pt.licence.replace("{l}", worker.licences.join(", "))}`
    : d.transport;
  const tiles = [
    { label: pt.region, value: d.region },
    { label: pt.rate, value: rate ? `€ ${rate.toLocaleString("nl-NL")} / ${lang === "nl" ? "uur" : "hour"}` : "" },
    { label: pt.transport, value: transport },
    { label: pt.tools, value: d.tools },
    { label: pt.team, value: d.team },
  ].filter((x) => x.value);
  if (!tiles.length && !d.trades.length && !d.languages.length && !photoUrls.length && !availability) return null;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {availability && (
        <p className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-sm font-semibold text-green-800">
          ● {availability}
          {worker.availability === "part" ? ` · ${getWorkerDict(lang).availability.part.toLowerCase()}` : ""}
        </p>
      )}
      {tiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {tiles.map((x) => (
            <div key={x.label} className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-xs text-slate-500">{x.label}</p>
              <p className="font-medium">{x.value}</p>
            </div>
          ))}
        </div>
      )}
      {d.trades.length > 0 && (
        <div className="space-y-1.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{pt.crafts}</p>
          {d.trades.map((x) => (
            <div key={x.name} className="flex justify-between gap-3">
              <span>{x.name}</span>
              <span className="text-right font-medium">{x.detail}</span>
            </div>
          ))}
        </div>
      )}
      {d.languages.length > 0 && (
        <div className="space-y-1.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{pt.languages}</p>
          <div className="flex flex-wrap gap-1.5">
            {d.languages.map((x) => (
              <span key={x.name} className="rounded-full border border-slate-300 px-2 py-0.5">
                {x.name} · {x.level.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}
      {photoUrls.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{pt.work}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {photoUrls.map((u) => (
              <a key={u} href={u} target="_blank" rel="noopener" className="block aspect-square overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">{pt.footnote}</p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </>
  );
}

function PassportDocument({ doc, t, url }: { doc: DocumentRow; t: PassportDict; url?: string }) {
  const status = docStatus(doc);
  const badge = {
    valid: { label: t.valid, color: "bg-green-100 text-green-800" },
    expires_soon: { label: t.expiresSoon, color: "bg-amber-100 text-amber-800" },
    kvk_old: { label: t.kvkOld, color: "bg-amber-100 text-amber-800" },
    expired: { label: t.expired, color: "bg-red-100 text-red-800" },
  }[status];

  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{t.docTypes[doc.doc_type]}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <Row label={t.number} value={doc.document_number} />
        <Row label={t.insurer} value={doc.insurer} />
        <Row label={t.coverage} value={doc.coverage_amount} />
        <Row label={t.issued} value={doc.issued_on} />
        <Row label={t.expires} value={doc.expires_on} />
      </dl>
      {url && (
        <a href={url} target="_blank" rel="noopener" className="mt-2 inline-block text-sm text-blue-700 underline">
          {t.view} ↗
        </a>
      )}
    </li>
  );
}
