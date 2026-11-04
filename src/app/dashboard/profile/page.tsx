import Link from "next/link";
import { signOut } from "@/app/actions";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PasswordForm } from "@/components/PasswordForm";
import { saveRate, setAvailability, setInSearch, setUsername } from "@/app/profile-actions";
import { CopyButton } from "@/components/CopyButton";
import { siteUrl } from "@/lib/lang";
import { getSocialDict } from "@/lib/social-i18n";
import { suggestUsername } from "@/lib/username";
import { SubmitButton } from "@/components/SubmitButton";
import { AvatarUpload } from "@/components/AvatarUpload";
import { WorkPhotos } from "@/components/WorkPhotos";
import { docStatus, type DocumentRow } from "@/lib/documents";
import { AVAILABILITY, completeness, withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { describeProfile, getWorkerDict } from "@/lib/worker-profile-text";
import { loadWorkspace, signedUrls } from "@/lib/workspace";
import { getWorksDict } from "@/lib/works-i18n";
import { RatingSummary } from "@/components/RatingSummary";
import { ratingSummary, type Review } from "@/lib/reviews";
import { getReviewsDict } from "@/lib/reviews-i18n";

const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const MISSING_ICON: Record<string, string> = {
  trades: "🛠", region: "📍", languages: "💬", vehicle: "🚐", tools: "🧰", team: "👷",
  rate: "💶", availability: "📅", photos: "📷", kvk: "📄",
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
  photos: "#photos",
  kvk: "/dashboard/passport",
};

// "My profile": what clients see about the worker, and what to add next.
export default async function MyProfile({ searchParams }: { searchParams: Promise<{ nick?: string }> }) {
  const { nick } = await searchParams;
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const so = getSocialDict(lang);
  const username = (profile as typeof profile & { username?: string | null }).username ?? null;
  const profileUrl = username ? `${await siteUrl()}/@${username}` : null;
  const inSearch = Boolean((profile as typeof profile & { in_search?: boolean }).in_search);
  const w = getWorkerDict(lang);
  const p = withDefaults(profile as unknown as Partial<WorkerProfile>);
  const { data: docRows } = await supabase.from("documents").select("*").eq("user_id", user.id).returns<DocumentRow[]>();
  const docs = (docRows ?? []).filter((d) => docStatus(d) !== "expired");
  const score = completeness(p, docs);
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
  const rv = getReviewsDict(lang);
  const { data: reviewRows } = await supabase.from("reviews").select("*").eq("worker_id", user.id).eq("status", "submitted").returns<Review[]>();
  const rating = ratingSummary(reviewRows ?? []);
  const workCovers = works.slice(0, 3).flatMap((x) => x.photos_after.slice(0, 1));
  const urls = await signedUrls(supabase, [...p.work_photos, ...workCovers, ...(profile.avatar_path ? [profile.avatar_path] : [])]);
  const name = profile.full_name || profile.company_name || user.email || "";
  const initials = name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
  const rate = Number(p.hourly_rate) > 0 ? Number(p.hourly_rate) : null;

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

      <section className={card}>
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
            <p className="text-sm text-slate-600">{d.trades.map((x) => x.name).join(" · ")}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
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
                      {MISSING_ICON[m.key]} {w.missing[m.key]}
                    </span>
                    <span className="font-semibold text-orange-700">+{m.gain}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section id="nick" className={card}>
        <h2 className="font-semibold">{so.nickTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{so.nickHint}</p>
        <form action={setUsername} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:ring-2 focus-within:ring-orange-400">
            <span className="font-semibold text-slate-400">@</span>
            <input
              name="username"
              defaultValue={username ?? suggestUsername(profile.full_name)}
              maxLength={30}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label={so.nickTitle}
              className="min-w-0 flex-1 py-2 pl-0.5 text-base outline-none"
            />
          </label>
          <SubmitButton className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{so.nickSave}</SubmitButton>
        </form>
        {nick === "saved" && <p className="mt-2 text-sm font-medium text-green-700">✓ {so.nickSaved}</p>}
        {nick === "taken" && <p className="mt-2 text-sm font-medium text-red-700">{so.nickTaken}</p>}
        {nick === "bad" && <p className="mt-2 text-sm font-medium text-red-700">{so.nickBad}</p>}
        {profileUrl && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <a href={`/@${username}`} className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white">
              👤 {so.nickOpen}
            </a>
            <CopyButton value={profileUrl} label={so.share} />
          </div>
        )}
        {profileUrl && !profile.passport_enabled && <p className="mt-2 text-xs text-amber-700">{so.nickPassportOff}</p>}
        {username && (
          <form action={setInSearch.bind(null, !inSearch)} className="mt-4 border-t border-slate-100 pt-3">
            <button className="flex w-full items-center justify-between gap-3 text-left">
              <span>
                <span className="block font-semibold">🔍 {so.inSearch}</span>
                <span className="block text-xs text-slate-500">{so.inSearchHint}</span>
              </span>
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${inSearch ? "bg-green-600" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${inSearch ? "left-[22px]" : "left-0.5"}`} />
              </span>
            </button>
          </form>
        )}
      </section>

      <section id="availability" className={card}>
        <form action={setAvailability} className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="font-semibold">{w.availableTitle}</span>
            <input type="checkbox" name="available" defaultChecked={p.available} className="peer sr-only" />
            <span className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-green-600 after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-400" />
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium">
              {w.availableFrom}
              <input
                type="date"
                name="available_from"
                defaultValue={p.available_from ?? ""}
                className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-base"
              />
            </label>
            <div className="flex gap-1.5 text-sm">
              {AVAILABILITY.map((a) => (
                <label key={a} className="cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    value={a}
                    defaultChecked={(p.availability ?? "full") === a}
                    className="peer sr-only"
                  />
                  <span className="block rounded-lg border border-slate-300 px-3 py-2 peer-checked:border-2 peer-checked:border-orange-600 peer-checked:bg-orange-50 peer-checked:font-semibold peer-checked:text-orange-700">
                    {w.availability[a]}
                  </span>
                </label>
              ))}
            </div>
            <SubmitButton className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {w.saveChanges}
            </SubmitButton>
          </div>
        </form>
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

      <section id="reviews" className={card}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">
              ⭐ {rv.title} · {rating.n}
            </p>
            <p className="text-sm text-slate-600">{rv.profileHint}</p>
          </div>
          <Link href="/dashboard/reviews" className="shrink-0 text-sm font-medium text-orange-700 underline">
            {rv.nav} →
          </Link>
        </div>
        <RatingSummary summary={rating} criteria={rv.criteria} averageText={rv.average} newcomerText={rv.newcomer} />
      </section>

      <section id="works" className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">
              {wk.title} · {works.length}
            </p>
            <p className="text-sm text-slate-600">{wk.profileHint}</p>
          </div>
          <Link href="/dashboard/works" className="shrink-0 text-sm font-medium text-orange-700 underline">
            {wk.nav} →
          </Link>
        </div>
        {workCovers.length > 0 ? (
          <Link href="/dashboard/works" className="mt-3 grid grid-cols-3 gap-2">
            {workCovers.map((path) => (
              <span key={path} className="block aspect-square overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {urls.get(path) && <img src={urls.get(path)} alt="" className="h-full w-full object-cover" />}
              </span>
            ))}
          </Link>
        ) : (
          <Link href="/dashboard/works/new" className="mt-3 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
            {wk.add}
          </Link>
        )}
      </section>

      <section id="photos" className={card}>
        <p className="font-semibold">{w.photosTitle}</p>
        <p className="mb-3 text-sm text-slate-600">{w.photosHint}</p>
        <WorkPhotos
          t={t}
          w={w}
          userId={user.id}
          photos={p.work_photos.map((path) => ({ path, url: urls.get(path) ?? null }))}
        />
      </section>

      {/* Account settings live here (moved from the header): e-mail, language, password, sign out. */}
      <section id="settings" className={card}>
        <p className="mb-3 text-lg font-semibold">⚙️ {t.settingsTitle}</p>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">{t.emailLabel}</p>
            <p className="font-medium break-all">{user.email}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{t.language}</p>
            <LanguageSwitcher current={lang} label={t.language} up alignRight />
          </div>
          <div className="border-t border-slate-200 pt-4">
            <p className="mb-2 flex items-center gap-2 font-medium">
              <Icon name="key" className="h-4 w-4" />
              {t.navPassword}
            </p>
            <PasswordForm t={t} />
          </div>
          <form action={signOut} className="border-t border-slate-200 pt-4">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700">
              <Icon name="logout" className="h-4 w-4" />
              {t.signOut}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
