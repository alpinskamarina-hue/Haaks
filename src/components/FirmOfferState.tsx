import Link from "next/link";
import { setFirmOutcome } from "@/app/dashboard/leads/firms/actions";
import type { getFirmOfferDict } from "@/lib/firm-offer-i18n";

export type Offer = { firm_id: string; channel: "whatsapp" | "email" | "copy"; sent_at: string; outcome: "work" | "no" | null };

const DAY = 86_400_000;

// Main action of a firm card: «Предложить себя», or what happened after the offer.
export function FirmOfferState({
  offer,
  firmId,
  o,
  dateFmt,
}: {
  offer: Offer | undefined;
  firmId: string;
  o: ReturnType<typeof getFirmOfferDict>;
  dateFmt: Intl.DateTimeFormat;
}) {
  const offerLink = (
    <Link
      href={`/dashboard/leads/firms/${firmId}/offer`}
      className="mt-3 block rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2.5 text-center font-semibold text-white shadow-[0_3px_0_#9a3412]"
    >
      {o.offer}
    </Link>
  );
  if (!offer) return offerLink;
  const quiet = !offer.outcome && Date.now() - new Date(offer.sent_at).getTime() > 5 * DAY;
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg bg-green-100 px-2 py-1 text-sm font-semibold text-green-800">
          {o.sent.replace("{date}", dateFmt.format(new Date(offer.sent_at)))} · {o.via[offer.channel]}
        </span>
        {offer.outcome && (
          <span className="rounded-lg bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-800">
            {offer.outcome === "work" ? o.work : o.no}
          </span>
        )}
      </div>
      {quiet && <p className="rounded-lg border border-orange-200 bg-orange-50 p-2 text-sm text-orange-900">{o.noAnswer}</p>}
      {!offer.outcome && (
        <form action={setFirmOutcome} className="flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="firm" value={firmId} />
          <span className="text-slate-600">{o.answered}</span>
          <button name="outcome" value="work" className="rounded-lg border border-slate-300 px-2.5 py-1">
            {o.work}
          </button>
          <button name="outcome" value="no" className="rounded-lg border border-slate-300 px-2.5 py-1">
            {o.no}
          </button>
        </form>
      )}
      <Link href={`/dashboard/leads/firms/${firmId}/offer`} className="inline-block text-sm font-medium text-orange-700 underline">
        {o.resend}
      </Link>
    </div>
  );
}
