import Link from "next/link";
import { isPaid } from "@/lib/plans";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { LetterSheet } from "@/components/LetterSheet";
import { PrintButton } from "@/components/PrintButton";
import { loadFeed } from "@/lib/feed-server";
import { siteUrl } from "@/lib/lang";
import { getLetterDict } from "@/lib/letter-i18n";
import { ownerLetter, permitParts } from "@/lib/owner-letter";
import { loadWorkspace } from "@/lib/workspace";

const input = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base";

// "Letter to the owner" for a building permit card: a Dutch letter to print and drop in the mailbox.
export default async function OwnerLetterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ street?: string; nr?: string; pc?: string; place?: string }>;
}) {
  const { supabase, user, profile, lang } = await loadWorkspace();
  const { id } = await params;
  const sp = await searchParams;
  const t = getLetterDict(lang);
  const { items } = await loadFeed(supabase, user.id, profile);
  const item = items.find((i) => i.id === id && i.kind === "permit");
  if (!item) notFound();
  const pro = isPaid(profile as typeof profile & { plan?: string; plan_until?: string | null });
  if (item.locked || !(pro || item.opened)) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <Link href="/dashboard/leads/feed?section=soon" className="text-sm text-slate-500">
          {t.back}
        </Link>
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">{t.locked}</p>
      </main>
    );
  }

  const parts = permitParts(item);
  const p = profile as typeof profile & { trades?: string[]; business_email?: string | null };
  const passportUrl = p.passport_enabled && p.passport_token ? `${await siteUrl()}/p/${p.passport_token}` : null;
  const qr = passportUrl ? await QRCode.toDataURL(passportUrl, { margin: 1, width: 200 }) : null;
  const clean = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);
  const address = {
    street: clean(sp.street, 80) || parts.street,
    number: clean(sp.nr, 10),
    postcode: (clean(sp.pc, 7) || parts.pc4).toUpperCase(),
    place: clean(sp.place, 60) || parts.place,
  };
  const today = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }).format(new Date());
  const letter = ownerLetter(
    item,
    {
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      email: p.business_email || user.email || null,
      city: p.city ?? null,
      kvk_number: p.kvk_number ?? null,
      trades: p.trades ?? [],
      passportUrl,
    },
    today,
  );

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 print:max-w-none print:p-0">
      <div className="space-y-3 print:hidden">
        <Link href="/dashboard/leads/feed?section=soon" className="text-sm text-slate-500">
          {t.back}
        </Link>
        <h1 className="text-2xl font-bold">✉️ {t.title}</h1>
        <p className="text-slate-600">{t.intro}</p>
        {item.source_url && (
          <a href={item.source_url} target="_blank" rel="noreferrer" className="inline-block text-sm font-medium text-orange-700 underline">
            {t.openPublication}
          </a>
        )}
        {(!p.full_name || !p.phone) && (
          <Link href="/dashboard/profile" className="block rounded-lg bg-amber-50 p-3 text-sm text-amber-800 underline">
            {t.missing}
          </Link>
        )}
        <form className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <label className="col-span-2 block text-sm font-medium">
            {t.street}
            <input name="street" defaultValue={address.street} className={input} />
          </label>
          <label className="block text-sm font-medium">
            {t.number}
            <input name="nr" defaultValue={address.number} placeholder="12" className={input} />
          </label>
          <label className="block text-sm font-medium">
            {t.postcode}
            <input name="pc" defaultValue={address.postcode} placeholder="3011 AB" className={input} />
          </label>
          <label className="col-span-2 block text-sm font-medium sm:col-span-2">
            {t.place}
            <input name="place" defaultValue={address.place} className={input} />
          </label>
          <div className="col-span-2 flex items-end gap-2">
            <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">{t.update}</button>
            <PrintButton label={t.print} />
          </div>
        </form>
      </div>

      <LetterSheet letter={letter} address={address} qr={qr} passportUrl={passportUrl} />
    </main>
  );
}
