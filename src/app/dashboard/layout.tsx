import Link from "next/link";
import { signOut } from "@/app/actions";
import { HelpButton } from "@/components/HelpButton";
import { HtmlLang } from "@/components/HtmlLang";
import { Icon } from "@/components/icons";
import { BottomNav, SideNav, type NavItem } from "@/components/NavLinks";
import { loadFeed, newFittingCount } from "@/lib/feed-server";
import { legalSummary } from "@/lib/legal";
import { getHelp } from "@/lib/help";
import { getHelperDict } from "@/lib/helper-i18n";
import { getAccountantDict } from "@/lib/accountant-i18n";
import { getSocialDict } from "@/lib/social-i18n";
import { getMaterialsDict } from "@/lib/materials-i18n";
import { getPricingDict } from "@/lib/pricing-i18n";
import { faceUrl, staffOf } from "@/lib/staff";
import { getStaffDict } from "@/lib/staff-i18n";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { createServerAccountClient } from "@/lib/supabase/server";
import { loadWorkspace, signedUrls } from "@/lib/workspace";

// One cabinet for every service: sidebar on a computer, tab bar on a phone.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  // New fitting jobs since the worker last opened the feed: the number on the Feed button.
  const newJobs = await loadFeed(supabase, user.id, profile)
    .then(({ items }) => newFittingCount(items, (profile as typeof profile & { feed_seen_at?: string | null }).feed_seen_at))
    .catch(() => 0);

  // Haaks admin: jobs waiting for a check, plus complaints.
  const isAdmin = Boolean((profile as typeof profile & { is_admin?: boolean }).is_admin);
  const pendingJobs = isAdmin
    ? await createServerAccountClient()
        .then((server) =>
          Promise.all([
            server.from("company_jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
            server.from("client_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
            server.from("reports").select("id", { count: "exact", head: true }),
            server.from("reviews").select("id", { count: "exact", head: true }).eq("status", "submitted").not("report_reason", "is", null),
          ]),
        )
        .then(([jobs, clients, reports, reviews]) => (jobs.count ?? 0) + (clients.count ?? 0) + (reports.count ?? 0) + (reviews.count ?? 0))
        .catch(() => 0)
    : 0;

  const w = getWorkerDict(lang);
  const items: NavItem[] = [
    { href: "/dashboard", label: t.navHome, icon: "home" },
    { href: "/dashboard/leads/feed", section: "/dashboard/leads", label: t.navLeads, short: t.navLeadsShort, icon: "feed", badge: newJobs, clearOn: "/dashboard/leads/feed" },
    { href: "/dashboard/quotes", label: t.navQuotes, icon: "quote" },
    { href: "/dashboard/orders", label: t.navOrders, icon: "orders" },
    { href: "/dashboard/materials", label: getMaterialsDict(lang).nav, icon: "cart" },
    { href: "/dashboard/invoices", label: t.navInvoices, icon: "invoice" },
    { href: "/dashboard/accountant", label: getAccountantDict(lang).nav, icon: "folder" },
    { href: "/dashboard/passport", label: t.navPassport, icon: "passport", also: ["/dashboard/works", "/dashboard/reviews"] },
    { href: "/dashboard/profile", label: w.navProfile, icon: "user" },
    { href: "/dashboard/helpers", label: getHelperDict(lang).nav, icon: "plus" },
    { href: "/dashboard/staff", label: getStaffDict(lang).nav, icon: "sparkle" },
    ...(isAdmin ? [{ href: "/dashboard/moderation", label: "Модерация", icon: "search" as const, badge: pendingJobs }] : []),
  ];
  const name = profile.company_name || profile.full_name || user.email;
  const so = getSocialDict(lang);
  const help = getHelp(lang).ui;
  // The worker's own photo in the header: one tap to «Мой профиль».
  const avatarPath = (profile as typeof profile & { avatar_path?: string | null }).avatar_path ?? null;
  const avatarUrl = avatarPath ? ((await signedUrls(supabase, [avatarPath]).catch(() => new Map<string, string>())).get(avatarPath) ?? null) : null;
  const initials =
    (profile.full_name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]!.toUpperCase())
      .join("") || "🙂";

  return (
    <div lang={lang} className="min-h-screen lg:flex">
      <HtmlLang lang={lang} />
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:flex lg:h-screen print:hidden">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-3 text-xl font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-600 text-white">H</span>
          Haaks
        </Link>
        <Link href="/dashboard/search" className="mb-4 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-200">
          🔍 <span className="truncate">{so.searchPlaceholder}</span>
        </Link>
        <SideNav items={items} />
        <div className="mt-auto space-y-3 border-t border-slate-200 px-3 pt-4">
          <Link href="/dashboard/profile" className="block truncate text-sm font-medium">
            {name}
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm text-slate-600">
            ⚙️ {t.settingsTitle}
          </Link>
          <Link href="/dashboard/plan" className="flex items-center gap-2 text-sm text-slate-600">
            💳 {getPricingDict(lang).myTitle}
          </Link>
          <HelpButton label={help.help} variant="line" />
          <nav className="flex flex-wrap gap-x-3 text-xs text-slate-400">
            <Link href="/privacy">{legalSummary(lang).links.privacy}</Link>
            <Link href="/terms">{legalSummary(lang).links.terms}</Link>
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-8">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
          <Link href="/dashboard" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-600 text-sm font-bold text-white" aria-label="Haaks">
            H
          </Link>
          <Link href="/dashboard/search" className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
            🔍 <span className="truncate">{so.searchPlaceholder}</span>
          </Link>
          {/* The worker's digital employee, one tap away. */}
          <Link href="/dashboard/staff" className="shrink-0" aria-label={getStaffDict(lang).nav} title={getStaffDict(lang).nav}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={faceUrl(staffOf(profile as Parameters<typeof staffOf>[0]).face)} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-violet-500 ring-offset-1" />
          </Link>
          <HelpButton label={help.helpHere} variant="round" />
          <Link href="/dashboard/profile" className="shrink-0" aria-label={w.navProfile} title={w.navProfile}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-orange-500 ring-offset-1" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-orange-100 text-sm font-bold text-orange-800 ring-2 ring-orange-500 ring-offset-1">
                {initials}
              </span>
            )}
          </Link>
          {/* Menu: profile, settings, plan, sign out. */}
          <details className="relative shrink-0">
            <summary className="list-none p-1 text-slate-500 [&::-webkit-details-marker]:hidden" aria-label={t.settingsTitle}>
              <Icon name="menu" />
            </summary>
            <div className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-lg">
              <Link href="/dashboard/profile" className="block px-4 py-3">
                👤 {w.navProfile}
              </Link>
              <Link href="/dashboard/staff" className="block border-t border-slate-100 px-4 py-3">
                🤖 {getStaffDict(lang).nav}
              </Link>
              <Link href="/dashboard/settings" className="block border-t border-slate-100 px-4 py-3">
                ⚙️ {t.settingsTitle}
              </Link>
              <Link href="/dashboard/accountant" className="block border-t border-slate-100 px-4 py-3">
                📁 {getAccountantDict(lang).title}
              </Link>
              <Link href="/dashboard/plan" className="block border-t border-slate-100 px-4 py-3">
                💳 {getPricingDict(lang).myTitle}
              </Link>
              <Link href="/dashboard/help" className="block border-t border-slate-100 px-4 py-3">
                ❓ {help.help}
              </Link>
              {isAdmin && (
                <Link href="/dashboard/moderation" className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
                  🛡 Модерация
                  {pendingJobs > 0 && <span className="rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">{pendingJobs}</span>}
                </Link>
              )}
              <form action={signOut} className="border-t border-slate-100">
                <button className="block w-full px-4 py-3 text-left">🚪 {t.signOut}</button>
              </form>
            </div>
          </details>
        </header>
        {children}
      </div>

      <BottomNav items={items.filter((i) => !["/dashboard/profile", "/dashboard/materials", "/dashboard/accountant", "/dashboard/moderation", "/dashboard/helpers", "/dashboard/staff"].includes(i.href))} />
    </div>
  );
}
