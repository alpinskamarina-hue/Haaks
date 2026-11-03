import Link from "next/link";
import { redirect } from "next/navigation";
import { setLanguage, signOut } from "@/app/actions";
import { HtmlLang } from "@/components/HtmlLang";
import { Icon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { companyLang, getCompanyDict } from "@/lib/company-i18n";
import { ensureProfile } from "@/lib/workspace";

// Cabinet for companies (BV) that post jobs for ZZP builders. Dutch or English.
export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const profile = (await ensureProfile(supabase, user.id)) as { account_type?: string; language?: string } | null;
  if (profile?.account_type !== "company") redirect("/dashboard");
  const lang = companyLang(profile.language);
  const t = getCompanyDict(lang);
  const other = lang === "nl" ? "en" : "nl";

  return (
    <div lang={lang} className="min-h-screen bg-slate-50">
      <HtmlLang lang={lang} />
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/company" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-600 text-sm text-white">H</span>
            Haaks <span className="font-medium text-slate-500">· {t.brand}</span>
          </Link>
          <div className="flex items-center gap-3">
            <form action={setLanguage.bind(null, other)}>
              <button className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold uppercase text-slate-600">{other}</button>
            </form>
            <form action={signOut}>
              <button className="p-1 text-slate-500" aria-label={t.signOut} title={t.signOut}>
                <Icon name="logout" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
