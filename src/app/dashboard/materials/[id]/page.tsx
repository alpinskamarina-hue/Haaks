import Link from "next/link";
import { notFound } from "next/navigation";
import { addMaterialsToInvoice, deleteMaterialList } from "@/app/materials-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { MaterialsEditor } from "@/components/MaterialsEditor";
import { SendMaterials } from "@/components/SendMaterials";
import { SubmitButton } from "@/components/SubmitButton";
import { getCardsDict } from "@/lib/cards-i18n";
import { siteUrl } from "@/lib/lang";
import { STATUS_COLOR, type MaterialList } from "@/lib/materials";
import { getMaterialsDict, materialsMessage } from "@/lib/materials-i18n";
import { storeForUrl, storeOf, type StoreCard } from "@/lib/store-cards";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function MaterialListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile, lang, t } = await loadWorkspace();
  const m = getMaterialsDict(lang);
  const { data: list } = await supabase.from("material_lists").select("*").eq("id", id).maybeSingle<MaterialList>();
  if (!list) notFound();
  const { data: order } = list.order_id
    ? await supabase.from("orders").select("id, title").eq("id", list.order_id).maybeSingle()
    : { data: null };

  // Store cards for the shops in this list: one tap shows the card at the till.
  const shops = new Set(list.items.flatMap((x) => (x.url ? [storeForUrl(x.url)?.key ?? ""] : [])).filter(Boolean));
  const { data: myCards } = shops.size
    ? await supabase.from("store_cards").select("id, store").eq("user_id", user.id).in("store", [...shops]).returns<Pick<StoreCard, "id" | "store">[]>()
    : { data: [] };
  const cardButtons = [...new Map((myCards ?? []).map((c) => [c.store, c])).values()];
  const cd = getCardsDict(lang);

  const url = `${await siteUrl()}/m/${list.public_token}`;
  const worker = profile.company_name || profile.full_name || "";
  const message = materialsMessage({ clientName: list.client_name, title: list.title, url, worker });

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <Link href={order ? `/dashboard/orders/${order.id}` : "/dashboard/materials"} className="text-sm text-slate-600 underline">
        ← {order ? `${m.order}: ${order.title}` : t.back}
      </Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{list.title}</h1>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[list.status]}`}>
          {m.status[list.status]}
        </span>
      </div>

      {list.status === "accepted" && (
        <section className={`${card} space-y-3 border-green-200 bg-green-50`}>
          <p className="font-semibold text-green-900">✓ {m.acceptedBy.replace("{name}", list.accepted_name ?? "")}</p>
          <p className="text-sm">{list.buyer === "client" ? m.buyerClient : m.buyerWorker}</p>
          {list.buyer !== "client" && (
            <form action={addMaterialsToInvoice.bind(null, list.id)} className="space-y-1">
              <SubmitButton className="rounded-lg bg-orange-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
                {list.invoice_id ? m.openInvoice : m.addToInvoice}
              </SubmitButton>
              {!list.invoice_id && <p className="text-xs text-slate-600">{m.addToInvoiceHint}</p>}
            </form>
          )}
        </section>
      )}
      {list.status === "sent" && list.viewed_at && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">👁 {m.viewed}</p>
      )}

      {cardButtons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cardButtons.map((c) => (
            <Link key={c.id} href={`/dashboard/cards?show=${c.id}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-orange-300">
              {cd.showCard.replace("{store}", storeOf({ store: c.store, custom_name: null }).name)}
            </Link>
          ))}
        </div>
      )}

      <section className={card}>
        <MaterialsEditor m={m} listId={list.id} initial={{ title: list.title, client_name: list.client_name, items: list.items }} />
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className="text-lg font-semibold">{m.sendTitle}</h2>
        <p className="text-sm text-slate-600">{m.sendHint}</p>
        <SendMaterials lang={lang} listId={list.id} message={message} subject={`Materiaallijst: ${list.title}`} labels={{ copy: m.copy, copied: m.copied }} />
        <a href={url} target="_blank" rel="noopener" className="inline-block text-sm text-blue-700 underline">
          {m.preview} ↗
        </a>
        {list.status !== "accepted" && (
          <form action={addMaterialsToInvoice.bind(null, list.id)} className="border-t border-slate-100 pt-3">
            <SubmitButton className="text-sm font-medium text-orange-700 underline disabled:opacity-60">
              {list.invoice_id ? m.openInvoice : m.addToInvoice}
            </SubmitButton>
          </form>
        )}
      </section>

      <form action={deleteMaterialList.bind(null, list.id)}>
        <ConfirmButton message={m.deleteConfirm} className="text-sm text-red-700 underline">
          {m.deleteList}
        </ConfirmButton>
      </form>
    </main>
  );
}
