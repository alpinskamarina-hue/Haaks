import type { Metadata } from "next";
import { acceptMaterialList } from "@/app/materials-actions";
import { HtmlLang } from "@/components/HtmlLang";
import { PublicFooter } from "@/components/PublicFooter";
import type { Profile } from "@/lib/documents";
import { itemTotal, listTotal, type MaterialList } from "@/lib/materials";
import { euro } from "@/lib/orders";
import { createServerAccountClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Materiaallijst",
  robots: { index: false, follow: false },
};

const date = (value: string) =>
  new Date(value).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

// What the client sees: products with prices and shop links, who buys, and "Akkoord".
export default async function PublicMaterialsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = await createServerAccountClient();
  const { data: list } = await admin.from("material_lists").select("*").eq("public_token", token).maybeSingle<MaterialList>();

  if (!list) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">
        Deze materiaallijst bestaat niet of is verwijderd.
      </main>
    );
  }
  if (list.status === "sent" && !list.viewed_at) {
    await admin.from("material_lists").update({ viewed_at: new Date().toISOString() }).eq("id", list.id).eq("status", "sent");
  }

  const { data: worker } = await admin.from("profiles").select("*").eq("id", list.user_id).single<Profile>();
  const name = worker?.full_name || worker?.company_name || "de vakman";
  const firstName = worker?.full_name?.split(" ")[0] || name;
  const stores = [...new Set(list.items.map((i) => i.store).filter(Boolean))];

  return (
    <main lang="nl" className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <HtmlLang lang="nl" />
      {list.status === "draft" && (
        <p className="rounded-lg bg-slate-100 p-3 text-center text-sm text-slate-700">
          Concept: deze lijst is nog niet verstuurd.
        </p>
      )}
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Materiaallijst</p>
        <h1 className="text-2xl font-bold">{list.title}</h1>
        <p className="text-sm text-slate-600">
          Van {name}
          {worker?.trade ? ` · ${worker.trade}` : ""}
          {list.client_name ? ` · voor ${list.client_name}` : ""}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <ul className="divide-y divide-slate-100">
          {list.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-2xl">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  "📦"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {Number(item.quantity).toLocaleString("nl-NL")} {item.unit} × {euro(item.unit_price)}
                  {item.store ? ` · ${item.store}` : ""}
                </p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-0.5 inline-block text-xs font-medium text-blue-700 underline"
                  >
                    Bekijk {item.store ? `bij ${item.store}` : "product"} ↗
                  </a>
                )}
              </div>
              <p className="shrink-0 text-sm font-semibold">{euro(itemTotal(item))}</p>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex justify-between border-t border-slate-200 px-1 pt-3 text-lg font-bold">
          <span>Totaal incl. btw</span>
          <span>{euro(listTotal(list.items))}</span>
        </div>
        <p className="px-1 text-xs text-slate-500">
          Prijzen volgens {stores.length ? stores.join(", ") : "de winkels"} op {date(list.updated_at)}. Winkels kunnen
          prijzen wijzigen.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        {list.status === "accepted" ? (
          <div className="space-y-1 text-green-800">
            <p>
              ✓ Akkoord gegeven{list.accepted_name ? ` door ${list.accepted_name}` : ""}
              {list.accepted_at ? ` op ${date(list.accepted_at)}` : ""}.
            </p>
            <p className="text-slate-700">
              {list.buyer === "client"
                ? "U koopt de materialen zelf via de links hierboven."
                : `${firstName} regelt de materialen en zet ze op de factuur.`}
            </p>
          </div>
        ) : list.status === "draft" ? (
          <p className="text-slate-600">Akkoord geven kan zodra de lijst is verstuurd.</p>
        ) : (
          <form action={acceptMaterialList.bind(null, token)} className="space-y-3">
            <h2 className="font-semibold">Wie koopt de materialen?</h2>
            <label className="block cursor-pointer">
              <input type="radio" name="buyer" value="worker" defaultChecked className="peer sr-only" />
              <span className="block rounded-xl border border-slate-300 p-3 peer-checked:border-2 peer-checked:border-orange-600 peer-checked:bg-orange-50">
                <span className="block font-semibold">{firstName} regelt het</span>
                <span className="block text-sm text-slate-600">Hij of zij koopt alles en zet het op de factuur.</span>
              </span>
            </label>
            <label className="block cursor-pointer">
              <input type="radio" name="buyer" value="client" className="peer sr-only" />
              <span className="block rounded-xl border border-slate-300 p-3 peer-checked:border-2 peer-checked:border-orange-600 peer-checked:bg-orange-50">
                <span className="block font-semibold">Ik koop zelf</span>
                <span className="block text-sm text-slate-600">U bestelt via de links hierboven.</span>
              </span>
            </label>
            <label className="block text-sm font-medium">
              Uw naam
              <input name="name" required className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-3" />
            </label>
            <button className="w-full rounded-xl bg-orange-600 px-4 py-3 text-lg font-semibold text-white">Akkoord</button>
          </form>
        )}
        {worker?.phone && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Vraag of wijziging? Bel {firstName}: <a href={`tel:${worker.phone.replace(/[^\d+]/g, "")}`} className="underline">{worker.phone}</a>
          </p>
        )}
      </section>
      <PublicFooter />
    </main>
  );
}
