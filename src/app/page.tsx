import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/LoginForm";
import { getDict } from "@/lib/i18n";
import { getLanding } from "@/lib/landing";
import { requestLang } from "@/lib/lang";
import { createClient } from "@/lib/supabase/server";

const ctaClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-orange-700 sm:w-auto";

// Landing page for visitors; signed-in workers go straight to their dashboard.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const lang = await requestLang();
  const t = getDict(lang);
  const l = getLanding(lang);
  const { error, mode } = await searchParams;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-xl font-bold">
            Haaks<span className="text-orange-600">.</span>
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={lang} label={t.language} />
            <Link href="/?mode=signin#signup" className="hidden text-sm font-semibold text-orange-700 sm:inline">
              {l.login}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-b from-orange-50 to-slate-50">
          <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-20">
            <p className="inline-block rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
              {l.badge}
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{l.title}</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-700">{l.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#signup" className={ctaClass}>
                {l.cta}
                <Icon name="arrow" />
              </a>
              <span className="text-sm text-slate-600">{l.ctaNote}</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-3xl font-bold">{l.problemsTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {l.problems.map((p) => (
              <div key={p.title} className="rounded-2xl border border-red-100 bg-white p-5">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-slate-600">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="text-3xl font-bold">{l.featuresTitle}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {l.features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                    <Icon name={f.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-slate-600">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-3xl font-bold">{l.stepsTitle}</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {l.steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 rounded-2xl bg-slate-900 p-6 text-white">
            <h3 className="text-xl font-semibold">{l.langTitle}</h3>
            <p className="mt-2 text-slate-300">{l.langText}</p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-14">
            <h2 className="text-3xl font-bold">{l.faqTitle}</h2>
            <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
              {l.faq.map((f) => (
                <details key={f.q} className="group p-5">
                  <summary className="cursor-pointer list-none text-lg font-semibold marker:hidden">
                    <span className="mr-2 inline-block text-orange-600 transition group-open:rotate-45">+</span>
                    {f.q}
                  </summary>
                  <p className="mt-2 text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="signup" className="scroll-mt-20 bg-gradient-to-b from-slate-50 to-orange-50">
          <div className="mx-auto max-w-md px-4 py-16">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <h2 className="text-2xl font-bold">{l.signupTitle}</h2>
              <p className="mb-5 mt-2 text-slate-600">{l.signupText}</p>
              {error && <p className="mb-3 text-sm text-red-700">{t.loginError}</p>}
              <LoginForm key={mode} t={t} initialMode={mode === "signin" ? "signin" : "signup"} />
              <p className="mt-4 text-xs text-slate-500">{t.privacyNote}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <p className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-500">{l.footer}</p>
      </footer>
    </div>
  );
}
