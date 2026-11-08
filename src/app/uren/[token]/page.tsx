import type { Metadata } from "next";
import { decideHours } from "@/app/hours-public-actions";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import { isoWeek } from "@/lib/hours";
import { createClient, createServerAccountClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Urenstaat",
  robots: { index: false, follow: false },
};

type Approval = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  date_from: string;
  date_to: string;
  hours: number;
  lines: { work_date: string; hours: number; note: string | null }[];
  decided_name: string | null;
  decided_at: string | null;
  comment: string | null;
  order_title: string;
  address: string | null;
  client_name: string | null;
  worker_name: string | null;
  company: string | null;
};

const day = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const num = (n: number) => Number(n).toLocaleString("nl-NL");
const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3 text-base";

// The week of hours as the company sees it: Dutch, no account; Akkoord with a name, or not with a comment.
export default async function HoursApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = await createServerAccountClient();
  const { data } = await admin.rpc("hour_approval_get", { p_token: token });
  const a = data as Approval | null;
  if (!a) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">Deze urenstaat bestaat niet of is verwijderd.</main>;
  }
  if (a.status === "pending") {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (user?.id !== a.user_id) await admin.rpc("hour_approval_viewed", { p_token: token });
  }
  const who = [a.worker_name, a.company].filter(Boolean).join(" · ");
  const week = isoWeek(a.date_from).week;

  return (
    <main lang="nl" className="mx-auto max-w-xl space-y-6 bg-white px-4 py-6 text-[15px]">
      <HtmlLang lang="nl" />
      <header>
        <p className="text-sm text-slate-500">Urenstaat{who ? ` · ${who}` : ""}</p>
        <h1 className="mt-1 text-2xl font-bold">
          Week {week} · {day(a.date_from)} – {day(a.date_to)}
        </h1>
        <p className="mt-1 text-slate-600">
          Project: {a.order_title}
          {a.address ? `, ${a.address}` : ""}
        </p>
      </header>

      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-200">
          {a.lines.map((l, i) => (
            <tr key={i}>
              <td className="whitespace-nowrap py-2 pr-3">{day(l.work_date)}</td>
              <td className="py-2 text-slate-700">{l.note ?? ""}</td>
              <td className="whitespace-nowrap py-2 pl-3 text-right font-semibold">{num(l.hours)} u</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-2">Totaal</td>
            <td />
            <td className="py-2 text-right">{num(a.hours)} u</td>
          </tr>
        </tbody>
      </table>

      <section className="rounded-2xl border border-slate-200 p-5">
        {a.status === "approved" ? (
          <p className="text-green-800">
            ✓ Akkoord gegeven door {a.decided_name}
            {a.decided_at ? ` op ${new Date(a.decided_at).toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam" })}` : ""}.
          </p>
        ) : a.status === "rejected" ? (
          <p className="text-slate-700">
            Niet akkoord ({a.decided_name}){a.comment ? `: “${a.comment}”` : "."} {a.worker_name || "De opdrachtnemer"} past de uren aan en stuurt ze opnieuw.
          </p>
        ) : (
          <div className="space-y-5">
            <form action={decideHours.bind(null, token, true)} className="space-y-3">
              <h2 className="font-semibold">Kloppen deze uren?</h2>
              <label className="block text-sm font-medium">
                Uw naam
                <input name="name" required maxLength={200} placeholder="bijv. P. de Vries" className={input} />
              </label>
              <button className="w-full rounded-xl bg-green-700 px-4 py-3 text-lg font-semibold text-white">✓ Akkoord met deze uren</button>
            </form>
            <details className="rounded-xl bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">Niet akkoord? Stuur een opmerking</summary>
              <form action={decideHours.bind(null, token, false)} className="mt-3 space-y-3">
                <label className="block text-sm font-medium">
                  Uw naam
                  <input name="name" required maxLength={200} className={input} />
                </label>
                <label className="block text-sm font-medium">
                  Opmerking
                  <textarea name="comment" required maxLength={1000} rows={3} placeholder="bijv. donderdag was 6 uur" className={input} />
                </label>
                <button className="w-full rounded-xl border border-slate-400 bg-white px-4 py-3 font-semibold text-slate-800">Niet akkoord versturen</button>
              </form>
            </details>
            <p className="text-xs text-slate-500">Met Akkoord bevestigt u dat deze uren zijn gewerkt. Haaks bewaart uw naam en het tijdstip.</p>
          </div>
        )}
      </section>
      <PublicFooter />
    </main>
  );
}
