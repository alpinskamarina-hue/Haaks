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
import { ConfirmButton } from "@/components/ConfirmButton";
import { CopyButton } from "@/components/CopyButton";
import { PassportPack } from "@/components/PassportPack";
import { PassportTabs } from "@/components/PassportTabs";
import { UploadForm } from "@/components/UploadForm";
import {
  docStatus,
  readiness,
  REQUIREMENTS,
  type DocumentRow,
} from "@/lib/documents";
import { getWorkerDict } from "@/lib/worker-profile-text";
import { getDict, isLang, type Dict } from "@/lib/i18n";
import { getPassportPlusDict, passportMessage, type PassportPlusDict } from "@/lib/passport-plus-i18n";
import { siteUrl } from "@/lib/lang";
import { packProps } from "@/lib/passport-pack";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile, signedUrls } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ upload?: string }>;
}) {
  const { upload } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: docs }, { count: views }, { data: lastView }] = await Promise.all([
    ensureProfile(supabase, user.id).then((data) => ({ data })),
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
    supabase
      .from("passport_views")
      .select("viewed_at")
      .eq("profile_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ viewed_at: string }>(),
  ]);
  if (!profile) throw new Error("Profile not found");

  const lang = isLang(profile.language) ? profile.language : "en";
  const t = getDict(lang);
  const documents = docs ?? [];
  const ready = readiness(profile, documents);
  const doneCount = REQUIREMENTS.filter((r) => ready[r]).length;
  const passportUrl = `${await siteUrl()}/p/${profile.passport_token}`;
  const qr = await QRCode.toDataURL(passportUrl, { margin: 1, width: 240 });
  const tp = getPassportPlusDict(lang);
  const trades = (profile as { trades?: string[] | null }).trades ?? [];
  const message = passportMessage({
    url: passportUrl,
    name: profile.full_name ?? "",
    trade: trades[0] ? (getWorkerDict("nl").trades as Record<string, string>)[trades[0]] ?? "" : (profile.trade ?? ""),
    ready,
  });
  const fileUrls = await signedUrls(supabase, documents.map((d) => d.file_path));
  const pack = await packProps({ profile, documents, urlOf: (p) => fileUrls.get(p), passportUrl, lang: "nl" });

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <PassportTabs active="docs" lang={lang} userId={user.id} token={profile.passport_token} username={(profile as { username?: string | null }).username} />

      {doneCount < REQUIREMENTS.length && (
        <section className={card}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">{t.readinessTitle}</h2>
            <span className="whitespace-nowrap text-lg font-bold">
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
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t[`req_${req}`]}</p>
                  {!ready[req] && <p className="text-sm text-slate-600">{t[`hint_${req}`]}</p>}
                </div>
                {!ready[req] && (
                  <a
                    href={req === "kvk_number" || req === "btw_number" ? "#profile" : `?upload=${req}#upload`}
                    className="h-fit shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    {req === "kvk_number" || req === "btw_number" ? tp.fill : tp.upload}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h2 className="text-xl font-semibold">{t.passportTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.passportHint}</p>
        <div className="mt-4 flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="QR"
            width={104}
            height={104}
            className={`h-[104px] w-[104px] shrink-0 rounded-lg border border-slate-200 ${profile.passport_enabled ? "" : "opacity-30"}`}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-slate-100 px-2 py-2 text-xs">
                {passportUrl}
              </code>
              <CopyButton value={passportUrl} />
            </div>
            <p className="text-xs text-slate-500">{tp.qrHint}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-orange-50 p-4">
          <p className="font-semibold">📤 {tp.sendTitle}</p>
          <p className="mt-0.5 text-sm text-slate-600">{tp.sendHint}</p>
          {profile.passport_enabled ? (
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message.body)}`}
                target="_blank"
                rel="noopener"
                className="rounded-lg bg-green-600 px-3 py-2 font-semibold text-white"
              >
                {tp.whatsapp}
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`}
                className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white"
              >
                ✉ {tp.email}
              </a>
              <CopyButton value={message.body} label={tp.copyText} />
              {documents.some((d) => d.show_in_passport) && (
                <PassportPack
                  {...pack}
                  label={tp.pdfPack}
                  busyLabel={tp.pdfBusy}
                  errorLabel={tp.pdfError}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium disabled:opacity-60"
                />
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-800">{tp.offNote}</p>
          )}
        </div>

        <p className="mt-4 text-sm text-slate-700">
          👁{" "}
          {views
            ? `${tp.opened.replace("{n}", String(views))} · ${tp.lastOpened.replace("{when}", openedWhen(lastView?.viewed_at, tp, lang))}`
            : tp.never}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm">
          <a href={passportUrl} target="_blank" className="rounded-lg border border-slate-300 px-3 py-2 font-medium">
            {t.openPassport}
          </a>
          <form action={setPassportEnabled.bind(null, !profile.passport_enabled)}>
            <button className="rounded-lg border border-slate-300 px-3 py-2">
              {profile.passport_enabled ? t.turnOff : t.turnOn}
            </button>
          </form>
          <form action={regeneratePassportLink}>
            <ConfirmButton message={t.confirmNewLink} className="rounded-lg border border-slate-300 px-3 py-2">
              {t.newLink}
            </ConfirmButton>
          </form>
          <span className="text-slate-500">{profile.passport_enabled ? t.passportOn : t.passportOff}</span>
        </div>
      </section>

      <section id="upload" className={`${card} scroll-mt-4`}>
        <h2 className="mb-1 text-xl font-semibold">{t.uploadTitle}</h2>
        <p className="mb-4 text-sm text-slate-600">{t.privacyNote}</p>
        <UploadForm key={upload ?? ""} t={t} userId={user.id} initialType={upload} />
      </section>

      <section className={card}>
        <h2 className="mb-4 text-xl font-semibold">{t.docsTitle}</h2>
        {documents.length === 0 && <p className="text-slate-600">{t.noDocs}</p>}
        <ul className="space-y-4">
          {documents.map((doc) => (
            <DocumentItem key={doc.id} doc={doc} t={t} fileUrl={fileUrls.get(doc.file_path)} />
          ))}
        </ul>
      </section>

      <section id="profile" className={`${card} scroll-mt-4`}>
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
              ["pay_link", t.payLink],
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

const LOCALES: Record<string, string> = { pl: "pl-PL", ro: "ro-RO", uk: "uk-UA", ru: "ru-RU", tr: "tr-TR", en: "en-GB", nl: "nl-NL" };

// "today at 14:05", "yesterday at 09:10" or "3 nov." in the worker's language, Dutch time.
function openedWhen(at: string | undefined, tp: PassportPlusDict, lang: string) {
  if (!at) return "—";
  const tz = "Europe/Amsterdam";
  const locale = LOCALES[lang] ?? "en-GB";
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: tz });
  const when = new Date(at);
  const now = new Date();
  const time = when.toLocaleTimeString(locale, { timeZone: tz, hour: "2-digit", minute: "2-digit" });
  if (day(when) === day(now)) return tp.today.replace("{time}", time);
  if (day(when) === day(new Date(now.getTime() - 86_400_000))) return tp.yesterday.replace("{time}", time);
  return when.toLocaleDateString(locale, { timeZone: tz, day: "numeric", month: "short" });
}

function StatusBadge({ doc, t }: { doc: DocumentRow; t: Dict }) {
  const status = docStatus(doc);
  if (status === "valid") return null;
  const label = { expired: t.expired, expires_soon: t.expiresSoon, kvk_old: t.kvkOld }[status];
  const color = status === "expired" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

function DocumentItem({ doc, t, fileUrl }: { doc: DocumentRow; t: Dict; fileUrl?: string }) {
  // Without AI reading the file, the number and expiry date are only known
  // once the worker types them, so the editor starts open with a hint.
  const needsDates = (doc.ai_status === "skipped" || doc.ai_status === "failed") && !doc.expires_on;
  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{t[`docType_${doc.doc_type}`]}</span>
        <StatusBadge doc={doc} t={t} />
      </div>
      <p className="truncate text-xs text-slate-500">
        {fileUrl ? (
          <a href={fileUrl} target="_blank" rel="noopener" className="font-medium text-orange-700 underline">
            {t.openFile}
          </a>
        ) : null}{" "}
        {doc.file_name}
      </p>

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

      {needsDates && <p className="mt-2 text-sm text-amber-800">{t.fillDatesHint}</p>}
      <details className="mt-3" open={needsDates}>
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
          <ConfirmButton message={t.confirmDelete} className="rounded-lg border border-red-200 px-3 py-1 text-red-700">
            {t.delete}
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
