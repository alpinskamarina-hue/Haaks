import QRCode from "qrcode";
import { StoreCards, type ShownCard } from "@/components/StoreCards";
import { getCardsDict } from "@/lib/cards-i18n";
import { STORES, barcodeSvg, storeOf, type StoreCard } from "@/lib/store-cards";
import { loadWorkspace } from "@/lib/workspace";

// «Мои карты»: store discount cards; a card opens full screen as a clean barcode for the till.
// ?show=<id> opens that card at once (from a material link or the app icon shortcut).
export default async function CardsPage({ searchParams }: { searchParams: Promise<{ show?: string; add?: string }> }) {
  const { show, add } = await searchParams;
  const { supabase, user, lang } = await loadWorkspace();
  const d = getCardsDict(lang);
  const { data } = await supabase.from("store_cards").select("*").eq("user_id", user.id).order("created_at").returns<StoreCard[]>();
  const rows = data ?? [];

  // Photos get a week-long link so the card photo still opens when the page was kept for offline use.
  const paths = rows.flatMap((c) => (c.photo_path ? [c.photo_path] : []));
  const { data: signed } = paths.length ? await supabase.storage.from("documents").createSignedUrls(paths, 60 * 60 * 24 * 7) : { data: [] };
  const urls = new Map((signed ?? []).flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl] as const] : [])));

  const cards: ShownCard[] = await Promise.all(
    rows.map(async (c) => {
      const { name, color } = storeOf(c);
      const svg =
        c.format === "qr"
          ? await QRCode.toString(c.number, { type: "svg", margin: 2, errorCorrectionLevel: "M" })
          : barcodeSvg(c.format, c.number);
      return {
        id: c.id,
        name,
        color,
        number: c.number,
        format: c.format,
        svg,
        photoUrl: c.photo_path ? (urls.get(c.photo_path) ?? null) : null,
      };
    }),
  );

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <StoreCards
        cards={cards}
        stores={STORES.map(({ key, name, color }) => ({ key, name, color }))}
        d={d}
        userId={user.id}
        openId={show && cards.some((c) => c.id === show) ? show : null}
        startAdding={add === "1"}
      />
    </main>
  );
}
