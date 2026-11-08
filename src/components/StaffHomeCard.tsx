/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { startUltraTrial } from "@/app/plan-actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { StaffFeedDict } from "@/lib/staff-i18n";
import type { StaffLandingDict } from "@/lib/staff-landing-i18n";

// «Цифровой сотрудник» on the cabinet home (Nasim, 2026-11-08): who it is and how it works.
// Ultra workers get the chat button and the steps folded; others see the steps and the trial.
export function StaffHomeCard({
  s,
  f,
  face,
  name,
  ultra,
  canTrial,
  plansLabel,
}: {
  s: StaffLandingDict;
  f: StaffFeedDict;
  face: string;
  name: string;
  ultra: boolean;
  canTrial: boolean;
  plansLabel: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 to-violet-950 p-4 text-white shadow-sm">
      <div className="flex items-center gap-3">
        <img src={face} alt="" className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-violet-200">{ultra ? `🟢 ${s.chat.role}` : `✨ ${s.badge}`}</p>
          <h2 className="text-lg font-bold leading-snug">{ultra ? name : s.title}</h2>
        </div>
      </div>
      <p className="mt-2 text-sm text-violet-100">{s.lead}</p>
      <details open={!ultra} className="group mt-3 rounded-xl bg-white/10 px-3 py-2">
        <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span className="mr-1 inline-block transition group-open:rotate-90">›</span> {s.howTitle}
        </summary>
        <ol className="mt-2 space-y-2 pb-1">
          {s.steps.map((st) => (
            <li key={st.title} className="flex gap-2 text-sm">
              <span className="shrink-0">{st.icon}</span>
              <span>
                <span className="font-semibold">{st.title}.</span> <span className="text-violet-100">{st.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </details>
      <div className="mt-3">
        {ultra ? (
          <Link href="/dashboard/staff" className="block rounded-xl bg-white px-4 py-2.5 text-center font-semibold text-violet-800">
            💬 {f.openChat}
          </Link>
        ) : canTrial ? (
          <form action={startUltraTrial}>
            <SubmitButton className="w-full rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white">{s.cta}</SubmitButton>
          </form>
        ) : (
          <Link href="/dashboard/plan#plans" className="block rounded-xl bg-white px-4 py-2.5 text-center font-semibold text-violet-800">
            {plansLabel}
          </Link>
        )}
        {!ultra && <p className="mt-1.5 text-center text-xs text-violet-200">{s.note}</p>}
      </div>
    </section>
  );
}
