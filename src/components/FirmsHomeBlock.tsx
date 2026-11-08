import Link from "next/link";
import type { Offer } from "@/components/FirmOfferState";
import { waNumber } from "@/lib/firm-offer";
import type { FirmOfferDict } from "@/lib/firm-offer-i18n";
import type { Firm } from "@/lib/firms";

type NearFirm = Firm & { km: number | null };

// Home: three nearest firms the builder can offer themselves to, and how their offers went.
export function FirmsHomeBlock({ firms, offers, o }: { firms: NearFirm[]; offers: Map<string, Offer>; o: FirmOfferDict }) {
  // Firms not written to yet first, then the ones already sent.
  const shown = [...firms.filter((f) => !offers.has(f.id)), ...firms.filter((f) => offers.has(f.id))].slice(0, 3);
  const all = [...offers.values()];
  const answered = all.filter((x) => x.outcome).length;
  const work = all.filter((x) => x.outcome === "work").length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{o.homeTitle}</h2>
      <p className="mt-1 text-sm text-slate-600">{o.homeIntro}</p>
      <ul className="mt-2 divide-y divide-slate-100">
        {shown.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate font-semibold">{f.name}</p>
              <p className="text-sm text-slate-500">
                {[
                  f.km != null ? `${Math.round(f.km)} km` : null,
                  f.rating != null ? `★ ${String(f.rating).replace(".", ",")}` : null,
                  waNumber(f.phone) ? "📱" : null,
                  f.email ? "✉️" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {offers.has(f.id) ? (
              <span className="shrink-0 rounded-lg bg-green-100 px-2.5 py-1.5 text-sm font-semibold text-green-800">{o.sentShort}</span>
            ) : (
              <Link
                href={`/dashboard/leads/firms/${f.id}/offer`}
                className="shrink-0 rounded-lg bg-gradient-to-b from-orange-500 to-orange-600 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_2px_0_#9a3412]"
              >
                {o.offerShort}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {all.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[
            [all.length, o.statSent],
            [answered, o.statAnswered],
            [work, o.statWork],
          ].map(([n, label]) => (
            <div key={String(label)} className="rounded-xl bg-slate-50 p-2">
              <p className="text-lg font-bold">{n}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}
      <Link href="/dashboard/leads/firms" className="mt-3 block text-right text-sm font-semibold text-orange-700 hover:underline">
        {o.allFirms.replace("{n}", String(firms.length))} →
      </Link>
    </section>
  );
}
