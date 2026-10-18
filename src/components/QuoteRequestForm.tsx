"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { generateQuote } from "@/app/quotes-actions";
import { MAX_FILE_BYTES } from "@/lib/documents";
import type { Dict } from "@/lib/i18n";
import { MAX_QUOTE_PHOTOS, PHOTO_MIME, VAT_RATES } from "@/lib/quotes";
import { createClient } from "@/lib/supabase/client";

type OrderOption = { id: string; title: string };

// The worker describes the job and adds site photos; AI turns it into a draft quote.
export function QuoteRequestForm({
  t,
  userId,
  orders,
  defaultOrderId,
  defaultRate,
}: {
  t: Dict;
  userId: string;
  orders: OrderOption[];
  defaultOrderId: string | null;
  defaultRate: number | null;
}) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [orderId, setOrderId] = useState(defaultOrderId ?? "");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [rate, setRate] = useState(defaultRate ? String(defaultRate) : "");
  const [vatRate, setVatRate] = useState(21);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPhotos(list: FileList | null) {
    const picked = Array.from(list ?? []);
    const bad = picked.find((f) => f.size > MAX_FILE_BYTES || !PHOTO_MIME.includes(f.type));
    setError(bad ? `${bad.name}: ${bad.size > MAX_FILE_BYTES ? t.fileTooBig : "JPG, PNG, WEBP"}` : null);
    const ok = picked.filter((f) => f.size <= MAX_FILE_BYTES && PHOTO_MIME.includes(f.type));
    setPhotos((prev) => [...prev, ...ok].slice(0, MAX_QUOTE_PHOTOS));
    if (cameraRef.current) cameraRef.current.value = "";
    if (filesRef.current) filesRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() && !photos.length) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const uploaded = [];
      for (const file of photos) {
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
        const path = `${userId}/quotes/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw new Error(`${file.name}: ${uploadError.message}`);
        uploaded.push({ path, mimeType: file.type });
      }
      const { id } = await generateQuote({
        orderId: orderId || null,
        description,
        photos: uploaded,
        hourlyRate: Number(rate.replace(",", ".")) || 0,
        vatRate,
      });
      router.push(`/dashboard/quotes/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3";
  const button = "flex-1 rounded-lg px-4 py-3 text-center font-semibold disabled:opacity-60 cursor-pointer";

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm text-slate-600">{t.quoteHelp}</p>
      <label className="block text-sm font-medium">
        {t.quoteOrder}
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} disabled={busy} className={field}>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
          <option value="">{t.noOrder}</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        {t.jobDescription}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          rows={5}
          placeholder={t.jobDescriptionHint}
          className={field}
        />
      </label>

      <div>
        <p className="text-sm font-medium">
          {t.sitePhotos} ({photos.length}/{MAX_QUOTE_PHOTOS})
        </p>
        {photos.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {photos.map((f, i) => (
              <li key={`${f.name}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-slate-900 text-xs text-white"
                  aria-label={t.delete}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy || photos.length >= MAX_QUOTE_PHOTOS}
            onClick={() => cameraRef.current?.click()}
            className={`${button} border border-slate-300 bg-white`}
          >
            📷 {t.takePhoto}
          </button>
          <button
            type="button"
            disabled={busy || photos.length >= MAX_QUOTE_PHOTOS}
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
          onChange={(e) => addPhotos(e.target.files)}
        />
        <input
          ref={filesRef}
          type="file"
          multiple
          accept={PHOTO_MIME.join(",")}
          className="hidden"
          onChange={(e) => addPhotos(e.target.files)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          {t.hourlyRate}
          <input
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            inputMode="decimal"
            placeholder="45"
            disabled={busy}
            className={field}
          />
        </label>
        <label className="block text-sm font-medium">
          {t.vatRate}
          <select
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            disabled={busy}
            className={field}
          >
            {VAT_RATES.map((r) => (
              <option key={r} value={r}>
                {r}%
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        disabled={busy || (!description.trim() && !photos.length)}
        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {busy ? t.drafting : `✨ ${t.makeDraft}`}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
