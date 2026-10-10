import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/LoginForm";
import { getDict } from "@/lib/i18n";
import { requestLang } from "@/lib/lang";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const lang = await requestLang();
  const t = getDict(lang);
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold">ZZP Paspoort</span>
        <LanguageSwitcher current={lang} label={t.language} />
      </header>

      <section className="mt-12 space-y-3">
        <h1 className="text-3xl font-bold leading-tight">{t.tagline}</h1>
        <p className="text-slate-600">{t.privacyNote}</p>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">{t.loginTitle}</h2>
        {error && <p className="mb-3 text-sm text-red-700">{t.loginError}</p>}
        <LoginForm t={t} />
      </section>
    </main>
  );
}
