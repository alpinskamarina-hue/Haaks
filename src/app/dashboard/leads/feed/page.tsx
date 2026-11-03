import Link from "next/link";
import {
  connectTelegram,
  disconnectTelegram,
  hideFeedItem,
  saveFeedNotifications,
  takeFeedItem,
  unhideFeedItem,
  unlockFeedItem,
} from "@/app/feed-actions";
import { LeadsTabs } from "@/components/LeadsTabs";
import { PushToggle } from "@/components/PushToggle";
import { SubmitButton } from "@/components/SubmitButton";
import { feedText, sourceLabel, timeAgo, tradeLabel, type FeedEmailMode } from "@/lib/feed";
import { fill, getFeedDict, pushTexts, type FeedDict } from "@/lib/feed-i18n";
import { FIT_SCORE, FREE_OPENS, isNewJob, loadFeed, markFeedSeen, newFittingCount, newSince, type ScoredFeedItem } from "@/lib/feed-server";
import type { Lang } from "@/lib/i18n";
import { emailLink, resumeMessage, scoreColor } from "@/lib/leads";
import { siteUrl } from "@/lib/lang";
import { vapidPublicKey } from "@/lib/push";
import { telegramEnabled } from "@/lib/telegram";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

// Sections of the feed, each with its own colour: real jobs first, then signals.
type Section = "jobs" | "soon" | "tender" | "business";
const SECTION_OF: Record<ScoredFeedItem["kind"], Section> = {
  private: "jobs",
  permit: "soon",
  tender: "tender",
  business: "business",
};
const SECTIONS: { key: Section; icon: string; label: (f: FeedDict) => string; chip: string; bg: string; stripe: string; text: string }[] = [
  { key: "jobs", icon: "🔥", label: (f) => f.secJobs, chip: "border-orange-500 text-orange-700", bg: "bg-orange-50", stripe: "border-l-orange-500", text: "text-orange-700" },
  { key: "soon", icon: "🏗", label: (f) => f.secSoon, chip: "border-green-600 text-green-700", bg: "bg-green-50", stripe: "border-l-green-600", text: "text-green-700" },
  { key: "tender", icon: "📋", label: (f) => f.secTender, chip: "border-blue-600 text-blue-700", bg: "bg-blue-50", stripe: "border-l-blue-600", text: "text-blue-700" },
  { key: "business", icon: "🏢", label: (f) => f.secBusiness, chip: "border-purple-600 text-purple-700", bg: "bg-purple-50", stripe: "border-l-purple-600", text: "text-purple-700" },
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
  searchParams: Promise<{ all?: string; hidden?: string; saved?: string; section?: string; city?: string }>;
}) {
  const params = await searchParams;
  const showAll = params.all === "1";
  const showHidden = params.hidden === "1";
  const section = SECTIONS.find((x) => x.key === params.section)?.key ?? null;
  const cityFilter = params.city?.trim() || null;
  const { supabase, user, profile, lang } = await loadWorkspace();
  const f = getFeedDict(lang);
  const extra = profile as typeof profile & {
    plan?: string;
    feed_email?: FeedEmailMode;
    notify_email?: string | null;
    telegram_chat_id?: number | null;
    feed_seen_at?: string | null;
    feed_last_visit?: string | null;
  };
  const pro = extra.plan === "pro";

  const [{ items, trades, regions, match, opensLeft }, { count: mineCount }, lastVisit] = await Promise.all([
    loadFeed(supabase, user.id, profile),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "new"),
    markFeedSeen(supabase, user.id, extra),
  ]);
  // "New": came in since the visit before this one.
  const since = newSince(lastVisit);

  const shown = items
    .filter((i) => (showHidden ? i.action === "hidden" : i.action !== "hidden"))
    .filter((i) => showAll || showHidden || i.score >= FIT_SCORE);
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
        sectionOrder.indexOf(SECTION_OF[a.kind]) - sectionOrder.indexOf(SECTION_OF[b.kind]) ||
        (a.distance ?? Infinity) - (b.distance ?? Infinity) ||
        b.published_at.localeCompare(a.published_at),
    );
  const sectionCount = (key: Section) => base.filter((i) => SECTION_OF[i.kind] === key).length;
  const sectionNew = (key: Section) => base.filter((i) => SECTION_OF[i.kind] === key && isNewJob(i, since)).length;
  const query = (next: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const merged = { all: showAll ? "1" : null, hidden: showHidden ? "1" : null, section, city: cityFilter, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const str = q.toString();
    return `/dashboard/leads/feed${str ? `?${str}` : ""}`;
  };
  const passportUrl = profile.passport_enabled ? `${await siteUrl()}/p/${profile.passport_token}` : null;
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
  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 ${active ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"}`;

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{f.tabFeed}</h1>
        <p className="text-slate-600">{f.feedSubtitle}</p>
      </div>

      <LeadsTabs
        active="feed"
        feedLabel={f.tabFeed}
        mineLabel={f.tabMine}
        feedCount={newFittingCount(items, lastVisit)}
        mineCount={mineCount ?? 0}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          {!pro && locked.length > 0 && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="font-semibold text-orange-900">{fill(f.bannerTitle, { n: locked.length })}</p>
              <p className="mt-1 text-sm text-orange-900/80">{f.bannerText}</p>
              <p className="mt-2 text-sm font-semibold text-orange-900">
                {opensLeft > 0 ? `🔓 ${fill(f.openLeft, { n: opensLeft })}` : f.openNone}
              </p>
              <a href="#pro" className="mt-3 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
                {f.proTitle}
              </a>
            </div>
          )}

          {trades.length === 0 && regions.length === 0 && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {f.profileHint}{" "}
              <Link href="/dashboard/leads" className="font-semibold underline">
                {f.profileLink}
              </Link>
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-sm">
            <Link href={query({ section: null })} className={chip(!section)}>
              {f.secAll} {base.length}
            </Link>
            {SECTIONS.map((x) => (
              <Link
                key={x.key}
                href={query({ section: x.key })}
                className={`shrink-0 rounded-full border-2 px-3 py-1 font-medium ${
                  section === x.key ? `${x.chip} ${x.bg} shadow-sm` : `${x.chip} bg-white`
                }`}
              >
                {x.icon} {x.label(f)} {sectionCount(x.key)}
                {sectionNew(x.key) > 0 && (
                  <span className="ml-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">+{sectionNew(x.key)}</span>
                )}
              </Link>
            ))}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-xs sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={query({ all: null, hidden: null, city: null })} className={chip(!showAll && !showHidden)}>
              {f.filterMine}
            </Link>
            <Link href={query({ all: "1", hidden: null })} className={chip(showAll)}>
              {f.filterAll}
            </Link>
            {hiddenCount > 0 && (
              <Link href={query({ hidden: "1", all: null })} className={chip(showHidden)}>
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
              })}{" "}
              <Link href="/dashboard/leads" className="underline">
                {f.profileLink}
              </Link>
            </p>
          )}

          {visible.length === 0 && <p className={`${card} text-slate-600`}>{f.empty}</p>}
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
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{f.proSoon}</p>
            </section>
          )}

          <div id="push">
            <PushToggle publicKey={vapidPublicKey()} t={pushTexts(f)} />
          </div>

          <section id="notify" className={card}>
            <h2 className="mb-3 font-semibold">{f.notifyTitle}</h2>
            <form action={saveFeedNotifications} className="space-y-2 text-sm">
              {(
                [
                  ["off", f.notifyOff],
                  ["daily", f.notifyDaily],
                  ["instant", f.notifyInstant],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className={`flex items-center gap-2 ${value === "instant" && !pro ? "text-slate-400" : ""}`}>
                  <input
                    type="radio"
                    name="feed_email"
                    value={value}
                    defaultChecked={(extra.feed_email ?? "off") === value}
                    disabled={value === "instant" && !pro}
                  />
                  {label}
                </label>
              ))}
              <label className="block pt-1 font-medium">
                {f.notifyEmail}
                <input
                  name="notify_email"
                  type="email"
                  defaultValue={extra.notify_email ?? user.email ?? ""}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
                />
              </label>
              <div className="flex items-center gap-3 pt-1">
                <SubmitButton className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">{f.notifySave}</SubmitButton>
                {params.saved && <span className="text-green-700">{f.notifySaved}</span>}
              </div>
            </form>
            <p className="mt-3 text-xs text-slate-500">{f.notifyNext}</p>
          </section>

          <section id="telegram" className={card}>
            <h2 className="mb-2 font-semibold">{f.tgTitle}</h2>
            {extra.telegram_chat_id ? (
              <>
                <p className="text-sm text-green-700">✓ {f.tgConnected}</p>
                <form action={disconnectTelegram} className="mt-3">
                  <SubmitButton className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                    {f.tgDisconnect}
                  </SubmitButton>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">{f.tgText}</p>
                {!pro ? (
                  <p className="mt-3 rounded-lg bg-orange-50 p-3 text-xs text-orange-800">{f.tgProOnly}</p>
                ) : telegramEnabled() ? (
                  <form action={connectTelegram} className="mt-3">
                    <SubmitButton className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white">{f.tgConnect}</SubmitButton>
                  </form>
                ) : (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{f.tgNotReady}</p>
                )}
              </>
            )}
          </section>

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
}: {
  item: ScoredFeedItem;
  f: FeedDict;
  lang: Lang;
  pro: boolean;
  opensLeft: number;
  worker: Worker;
  isNew: boolean;
}) {
  // An opened card is shown like for Pro.
  const pro = isPro || item.opened;
  const { title, summary } = feedText(item, lang);
  const age = Date.now() - new Date(item.published_at).getTime();
  const old = age > 14 * 24 * 60 * 60 * 1000;
  const info = sectionInfo(item.kind);
  const left = item.kind === "tender" ? daysLeft(item.timing) : null;
  const meta = [item.city, item.trades.map((tr) => tradeLabel(tr, lang)).join(", "), item.timing, item.budget].filter(Boolean);
  const resumeLink = pro
    ? emailLink(item.contact, `ZZP vakman voor uw klus: ${item.title ?? title}`, resumeMessage({ ...worker, job: item.title ?? title }))
    : null;
  return (
    <li className={`rounded-2xl border border-l-[6px] border-slate-200 ${info.stripe} bg-white p-4 shadow-sm ${old ? "opacity-70" : ""}`}>
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
          {sourceLabel(item)}
        </span>
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
        {item.is_demo && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">{f.demoBadge}</span>}
        <span className={`ml-auto rounded-full px-2 py-0.5 font-semibold ${scoreColor(item.score)}`}>{item.score}%</span>
      </div>
      <p className="mt-2 break-words font-semibold">{title}</p>
      <p className="text-sm text-slate-500">
        {kindLabel(item.kind, f)} · {meta.join(" · ")}
      </p>
      <p className="mt-2 break-words text-sm text-slate-700">{summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm">
        {item.leadId ? (
          <Link href={`/dashboard/leads/${item.leadId}`} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium">
            ✓ {f.taken} · {f.openLead}
          </Link>
        ) : pro ? (
          <form action={takeFeedItem.bind(null, item.id)}>
            <SubmitButton className="rounded-lg bg-orange-600 px-3 py-1.5 font-semibold text-white disabled:opacity-60">
              ✨ {f.reply}
            </SubmitButton>
          </form>
        ) : opensLeft > 0 ? (
          <OpenButton id={item.id} f={f} opensLeft={opensLeft} />
        ) : (
          <a href="#pro" className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-600">
            🔒 {f.lockedActions}
          </a>
        )}
        {resumeLink && (
          <a href={resumeLink} className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white">
            ✉️ {f.sendResume}
          </a>
        )}
        {pro && item.contact && !item.leadId && <span className="break-all text-slate-500">{item.contact}</span>}
        {pro && item.source_url && (
          <a href={item.source_url} target="_blank" rel="noreferrer" className="text-slate-500 underline">
            ↗
          </a>
        )}
        <form action={(item.action === "hidden" ? unhideFeedItem : hideFeedItem).bind(null, item.id)} className="ml-auto">
          <SubmitButton className="text-slate-400 hover:text-slate-700">
            {item.action === "hidden" ? "↺" : f.hide}
          </SubmitButton>
        </form>
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
    <li className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
