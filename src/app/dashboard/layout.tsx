import Link from "next/link";
import { signOut } from "@/app/actions";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BottomNav, SideNav, type NavItem } from "@/components/NavLinks";
import { loadWorkspace } from "@/lib/workspace";

// One cabinet for every service: sidebar on a computer, tab bar on a phone.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const { count: newLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "new");

  const items: NavItem[] = [
    { href: "/dashboard", label: t.navHome, icon: "home" },
    { href: "/dashboard/leads", label: t.navLeads, short: t.navLeadsShort, icon: "search", badge: newLeads ?? 0 },
    { href: "/dashboard/quotes", label: t.navQuotes, icon: "quote" },
    { href: "/dashboard/orders", label: t.navOrders, icon: "orders" },
    { href: "/dashboard/invoices", label: t.navInvoices, icon: "invoice" },
    { href: "/dashboard/passport", label: t.navPassport, icon: "passport" },
  ];
  const name = profile.company_name || profile.full_name || user.email;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:flex lg:h-screen print:hidden">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-3 text-xl font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-600 text-white">H</span>
          Haaks
        </Link>
        <SideNav items={items} />
        <div className="mt-auto space-y-3 border-t border-slate-200 px-3 pt-4">
          <p className="truncate text-sm font-medium">{name}</p>
          <LanguageSwitcher current={lang} label={t.language} />
          <form action={signOut}>
            <button className="flex items-center gap-2 text-sm text-slate-600">
              <Icon name="logout" className="h-4 w-4" />
              {t.signOut}
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-8">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-600 text-sm text-white">H</span>
            Haaks
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={lang} label={t.language} />
            <form action={signOut}>
              <button className="p-1 text-slate-500" aria-label={t.signOut}>
                <Icon name="logout" />
              </button>
            </form>
          </div>
        </header>
        {children}
      </div>

      <BottomNav items={items.filter((i) => i.href !== "/dashboard/passport")} />
    </div>
  );
}
