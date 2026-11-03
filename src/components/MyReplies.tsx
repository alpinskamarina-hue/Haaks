import Link from "next/link";
import type { MyReply, ReplyDict } from "@/lib/job-replies";

const badge = { sent: "bg-purple-50 text-purple-800", accepted: "bg-green-100 text-green-800", declined: "bg-slate-100 text-slate-500" };

// The builder's replies to company jobs; the company's contacts show once it accepts.
export function MyReplies({ replies, rt }: { replies: MyReply[]; rt: ReplyDict }) {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
      <h1 className="text-2xl font-bold">🙋 {rt.myTitle}</h1>
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
                <p className="text-xs font-semibold text-slate-500">🏢 {r.company_name ?? "—"}</p>
                <p className="mt-1 font-semibold">
                  {r.job_title}, {r.job_city}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === "closed" ? badge.declined : badge[r.status]}`}
                >
                  {status === "accepted" ? `✓ ${rt.accepted}` : status === "declined" ? rt.declined : status === "closed" ? rt.closed : `⏳ ${rt.sent}`}
                </span>
                {r.status === "accepted" && (
                  <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm">
                    <p className="font-semibold text-green-900">{rt.contacts}</p>
                    {r.contact_name && <p className="text-green-900">{r.contact_name}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.phone && (
                        <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="rounded-lg bg-green-600 px-3 py-2 font-semibold text-white">
                          📞 {rt.call} · {r.phone}
                        </a>
                      )}
                      {r.email && (
                        <a href={`mailto:${r.email}`} className="break-all rounded-lg border border-green-600 px-3 py-2 font-semibold text-green-800">
                          ✉️ {rt.write} · {r.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
