import Link from "next/link";
import { enableVisibility, saveRate } from "@/app/profile-actions";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/SubmitButton";
import { AvatarUpload } from "@/components/AvatarUpload";
import { AboutForm, AvailabilityNow } from "@/components/ProfileAbout";
import { ShareButton } from "@/components/ShareButton";
import { docStatus, type DocumentRow } from "@/lib/documents";
import { completeness, withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { aboutFacts, cleanStrengths, getAboutDict, isExperience } from "@/lib/profile-about";
import { siteUrl } from "@/lib/lang";
import { getShareDict } from "@/lib/share-i18n";
import { suggestUsername } from "@/lib/username";
import { describeProfile, getWorkerDict } from "@/lib/worker-profile-text";
import { loadWorkspace, signedUrls } from "@/lib/workspace";
import { getWorksDict } from "@/lib/works-i18n";
import { RatingSummary } from "@/components/RatingSummary";
import { ratingSummary, type Review } from "@/lib/reviews";
import { getReviewsDict } from "@/lib/reviews-i18n";
import { getSettingsDict } from "@/lib/settings-i18n";

const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const MISSING_ICON: Record<string, string> = {
  trades: "🛠", region: "📍", languages: "💬", vehicle: "🚐", tools: "🧰", team: "👷",
  rate: "💶", availability: "📅", photos: "📷", kvk: "📄", about: "✍️",
};
const MISSING_LINK: Record<string, string> = {
  trades: "/dashboard/onboarding?step=1&edit=1",
  region: "/dashboard/onboarding?step=2&edit=1",
  languages: "/dashboard/onboarding?step=3&edit=1",
  vehicle: "/dashboard/onboarding?step=4&edit=1",
  tools: "/dashboard/onboarding?step=4&edit=1",
  team: "/dashboard/onboarding?step=4&edit=1",
  rate: "#rate",
  availability: "#availability",
  photos: "/dashboard/works/new",
  about: "#about",
  kvk: "/dashboard/passport",
};

// "My profile": what clients see about the worker, and what to add next.
export default async function MyProfile({ searchParams }: { searchParams: Promise<{ nick?: string; saved?: string }> }) {
  // The nickname moved to Settings; old links land there.
  const { nick, saved } = await searchParams;
  if (nick) redirect(`/dashboard/settings?nick=${encodeURIComponent(nick)}#nick`);
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const w = getWorkerDict(lang);
  const p = withDefaults(profile as unknown as Partial<WorkerProfile>);
  const { data: docRows } = await supabase.from("documents").select("*").eq("user_id", user.id).returns<DocumentRow[]>();
  const docs = (docRows ?? []).filter((d) => docStatus(d) !== "expired");
  const a = getAboutDict(lang);
  const d = describeProfile(p, w, lang);
  const wk = getWorksDict(lang);
  const { data: workRows } = await supabase
    .from("works")
    .select("id, photos_after")
    .eq("user_id", user.id)
    .order("done_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<{ id: string; photos_after: string[] }[]>();
  const works = workRows ?? [];
  const score = completeness(p, docs, works.length);
  const rv = getReviewsDict(lang);
  const { data: reviewRows } = await supabase.from("reviews").select("*").eq("worker_id", user.id).eq("status", "submitted").returns<Review[]>();
  const rating = ratingSummary(reviewRows ?? []);
  const workCovers = works.slice(0, 3).flatMap((x) => x.photos_after.slice(0, 1));
  const urls = await signedUrls(supabase, [...workCovers, ...(profile.avatar_path ? [profile.avatar_path] : [])]);
  const name = profile.full_name || profile.company_name || user.email || "";
  const initials = name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
  const rate = Number(p.hourly_rate) > 0 ? Number(p.hourly_rate) : null;

  // What a client sees, and whether anyone can find the builder at all.
  const vis = profile as typeof profile & { username?: string | null; in_search?: boolean };
  const username = vis.username ?? null;
  const open = Boolean(profile.passport_enabled);
  const publicPath = open ? (username ? `/@${username}` : `/p/${profile.passport_token}`) : null;
  const publicUrl = publicPath ? `${await siteUrl()}${publicPath}` : null;
  const reasons = [!open && a.rClosed, !username && a.rNoNick, !vis.in_search && a.rNoSearch].filter((x): x is string => Boolean(x));
  const nickToBe = username ?? (suggestUsername(profile.full_name) || "zzp");
  const dn = describeProfile(p, getWorkerDict("nl"), "nl");
  const nlFacts = aboutFacts(p, profile.full_name, "nl");
  const availState = p.available ? "free" : p.available_from ? "from" : "busy";
  const sh = getShareDict(lang);

  const rows: { label: string; value: string; href: string }[] = [
    { label: w.rowName, value: profile.full_name ?? "", href: "?step=0" },
    { label: w.rowPhone, value: profile.phone ?? "", href: "?step=0" },
    { label: w.rowTrades, value: d.trades.map((x) => [x.name, x.detail].filter(Boolean).join(", ")).join("\n"), href: "?step=1" },
    { label: w.rowRegion, value: d.region, href: "?step=2" },
    { label: w.rowLanguages, value: d.languages.map((x) => `${x.name} (${x.level.toLowerCase()})`).join(", "), href: "?step=3" },
    { label: w.rowTransport, value: d.transport, href: "?step=4" },
    { label: w.rowTools, value: d.tools, href: "?step=4" },
    { label: w.rowTeam, value: d.team, href: "?step=4" },
  ];
  const docBadges = [
    { type: "kvk_extract", name: "KvK" },
    { type: "vca", name: "VCA" },
    { type: "avb", name: "AVB" },
  ].map((b) => ({ ...b, ok: docs.some((x) => x.doc_type === b.type) }));

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">{w.profileTitle}</h1>

      <section className="rounded-2xl border-2 border-dashed border-orange-300 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm text-slate-500">{a.seeAs}</p>
        <div className="flex items-center gap-4">
          <AvatarUpload
            t={t}
            w={w}
            userId={user.id}
            url={profile.avatar_path ? (urls.get(profile.avatar_path) ?? null) : null}
            initials={initials}
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{name}</p>
            <p className="text-sm text-slate-600">{[dn.trades.map((x) => x.name).join(" · "), dn.region].filter(Boolean).join(" · ")}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              {rating.showAverage && rating.avg ? (
                <span className="font-semibold text-amber-600">
                  ★ {rating.avg.toFixed(1)} · {rating.n}
                </span>
              ) : (
                <span className="text-slate-500">{a.newcomer}</span>
              )}
              {docBadges.some((b) => b.ok) && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">
                  ✓ {docBadges.filter((b) => b.ok).map((b) => b.name).join(" · ")}
                </span>
              )}
            </p>
          </div>
        </div>
        <Link href="#about" lang="nl" className="mt-3 block rounded-xl bg-slate-50 p-3 text-sm italic leading-snug text-slate-700">
          {p.about ? `„${p.about.length > 160 ? `${p.about.slice(0, 157).trimEnd()}…` : p.about}”` : <span className="not-italic text-slate-400">{a.noAbout}</span>}
        </Link>
        {publicPath && publicUrl && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
            <a href={publicPath} className="rounded-xl border border-orange-600 py-2.5 text-center text-orange-700">
              👁 {a.open}
            </a>
            <ShareButton
              url={publicUrl}
              text={name}
              labels={sh}
              className="w-full rounded-xl bg-orange-600 py-2.5 text-center text-white"
            />
          </div>
        )}
      </section>

      {reasons.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p>
            <b>{a.hidden}:</b> {reasons.join(", ")}.
          </p>
          <form action={enableVisibility} className="mt-3">
            <SubmitButton className="w-full rounded-xl bg-slate-900 py-2.5 font-bold text-white disabled:opacity-60">
              {a.enable.replace("{nick}", nickToBe)}
            </SubmitButton>
          </form>
          <p className="mt-2 text-xs text-red-800">{a.enableHint}</p>
        </section>
      )}

      <section className={card}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{w.filled.replace("{p}", String(score.percent))}</span>
          <span className="text-slate-500">
            {score.done} / {score.total}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 rounded-full bg-slate-100">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-orange-600"
            style={{ width: `${score.percent}%` }}
          />
        </div>
        {score.missing.length > 0 && (
          <>
            <p className="mt-2 text-sm text-slate-600">{w.filledHint}</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {score.missing.slice(0, 3).map((m) => (
                <li key={m.key}>
                  <Link
                    href={MISSING_LINK[m.key]!}
                    className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 hover:bg-orange-100"
                  >
                    <span>
                      {MISSING_ICON[m.key]} {m.key === "about" ? a.missingAbout : m.key === "photos" ? a.missingWork : w.missing[m.key]}
                    </span>
                    <span className="font-semibold text-orange-700">+{m.gain}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section id="about" className={`${card} scroll-mt-20`}>
        <p className="font-semibold">{a.aboutTitle}</p>
        <p className="mb-3 text-sm text-slate-600">{a.aboutHint}</p>
        {saved === "about" && <p className="mb-2 text-sm font-medium text-green-700">{a.saved}</p>}
        <AboutForm
          a={a}
          nl={nlFacts}
          mine={lang === "nl" ? null : aboutFacts(p, profile.full_name, lang)}
          initial={{
            exp: isExperience(p.experience_years) ? p.experience_years : null,
            strengths: cleanStrengths(p.strengths),
            about: p.about,
          }}
        />
      </section>

      <section id="availability" className={`${card} scroll-mt-20`}>
        <p className="mb-2 font-semibold">{a.nowTitle}</p>
        <AvailabilityNow a={a} state={availState} from={p.available_from} />
      </section>

      <section id="works" className={`${card} scroll-mt-20`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">
              🧱 {wk.title} · {works.length}
            </p>
            <p className="text-sm text-slate-600">{a.worksHint}</p>
          </div>
          {works.length > 0 && (
            <Link href="/dashboard/works" className="shrink-0 text-sm font-semibold text-orange-700">
              {a.all}
            </Link>
          )}
        </div>
        {workCovers.length > 0 && (
          <Link href="/dashboard/works" className="mt-3 grid grid-cols-3 gap-2">
            {workCovers.map((path) => (
              <span key={path} className="block aspect-square overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {urls.get(path) && <img src={urls.get(path)} alt="" className="h-full w-full object-cover" />}
              </span>
            ))}
          </Link>
        )}
        <Link href="/dashboard/works/new" className="mt-3 block rounded-xl border border-orange-600 py-2.5 text-center text-sm font-bold text-orange-700">
          {a.addWork}
        </Link>
      </section>

      <section id="reviews" className={card}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="font-semibold">
            ⭐ {rv.title} · {rating.n}
          </p>
          <Link href="/dashboard/reviews" className="shrink-0 text-sm font-semibold text-orange-700">
            {rv.nav} →
          </Link>
        </div>
        {rating.n > 0 ? (
          <RatingSummary summary={rating} criteria={rv.criteria} averageText={rv.average} newcomerText={rv.newcomer} />
        ) : (
          <>
            <p className="text-sm text-slate-600">{a.reviewsEmpty}</p>
            <ol className="mt-2 space-y-1.5 text-sm">
              {a.steps.map((step, i) => (
                <li key={step} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <section className={card}>
        <p className="mb-3 font-semibold">{w.myData}</p>
        <dl className="divide-y divide-slate-100 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-3 py-2.5">
              <dt className="shrink-0 text-slate-500">{r.label}</dt>
              <dd className="flex min-w-0 items-start gap-3 text-right">
                {r.value ? (
                  <span className="whitespace-pre-line">{r.value}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
                <Link href={`/dashboard/onboarding${r.href}&edit=1`} className="shrink-0 font-medium text-orange-700">
                  {r.value ? w.edit : w.add}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
        <form id="rate" action={saveRate} className="mt-2 flex items-end gap-2 border-t border-slate-100 pt-3">
          <label className="flex-1 text-sm text-slate-500">
            {w.rateLabel}
            <input
              name="hourly_rate"
              inputMode="decimal"
              defaultValue={rate ?? ""}
              placeholder="45"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <SubmitButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {w.saveChanges}
          </SubmitButton>
        </form>
      </section>

      <section className={card}>
        <p className="font-semibold">{w.documents}</p>
        <p className="mb-3 text-sm text-slate-600">{w.documentsHint}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          {docBadges.map((b) =>
            b.ok ? (
              <span key={b.type} className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800">
                ✓ {b.name}
              </span>
            ) : (
              <Link key={b.type} href="/dashboard/passport" className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                {w.docMissing.replace("{doc}", b.name)}
              </Link>
            ),
          )}
        </div>
      </section>

      <Link href="/dashboard/settings" className={`${card} flex items-center justify-between font-semibold`}>
        ⚙️ {getSettingsDict(lang).title}
        <span className="text-slate-300">›</span>
      </Link>
    </main>
  );
}
