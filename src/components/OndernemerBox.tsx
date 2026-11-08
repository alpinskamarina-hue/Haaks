import { fillO, SIGNS, type SignResult } from "@/lib/ondernemer";

// «Zelfstandig ondernemer» for companies: a green line with the number of true signs that opens the list.
export function OndernemerBox({ signs, title, lines, href }: { signs: SignResult[]; title: string; lines: Record<string, string>; href?: string }) {
  return (
    <details className="mt-2 rounded-lg border border-green-200 bg-green-50/70 px-3 py-2 text-sm">
      <summary className="cursor-pointer font-semibold text-green-900">
        💼 {title} · {signs.length}/{SIGNS.length} ✓
      </summary>
      <ul className="mt-2 space-y-1 text-slate-700">
        {signs.map((s) => (
          <li key={s.id} className="flex gap-2">
            <span className="font-bold text-green-700" aria-hidden>
              ✓
            </span>
            <span>{fillO(lines[s.id], s.vars)}</span>
          </li>
        ))}
      </ul>
      {href && (
        <a href={href} target="_blank" rel="noopener" className="mt-2 inline-block text-xs text-green-900 underline">
          ZZP-paspoort ↗
        </a>
      )}
    </details>
  );
}
