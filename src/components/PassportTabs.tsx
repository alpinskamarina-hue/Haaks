import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { siteUrl } from "@/lib/lang";
import { createClient } from "@/lib/supabase/server";

// Documents, finished work and reviews all live under one menu item, the ZZP passport.
// These tabs sit at the top of each of the three pages.
const LABELS: Record<Lang, { title: string; docs: string; works: string; reviews: string; client: string }> = {
  ru: { title: "ZZP-паспорт", docs: "Документы", works: "Работы", reviews: "Отзывы", client: "Как видит заказчик" },
  uk: { title: "ZZP-паспорт", docs: "Документи", works: "Роботи", reviews: "Відгуки", client: "Як бачить замовник" },
  pl: { title: "Paszport ZZP", docs: "Dokumenty", works: "Realizacje", reviews: "Opinie", client: "Jak widzi klient" },
  ro: { title: "Pașaport ZZP", docs: "Documente", works: "Lucrări", reviews: "Recenzii", client: "Cum vede clientul" },
  en: { title: "ZZP passport", docs: "Documents", works: "Work", reviews: "Reviews", client: "How clients see it" },
  nl: { title: "ZZP-paspoort", docs: "Documenten", works: "Werk", reviews: "Beoordelingen", client: "Zo ziet de klant het" },
};

export type PassportTab = "docs" | "works" | "reviews";

export async function PassportTabs({
  active,
  lang,
  userId,
  token,
  username,
}: {
  active: PassportTab;
  lang: Lang;
  userId: string;
  token: string;
  username?: string | null;
}) {
  const supabase = await createClient();
  const [{ count: works }, { count: reviews }, base] = await Promise.all([
    supabase.from("works").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("worker_id", userId).eq("status", "submitted"),
    siteUrl(),
  ]);
  return <PassportTabsView active={active} lang={lang} clientHref={`${base}/p/${token}`} works={works} reviews={reviews} username={username} />;
}

// The look on its own, without loading anything.
export function PassportTabsView({
  active,
  lang,
  clientHref,
  works,
  reviews,
  username,
}: {
  active: PassportTab;
  lang: Lang;
  clientHref: string;
  works?: number | null;
  reviews?: number | null;
  username?: string | null;
}) {
  const l = LABELS[lang];
  const tabs: { id: PassportTab; href: string; label: string; n?: number | null }[] = [
    { id: "docs", href: "/dashboard/passport", label: l.docs },
    { id: "works", href: "/dashboard/works", label: l.works, n: works },
    { id: "reviews", href: "/dashboard/reviews", label: l.reviews, n: reviews },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{l.title}</h1>
          {username && (
            <a href={`/@${username}`} className="text-sm font-semibold text-orange-600">
              @{username}
            </a>
          )}
        </div>
        <a
          href={clientHref}
          target="_blank"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
        >
          👁 {l.client}
        </a>
      </div>
      <nav className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" aria-label={l.title}>
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={tab.id === active ? "page" : undefined}
            className={`truncate rounded-lg px-2 py-2 text-center text-sm font-semibold ${
              tab.id === active ? "bg-white text-orange-700 shadow-sm" : "text-slate-600"
            }`}
          >
            {tab.label}
            {tab.n ? <span className="ml-1 font-normal text-slate-400">{tab.n}</span> : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
