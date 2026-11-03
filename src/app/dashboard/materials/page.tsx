import Link from "next/link";
import { createMaterialList } from "@/app/materials-actions";
import { SubmitButton } from "@/components/SubmitButton";
import { listTotal, STATUS_COLOR, type MaterialList } from "@/lib/materials";
import { getMaterialsDict } from "@/lib/materials-i18n";
import { euro } from "@/lib/orders";
import { loadWorkspace } from "@/lib/workspace";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export default async function MaterialsPage() {
  const { supabase, user, lang } = await loadWorkspace();
  const m = getMaterialsDict(lang);
  const { data: rows } = await supabase
    .from("material_lists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<MaterialList[]>();
  const lists = rows ?? [];

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{m.listsTitle}</h1>
        <p className="text-slate-600">{m.listsHint}</p>
      </div>
      <form action={createMaterialList} className={`${card} flex gap-2`}>
        <input
          name="title"
          placeholder={m.titleDefault}
          aria-label={m.titleLabel}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base"
        />
        <SubmitButton className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
          + {m.newList}
        </SubmitButton>
      </form>
      {lists.length === 0 ? (
        <p className="text-slate-600">{m.noLists}</p>
      ) : (
        <ul className="space-y-3">
          {lists.map((l) => (
            <li key={l.id}>
              <Link href={`/dashboard/materials/${l.id}`} className={`${card} block hover:border-orange-300`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.title}</p>
                    <p className="text-sm text-slate-600">
                      {[l.client_name, m.items.replace("{n}", String(l.items.length))].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">{euro(listTotal(l.items))}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[l.status]}`}>
                      {m.status[l.status]}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
