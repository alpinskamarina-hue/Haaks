import Link from "next/link";
import { STAGES, type NextStep, type Stage } from "@/lib/project";
import { fillP, type ProjectDict } from "@/lib/project-i18n";

const TONE = {
  info: "bg-orange-50 text-orange-900",
  warn: "bg-amber-50 text-amber-900",
  bad: "bg-red-50 text-red-800",
};

// Five short bars: how far the order has come.
export function StageBars({ stage }: { stage: Stage }) {
  const at = STAGES.indexOf(stage);
  return (
    <div className="my-2.5 flex gap-1" aria-hidden>
      {STAGES.map((s, i) => (
        <i key={s} className={`h-1.5 flex-1 rounded-full ${i <= at ? "bg-orange-600" : "bg-slate-200"}`} />
      ))}
    </div>
  );
}

// The stage line with labels, for the order page.
export function StageLine({ stage, p }: { stage: Stage; p: ProjectDict }) {
  const at = STAGES.indexOf(stage);
  return (
    <ol className="mt-4 grid grid-cols-5 text-center text-[11px] leading-tight">
      {STAGES.map((s, i) => (
        <li key={s} className="relative pt-5">
          {i > 0 && <span className={`absolute left-[-50%] top-[7px] h-0.5 w-full ${i <= at ? "bg-orange-500" : "bg-slate-200"}`} />}
          <span
            className={`absolute left-1/2 top-0.5 z-10 -translate-x-1/2 rounded-full ${
              i < at ? "h-3 w-3 bg-orange-600" : i === at ? "h-3.5 w-3.5 border-[3px] border-orange-600 bg-white" : "h-3 w-3 bg-slate-200"
            }`}
          />
          <span className={i === at ? "font-bold text-orange-700" : i < at ? "font-medium text-slate-800" : "text-slate-400"}>{s === "quote" ? p.stageQuoteShort : p.stage[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function nextText(next: NextStep, p: ProjectDict, fmtDate: (d: string) => string) {
  if (next.kind === "awaitPay" && next.date) return fillP(p.next.awaitPayDate, { date: fmtDate(next.date) });
  return fillP(p.next[next.kind], { n: next.n });
}

export function NextStepLink({ next, p, fmtDate, big }: { next: NextStep; p: ProjectDict; fmtDate: (d: string) => string; big?: boolean }) {
  const text = nextText(next, p, fmtDate);
  if (big)
    return (
      <Link href={next.href} className="mt-3 block rounded-xl bg-orange-600 px-4 py-3 text-center font-bold text-white">
        {text}
      </Link>
    );
  return (
    <Link href={next.href} className={`mt-2 block rounded-lg px-2.5 py-1.5 text-sm font-semibold ${TONE[next.tone]}`}>
      {text}
    </Link>
  );
}
