import type { Metadata } from "next";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import { SocialProfile, type SocialTab } from "@/components/SocialProfile";
import Link from "next/link";
import { docStatus, type DocumentRow } from "@/lib/documents";
import { isLang, type Lang } from "@/lib/i18n";
import { siteUrl } from "@/lib/lang";
import { dutchToday } from "@/lib/quotes";
import { ratingSummary, type Review } from "@/lib/reviews";
import { getReviewsDict } from "@/lib/reviews-i18n";
import { getSocialDict } from "@/lib/social-i18n";
import { createClient, createServerAccountClient } from "@/lib/supabase/server";
import { USERNAME_RE } from "@/lib/username";
import { withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { describeProfile, getWorkerDict } from "@/lib/worker-profile-text";
import type { Work } from "@/lib/works";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Haaks",
  robots: { index: false, follow: false },
};

type Row = WorkerProfile & {
  id: string;
  username: string;
  full_name: string | null;
  company_name: string | null;
  avatar_path: string | null;
  passport_token: string;
};

// Social-style public profile, reached at /@nick (next.config rewrites it here).
// Shown only while the builder's ZZP passport is switched on; contacts are never shown.
export default async function SocialProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string; lang?: string }>;
}) {
  const handle = decodeURIComponent((await params).handle).replace(/^@/, "").toLowerCase();
  const sp = await searchParams;
  const tab: SocialTab = sp.tab === "reviews" || sp.tab === "about" ? sp.tab : "works";

  // The viewer's own language when signed in; Dutch (or ?lang=en) for everyone else.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewer } = user
    ? await supabase.from("profiles").select("language, account_type").eq("id", user.id).maybeSingle()
    : { data: null };
  const lang: Lang = viewer && isLang(viewer.language) ? viewer.language : sp.lang === "en" ? "en" : "nl";
  const s = getSocialDict(lang);

  const admin = await createServerAccountClient();
  const { data: profile } = USERNAME_RE.test(handle)
    ? await admin.from("profiles").select("*").eq("username", handle).eq("passport_enabled", true).maybeSingle<Row>()
    : { data: null };
  if (!profile) {
    return (
      <main lang={lang} className="mx-auto max-w-xl px-4 py-16 text-center text-slate-600">
        <HtmlLang lang={lang} />
        {s.notFound}
      </main>
    );
  }

  const [{ data: docRows }, { data: workRows }, { data: reviewRows }] = await Promise.all([
    admin.from("documents").select("*").eq("user_id", profile.id).eq("show_in_passport", true).returns<DocumentRow[]>(),
    admin
      .from("works")
      .select("*")
      .eq("user_id", profile.id)
      .order("done_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(60)
      .returns<Work[]>(),
    admin
      .from("reviews")
      .select("*")
      .eq("worker_id", profile.id)
      .eq("status", "submitted")
      .eq("held", false)
      .lte("publish_at", new Date().toISOString())
      .order("submitted_at", { ascending: false })
      .limit(50)
      .returns<Review[]>(),
  ]);
  const docs = (docRows ?? []).filter((d) => docStatus(d) !== "expired");
  const works = workRows ?? [];
  const rating = ratingSummary(reviewRows ?? []);
  const worker = withDefaults(profile as unknown as Partial<WorkerProfile>);
  const w = getWorkerDict(lang);
  const d = describeProfile(worker, w, lang);
  const rv = getReviewsDict(lang);

  // One square per finished job (its first "after" photo), then the loose profile photos.
  const covers = works.flatMap((x) => {
    const path = x.photos_after[0] ?? x.photos_before[0];
    return path ? [{ path, title: x.title }] : [];
  });
  const loose = worker.work_photos.map((path) => ({ path, title: "" }));
  const paths = [...covers, ...loose].map((x) => x.path).concat(profile.avatar_path ? [profile.avatar_path] : []);
  const signed = paths.length ? ((await admin.storage.from("documents").createSignedUrls(paths, 600)).data ?? []) : [];
  const url = new Map(signed.flatMap((x) => (x.path && x.signedUrl ? [[x.path, x.signedUrl] as const] : [])));

  const name = profile.full_name || profile.company_name || `@${profile.username}`;
  const today = dutchToday();
  const from = worker.available_from;
  const availability =
    from && from > today
      ? s.availableFrom.replace(
          "{d}",
          new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${from}T00:00:00Z`)),
        )
      : worker.available
        ? s.available
        : null;
  const badges = [
    docs.some((x) => x.doc_type === "kvk_extract") ? "KvK" : null,
    docs.some((x) => x.doc_type === "vca") ? "VCA" : null,
    docs.some((x) => x.doc_type === "avb" || x.doc_type === "car") ? s.insurance : null,
  ].filter((x): x is string => Boolean(x));
  const base = await siteUrl();
  const own = user?.id === profile.id;

  return (
    <main className="min-h-screen bg-slate-50">
      <HtmlLang lang={lang} />
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-600 text-sm text-white">H</span>
          Haaks
        </Link>
      </header>
      <SocialProfile
        lang={lang}
        s={s}
        tab={tab}
        own={own}
        shareUrl={`${base}/@${profile.username}`}
        passportHref={`/p/${profile.passport_token}${lang === "en" ? "?lang=en" : ""}`}
        inviteHref={!own && viewer?.account_type === "company" ? "/company/builders" : null}
        signUpHref={user ? null : "/?mode=signup#signup"}
        p={{
          name,
          username: profile.username,
          avatarUrl: profile.avatar_path ? (url.get(profile.avatar_path) ?? null) : null,
          initials: name
            .replace(/^@/, "")
            .split(/[\s.]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((x) => x[0]!.toUpperCase())
            .join(""),
          headline: [d.trades.map((x) => x.name).join(" · "), d.region].filter(Boolean).join(" · "),
          rating: { n: rating.n, avg: rating.avg, showAverage: rating.showAverage },
          newcomerText: rv.newcomer,
          reviewsCountText: `${rating.n} ${s.reviewsN}`,
          badges,
          availability,
          worksCount: works.length,
          rate: Number(worker.hourly_rate) > 0 ? Number(worker.hourly_rate) : null,
          tiles: [...covers, ...loose].flatMap((x) => (url.get(x.path) ? [{ url: url.get(x.path)!, title: x.title }] : [])),
          reviews: rating.published,
          criteria: rv.criteria,
          replyLabel: `💬 ${name.split(" ")[0]}`,
          bio: worker.about,
          about: [
            { label: w.rowTrades, value: d.trades.map((x) => [x.name, x.detail].filter(Boolean).join(", ")).join("\n") },
            { label: w.rowRegion, value: d.region },
            { label: w.rowTransport, value: d.transport },
            { label: w.rowTools, value: d.tools },
            { label: w.rowTeam, value: d.team },
          ].filter((x) => x.value),
          languages: d.languages.map((x) => `${x.name} · ${x.level.toLowerCase()}`),
        }}
      />
      <PublicFooter />
    </main>
  );
}
