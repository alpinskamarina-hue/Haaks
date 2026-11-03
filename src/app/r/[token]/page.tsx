import type { Metadata } from "next";
import Link from "next/link";
import { submitReview } from "@/app/reviews-actions";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import { StarInput } from "@/components/StarInput";
import { SubmitButton } from "@/components/SubmitButton";
import { CRITERIA, type Review } from "@/lib/reviews";
import { PUBLIC_REVIEWS } from "@/lib/reviews-i18n";
import { createClient, createServerAccountClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beoordeling",
  robots: { index: false, follow: false },
};

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5";

// What the client sees: a one-time review form in Dutch (or English), no account needed.
export default async function ReviewFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string; done?: string; error?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const lang = sp.lang === "en" ? "en" : "nl";
  const t = PUBLIC_REVIEWS[lang];

  const admin = await createServerAccountClient();
  const { data: review } = await admin.from("reviews").select("*").eq("token", token).maybeSingle<Review>();
  const { data: worker } = review
    ? await admin.from("profiles").select("full_name, company_name, avatar_path").eq("id", review.worker_id).single()
    : { data: null };
  const name = worker?.company_name || worker?.full_name || "ZZP";
  const avatar = worker?.avatar_path
    ? (await admin.storage.from("documents").createSignedUrl(worker.avatar_path, 600)).data?.signedUrl
    : null;
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  const fill = (s: string) => s.replace("{name}", name);

  let body: React.ReactNode;
  if (!review || review.status === "hidden") {
    body = <p className="text-center text-slate-600">{t.notFound}</p>;
  } else if (sp.done || review.status !== "requested") {
    body = (
      <div className="text-center">
        <p className="text-4xl">⭐</p>
        <h1 className="mt-2 text-2xl font-bold">{sp.done ? t.thanks : t.used}</h1>
        {sp.done && <p className="mt-2 text-slate-600">{fill(t.thanksText)}</p>}
      </div>
    );
  } else {
    const own = user?.id === review.worker_id;
    body = (
      <>
        <div className="flex items-center gap-3">
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
          )}
          <h1 className="text-2xl font-bold">{fill(t.title)}</h1>
        </div>
        <p className="text-slate-600">{fill(t.intro)}</p>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">{t.job}:</span> <b>{review.job_title}</b>
        </p>
        {own && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t.own}</p>}
        {sp.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{t.needStars}</p>}
        {!own && (
        <form action={submitReview.bind(null, token, lang)} className="space-y-5">
          <StarInput name="stars" label={t.overall} big required />
          <div className="space-y-2 rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-600">{t.details}</p>
            {CRITERIA.map((c) => (
              <StarInput key={c} name={c} label={t.criteria[c]} />
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t.body}</span>
            <textarea name="body" maxLength={1000} placeholder={t.bodyHint} className={`${input} min-h-28`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t.name}</span>
              <input name="name" required maxLength={60} defaultValue={review.client_name ?? ""} className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t.city}</span>
              <input name="city" maxLength={60} className={input} />
            </label>
          </div>
          <p className="text-xs text-slate-500">{t.nameHint}</p>
          <SubmitButton className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
            {t.send}
          </SubmitButton>
        </form>
        )}
      </>
    );
  }

  return (
    <main lang={lang} className="mx-auto max-w-xl space-y-5 px-4 py-6">
      <HtmlLang lang={lang} />
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Haaks · {t.pageTitle}</p>
        <nav className="flex gap-2 text-sm">
          <Link href={`?lang=nl`} className={lang === "nl" ? "font-bold" : "text-slate-500"}>
            NL
          </Link>
          <Link href={`?lang=en`} className={lang === "en" ? "font-bold" : "text-slate-500"}>
            EN
          </Link>
        </nav>
      </header>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{body}</section>
      <p className="text-xs text-slate-500">✓ {t.verified}</p>
      <PublicFooter />
    </main>
  );
}
