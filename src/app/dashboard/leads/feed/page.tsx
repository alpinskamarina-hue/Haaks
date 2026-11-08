import Link from "next/link";
import { isPaid } from "@/lib/plans";
import { getPricingDict } from "@/lib/pricing-i18n";
import { getFeedPlusDict, HIDE_REASONS, type FeedPlusDict } from "@/lib/feed-plus-i18n";
import {
  answerFeedTip,
  saveFeedItem,
  hideFeedItem,
  takeFeedItem,
  unhideFeedItem,
  unlockFeedItem,
  replyToCompanyJob,
} from "@/app/feed-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { feedText, sourceLabel, timeAgo, tradeLabel, type FeedEmailMode } from "@/lib/feed";
import { KVK_BADGE } from "@/lib/kvk-check";
import { fill, getFeedDict, type FeedDict } from "@/lib/feed-i18n";
import { FIT_SCORE, FREE_OPENS, isNewJob, loadFeed, markFeedSeen, newSince, type ScoredFeedItem } from "@/lib/feed-server";
import type { Lang } from "@/lib/i18n";
import { getHelperDict } from "@/lib/helper-i18n";
import { getFirmOfferDict } from "@/lib/firm-offer-i18n";
import { loadNearFirms } from "@/lib/firms";
import { getLetterDict } from "@/lib/letter-i18n";
import { getReportDict, JOB_REASONS, type ReportDict } from "@/lib/report-i18n";
import { ReportButton } from "@/components/ReportButton";
import { HideMenu } from "@/components/HideMenu";
import { ShareButton } from "@/components/ShareButton";
import { Icon } from "@/components/icons";
import { getShareDict } from "@/lib/share-i18n";
import { getVacancyDict } from "@/lib/vacancy-i18n";
import { isBureau } from "@/lib/collect/vacancies";
import { getJobShareDict, type JobShareDict } from "@/lib/job-share-i18n";
import { thankShare } from "@/app/share-actions";
import { shortName } from "@/lib/company-jobs";
import { catalogActive, getReplyDict, type MyReply, type ReplyDict } from "@/lib/job-replies";
import { contactPhones, emailLink, resumeMessage, scoreColor } from "@/lib/leads";
import { siteUrl } from "@/lib/lang";
import { loadWorkspace } from "@/lib/workspace";
import { freeLeft, limitText, type FreeQuota } from "@/lib/free-limits";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

// Sections of the feed, each with its own colour: real jobs first, then signals.
type Section = "jobs" | "soon" | "tender" | "business";
const SECTION_OF: Record<ScoredFeedItem["kind"], Section> = {
  private: "jobs",
  permit: "soon",
  tender: "tender",
  business: "business",
};
const SECTIONS: { key: Section; icon: string; solid: string; label: (f: FeedDict) => string; chip: string; bg: string; stripe: string; text: string }[] = [
  { key: "jobs", icon: "🔥", solid: "bg-orange-600", label: (f) => f.secJobs, chip: "border-orange-500 text-orange-700", bg: "bg-orange-50", stripe: "border-l-orange-500", text: "text-orange-700" },
  { key: "soon", icon: "🏗", solid: "bg-green-700", label: (f) => f.secSoon, chip: "border-green-600 text-green-700", bg: "bg-green-50", stripe: "border-l-green-600", text: "text-green-700" },
  { key: "tender", icon: "📋", solid: "bg-blue-700", label: (f) => f.secTender, chip: "border-blue-600 text-blue-700", bg: "bg-blue-50", stripe: "border-l-blue-600", text: "text-blue-700" },
  { key: "business", icon: "🏢", solid: "bg-purple-700", label: (f) => f.secBusiness, chip: "border-purple-600 text-purple-700", bg: "bg-purple-50", stripe: "border-l-purple-600", text: "text-purple-700" },
];
const sectionInfo = (kind: ScoredFeedItem["kind"]) => SECTIONS.find((x) => x.key === SECTION_OF[kind])!;

// "inschrijven tot 2026-11-30" -> days left until the tender closes.
function daysLeft(timing: string | null) {
  const date = timing?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (!date) return null;
  return Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400000);
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string; hidden?: string; saved?: string; starred?: string; section?: string; city?: string; received?: string }>;
}) {
  const params = await searchParams;
  const showAll = params.all === "1";
  const showHidden = params.hidden === "1";
  const showSaved = params.starred === "1";
  // «Мне прислали»: jobs colleagues sent to this builder.
  const showReceived = params.received === "1";
  const section = SECTIONS.find((x) => x.key === params.section)?.key ?? null;
  const cityFilter = params.city?.trim() || null;
  const { supabase, user, profile, lang } = await loadWorkspace();
  const f = getFeedDict(lang);
  const fp = getFeedPlusDict(lang);
  const extra = profile as typeof profile & {
    plan?: string;
    plan_until?: string | null;
    feed_email?: FeedEmailMode;
    notify_email?: string | null;
    telegram_chat_id?: number | null;
    feed_seen_at?: string | null;
    feed_last_visit?: string | null;
    feed_tip_at?: string | null;
    travel_km?: number | null;
    home_lat?: number | null;
  };
  const pro = isPaid(extra);
  // Free plan: replies to company and helper jobs, 3 per 24 hours.
  const replyQuota = pro ? null : await freeLeft(supabase, "job_reply");

  const [{ items, sharesUnseen, trades, regions, match, opensLeft, opensInHours, hides }, lastVisit, { data: myReplyRows }, { data: myJobRows }, { data: myReports }, { data: targetRows }] = await Promise.all([
    loadFeed(supabase, user.id, profile),
    markFeedSeen(supabase, user.id, extra),
    supabase.rpc("my_job_replies"),
    // "Need a helper" jobs this builder posted: their own card links to the replies.
    supabase.from("company_jobs").select("id, feed_item_id").eq("company_id", user.id).not("feed_item_id", "is", null),
    supabase.from("reports").select("target_id").eq("target_kind", "job"),
    supabase.rpc("my_share_targets"),
  ]);
  // Opening «Мне прислали» marks the sent jobs as seen (the red number goes away next time).
  if (showReceived && sharesUnseen > 0) await supabase.rpc("mark_shares_seen");
  const js = getJobShareDict(lang);
  const shareTargets = ((targetRows ?? []) as { username: string; full_name: string | null }[]).map((r) => ({
    username: r.username,
    name: r.full_name ? shortName(r.full_name) : `@${r.username}`,
  }));
  const myNick = (profile as typeof profile & { username?: string | null }).username ?? null;
  // «Фирмы рядом»: a tab of its own once there are firms within the builder's radius.
  const firmCount = (await loadNearFirms(supabase, profile)).firms.length;
  const firmsTab = getFirmOfferDict(lang).tab;
  const reportedJobs = new Set((myReports ?? []).map((r) => r.target_id as string));
  const reportT = getReportDict(lang);
  const letterLabel = getLetterDict(lang).button;
  const ownJobByItem = new Map((myJobRows ?? []).map((j) => [j.feed_item_id as string, j.id as string]));
  const helper = getHelperDict(lang);
  const yourJob = helper.yourJob;
  // Replies to company jobs, by feed card.
  const myReplies = (myReplyRows ?? []) as MyReply[];
  const replyByItem = new Map(myReplies.filter((r) => r.feed_item_id).map((r) => [r.feed_item_id!, r]));
  const rt = getReplyDict(lang);
  const inCatalog = catalogActive(profile as typeof profile & { in_catalog?: boolean; catalog_until?: string | null });
  // "New": came in since the visit before this one.
  const since = newSince(lastVisit);

  const receivedItems = items.filter((i) => i.sharedBy.length > 0);
  const shown = showReceived
    ? receivedItems
    : showSaved
    ? items.filter((i) => i.saved)
    : items
        .filter((i) => (showHidden ? i.action === "hidden" : i.action !== "hidden"))
        .filter((i) => showAll || showHidden || i.score >= FIT_SCORE);
  const savedCount = items.filter((i) => i.saved).length;
  // Feed tip: after 3 hides for the same reason since the last tip, offer to fix the settings.
  const tipSince = extra.feed_tip_at ? Date.parse(extra.feed_tip_at) : 0;
  const reasonCount = (r: string) => hides.filter((x) => x.reason === r && Date.parse(x.at) > tipSince).length;
  const radius = extra.travel_km ?? 30;
  const smaller = Math.max(5, Math.round(radius / 2 / 5) * 5);
  const tip =
    reasonCount("far") >= 3 && extra.travel_km !== 0 && extra.home_lat != null && radius > 5
      ? ({ kind: "far", n: reasonCount("far") } as const)
      : reasonCount("trade") >= 3
        ? ({ kind: "trade", n: reasonCount("trade") } as const)
        : null;
  // Places to pick from in "all jobs", most jobs first.
  const cityCounts = new Map<string, number>();
  for (const i of shown) if (i.city) cityCounts.set(i.city, (cityCounts.get(i.city) ?? 0) + 1);
  const cities = [...cityCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c);
  const base = shown.filter((i) => !cityFilter || i.city === cityFilter);
  const sectionOrder = SECTIONS.map((x) => x.key);
  // Real jobs first, then nearest first; jobs without a known place after those, newest first.
  const visible = base
    .filter((i) => !section || SECTION_OF[i.kind] === section)
    .sort(
      (a, b) =>
        (showReceived ? b.sharedBy[0].created_at.localeCompare(a.sharedBy[0].created_at) : 0) ||
        sectionOrder.indexOf(SECTION_OF[a.kind]) - sectionOrder.indexOf(SECTION_OF[b.kind]) ||
        (a.distance ?? Infinity) - (b.distance ?? Infinity) ||
        b.published_at.localeCompare(a.published_at),
    );
  const sectionCount = (key: Section) => base.filter((i) => SECTION_OF[i.kind] === key).length;
  const sectionNew = (key: Section) => base.filter((i) => SECTION_OF[i.kind] === key && isNewJob(i, since)).length;
  const query = (next: Record<string, string | null>) => {
    const q = new URLSearchParams();
    // «Мне прислали» is its own view: any other tab or filter leaves it.
    const merged = { all: showAll ? "1" : null, hidden: showHidden ? "1" : null, starred: showSaved ? "1" : null, section, city: cityFilter, received: null, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const str = q.toString();
    return `/dashboard/leads/feed${str ? `?${str}` : ""}`;
  };
  const site = await siteUrl();
  const share = { base: site, t: getShareDict(lang) };
  const passportUrl = profile.passport_enabled ? `${site}/p/${profile.passport_token}` : null;
  const worker = {
    name: profile.company_name || profile.full_name || null,
    trades: trades.map((tr) => tradeLabel(tr, "nl")),
    city: profile.city,
    phone: profile.phone,
    passportUrl,
  };
  const locked = visible.filter((i) => i.locked);
  const open = visible.filter((i) => !i.locked);
  const hiddenCount = items.filter((i) => i.action === "hidden").length;
  const hasDemo = items.some((i) => i.is_demo);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{f.tabFeed}</h1>
        <p className="text-slate-600">{f.feedSubtitle}</p>
      </div>

      {(myReplies.length > 0 || !inCatalog) && (
        <Link
          href="/dashboard/replies"
          className="flex items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-800"
        >
          <span>{myReplies.length > 0 ? `🙋 ${rt.myLink} (${myReplies.length})` : `🔎 ${rt.catalogBanner}`}</span>
          {myReplies.some((r) => r.status === "accepted") ? (
            <span className="shrink-0 rounded-full bg-green-600 px-2 py-0.5 text-xs text-white">✓</span>
          ) : (
            <span className="shrink-0">→</span>
          )}
        </Link>
      )}

      {/* "Need a helper": a builder posts a job for other builders. */}
      <Link href="/dashboard/helpers" className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
        <span>
          <span className="block font-semibold text-sky-900">👷 {helper.nav}</span>
          <span className="block text-sm text-slate-700">{helper.cardText}</span>
        </span>
        <span className="shrink-0 font-semibold text-sky-900">→</span>
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          {!pro && locked.length > 0 && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="font-semibold text-orange-900">{fill(f.bannerTitle, { n: locked.length })}</p>
              <p className="mt-1 text-sm text-orange-900/80">{f.bannerText}</p>
              <p className="mt-2 text-sm font-semibold text-orange-900">
                {opensLeft > 0 ? `🔓 ${fill(f.openLeft, { n: opensLeft })}` : `⏳ ${fill(f.openNone, { h: opensInHours })}`}
              </p>
              <a href="#pro" className="mt-3 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
                {f.proTitle}
              </a>
            </div>
          )}

          {trades.length === 0 && regions.length === 0 && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {f.profileHint}{" "}
              <Link href="/dashboard/profile" className="font-semibold underline">
                {f.profileLink}
              </Link>
            </p>
          )}

          {/* Sections: one calm row of tabs that scrolls sideways on a phone; empty ones are left out. */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            <Link
              href={query({ section: null })}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold ${!section && !showReceived ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
            >
              {f.secAll} <span className="opacity-70">{showReceived ? items.filter((i) => i.action !== "hidden" && i.score >= FIT_SCORE).length : base.length}</span>
            </Link>
            {(receivedItems.length > 0 || showReceived) && (
              <Link
                href={query({ received: "1", section: null, all: null, hidden: null, starred: null, city: null })}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold ${showReceived ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-800 ring-1 ring-orange-200"}`}
              >
                📨 {js.tab} <span className="opacity-70">{receivedItems.length}</span>
                {sharesUnseen > 0 && !showReceived && <span className="ml-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">+{sharesUnseen}</span>}
              </Link>
            )}
            {SECTIONS.filter((x) => !showReceived && (sectionCount(x.key) > 0 || section === x.key)).map((x) => (
              <Link
                key={x.key}
                href={query({ section: x.key })}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold ${
                  section === x.key ? `${x.solid} text-white` : `${x.bg} ${x.text}`
                }`}
              >
                {x.icon} {x.label(f)} <span className="opacity-70">{sectionCount(x.key)}</span>
                {sectionNew(x.key) > 0 && (
                  <span className="ml-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">+{sectionNew(x.key)}</span>
                )}
              </Link>
            ))}
            {!showReceived && firmCount > 0 && (
              <Link
                href="/dashboard/leads/firms"
                className="shrink-0 whitespace-nowrap rounded-full bg-purple-50 px-3.5 py-1.5 font-semibold text-purple-800 ring-1 ring-purple-200"
              >
                🏢 {firmsTab} <span className="opacity-70">{firmCount}</span>
              </Link>
            )}
          </div>
          {/* Which jobs: a two-way switch, then saved and hidden as small links. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex rounded-full bg-slate-200/70 p-1">
              <Link
                href={query({ all: null, hidden: null, starred: null, city: null })}
                className={`rounded-full px-3.5 py-1 ${!showAll && !showHidden && !showSaved ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600"}`}
              >
                {f.filterMine}
              </Link>
              <Link
                href={query({ all: "1", hidden: null, starred: null })}
                className={`rounded-full px-3.5 py-1 ${showAll ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600"}`}
              >
                {f.filterAll}
              </Link>
            </div>
            {savedCount > 0 && (
              <Link href={query({ starred: "1", all: null, hidden: null })} className={showSaved ? "font-semibold text-amber-700" : "text-slate-600"}>
                ⭐ {fp.savedTab} {savedCount}
              </Link>
            )}
            {hiddenCount > 0 && (
              <Link href={query({ hidden: "1", all: null, starred: null })} className={showHidden ? "font-semibold text-slate-900" : "text-slate-500"}>
                {f.showHidden} {hiddenCount}
              </Link>
            )}
          </div>
          {showAll && cities.length > 1 && (
            <form action="/dashboard/leads/feed" className="flex flex-wrap items-center gap-2 text-sm">
              <input type="hidden" name="all" value="1" />
              {section && <input type="hidden" name="section" value={section} />}
              <select name="city" defaultValue={cityFilter ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5">
                <option value="">{f.cityAll}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c} ({cityCounts.get(c)})
                  </option>
                ))}
              </select>
              <button className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white">{f.cityShow}</button>
            </form>
          )}
          {(trades.length > 0 || regions.length > 0) && !showHidden && (
            <p className="text-xs text-slate-500">
              {fill(f.matchFor, {
                trades: trades.map((tr) => tradeLabel(tr, lang)).join(", ") || "—",
                cities:
                  match.radius === 0
                    ? f.wholeCountry
                    : [
                        profile.city && match.lat != null && match.radius
                          ? fill(f.withinKm, { city: profile.city, n: match.radius })
                          : profile.lead_regions || profile.city,
                        ...((profile as typeof profile & { extra_cities?: string[] }).extra_cities ?? []),
                      ]
                        .filter(Boolean)
                        .join(", ") || "—",
              })}
            </p>
          )}

          {tip && !showHidden && !showSaved && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              <p className="font-semibold">💡 {fill(tip.kind === "far" ? fp.tipFarTitle : fp.tipTradeTitle, { n: tip.n })}</p>
              <p className="mt-1">{tip.kind === "far" ? fill(fp.tipFarText, { from: radius, to: smaller }) : fp.tipTradeText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tip.kind === "far" ? (
                  <form action={answerFeedTip.bind(null, smaller)}>
                    <SubmitButton className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
                      {fill(fp.tipFarYes, { to: smaller })}
                    </SubmitButton>
                  </form>
                ) : (
                  <Link href="/dashboard/settings#feed" className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white">
                    {fp.tipTradeYes}
                  </Link>
                )}
                <form action={answerFeedTip.bind(null, null)}>
                  <SubmitButton className="rounded-lg border border-orange-600 bg-white px-4 py-2 font-semibold text-orange-700 disabled:opacity-60">
                    {fp.tipKeep}
                  </SubmitButton>
                </form>
              </div>
            </div>
          )}

          {visible.length === 0 && showReceived && (
            <div className={`${card} text-slate-600`}>
              {myNick ? (
                <p>{fill(js.emptyNick, { nick: myNick })}</p>
              ) : (
                <>
                  <p>{js.emptyNoNick}</p>
                  <Link href="/dashboard/settings#nick" className="mt-2 inline-block font-semibold text-orange-700 underline">
                    {js.setNick} →
                  </Link>
                </>
              )}
            </div>
          )}
          {visible.length === 0 && !showReceived && <p className={`${card} text-slate-600`}>{f.empty}</p>}
          <ul className="space-y-3">
            {locked.map((item) => (
              <LockedCard key={item.id} item={item} f={f} lang={lang} opensLeft={opensLeft} />
            ))}
            {open.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                f={f}
                lang={lang}
                pro={pro}
                opensLeft={opensLeft}
                worker={worker}
                isNew={isNewJob(item, since)}
                reply={replyByItem.get(item.id)}
                rt={rt}
                ownJob={ownJobByItem.get(item.id)}
                yourJob={yourJob}
                replyQuota={replyQuota}
                reportT={reportT}
                reported={reportedJobs.has(item.id)}
                letterLabel={letterLabel}
                share={share}
                fp={fp}
                js={js}
                shareTargets={shareTargets}
              />
            ))}
          </ul>
        </div>

        <aside className="min-w-0 space-y-5">
          {pro ? (
            <section className={card}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{f.planTitle}</h2>
                <span className="rounded-full bg-orange-600 px-2 py-0.5 text-xs font-semibold text-white">PRO</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{f.planPro}</p>
              <Link href="/dashboard/plan" className="mt-2 inline-block text-sm font-semibold text-orange-700 underline">
                {getPricingDict(lang).myTitle} →
              </Link>
            </section>
          ) : (
            <section id="pro" className="rounded-2xl border border-orange-300 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">{f.proTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {f.proPoints.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-orange-600">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/plan" className="mt-4 block rounded-xl bg-orange-600 px-4 py-2.5 text-center text-sm font-bold text-white">
                {getPricingDict(lang).nav} →
              </Link>
            </section>
          )}

          <section className={card}>
            <h2 className="mb-3 font-semibold">{f.sourcesTitle}</h2>
            <ul className="space-y-2 text-sm">
              {[f.srcTelegram, f.srcPermits, f.srcEmail, f.srcTender, f.srcHaaks].map((name) => (
                <li key={name} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${hasDemo ? "bg-slate-300" : "bg-green-500"}`} />
                  {name}
                </li>
              ))}
            </ul>
            {hasDemo && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{f.demoNote}</p>}
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">{f.legal}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function kindLabel(kind: ScoredFeedItem["kind"], f: FeedDict) {
  return { private: f.kindPrivate, business: f.kindBusiness, permit: f.kindPermit, tender: f.kindTender }[kind];
}

type Worker = Omit<Parameters<typeof resumeMessage>[0], "job">;

function FeedCard({
  item,
  f,
  lang,
  pro: isPro,
  opensLeft,
  worker,
  isNew,
  reply,
  rt,
  ownJob,
  yourJob,
  replyQuota,
  reportT,
  reported,
  letterLabel,
  share,
  fp,
  js,
  shareTargets,
}: {
  item: ScoredFeedItem;
  f: FeedDict;
  lang: Lang;
  pro: boolean;
  opensLeft: number;
  worker: Worker;
  isNew: boolean;
  reply?: MyReply;
  rt: ReplyDict;
  ownJob?: string;
  yourJob: string;
  replyQuota: FreeQuota | null;
  reportT: ReportDict;
  reported: boolean;
  letterLabel: string;
  share: { base: string; t: ReturnType<typeof getShareDict> };
  fp: FeedPlusDict;
  js: JobShareDict;
  shareTargets: { username: string; name: string }[];
}) {
  // An opened card is shown like for Pro.
  const pro = isPro || item.opened;
  const { title, summary } = feedText(item, lang);
  const age = Date.now() - new Date(item.published_at).getTime();
  const old = age > 14 * 24 * 60 * 60 * 1000;
  // Real jobs: fresh ones are "hot", old ones are probably taken already.
  const realJob = item.kind === "private" || item.kind === "business";
  const hot = realJob && !item.action && !item.leadId && age < 24 * 60 * 60 * 1000;
  const stale = realJob && old && !item.leadId;
  const info = sectionInfo(item.kind);
  const left = item.kind === "tender" ? daysLeft(item.timing) : null;
  const meta = [item.city, item.trades.map((tr) => tradeLabel(tr, lang)).join(", "), item.timing, item.budget].filter(Boolean);
  // A job a company posted on Haaks: builders reply here, contacts open when the company accepts.
  const companyJob = item.source === "haaks";
  // A ZZP vacancy from a job site: the builder applies on the original ad.
  const vacancy = item.source === "googlejobs";
  const vt = getVacancyDict(lang);
  const q = item.quote;
  const status = !q
    ? { text: `✓ ${fp.statusTaken}`, cls: "border border-slate-300" }
    : q.status === "accepted"
      ? { text: `🤝 ${fp.statusAccepted}`, cls: "bg-green-600 text-white" }
      : q.status === "declined"
        ? { text: fp.statusDeclined, cls: "bg-slate-100 text-slate-500" }
        : q.status === "sent" && q.viewed
          ? { text: `👀 ${fp.statusViewed}`, cls: "bg-amber-100 text-amber-900" }
          : q.status === "sent"
            ? { text: `📄 ${fp.statusSent}`, cls: "bg-blue-100 text-blue-800" }
            : { text: `📝 ${fp.statusDraft}`, cls: "border border-slate-300" };
  const resumeLink = pro && !companyJob
    ? emailLink(item.contact, `ZZP vakman voor uw klus: ${item.title ?? title}`, resumeMessage({ ...worker, job: item.title ?? title }))
    : null;
  return (
    <li id={`job-${item.id}`} className={`scroll-mt-20 rounded-2xl border border-l-[6px] border-slate-200 ${info.stripe} bg-white p-4 shadow-sm ${old ? "opacity-70" : ""}`}>
      {item.sharedBy.map((sh) => (
        <div key={sh.id} className="mb-3 flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-600 text-sm font-bold text-white">
            {(sh.from_name || sh.from_username || "?").trim()[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p>
              <b>{fill(js.from, { name: shortName(sh.from_name) })}</b>
              {sh.from_username && <span className="text-slate-500"> @{sh.from_username}</span>}
              <span className="text-slate-500"> · {timeAgo(sh.created_at, lang)}</span>
            </p>
            {sh.note && <p className="mt-0.5 text-orange-900">«{sh.note}»</p>}
          </div>
          {sh.thanked_at ? (
            <span className="shrink-0 text-xs text-slate-500">{js.thanked}</span>
          ) : (
            <form action={thankShare.bind(null, sh.id)} className="shrink-0">
              <SubmitButton className="rounded-full border border-orange-300 bg-white px-2.5 py-1 text-xs font-semibold text-orange-800 disabled:opacity-60">
                🙏 {js.thanks}
              </SubmitButton>
            </form>
          )}
        </div>
      ))}
      <p className={`mb-1 text-xs font-bold uppercase tracking-wide ${info.text}`}>
        {info.icon} {info.label(f)}
        {left !== null && left >= 0 && (
          <span className={`ml-2 rounded-full px-2 py-0.5 normal-case ${left < 7 ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-700"}`}>
            {left === 0 ? f.lastDay : fill(f.daysLeft, { n: left })}
          </span>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${item.source === "haaks" ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-700"}`}
        >
          {item.source === "bekendmakingen" ? sourceLabel(item).split(" · ")[0] : sourceLabel(item)}
        </span>
        {vacancy && isBureau(item.source_name) && (
          <span title={vt.bureauHint} className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
            {vt.bureau}
          </span>
        )}
        {item.kvk_ok && (
          <span title={KVK_BADGE[lang].hint} className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">
            ✓ {KVK_BADGE[lang].badge}
          </span>
        )}
        <span>{timeAgo(item.published_at, lang)}</span>
        {item.distance !== null && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
            📍 {fill(f.kmAway, { n: Math.max(1, item.distance) })}
          </span>
        )}
        {item.opened && !isPro && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-800">🔓 {f.openedBadge}</span>
        )}
        {isNew && <span className="rounded-full bg-red-600 px-2 py-0.5 font-semibold text-white">{f.newBadge}</span>}
        {hot && <span className="rounded-full bg-orange-600 px-2 py-0.5 font-semibold text-white">⚡ {fp.hot}</span>}
        {stale && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">⏳ {fp.likelyTaken}</span>}
        {item.is_demo && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">{f.demoBadge}</span>}
        <span className={`ml-auto rounded-full px-2 py-0.5 font-semibold ${scoreColor(item.score)}`}>{item.score}%</span>
      </div>
      <div className="mt-2 flex items-start gap-2">
        <p className="min-w-0 flex-1 break-words font-semibold">{title}</p>
        <form action={saveFeedItem.bind(null, item.id, !item.saved)}>
          <SubmitButton
            className={`-mr-1 -mt-1 px-1 text-2xl leading-none ${item.saved ? "text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
          >
            <span aria-label={item.saved ? fp.saved : fp.save} title={item.saved ? fp.saved : fp.save}>
              {item.saved ? "★" : "☆"}
            </span>
          </SubmitButton>
        </form>
      </div>
      <p className="text-sm text-slate-500">
        {vacancy ? vt.badge : kindLabel(item.kind, f)} · {meta.join(" · ")}
      </p>
      <p className="mt-2 break-words text-sm text-slate-700">{summary}</p>
      {/* One bright main action; a second one, if any, is outlined; small actions are grey icons below. */}
      <div className="mt-3 flex flex-col gap-2 text-sm">
        {companyJob && ownJob ? (
          <Link href={`/dashboard/helpers/jobs/${ownJob}`} className="rounded-xl bg-sky-50 px-4 py-2.5 text-center font-medium text-sky-800">
            👷 {yourJob}
          </Link>
        ) : companyJob && reply ? (
          <Link
            href="/dashboard/replies"
            className={`rounded-xl px-4 py-2.5 text-center font-medium ${
              reply.status === "accepted" ? "bg-green-600 text-white" : reply.status === "declined" ? "bg-slate-100 text-slate-500" : "bg-purple-50 text-purple-800"
            }`}
          >
            {reply.status === "accepted" ? `✓ ${rt.accepted}` : reply.status === "declined" ? rt.declined : `⏳ ${rt.sent}`}
          </Link>
        ) : companyJob && pro && replyQuota && replyQuota.left === 0 ? (
          <div>
            <p className="text-sm font-medium text-slate-600">⏳ {fill(limitText(lang, "job_reply").none, { h: replyQuota.hours })}</p>
            <a href="#pro" className="mt-1 inline-block text-sm font-semibold text-orange-700 underline">{limitText(lang, "job_reply").pro}</a>
          </div>
        ) : companyJob && pro ? (
          <div>
            <form action={replyToCompanyJob.bind(null, item.id)}>
              <SubmitButton className="w-full rounded-xl bg-purple-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">🙋 {rt.reply}</SubmitButton>
            </form>
            <p className="mt-1 text-xs text-slate-500">{rt.hint}</p>
            {replyQuota && <p className="mt-1 text-xs font-medium text-orange-800">{fill(limitText(lang, "job_reply").left, { n: replyQuota.left })}</p>}
          </div>
        ) : vacancy && pro && item.source_url ? (
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-purple-700 px-4 py-2.5 text-center font-semibold text-white">
            📝 {vt.apply}
          </a>
        ) : item.leadId ? (
          <Link href={`/dashboard/leads/${item.leadId}`} className={`rounded-xl px-4 py-2.5 text-center font-medium ${status.cls}`}>
            {status.text} · {f.openLead}
          </Link>
        ) : pro && item.kind === "permit" ? (
          // A permit has no client contact: the letter to the owner is the main action.
          <>
            <Link href={`/dashboard/leads/letter/${item.id}`} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-center font-semibold text-white">
              ✉️ {letterLabel}
            </Link>
            <form action={takeFeedItem.bind(null, item.id)}>
              <SubmitButton className="w-full rounded-xl border border-orange-300 bg-white px-4 py-2.5 font-semibold text-orange-700 disabled:opacity-60">
                ✨ {f.reply}
              </SubmitButton>
            </form>
          </>
        ) : pro ? (
          <form action={takeFeedItem.bind(null, item.id)}>
            <SubmitButton className="w-full rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
              ✨ {f.reply}
            </SubmitButton>
          </form>
        ) : opensLeft > 0 ? (
          <OpenButton id={item.id} f={f} opensLeft={opensLeft} />
        ) : (
          <a href="#pro" className="rounded-xl bg-slate-100 px-4 py-2.5 text-center text-slate-600">
            🔒 {f.lockedActions}
          </a>
        )}
        {pro && item.kind === "permit" && item.leadId && (
          <Link href={`/dashboard/leads/letter/${item.id}`} className="rounded-xl border border-emerald-600 px-4 py-2.5 text-center font-semibold text-emerald-800">
            ✉️ {letterLabel}
          </Link>
        )}
        {resumeLink && (
          <a href={resumeLink} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-800">
            ✉️ {f.sendResume}
          </a>
        )}
        {pro && item.contact && !item.leadId &&
          contactPhones(item.contact).map((ph) => (
            <a key={ph.href} href={ph.href} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center font-semibold text-slate-800">
              📞 {ph.label}
            </a>
          ))}
        {pro && item.contact && !item.leadId && <span className="break-all text-slate-500">{item.contact}</span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-2.5">
        <ShareButton
          url={`${share.base}/job/${item.id}?lang=${lang}`}
          text={`${share.t.message} ${title}`}
          labels={share.t}
          compact
          haaks={pro ? { itemId: item.id, t: js, recent: shareTargets } : undefined}
        />
        {pro && item.source_url && (
          <a href={item.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
            <Icon name="external" className="h-5 w-5" />
            {share.t.source}
          </a>
        )}
        {item.action === "hidden" ? (
          <form action={unhideFeedItem.bind(null, item.id)}>
            <SubmitButton className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
              <Icon name="undo" className="h-5 w-5" />
              {share.t.unhide}
            </SubmitButton>
          </form>
        ) : (
          <HideMenu
            icon={<Icon name="eyeOff" className="h-5 w-5" />}
            label={f.hide}
            title={fp.whyTitle}
            hint={fp.whyHint}
            choices={HIDE_REASONS.map((r) => ({ key: r, label: fp.reasons[r], action: hideFeedItem.bind(null, item.id, r) }))}
            skip={{ label: fp.noReason, action: hideFeedItem.bind(null, item.id, "") }}
            cancel="✕"
          />
        )}
        {companyJob && !ownJob && (
          <div className="ml-auto">
            <ReportButton kind="job" target={item.id} reasons={JOB_REASONS} t={reportT} sent={reported} />
          </div>
        )}
      </div>
    </li>
  );
}

// "Open card for free (2 of 3 left)": spends one of the free opens.
function OpenButton({ id, f, opensLeft, center }: { id: string; f: FeedDict; opensLeft: number; center?: boolean }) {
  return (
    <form
      action={unlockFeedItem.bind(null, id)}
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${center ? "flex-col justify-center" : ""}`}
    >
      <SubmitButton className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
        🔓 {f.openCard}
      </SubmitButton>
      <span className="text-xs text-slate-500">{fill(f.openLeft, { n: opensLeft, total: FREE_OPENS })}</span>
    </form>
  );
}

function LockedCard({ item, f, lang, opensLeft }: { item: ScoredFeedItem; f: FeedDict; lang: Lang; opensLeft: number }) {
  const opensIn = Math.max(1, Math.ceil(24 - (Date.now() - new Date(item.published_at).getTime()) / 3600000));
  return (
    <li id={`job-${item.id}`} className="relative scroll-mt-20 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div aria-hidden className="select-none blur-[5px]">
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-0.5">Telegram · ••••••</span>
          <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-green-800">••%</span>
        </div>
        <p className="mt-2 font-semibold">•••••••• •• •••••••, {item.city}</p>
        <p className="text-sm text-slate-500">{item.trades.map((tr) => tradeLabel(tr, lang)).join(", ")}</p>
        <p className="mt-2 text-sm text-slate-700">•••••• ••••••••• •••• •••••• ••• ••••••••• •••••• •••••••••.</p>
      </div>
      {opensLeft > 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 p-3 text-center">
          <span className="rounded-2xl bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">
            🔒 {fill(f.lockedTitle, { city: item.city ?? "—" })}
          </span>
          <OpenButton id={item.id} f={f} opensLeft={opensLeft} center />
        </div>
      ) : (
        <a href="#pro" className="absolute inset-0 grid place-items-center bg-white/40 p-3">
          <span className="rounded-2xl bg-slate-900 px-3 py-1.5 text-center text-sm font-medium text-white">
            🔒 {fill(f.lockedTitle, { city: item.city ?? "—" })} · {fill(f.lockedText, { h: opensIn })}
          </span>
        </a>
      )}
    </li>
  );
}
