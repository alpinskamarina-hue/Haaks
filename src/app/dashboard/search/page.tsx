import Link from "next/link";
import { Stars } from "@/components/Stars";
import { fill } from "@/lib/feed-i18n";
import { freeLeft, limitText } from "@/lib/free-limits";
import { LANGS } from "@/lib/i18n";
import { ratingText } from "@/lib/reviews";
import { MIN_REVIEWS_FOR_AVERAGE } from "@/lib/reviews";
import { getSocialDict } from "@/lib/social-i18n";
import { createServerAccountClient } from "@/lib/supabase/server";
import { TRADES } from "@/lib/worker-profile";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { loadWorkspace } from "@/lib/workspace";

type Found = {
  username: string;
  full_name: string | null;
  avatar_path: string | null;
  trades: string[] | null;
  city: string | null;
  works: number;
  reviews: number;
  avg_stars: number | null;
};

// Builder search: by @nick, name, trade or town. Only builders who switched on
// "show me in search" are found. Opening a profile is limited on the free plan.
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; trade?: string; limit?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 60);
  const trade = (TRADES as readonly string[]).includes(sp.trade ?? "") ? sp.trade! : null;
  const { supabase, profile, lang } = await loadWorkspace();
  const s = getSocialDict(lang);
  const w = getWorkerDict(lang);
  const tradeNames = w.trades as Record<string, string>;

  // Words that name a trade in any language ("плиточник", "tegelzetter") also search by that trade.
  const words = q.toLowerCase().split(/[\s,]+/).filter((x) => x.length >= 3);
  const tradeHits = TRADES.filter((id) =>
    LANGS.some((l) => {
      const name = ((getWorkerDict(l).trades as Record<string, string>)[id] ?? "").toLowerCase();
      return words.some((x) => name.includes(x));
    }),
  );

  const [{ data }, quota] = await Promise.all([
    supabase.rpc("search_builders", { p_query: q, p_trades: tradeHits, p_trade: trade }),
    freeLeft(supabase, "profile_view"),
  ]);
  const found = (data ?? []) as unknown as Found[];
  const avatars = found.flatMap((x) => (x.avatar_path ? [x.avatar_path] : []));
  const admin = await createServerAccountClient();
  const signed = avatars.length ? ((await admin.storage.from("documents").createSignedUrls(avatars, 600)).data ?? []) : [];
  const url = new Map(signed.flatMap((x) => (x.path && x.signedUrl ? [[x.path, x.signedUrl] as const] : [])));
  const lt = limitText(lang, "profile_view");
  const inSearch = Boolean((profile as typeof profile & { in_search?: boolean }).in_search);
  const chip = (on: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-sm ${on ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`;
  const withParams = (t: string | null) => `/dashboard/search?${new URLSearchParams({ ...(q ? { q } : {}), ...(t ? { trade: t } : {}) })}`;

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">{s.searchTitle}</h1>
      <form className="flex gap-2" action="/dashboard/search">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-orange-500 bg-white px-3">
          <span aria-hidden="true">🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder={s.searchPlaceholder}
            aria-label={s.searchTitle}
            autoFocus={!q}
            autoCapitalize="none"
            className="min-w-0 flex-1 py-2.5 text-base outline-none"
          />
        </label>
        {trade && <input type="hidden" name="trade" value={trade} />}
        <button className="rounded-xl bg-orange-600 px-4 font-semibold text-white">{s.searchButton}</button>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={withParams(null)} className={chip(!trade)}>
          {s.all}
        </Link>
        {TRADES.filter((id) => id !== "other").map((id) => (
          <Link key={id} href={withParams(id)} className={chip(trade === id)}>
            {tradeNames[id]}
          </Link>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        {s.searchHint} · {fill(s.found, { n: found.length })}
      </p>
      {!quota.pro && (
        <p className={`rounded-lg px-3 py-2 text-sm font-medium ${quota.left > 0 ? "bg-orange-50 text-orange-900" : "bg-slate-100 text-slate-700"}`}>
          {quota.left > 0 ? fill(lt.left, { n: quota.left }) : `⏳ ${fill(lt.none, { h: quota.hours })}`} ·{" "}
          <Link href="/dashboard/leads/feed#pro" className="font-semibold underline">
            {lt.pro}
          </Link>
        </p>
      )}
      {sp.limit && quota.left === 0 && <p className="text-sm font-medium text-red-700">{fill(lt.none, { h: quota.hours })}</p>}

      {found.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">{s.none}</p>
      ) : (
        <ul className="space-y-2.5">
          {found.map((x) => {
            const name = x.full_name || `@${x.username}`;
            const initials = name
              .replace(/^@/, "")
              .split(/[\s.]+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((c) => c[0]!.toUpperCase())
              .join("");
            const avatar = x.avatar_path ? url.get(x.avatar_path) : null;
            const meta = [(x.trades ?? []).map((t) => tradeNames[t]).filter(Boolean).slice(0, 2).join(", "), x.city].filter(Boolean).join(" · ");
            return (
              <li key={x.username}>
                {/* A plain link (no prefetch): opening a profile counts toward the free limit. */}
                <a
                  href={`/dashboard/search/open?${new URLSearchParams({ u: x.username, q })}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-lg font-bold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{name}</span>
                    <span className="block truncate text-sm font-semibold text-orange-600">@{x.username}</span>
                    {meta && <span className="block truncate text-sm text-slate-600">{meta}</span>}
                    <span className="block text-sm">
                      {x.reviews >= MIN_REVIEWS_FOR_AVERAGE && x.avg_stars !== null ? (
                        <>
                          <Stars value={Number(x.avg_stars)} /> <b>{ratingText(Number(x.avg_stars))}</b>
                          <span className="text-slate-500">
                            {" "}
                            · {x.reviews} {s.reviewsN} · {x.works} {s.worksN}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500">
                          {s.newcomer} · {x.works} {s.worksN}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-lg border border-orange-300 px-2.5 py-1.5 text-sm font-semibold text-orange-700">{s.open}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {!inSearch && (
        <p className="text-sm text-slate-600">
          💡{" "}
          <Link href="/dashboard/settings#nick" className="underline">
            {s.inSearchOff}
          </Link>
        </p>
      )}
    </main>
  );
}
