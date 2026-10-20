"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addReceipt } from "@/app/orders-actions";
import type { Dict } from "@/lib/i18n";
import { prepareUpload } from "@/lib/prepare-upload";
import { createClient } from "@/lib/supabase/client";

type OrderOption = { id: string; title: string };

// Two ways in: the phone camera at the till, or picking existing photos/PDFs (several at once).
export function ReceiptUpload({
  t,
  userId,
  orders,
  defaultOrderId,
  fixedOrder = false,
  aiEnabled = true,
}: {
  t: Dict;
  userId: string;
  orders: OrderOption[];
  defaultOrderId: string | null;
  fixedOrder?: boolean;
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [orderId, setOrderId] = useState(defaultOrderId ?? "");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function upload(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setErrors([]);
    setProgress({ done: 0, total: files.length });
    const supabase = createClient();
    const failed: string[] = [];

    for (const [i, file] of files.entries()) {
      const prepared = await prepareUpload(file);
      if ("error" in prepared) {
        failed.push(`${file.name}: ${prepared.error === "too_big" ? t.fileTooBig : t.unsupportedFile}`);
      } else {
        const path = `${userId}/receipts/${crypto.randomUUID()}.${prepared.ext}`;
        const { error } = await supabase.storage
          .from("documents")
          .upload(path, prepared.file, { contentType: prepared.mimeType });
        if (error) {
          console.error(error);
          failed.push(`${file.name}: ${t.uploadFailed}`);
        } else {
          try {
            await addReceipt({ path, fileName: file.name, mimeType: prepared.mimeType, orderId: orderId || null });
          } catch (err) {
            console.error(err);
            // Do not leave a file in storage that no receipt points to.
            await supabase.storage.from("documents").remove([path]);
            failed.push(`${file.name}: ${t.uploadFailed}`);
          }
        }
      }
      setProgress({ done: i + 1, total: files.length });
    }

    setErrors(failed);
    setProgress(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (filesRef.current) filesRef.current.value = "";
    router.refresh();
  }

  const busy = progress !== null;
  const button =
    "flex-1 rounded-lg px-4 py-3 text-center font-semibold disabled:opacity-60 cursor-pointer";

  return (
    <div className="space-y-3">
      {!fixedOrder && (
        <label className="block text-sm font-medium">
          {t.receiptsGoTo}
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            disabled={busy}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
            <option value="">{t.unsorted}</option>
          </select>
        </label>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          className={`${button} bg-orange-600 text-white`}
        >
          📷 {t.takePhoto}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => filesRef.current?.click()}
          className={`${button} border border-slate-300 bg-white`}
        >
          ⬆ {t.uploadFiles}
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <input
        ref={filesRef}
        type="file"
        multiple
        accept="application/pdf,image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />

      {progress && (
        <p className="text-sm text-slate-700">
          {(aiEnabled ? t.readingReceipts : t.uploadingReceipts).replace("{n}", String(progress.done)).replace("{m}", String(progress.total))}
        </p>
      )}
      {errors.map((e) => (
        <p key={e} className="text-sm text-red-700">
          {e}
        </p>
      ))}
    </div>
  );
}
