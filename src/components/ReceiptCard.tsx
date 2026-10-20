import { deleteReceipt, moveReceipt, updateReceipt } from "@/app/orders-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { Dict } from "@/lib/i18n";
import { euro, type Order, type Receipt } from "@/lib/orders";

const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-base";

export function ReceiptCard({
  receipt,
  orders,
  fileUrl,
  t,
}: {
  receipt: Receipt;
  orders: Pick<Order, "id" | "title">[];
  fileUrl?: string;
  t: Dict;
}) {
  // Without AI reading the receipt, the amounts are only known once the
  // worker types them, so the editor starts open with a hint.
  const needsAmounts =
    (receipt.ai_status === "skipped" || receipt.ai_status === "failed") && receipt.total_incl_vat === null;
  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold">{receipt.store_name ?? receipt.file_name}</p>
          <p className="text-sm text-slate-600">
            {receipt.purchased_on ?? "—"}
            {receipt.store_city ? ` · ${receipt.store_city}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{euro(receipt.total_incl_vat)}</p>
          <p className="text-xs text-slate-600">
            {t.vat} {euro(receipt.vat_total)}
          </p>
        </div>
      </div>

      {receipt.addressed_to_company === false && Number(receipt.total_incl_vat) > 100 && (
        <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {t.anonymousReceipt}
        </span>
      )}
      {receipt.ai_summary && <p className="mt-2 text-sm">{receipt.ai_summary}</p>}
      {receipt.ai_warnings.map((w) => (
        <p key={w} className="mt-1 text-sm text-amber-800">
          ⚠ {w}
        </p>
      ))}
      {receipt.ai_status === "failed" && <p className="mt-2 text-sm text-amber-800">{t.receiptFailed}</p>}

      {receipt.items.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-slate-600">
            {t.items}: {receipt.items.length}
          </summary>
          <ul className="mt-1 space-y-0.5 text-sm">
            {receipt.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {item.quantity && item.quantity !== 1 ? `${item.quantity} × ` : ""}
                  {item.description}
                </span>
                <span className="shrink-0">{euro(item.total)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {needsAmounts && <p className="mt-2 text-sm text-amber-800">{t.fillAmountsHint}</p>}
      <details className="mt-2" open={needsAmounts}>
        <summary className="cursor-pointer text-sm text-slate-600">{t.editDates}</summary>
        <form action={updateReceipt} className="mt-2 grid grid-cols-2 gap-2">
          <input type="hidden" name="id" value={receipt.id} />
          <label className="text-xs">
            {t.store}
            <input name="store_name" defaultValue={receipt.store_name ?? ""} className={input} />
          </label>
          <label className="text-xs">
            {t.date}
            <input type="date" name="purchased_on" defaultValue={receipt.purchased_on ?? ""} className={input} />
          </label>
          <label className="text-xs">
            {t.total}
            <input name="total_incl_vat" inputMode="decimal" defaultValue={receipt.total_incl_vat ?? ""} className={input} />
          </label>
          <label className="text-xs">
            {t.vat}
            <input name="vat_total" inputMode="decimal" defaultValue={receipt.vat_total ?? ""} className={input} />
          </label>
          <button className="col-span-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">{t.save}</button>
        </form>
      </details>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <form action={moveReceipt} className="flex items-center gap-2">
          <input type="hidden" name="id" value={receipt.id} />
          <select
            name="order_id"
            defaultValue={receipt.order_id ?? ""}
            className="max-w-[11rem] rounded-lg border border-slate-300 bg-white px-2 py-1"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
            <option value="">{t.unsorted}</option>
          </select>
          <button className="rounded-lg border border-slate-300 px-3 py-1">{t.moveTo}</button>
        </form>
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener" className="rounded-lg border border-slate-300 px-3 py-1">
            {t.viewFile}
          </a>
        )}
        <form action={deleteReceipt.bind(null, receipt.id)}>
          <ConfirmButton message={t.confirmDeleteReceipt} className="rounded-lg border border-red-200 px-3 py-1 text-red-700">
            {t.delete}
          </ConfirmButton>
        </form>
      </div>
    </li>
  );
}
