import Link from "next/link";
import { signOut } from "@/app/actions";
import { HtmlLang } from "@/components/HtmlLang";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BottomNav, SideNav, type NavItem } from "@/components/NavLinks";
import { loadFeed, newFittingCount } from "@/lib/feed-server";
import { legalSummary } from "@/lib/legal";
import { getHelperDict } from "@/lib/helper-i18n";
import { getSocialDict } from "@/lib/social-i18n";
import { getMaterialsDict } from "@/lib/materials-i18n";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { createServerAccountClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/workspace";

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
            server.from("reports").select("id", { count: "exact", head: true }),
            server.from("reviews").select("id", { count: "exact", head: true }).eq("status", "submitted").not("report_reason", "is", null),
          ]),
        )
        .then(([jobs, reports, reviews]) => (jobs.count ?? 0) + (reports.count ?? 0) + (reviews.count ?? 0))
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
    { href: "/dashboard/passport", label: t.navPassport, icon: "passport", also: ["/dashboard/works", "/dashboard/reviews"] },
    { href: "/dashboard/profile", label: w.navProfile, icon: "user" },
    { href: "/dashboard/helpers", label: getHelperDict(lang).nav, icon: "plus" },
    ...(isAdmin ? [{ href: "/dashboard/moderation", label: "Модерация", icon: "search" as const, badge: pendingJobs }] : []),
  ];
  const name = profile.company_name || profile.full_name || user.email;
  const so = getSocialDict(lang);

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
          <p className="truncate text-sm font-medium">{name}</p>
          <LanguageSwitcher current={lang} label={t.language} up />
          <Link href="/dashboard/password" className="flex items-center gap-2 text-sm text-slate-600">
            <Icon name="key" className="h-4 w-4" />
            {t.navPassword}
          </Link>
          <form action={signOut}>
            <button className="flex items-center gap-2 text-sm text-slate-600">
              <Icon name="logout" className="h-4 w-4" />
              {t.signOut}
            </button>
          </form>
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
          <div className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher current={lang} label={t.language} />
            <Link href="/dashboard/profile" className="p-1 text-slate-500" aria-label={w.navProfile}>
              <Icon name="user" />
            </Link>
            <Link href="/dashboard/password" className="p-1 text-slate-500" aria-label={t.navPassword}>
              <Icon name="key" />
            </Link>
            <form action={signOut}>
              <button className="p-1 text-slate-500" aria-label={t.signOut}>
                <Icon name="logout" />
              </button>
            </form>
          </div>
        </header>
        {children}
      </div>

      <BottomNav items={items.filter((i) => !["/dashboard/profile", "/dashboard/materials", "/dashboard/moderation", "/dashboard/helpers"].includes(i.href))} />
    </div>
  );
}
