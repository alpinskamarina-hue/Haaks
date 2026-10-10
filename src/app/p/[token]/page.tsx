import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  docStatus,
  kvkSearchUrl,
  VCA_REGISTER_URL,
  VIES_URL,
  type DocumentRow,
  type Profile,
} from "@/lib/documents";
import { getPassportDict, type PassportDict } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ZZP-paspoort",
  robots: { index: false, follow: false },
};

const SIGNED_URL_SECONDS = 10 * 60;

export default async function PassportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const lang = (await searchParams).lang === "en" ? "en" : "nl";
  const t = getPassportDict(lang);

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("passport_token", token)
    .eq("passport_enabled", true)
    .maybeSingle<Profile>();

  if (!profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">{t.notFound}</main>
    );
  }

  const { data: docs } = await admin
    .from("documents")
    .select("*")
    .eq("user_id", profile.id)
    .eq("show_in_passport", true)
    .order("doc_type")
    .returns<DocumentRow[]>();
  const documents = docs ?? [];

  const signed = documents.length
    ? (
        await admin.storage
          .from("documents")
          .createSignedUrls(documents.map((d) => d.file_path), SIGNED_URL_SECONDS)
      ).data ?? []
    : [];
  const urlByPath = new Map(
    signed.flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])),
  );

  await admin.from("passport_views").insert({
    profile_id: profile.id,
    user_agent: (await headers()).get("user-agent")?.slice(0, 300) ?? null,
  });

  const hasVca = documents.some((d) => d.doc_type === "vca");

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">{t.title}</p>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link href="?lang=nl" className={lang === "nl" ? "font-bold" : "text-slate-500"}>
            NL
          </Link>
          <Link href="?lang=en" className={lang === "en" ? "font-bold" : "text-slate-500"}>
            EN
          </Link>
        </nav>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold">{profile.full_name ?? profile.company_name ?? "—"}</h1>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <Row label={t.company} value={profile.company_name} />
          <Row label={t.trade} value={profile.trade} />
          <Row label={t.city} value={profile.city} />
          <Row label={t.phone} value={profile.phone} />
          <Row label={t.kvk} value={profile.kvk_number} />
          <Row label={t.btw} value={profile.btw_number} />
        </dl>
        <div className="mt-4 flex flex-col gap-1 text-sm">
          {profile.kvk_number && (
            <a className="text-blue-700 underline" href={kvkSearchUrl(profile.kvk_number)} target="_blank" rel="noopener">
              {t.checkKvk} ↗
            </a>
          )}
          {profile.btw_number && (
            <a className="text-blue-700 underline" href={VIES_URL} target="_blank" rel="noopener">
              {t.checkVies} ↗
            </a>
          )}
          {hasVca && (
            <a className="text-blue-700 underline" href={VCA_REGISTER_URL} target="_blank" rel="noopener">
              {t.checkVca} ↗
            </a>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">{t.documents}</h2>
        <ul className="space-y-3">
          {documents.map((doc) => (
            <PassportDocument key={doc.id} doc={doc} t={t} url={urlByPath.get(doc.file_path)} />
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500">{t.disclaimer}</p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </>
  );
}

function PassportDocument({ doc, t, url }: { doc: DocumentRow; t: PassportDict; url?: string }) {
  const status = docStatus(doc);
  const badge = {
    valid: { label: t.valid, color: "bg-green-100 text-green-800" },
    expires_soon: { label: t.expiresSoon, color: "bg-amber-100 text-amber-800" },
    kvk_old: { label: t.kvkOld, color: "bg-amber-100 text-amber-800" },
    expired: { label: t.expired, color: "bg-red-100 text-red-800" },
  }[status];

  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{t.docTypes[doc.doc_type]}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <Row label={t.number} value={doc.document_number} />
        <Row label={t.insurer} value={doc.insurer} />
        <Row label={t.coverage} value={doc.coverage_amount} />
        <Row label={t.issued} value={doc.issued_on} />
        <Row label={t.expires} value={doc.expires_on} />
      </dl>
      {url && (
        <a href={url} target="_blank" rel="noopener" className="mt-2 inline-block text-sm text-blue-700 underline">
          {t.view} ↗
        </a>
      )}
    </li>
  );
}
