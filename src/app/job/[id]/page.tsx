import type { Metadata } from "next";
import Link from "next/link";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import { ShareButton } from "@/components/ShareButton";
import { feedText, sourceLabel, timeAgo, tradeLabel, type FeedItem } from "@/lib/feed";
import { KVK_BADGE } from "@/lib/kvk-check";
import { getFeedDict } from "@/lib/feed-i18n";
import { isLang, type Lang } from "@/lib/i18n";
import { requestLang, siteUrl } from "@/lib/lang";
import { getShareDict } from "@/lib/share-i18n";
import { createClient, createServerAccountClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Job = Pick<
  FeedItem,
  "id" | "source" | "source_name" | "kind" | "title" | "summary" | "translations" | "trades" | "city" | "timing" | "budget"
> & { published_at: string | null; created_at: string; expires_at: string | null; kvk_ok?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A shared feed job: what and where, never the client's contact or the source link.
async function loadJob(id: string): Promise<Job | null> {
  if (!UUID.test(id)) return null;
  const admin = await createServerAccountClient();
  const { data } = await admin
    .from("feed_items")
    .select("id, source, source_name, kind, title, summary, translations, trades, city, timing, budget, published_at, created_at, expires_at")
    .eq("id", id)
    .maybeSingle<Job>();
  if (!data || (data.expires_at && new Date(data.expires_at) < new Date())) return null;
  // A company job: did Haaks check the company's KvK number?
  const { data: cj } = data.kind === "business"
    ? await admin.from("company_jobs").select("company_id").eq("feed_item_id", data.id).maybeSingle<{ company_id: string }>()
    : { data: null };
  const { data: company } = cj
    ? await admin.from("profiles").select("kvk_checked_at").eq("id", cj.company_id).maybeSingle<{ kvk_checked_at: string | null }>()
    : { data: null };
  return { ...data, translations: data.translations ?? {}, trades: data.trades ?? [], kvk_ok: !!company?.kvk_checked_at };
}

async function pageLang(langParam?: string): Promise<{ lang: Lang; signedIn: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase.from("profiles").select("language").eq("id", user.id).maybeSingle();
    if (isLang(data?.language)) return { lang: data.language, signedIn: true };
  }
  return { lang: isLang(langParam) ? langParam : await requestLang(), signedIn: Boolean(user) };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const job = await loadJob(id);
  const lang: Lang = isLang(sp.lang) ? sp.lang : "nl";
  if (!job) return { title: "Haaks", robots: { index: false } };
  const { title, summary } = feedText({ ...job, published_at: job.published_at ?? job.created_at, source_url: null, contact: null, is_demo: false, locked: false }, lang);
  const place = [job.city, job.budget].filter(Boolean).join(" · ");
  const name = `${title}${job.city && !title.includes(job.city) ? `, ${job.city}` : ""}`;
  return {
    title: `${name} · Haaks`,
    description: [place, summary].filter(Boolean).join(" · ").slice(0, 200),
    robots: { index: false, follow: false },
    openGraph: { title: name, description: [place, summary].filter(Boolean).join(" · ").slice(0, 200), siteName: "Haaks", type: "website" },
  };
}

export default async function JobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [job, { lang, signedIn }] = await Promise.all([loadJob(id), pageLang(sp.lang)]);
  const s = getShareDict(lang);

  const header = (
    <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
      <Link href={signedIn ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-bold">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-600 text-sm text-white">H</span>
        Haaks
      </Link>
    </header>
  );

  if (!job) {
    return (
      <main className="min-h-screen bg-slate-50">
        <HtmlLang lang={lang} />
        {header}
        <p className="mx-auto max-w-xl px-4 py-16 text-center text-slate-600">{s.notFound}</p>
      </main>
    );
  }

  const f = getFeedDict(lang);
  const { title, summary } = feedText({ ...job, published_at: job.published_at ?? job.created_at, source_url: null, contact: null, is_demo: false, locked: false }, lang);
  const kind = { private: f.kindPrivate, business: f.kindBusiness, permit: f.kindPermit, tender: f.kindTender }[job.kind];
  const section = { private: `🔥 ${f.secJobs}`, permit: `🏗 ${f.secSoon}`, tender: `📋 ${f.secTender}`, business: `🏢 ${f.secBusiness}` }[job.kind];
  const facts = [
    job.city ? `📍 ${job.city}` : null,
    job.trades.length ? `🛠 ${job.trades.map((t) => tradeLabel(t, lang)).join(", ")}` : null,
    job.timing ? `🗓 ${job.timing}` : null,
    job.budget ? `💶 ${job.budget}` : null,
  ].filter((x): x is string => Boolean(x));
  const url = `${await siteUrl()}/job/${job.id}?lang=${lang}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <HtmlLang lang={lang} />
      {header}
      <div className="mx-auto max-w-xl space-y-4 px-4 py-6">
        <article className="rounded-2xl border border-l-[6px] border-slate-200 border-l-orange-500 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">{section}</p>
          <p className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{sourceLabel(job)}</span>
            {job.kvk_ok && (
              <span title={KVK_BADGE[lang].hint} className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">
                ✓ {KVK_BADGE[lang].badge}
              </span>
            )}
            <span>{timeAgo(job.published_at ?? job.created_at, lang)}</span>
          </p>
          <h1 className="mt-2 break-words text-xl font-bold">{title}</h1>
          <p className="text-sm text-slate-500">{kind}</p>
          {facts.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {facts.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
          {summary && <p className="mt-3 whitespace-pre-line break-words text-slate-700">{summary}</p>}
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">🔒 {s.contactsHidden}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {signedIn ? (
              <Link href="/dashboard/leads/feed?all=1" className="rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white">
                {s.openFeed}
              </Link>
            ) : (
              <Link href="/?mode=signup#signup" className="w-full rounded-xl bg-orange-600 px-4 py-3 text-center font-semibold text-white">
                🙋 {s.signUp}
              </Link>
            )}
            <ShareButton url={url} text={`${s.message} ${title}`} labels={s} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700" />
          </div>
        </article>
        {!signedIn && (
          <section className="rounded-2xl bg-slate-900 p-5 text-white">
            <p className="font-semibold">{s.tagline}</p>
            <p className="mt-1 text-sm text-slate-300">{s.more_jobs}</p>
          </section>
        )}
      </div>
      <PublicFooter />
    </main>
  );
}
