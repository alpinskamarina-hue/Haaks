import Link from "next/link";
import { COMPANY } from "@/lib/company";
import type { Lang } from "@/lib/i18n";
import { legalSummary, type LegalKind } from "@/lib/legal";

const KINDS: LegalKind[] = ["privacy", "terms", "cookies"];

// Legal links and the business details Dutch law requires on the site.
export function SiteFooter({ lang, note }: { lang: Lang; note?: string }) {
  const s = legalSummary(lang);
  return (
    <footer className="border-t border-slate-200 bg-white print:hidden">
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-6 text-sm text-slate-500">
        {note && <p>{note}</p>}
        <nav className="flex flex-wrap gap-x-5 gap-y-1">
          {KINDS.map((k) => (
            <Link key={k} href={`/${k}`} className="font-medium text-slate-700 hover:text-orange-700">
              {s.links[k]}
            </Link>
          ))}
        </nav>
        <p className="text-xs">
          Haaks · {COMPANY.name} · KvK {COMPANY.kvk}
          {COMPANY.btw && ` · btw-id ${COMPANY.btw}`} · {COMPANY.address} ·{" "}
          <a href={`mailto:${COMPANY.email}`} className="underline">
            {COMPANY.email}
          </a>
        </p>
      </div>
    </footer>
  );
}
