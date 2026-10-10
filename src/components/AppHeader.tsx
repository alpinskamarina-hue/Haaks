import Link from "next/link";
import { signOut } from "@/app/actions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Dict, Lang } from "@/lib/i18n";

export function AppHeader({ lang, t, active }: { lang: Lang; t: Dict; active: "passport" | "orders" }) {
  const tab = (isActive: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-slate-900 text-white" : "text-slate-700"}`;
  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-bold">ZZP Paspoort</span>
        <div className="flex items-center gap-3">
          <LanguageSwitcher current={lang} label={t.language} />
          <form action={signOut}>
            <button className="text-sm text-slate-600 underline">{t.signOut}</button>
          </form>
        </div>
      </div>
      <nav className="flex gap-2">
        <Link href="/dashboard" className={tab(active === "passport")}>
          {t.navPassport}
        </Link>
        <Link href="/dashboard/orders" className={tab(active === "orders")}>
          {t.navOrders}
        </Link>
      </nav>
    </header>
  );
}
