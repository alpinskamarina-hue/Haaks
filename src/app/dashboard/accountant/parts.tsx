import { answerAccountantQuestion, createAccountantShare, revokeAccountantShare } from "@/app/accountant-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CopyButton } from "@/components/CopyButton";
import { SubmitButton } from "@/components/SubmitButton";
import type { AccountantDict } from "@/lib/accountant-i18n";
import { ANSWERS_FOR, questionTexts, type AnswerKind, type QuestionKind } from "@/lib/accountant-questions";
import type { Lang } from "@/lib/i18n";
import { euro } from "@/lib/orders";
import { fill } from "@/lib/quotes-i18n";

const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

export type ShareRow = {
  id: string;
  token: string;
  quarter: string;
  expires_at: string;
  revoked_at: string | null;
  opened_at: string | null;
  open_count: number;
};

export type QuestionRow = {
  id: string;
  kind: QuestionKind;
  body: string | null;
  answer_kind: AnswerKind | null;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  receipts: { store_name: string | null; purchased_on: string | null; total_incl_vat: number | null } | null;
  invoices: { number: string } | null;
};

// «Ссылка для бухгалтера»: make it, send it by e-mail or WhatsApp, see if it was opened, switch it off.
export function ShareCard({
  a,
  share,
  quarterKey,
  quarterLabel,
  url,
  name,
  fmt,
}: {
  a: AccountantDict;
  share: ShareRow | null;
  quarterKey: string;
  quarterLabel: string;
  url: string | null;
  name: string;
  fmt: (iso: string) => string;
}) {
  const live = share && !share.revoked_at && new Date(share.expires_at) > new Date() && url;
  const subject = fill(a.mailSubject, { q: quarterLabel, name });
  const body = url ? fill(a.mailBody, { q: quarterLabel, url, name }) : "";
  return (
    <section className={card}>
      <p className="font-semibold">{a.shareTitle}</p>
      <p className="mb-3 text-sm text-slate-600">{a.shareHint}</p>
      {live ? (
        <>
          <p className="break-all rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{url}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm font-bold">
            <a
              href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
              className="rounded-xl bg-orange-600 py-2.5 text-center text-white"
            >
              {a.byEmail}
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${subject}\n${url}`)}`}
              target="_blank"
              rel="noopener"
              className="rounded-xl border border-green-600 py-2.5 text-center text-green-700"
            >
              {a.byWhatsApp}
            </a>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <CopyButton value={url} label={a.copy} />
            <form action={revokeAccountantShare.bind(null, share.id)}>
              <ConfirmButton message={a.revokeConfirm} className="text-sm font-medium text-slate-500 underline">
                {a.revoke}
              </ConfirmButton>
            </form>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {share.opened_at ? fill(a.openedN, { n: share.open_count, when: fmt(share.opened_at) }) : a.notOpened} ·{" "}
            {fill(a.validTo, { date: fmt(share.expires_at) })}
          </p>
        </>
      ) : (
        <form action={createAccountantShare.bind(null, quarterKey)}>
          <SubmitButton className="w-full rounded-xl bg-slate-900 py-2.5 font-bold text-white disabled:opacity-60">{a.createLink}</SubmitButton>
        </form>
      )}
    </section>
  );
}

// The accountant's questions in the builder's language, with ready answers.
export function QuestionsCard({ a, lang, questions, fmt }: { a: AccountantDict; lang: Lang; questions: QuestionRow[]; fmt: (iso: string) => string }) {
  if (!questions.length) return null;
  const t = questionTexts(lang);
  const sorted = [...questions].sort((x, y) => Number(!!x.answered_at) - Number(!!y.answered_at) || y.created_at.localeCompare(x.created_at));
  return (
    <section id="vragen" className={`${card} scroll-mt-20`}>
      <p className="mb-2 font-semibold">{a.questionsTitle}</p>
      <ul className="space-y-3">
        {sorted.map((x) => {
          const about = x.receipts
            ? fill(a.qOn, { what: [x.receipts.store_name, x.receipts.purchased_on && fmt(x.receipts.purchased_on), x.receipts.total_incl_vat !== null && euro(Number(x.receipts.total_incl_vat))].filter(Boolean).join(" · ") })
            : x.invoices
              ? fill(a.qOnInvoice, { what: x.invoices.number })
              : a.qGeneral;
          return (
            <li key={x.id} className={`rounded-xl border p-3 ${x.answered_at ? "border-slate-100 bg-slate-50" : "border-orange-200 bg-orange-50"}`}>
              <p className="text-xs text-slate-500">
                {fmt(x.created_at.slice(0, 10))} · {about}
              </p>
              {x.kind !== "other" && <p className="mt-1 font-semibold">{t.q[x.kind]}</p>}
              {x.body && (
                <div className="mt-1 text-sm">
                  <span className="text-slate-500">{a.qOriginal} </span>
                  <span lang="nl" className="italic">
                    „{x.body}”
                  </span>{" "}
                  {lang !== "nl" && (
                    <a
                      href={`https://translate.google.com/?sl=nl&tl=${lang}&text=${encodeURIComponent(x.body)}`}
                      target="_blank"
                      rel="noopener"
                      className="whitespace-nowrap font-semibold text-orange-700 underline"
                    >
                      {a.translate}
                    </a>
                  )}
                </div>
              )}
              {x.answered_at ? (
                <p className="mt-2 text-sm text-green-800">
                  ✓ {a.yourAnswer} {x.answer_kind && x.answer_kind !== "other" ? t.a[x.answer_kind] : ""} {x.answer ?? ""}
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {ANSWERS_FOR[x.kind]
                      .filter((k) => k !== "other")
                      .map((k) => (
                        <form key={k} action={answerAccountantQuestion.bind(null, x.id, k)}>
                          <SubmitButton className="rounded-full border border-slate-900 bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-60">
                            {t.a[k]}
                          </SubmitButton>
                        </form>
                      ))}
                  </div>
                  <form action={answerAccountantQuestion.bind(null, x.id, "other")} className="flex gap-2">
                    <input
                      name="answer"
                      maxLength={500}
                      placeholder={a.answerOther}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
                    />
                    <SubmitButton className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{a.send}</SubmitButton>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
