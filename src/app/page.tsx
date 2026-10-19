import Link from "next/link";
import { redirect } from "next/navigation";
import { HeroScene } from "@/components/HeroScene";
import { Icon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/LoginForm";
import { getDict } from "@/lib/i18n";
import { getLanding } from "@/lib/landing";
import { requestLang } from "@/lib/lang";
import { createClient } from "@/lib/supabase/server";

const ctaClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-6 py-4 text-lg font-semibold text-white shadow-[0_6px_0_#9a3412,0_14px_24px_-6px_rgba(234,88,12,.6)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_0_#9a3412,0_18px_28px_-6px_rgba(234,88,12,.7)] active:translate-y-1 active:shadow-[0_2px_0_#9a3412] sm:w-auto";

// Cards lift and tilt slightly toward the pointer on computers.
const tilt =
  "transition duration-300 hover:[transform:perspective(900px)_rotateX(4deg)_rotateY(-5deg)_translateY(-4px)] hover:shadow-xl";

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
        <section className="relative isolate overflow-hidden bg-[#0b1224] text-white">
          <HeroScene className="absolute bottom-0 right-0 -z-20 h-[420px] w-full sm:h-[520px] lg:h-full" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1224] via-[#0b1224]/80 via-55% to-transparent to-75% lg:bg-gradient-to-r lg:from-slate-950/95 lg:via-slate-950/60 lg:to-transparent" />
          <div className="mx-auto max-w-5xl px-4 pb-[300px] pt-12 sm:pb-[380px] sm:pt-20 lg:flex lg:min-h-[680px] lg:flex-col lg:items-start lg:justify-center lg:pb-24 lg:pt-16">
            <p className="inline-block rounded-full bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-200 ring-1 ring-orange-400/40 backdrop-blur">
              {l.badge}
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight [text-shadow:0_2px_12px_rgba(0,0,0,.5)] sm:text-5xl">
              {l.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-200 [text-shadow:0_1px_8px_rgba(0,0,0,.6)]">{l.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#signup" className={ctaClass}>
                {l.cta}
                <Icon name="arrow" />
              </a>
              <span className="text-sm text-slate-300">{l.ctaNote}</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-3xl font-bold">{l.problemsTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {l.problems.map((p) => (
              <div key={p.title} className={`relative overflow-hidden rounded-2xl border border-red-100 bg-white p-5 pl-7 shadow-[0_10px_30px_-12px_rgba(15,23,42,.25)] ${tilt}`}>
                <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-red-400 to-red-600" />
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
                <div key={f.title} className={`rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_10px_30px_-12px_rgba(15,23,42,.25)] ${tilt}`}>
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[inset_0_2px_0_rgba(255,255,255,.35),inset_0_-5px_0_rgba(124,45,18,.35),0_10px_18px_-6px_rgba(234,88,12,.6)] [transform:perspective(300px)_rotateX(12deg)_rotateY(-12deg)]">
                    <Icon name={f.icon} className="h-7 w-7 drop-shadow" />
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
              <li key={s.title} className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-12px_rgba(15,23,42,.25)] ${tilt}`}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-lg font-bold text-white shadow-[inset_0_2px_0_rgba(255,255,255,.4),0_4px_0_#9a3412,0_10px_16px_-4px_rgba(234,88,12,.5)]">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_20px_40px_-16px_rgba(15,23,42,.6)]">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_0_#e2e8f0,0_30px_60px_-20px_rgba(234,88,12,.35)]">
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
