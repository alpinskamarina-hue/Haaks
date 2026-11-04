import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { ReviewCard } from "@/components/ReviewCard";
import { Stars } from "@/components/Stars";
import type { Lang } from "@/lib/i18n";
import type { Criterion, Review } from "@/lib/reviews";
import { ratingText } from "@/lib/reviews";
import type { getSocialDict } from "@/lib/social-i18n";

export type SocialTab = "works" | "reviews" | "about";

export type SocialProfileData = {
  name: string;
  username: string;
  avatarUrl: string | null;
  initials: string;
  headline: string; // trades · city
  rating: { n: number; avg: number | null; showAverage: boolean };
  newcomerText: string;
  reviewsCountText: string;
  badges: string[];
  availability: string | null;
  worksCount: number;
  rate: number | null;
  tiles: { url: string; title: string }[];
  reviews: Review[];
  criteria: Record<Criterion, string>;
  replyLabel: string;
  about: { label: string; value: string }[];
  languages: string[];
};

// The social-style public profile (/@nick): photo, nick, trades, stars, documents checked,
// numbers, and tabs with a photo grid of the work, reviews and "about".
export function SocialProfile({
  p,
  s,
  lang,
  tab,
  shareUrl,
  passportHref,
  inviteHref,
  own,
  signUpHref,
}: {
  p: SocialProfileData;
  s: ReturnType<typeof getSocialDict>;
  lang: Lang;
  tab: SocialTab;
  shareUrl: string;
  passportHref: string | null;
  inviteHref: string | null;
  own: boolean;
  signUpHref: string | null;
}) {
  const tabs: { id: SocialTab; label: string }[] = [
    { id: "works", label: s.works },
    { id: "reviews", label: s.reviews },
    { id: "about", label: s.about },
  ];
  return (
    <div lang={lang} className="mx-auto max-w-xl pb-10">
      <div className="h-24 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800 sm:rounded-b-2xl" />
      <div className="-mt-12 flex justify-center">
        {p.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatarUrl} alt="" className="h-24 w-24 rounded-full border-4 border-white object-cover shadow" />
        ) : (
          <span className="grid h-24 w-24 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-slate-400 to-slate-600 text-3xl font-bold text-white shadow">
            {p.initials}
          </span>
        )}
      </div>

      <div className="px-4 text-center">
        <h1 className="mt-2 text-2xl font-extrabold">{p.name}</h1>
        <p className="font-semibold text-orange-600">@{p.username}</p>
        {p.headline && <p className="mt-1 text-sm text-slate-600">{p.headline}</p>}
        {p.rating.showAverage && p.rating.avg !== null ? (
          <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-1.5 text-sm">
            <Stars value={p.rating.avg} className="text-lg" />
            <b>{ratingText(p.rating.avg)}</b>
            <span className="text-slate-500">· {p.reviewsCountText}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-sky-700">🆕 {p.newcomerText}</p>
        )}
        {(p.badges.length > 0 || p.availability) && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {p.badges.map((b) => (
              <span key={b} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                ✓ {b}
              </span>
            ))}
            {p.availability && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{p.availability}</span>
            )}
          </div>
        )}
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 rounded-2xl border border-slate-200 bg-white py-2.5 text-center">
        <div>
          <b className="block text-lg">{p.worksCount}</b>
          <span className="text-xs text-slate-500">{s.worksN}</span>
        </div>
        <div>
          <b className="block text-lg">{p.rating.n}</b>
          <span className="text-xs text-slate-500">{s.reviewsN}</span>
        </div>
        <div>
          <b className="block text-lg">{p.rate ? `€${p.rate.toLocaleString("nl-NL")}` : "—"}</b>
          <span className="text-xs text-slate-500">{s.perHour}</span>
        </div>
      </div>

      <div className="mx-4 mt-3 flex flex-wrap gap-2">
        {own ? (
          <Link href="/dashboard/profile" className="flex-1 rounded-xl bg-slate-900 py-2.5 text-center font-bold text-white">
            ✏️ {s.edit}
          </Link>
        ) : inviteHref ? (
          <Link href={inviteHref} className="flex-1 rounded-xl bg-orange-600 py-2.5 text-center font-bold text-white">
            {s.invite}
          </Link>
        ) : passportHref ? (
          <a href={passportHref} className="flex-1 rounded-xl bg-orange-600 py-2.5 text-center font-bold text-white">
            📄 {s.documents}
          </a>
        ) : null}
        <span className="flex flex-1 justify-center [&>button]:w-full [&>button]:justify-center [&>button]:rounded-xl [&>button]:py-2.5">
          <CopyButton value={shareUrl} label={s.share} />
        </span>
      </div>
      {own && <p className="mx-4 mt-2 text-center text-xs text-slate-500">{s.own}</p>}

      <nav className="mx-4 mt-4 grid grid-cols-3 border-b border-slate-200 text-center text-sm font-bold">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            scroll={false}
            aria-current={t.id === tab ? "page" : undefined}
            className={`py-2 ${t.id === tab ? "border-b-2 border-orange-600 text-orange-600" : "text-slate-500"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mx-4 mt-3">
        {tab === "works" &&
          (p.tiles.length ? (
            <div className="grid grid-cols-3 gap-1">
              {p.tiles.map((x) => (
                <a key={x.url} href={x.url} target="_blank" rel="noopener" className="relative block aspect-square overflow-hidden rounded-md bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-black/55 px-1.5 text-[10px] text-white">{x.title}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">{s.noWorks}</p>
          ))}
        {tab === "reviews" &&
          (p.reviews.length ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              {p.reviews.map((r) => (
                <ReviewCard key={r.id} review={r} lang={lang} criteria={p.criteria} replyLabel={p.replyLabel} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">{s.noReviews}</p>
          ))}
        {tab === "about" && (
          <dl className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            {p.about.map((x) => (
              <div key={x.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{x.label}</dt>
                <dd className="whitespace-pre-line font-medium">{x.value}</dd>
              </div>
            ))}
            {p.languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.languages.map((l) => (
                  <span key={l} className="rounded-full border border-slate-300 px-2 py-0.5">
                    {l}
                  </span>
                ))}
              </div>
            )}
          </dl>
        )}
      </div>

      {signUpHref && (
        <p className="mt-6 text-center text-sm">
          <Link href={signUpHref} className="font-semibold text-orange-700 underline">
            {s.signUp}
          </Link>
        </p>
      )}
    </div>
  );
}
