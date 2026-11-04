import Link from "next/link";
import { setPassportEnabled, signOut } from "@/app/actions";
import { connectTelegram, disconnectTelegram, saveFeedNotifications } from "@/app/feed-actions";
import { setInSearch, setUsername } from "@/app/profile-actions";
import { CopyButton } from "@/components/CopyButton";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PasswordForm } from "@/components/PasswordForm";
import { PushToggle } from "@/components/PushToggle";
import { SubmitButton } from "@/components/SubmitButton";
import { getFeedDict, pushTexts } from "@/lib/feed-i18n";
import { siteUrl } from "@/lib/lang";
import { legalSummary } from "@/lib/legal";
import { daysLeft, planOf, TRIAL_DAYS } from "@/lib/plans";
import { getPricingDict } from "@/lib/pricing-i18n";
import { vapidPublicKey } from "@/lib/push";
import { fill } from "@/lib/quotes-i18n";
import { getSettingsDict } from "@/lib/settings-i18n";
import { getSocialDict } from "@/lib/social-i18n";
import { telegramEnabled } from "@/lib/telegram";
import { suggestUsername } from "@/lib/username";
import { withDefaults, type WorkerProfile } from "@/lib/worker-profile";
import { describeProfile, getWorkerDict } from "@/lib/worker-profile-text";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const head = "px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-slate-500";
const row = "flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0";

function Switch({ on }: { on: boolean }) {
  return (
    <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-orange-600" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${on ? "left-[22px]" : "left-0.5"}`} />
    </span>
  );
}

// All settings in one place (Nasim, 2026-11-04): account, plan, alerts, which jobs the feed shows,
// visibility and documents. "My profile" stays what clients see.
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ nick?: string; saved?: string }> }) {
  const { nick, saved } = await searchParams;
  const { user, profile, lang, t } = await loadWorkspace();
  const s = getSettingsDict(lang);
  const f = getFeedDict(lang);
  const so = getSocialDict(lang);
  const w = getWorkerDict(lang);
  const pr = getPricingDict(lang);
  const legal = legalSummary(lang);
  const extra = profile as typeof profile & {
    plan?: string;
    plan_until?: string | null;
    trial_started_at?: string | null;
    feed_email?: "off" | "daily" | "instant";
    notify_email?: string | null;
    telegram_chat_id?: number | null;
    username?: string | null;
    in_search?: boolean;
  };
  const plan = planOf(extra);
  const pro = plan !== "free";
  const trial = Boolean(extra.trial_started_at && plan === "ultra");
  const username = extra.username ?? null;
  const profileUrl = username ? `${await siteUrl()}/@${username}` : null;
  const inSearch = Boolean(extra.in_search);
  const d = describeProfile(withDefaults(profile as unknown as Partial<WorkerProfile>), w, lang);
  const jumps = [
    ["account", s.account],
    ["plan", s.plan],
    ["notify", s.notifyShort],
    ["feed", s.feedShort],
    ["nick", s.visibility],
    ["docs", s.docs],
  ] as const;

  return (
    <main className="mx-auto max-w-2xl space-y-3 px-4 py-6">
      <h1 className="text-2xl font-bold">{s.title}</h1>
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {jumps.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="shrink-0 whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
            {label}
          </a>
        ))}
      </nav>

      <section id="account" className={`${card} scroll-mt-20`}>
        <p className={head}>{s.account}</p>
        <div className={row}>
          <span className="min-w-0">
            {t.emailLabel}
            <span className="block break-all text-sm text-slate-500">{user.email}</span>
          </span>
        </div>
        <div className={row}>
          <span>{t.language}</span>
          <LanguageSwitcher current={lang} label={t.language} alignRight />
        </div>
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="mb-2 flex items-center gap-2">
            <Icon name="key" className="h-4 w-4" />
            {t.navPassword}
          </p>
          <PasswordForm t={t} />
        </div>
      </section>

      <section id="plan" className={`${card} scroll-mt-20`}>
        <p className={head}>{s.plan}</p>
        <Link href="/dashboard/plan" className={row}>
          <span>
            {trial ? pr.myTrial : plan === "ultra" ? "Ultra" : plan === "pro" ? "Pro" : "Free"}
            {trial && extra.plan_until && (
              <span className="block text-sm text-slate-500">{fill(pr.myTrialLeft, { n: daysLeft(extra.plan_until), total: TRIAL_DAYS })}</span>
            )}
          </span>
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold uppercase text-white">{plan}</span>
        </Link>
        <Link href="/dashboard/plan#plans" className={`${row} text-slate-700`}>
          {s.allPlans}
          <span className="text-slate-300">›</span>
        </Link>
      </section>

      <section id="notify" className={`${card} scroll-mt-20`}>
        <p className={head}>{s.notify}</p>
        <div id="push" className="px-4 py-3">
          <PushToggle publicKey={vapidPublicKey()} t={pushTexts(f)} />
        </div>
        <div id="telegram" className="border-t border-slate-100 px-4 py-3">
          <p className="font-medium">✈️ {f.tgTitle}</p>
          {extra.telegram_chat_id ? (
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-sm text-green-700">✓ {f.tgConnected}</p>
              <form action={disconnectTelegram}>
                <SubmitButton className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700">{f.tgDisconnect}</SubmitButton>
              </form>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">{f.tgText}</p>
              {!pro ? (
                <p className="mt-2 rounded-lg bg-orange-50 p-3 text-xs text-orange-800">
                  {f.tgProOnly}{" "}
                  <Link href="/dashboard/plan" className="font-semibold underline">
                    {s.allPlans}
                  </Link>
                </p>
              ) : telegramEnabled() ? (
                <form action={connectTelegram} className="mt-2">
                  <SubmitButton className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white">{f.tgConnect}</SubmitButton>
                </form>
              ) : (
                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{f.tgNotReady}</p>
              )}
            </>
          )}
        </div>
        <form action={saveFeedNotifications} className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm">
          <p className="text-base font-medium">✉️ {f.notifyTitle}</p>
          {(
            [
              ["off", f.notifyOff],
              ["daily", f.notifyDaily],
              ["instant", f.notifyInstant],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={`flex items-center gap-2 ${value === "instant" && !pro ? "text-slate-400" : ""}`}>
              <input type="radio" name="feed_email" value={value} defaultChecked={(extra.feed_email ?? "off") === value} disabled={value === "instant" && !pro} />
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
            {saved && <span className="text-green-700">{f.notifySaved}</span>}
          </div>
        </form>
      </section>

      <section id="feed" className={`${card} scroll-mt-20`}>
        <p className={head}>{s.feed}</p>
        <p className="px-4 text-sm text-slate-500">{s.feedHint}</p>
        <Link href="/dashboard/onboarding?step=1&edit=1&back=settings" className={`${row} mt-2`}>
          <span className="min-w-0">
            {s.trades}
            <span className="mt-1 flex flex-wrap gap-1.5">
              {d.trades.length ? (
                d.trades.map((x) => (
                  <span key={x.name} className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs text-orange-800">
                    {x.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </span>
          </span>
          <span className="shrink-0 text-sm font-medium text-orange-700">{s.change}</span>
        </Link>
        <Link href="/dashboard/onboarding?step=2&edit=1&back=settings" className={row}>
          <span className="min-w-0">
            {s.where}
            <span className="block text-sm text-slate-500">{d.region || "—"}</span>
          </span>
          <span className="shrink-0 text-sm font-medium text-orange-700">{s.change}</span>
        </Link>
      </section>

      <section id="nick" className={`${card} scroll-mt-20`}>
        <p className={head}>{s.visibility}</p>
        <div className="px-4 py-3">
          <p className="font-medium">{so.nickTitle}</p>
          <p className="text-sm text-slate-600">{so.nickHint}</p>
          <form action={setUsername} className="mt-2 flex flex-wrap items-center gap-2">
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
        </div>
        {username && (
          <form action={setInSearch.bind(null, !inSearch)} className="border-t border-slate-100">
            <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
              <span>
                <span className="block">🔍 {so.inSearch}</span>
                <span className="block text-xs text-slate-500">{so.inSearchHint}</span>
              </span>
              <Switch on={inSearch} />
            </button>
          </form>
        )}
        <form action={setPassportEnabled.bind(null, !profile.passport_enabled)} className="border-t border-slate-100">
          <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
            <span>
              <span className="block">🪪 {s.passportOpen}</span>
              <span className="block text-xs text-slate-500">{s.passportOpenHint}</span>
            </span>
            <Switch on={Boolean(profile.passport_enabled)} />
          </button>
        </form>
      </section>

      <section id="docs" className={`${card} scroll-mt-20`}>
        <p className={head}>{s.docs}</p>
        {(["privacy", "terms", "cookies"] as const).map((k) => (
          <Link key={k} href={`/${k}`} className={row}>
            {legal.links[k]}
            <span className="text-slate-300">›</span>
          </Link>
        ))}
        <form action={signOut} className="border-t border-slate-100">
          <button className="flex w-full items-center gap-2 px-4 py-3 text-left font-medium text-slate-700">
            <Icon name="logout" className="h-4 w-4" />
            {t.signOut}
          </button>
        </form>
      </section>
    </main>
  );
}
