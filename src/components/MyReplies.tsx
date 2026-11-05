import Link from "next/link";
import { decideInvite, setInCatalog } from "@/app/feed-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { dayMonthYear } from "@/lib/company-jobs";
import type { MyInvite, MyReply, ReplyDict } from "@/lib/job-replies";

const badge = { sent: "bg-purple-50 text-purple-800", accepted: "bg-green-100 text-green-800", declined: "bg-slate-100 text-slate-500" };

// The builder's replies to company jobs; the company's contacts show once it accepts.
export function MyReplies({
  replies,
  invites,
  inCatalog,
  catalogUntil,
  rt,
  helper,
}: {
  replies: MyReply[];
  invites: MyInvite[];
  inCatalog: boolean;
  catalogUntil: string | null;
  rt: ReplyDict;
  helper: { nav: string; cardText: string };
}) {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <h1 className="text-2xl font-bold">🙋 {rt.pageTitle}</h1>

      <section id="catalog" className={`rounded-xl border p-4 ${inCatalog ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
        <h2 className="font-semibold">🔎 {rt.catalogTitle}</h2>
        <p className="mt-1 text-sm text-slate-700">{rt.catalogText}</p>
        {inCatalog && <p className="mt-2 text-sm font-semibold text-green-800">{rt.catalogIsOn}</p>}
        {inCatalog && catalogUntil && (
          <p className="mt-1 text-sm text-slate-700">{rt.catalogUntil.replace("{d}", dayMonthYear(catalogUntil.slice(0, 10)))}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {inCatalog && (
            <form action={setInCatalog.bind(null, true)}>
              <SubmitButton className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                ↻ {rt.catalogExtend}
              </SubmitButton>
            </form>
          )}
          <form action={setInCatalog.bind(null, !inCatalog)}>
            <SubmitButton
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${
                inCatalog ? "border border-slate-300 bg-white text-slate-600" : "bg-orange-600 text-white"
              }`}
            >
              {inCatalog ? rt.catalogOff : rt.catalogOn}
            </SubmitButton>
          </form>
        </div>
      </section>

      <Link href="/dashboard/helpers" className="block rounded-xl border border-sky-200 bg-sky-50 p-4">
        <h2 className="font-semibold">👷 {helper.nav} →</h2>
        <p className="mt-1 text-sm text-slate-700">{helper.cardText}</p>
      </Link>

      {invites.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">✉️ {rt.invitesTitle}</h2>
          <ul className="space-y-3">
            {invites.map((i) => (
              <li key={i.id} className="rounded-xl border border-purple-200 bg-white p-4">
                <p className="font-semibold">{rt.invite.replace("{company}", i.company_name ?? "—")}</p>
                {i.kvk_number && <p className="text-xs text-slate-500">KvK {i.kvk_number}</p>}
                {i.job_title && (
                  <p className="mt-1 text-sm text-slate-600">
                    {rt.inviteJob.replace("{job}", `${i.job_title}${i.job_city ? `, ${i.job_city}` : ""}`)}
                  </p>
                )}
                {i.status === "sent" ? (
                  <div className="mt-3 flex gap-2">
                    <form action={decideInvite.bind(null, i.id, true)} className="flex-1">
                      <SubmitButton className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
                        {rt.acceptInvite}
                      </SubmitButton>
                    </form>
                    <form action={decideInvite.bind(null, i.id, false)}>
                      <SubmitButton className="rounded-lg border border-slate-300 px-4 py-2.5 text-slate-600 disabled:opacity-60">{rt.declineInvite}</SubmitButton>
                    </form>
                  </div>
                ) : (
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${i.status === "accepted" ? badge.accepted : badge.declined}`}
                  >
                    {i.status === "accepted" ? `✓ ${rt.inviteAccepted}` : rt.inviteDeclined}
                  </span>
                )}
                {i.status === "accepted" && <Contacts rt={rt} name={i.contact_name} phone={i.phone} email={i.email} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="text-lg font-semibold">🙋 {rt.myTitle}</h2>
      {replies.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-500">
          {rt.myEmpty}{" "}
          <Link href="/dashboard/leads/feed?section=business" className="text-orange-700 underline">
            →
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {replies.map((r) => {
            const status = r.status === "sent" && !r.job_open ? "closed" : r.status;
            return (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">{r.company_name?.startsWith("ZZP") ? "👷" : "🏢"} {r.company_name ?? "—"}</p>
                <p className="mt-1 font-semibold">
                  {r.job_title}, {r.job_city}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === "closed" ? badge.declined : badge[r.status]}`}
                >
                  {status === "accepted" ? `✓ ${rt.accepted}` : status === "declined" ? rt.declined : status === "closed" ? rt.closed : `⏳ ${rt.sent}`}
                </span>
                {r.status === "accepted" && <Contacts rt={rt} name={r.contact_name} phone={r.phone} email={r.email} />}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function Contacts({ rt, name, phone, email }: { rt: ReplyDict; name: string | null; phone: string | null; email: string | null }) {
  return (
    <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm">
      <p className="font-semibold text-green-900">{rt.contacts}</p>
      {name && <p className="text-green-900">{name}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="rounded-lg bg-green-600 px-3 py-2 font-semibold text-white">
            📞 {rt.call} · {phone}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="break-all rounded-lg border border-green-600 px-3 py-2 font-semibold text-green-800">
            ✉️ {rt.write} · {email}
          </a>
        )}
      </div>
    </div>
  );
}
