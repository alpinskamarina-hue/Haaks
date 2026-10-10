import QRCode from "qrcode";
import { redirect } from "next/navigation";
import {
  deleteDocument,
  regeneratePassportLink,
  saveProfile,
  setPassportEnabled,
  toggleDocument,
  updateDocument,
} from "@/app/actions";
import { CopyButton } from "@/components/CopyButton";
import { AppHeader } from "@/components/AppHeader";
import { UploadForm } from "@/components/UploadForm";
import {
  docStatus,
  readiness,
  REQUIREMENTS,
  type DocumentRow,
  type Profile,
} from "@/lib/documents";
import { getDict, isLang, type Dict } from "@/lib/i18n";
import { siteUrl } from "@/lib/lang";
import { createClient } from "@/lib/supabase/server";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: docs }, { count: views }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<DocumentRow[]>(),
    supabase
      .from("passport_views")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id),
  ]);
  if (!profile) redirect("/");

  const lang = isLang(profile.language) ? profile.language : "en";
  const t = getDict(lang);
  const documents = docs ?? [];
  const ready = readiness(profile, documents);
  const doneCount = REQUIREMENTS.filter((r) => ready[r]).length;
  const passportUrl = `${await siteUrl()}/p/${profile.passport_token}`;
  const qr = await QRCode.toDataURL(passportUrl, { margin: 1, width: 240 });

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <AppHeader lang={lang} t={t} active="passport" />

      <section className={card}>
        <h2 className="text-xl font-semibold">{t.passportTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.passportHint}</p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="QR"
            width={160}
            height={160}
            className={profile.passport_enabled ? "" : "opacity-30"}
          />
          <div className="w-full min-w-0 space-y-3">
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-slate-100 px-2 py-2 text-xs">
                {passportUrl}
              </code>
              <CopyButton value={passportUrl} />
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <a
                href={passportUrl}
                target="_blank"
                className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white"
              >
                {t.openPassport}
              </a>
              <form action={setPassportEnabled.bind(null, !profile.passport_enabled)}>
                <button className="rounded-lg border border-slate-300 px-3 py-2">
                  {profile.passport_enabled ? t.turnOff : t.turnOn}
                </button>
              </form>
              <form action={regeneratePassportLink}>
                <button className="rounded-lg border border-slate-300 px-3 py-2">{t.newLink}</button>
              </form>
            </div>
            <p className="text-sm text-slate-600">
              {profile.passport_enabled ? t.passportOn : t.passportOff} · {t.views}: {views ?? 0}
            </p>
          </div>
        </div>
      </section>

      <section className={card}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">{t.readinessTitle}</h2>
          <span className="text-lg font-bold">
            {doneCount} / {REQUIREMENTS.length}
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-green-600"
            style={{ width: `${(doneCount / REQUIREMENTS.length) * 100}%` }}
          />
        </div>
        <ul className="mt-4 space-y-3">
          {REQUIREMENTS.map((req) => (
            <li key={req} className="flex gap-3">
              <span className={ready[req] ? "text-green-600" : "text-red-600"}>
                {ready[req] ? "✓" : "✗"}
              </span>
              <div>
                <p className="font-medium">{t[`req_${req}`]}</p>
                {!ready[req] && <p className="text-sm text-slate-600">{t[`hint_${req}`]}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="mb-1 text-xl font-semibold">{t.uploadTitle}</h2>
        <p className="mb-4 text-sm text-slate-600">{t.privacyNote}</p>
        <UploadForm t={t} userId={user.id} />
      </section>

      <section className={card}>
        <h2 className="mb-4 text-xl font-semibold">{t.docsTitle}</h2>
        {documents.length === 0 && <p className="text-slate-600">{t.noDocs}</p>}
        <ul className="space-y-4">
          {documents.map((doc) => (
            <DocumentItem key={doc.id} doc={doc} t={t} />
          ))}
        </ul>
      </section>

      <section id="profile" className={card}>
        <h2 className="mb-4 text-xl font-semibold">{t.profileTitle}</h2>
        <form action={saveProfile} className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["full_name", t.fullName],
              ["company_name", t.companyName],
              ["trade", t.trade],
              ["city", t.city],
              ["phone", t.phone],
              ["kvk_number", t.kvkNumber],
              ["btw_number", t.btwNumber],
              ["business_address", t.businessAddress],
              ["business_email", t.businessEmail],
              ["iban", t.iban],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="block text-sm font-medium">
              {label}
              <input name={name} defaultValue={profile[name] ?? ""} className={input} />
            </label>
          ))}
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
              {t.save}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function StatusBadge({ doc, t }: { doc: DocumentRow; t: Dict }) {
  const status = docStatus(doc);
  if (status === "valid") return null;
  const label = { expired: t.expired, expires_soon: t.expiresSoon, kvk_old: t.kvkOld }[status];
  const color = status === "expired" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

function DocumentItem({ doc, t }: { doc: DocumentRow; t: Dict }) {
  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{t[`docType_${doc.doc_type}`]}</span>
        <StatusBadge doc={doc} t={t} />
      </div>
      <p className="truncate text-xs text-slate-500">{doc.file_name}</p>

      {doc.ai_summary && <p className="mt-2 text-sm">{doc.ai_summary}</p>}
      {doc.ai_warnings.map((w) => (
        <p key={w} className="mt-1 text-sm text-amber-800">
          ⚠ {w}
        </p>
      ))}
      {doc.ai_status === "failed" && <p className="mt-2 text-sm text-amber-800">{t.aiFailed}</p>}

      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {doc.insurer && (
          <>
            <dt className="text-slate-500">{t.insurer}</dt>
            <dd>{doc.insurer}</dd>
          </>
        )}
        {doc.coverage_amount && (
          <>
            <dt className="text-slate-500">{t.coverage}</dt>
            <dd>{doc.coverage_amount}</dd>
          </>
        )}
      </dl>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-slate-600">
          {t.number}: {doc.document_number ?? "—"} · {t.issued}: {doc.issued_on ?? "—"} ·{" "}
          {t.expires}: {doc.expires_on ?? "—"} — {t.editDates}
        </summary>
        <form action={updateDocument} className="mt-2 grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="id" value={doc.id} />
          <label className="text-xs">
            {t.number}
            <input name="document_number" defaultValue={doc.document_number ?? ""} className={input} />
          </label>
          <label className="text-xs">
            {t.issued}
            <input type="date" name="issued_on" defaultValue={doc.issued_on ?? ""} className={input} />
          </label>
          <label className="text-xs">
            {t.expires}
            <input type="date" name="expires_on" defaultValue={doc.expires_on ?? ""} className={input} />
          </label>
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-3">
            {t.save}
          </button>
        </form>
      </details>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <form action={toggleDocument.bind(null, doc.id, !doc.show_in_passport)}>
          <button className="rounded-lg border border-slate-300 px-3 py-1">
            {doc.show_in_passport ? "☑" : "☐"} {t.showInPassport}
          </button>
        </form>
        <form action={deleteDocument.bind(null, doc.id)}>
          <button className="rounded-lg border border-red-200 px-3 py-1 text-red-700">{t.delete}</button>
        </form>
      </div>
    </li>
  );
}
