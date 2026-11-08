"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { attachRequestPhotos, createClientRequest } from "@/app/client-request-actions";
import type { ClientDict } from "@/lib/client-request-i18n";
import { MAX_PHOTOS, TIMINGS, WORK_TYPES } from "@/lib/client-requests";
import { prepareUpload } from "@/lib/prepare-upload";
import { createClient } from "@/lib/supabase/client";

const input = "block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base";
const label = "mb-1 mt-4 block text-sm font-medium text-slate-700";

// The client's job form on /vakman-gezocht. Photos are made small in the browser and go straight
// to storage through one-time upload slots, so no file passes through the server.
export function ClientRequestForm({ t, lang }: { t: ClientDict; lang: "nl" | "en" }) {
  const router = useRouter();
  const [type, setType] = useState("");
  const [timing, setTiming] = useState<string>("weeks");
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hint = WORK_TYPES.find((w) => w.key === type)?.sizeHint[lang] ?? "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    // Bots fill the hidden field; people never see it.
    if (f.get("website")) return;
    setBusy(true);
    setError(null);
    const result = await createClientRequest({
      work_type: type,
      size: String(f.get("size") ?? ""),
      description: String(f.get("description") ?? ""),
      postcode: String(f.get("postcode") ?? ""),
      timing,
      budget: String(f.get("budget") ?? ""),
      name: String(f.get("name") ?? ""),
      email: String(f.get("email") ?? ""),
      phone: String(f.get("phone") ?? ""),
      lang,
      photos: photos.length,
    }).catch(() => ({ ok: false as const, error: "failed" as const }));
    if (!result.ok) {
      setBusy(false);
      setError(t.errors[result.error]);
      return;
    }
    const storage = createClient().storage.from("documents");
    const done: string[] = [];
    for (let i = 0; i < result.uploads.length && i < photos.length; i++) {
      const prepared = await prepareUpload(photos[i]);
      if ("error" in prepared) continue;
      const { error: upErr } = await storage.uploadToSignedUrl(result.uploads[i].path, result.uploads[i].token, prepared.file, { contentType: prepared.mimeType });
      if (!upErr) done.push(result.uploads[i].path);
    }
    if (done.length) await attachRequestPhotos(result.token, done).catch(() => null);
    router.push(`/klus/${result.token}?new=1`);
  }

  return (
    <form onSubmit={submit} className="space-y-1">
      <p className={label}>{t.what}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {WORK_TYPES.map((w) => (
          <button
            key={w.key}
            type="button"
            onClick={() => setType(w.key)}
            className={`rounded-xl border bg-white px-1 py-2.5 text-center text-xs font-medium ${type === w.key ? "border-2 border-orange-600 bg-orange-50" : "border-slate-200"}`}
          >
            <span className="block text-2xl">{w.icon}</span>
            {w[lang]}
          </button>
        ))}
      </div>

      <label className={label}>
        {t.size}
        <input name="size" maxLength={120} placeholder={hint} className={`${input} mt-1 font-normal`} />
      </label>
      <label className={label}>
        {t.describe}
        <textarea name="description" required minLength={10} maxLength={2000} rows={4} placeholder={t.describeHint} className={`${input} mt-1 font-normal`} />
      </label>

      <p className={label}>{t.photos}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <button key={i} type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="relative h-16 w-16 overflow-hidden rounded-xl bg-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(p)} alt="" className="h-full w-full object-cover" />
            <span className="absolute right-0.5 top-0.5 rounded-full bg-black/60 px-1 text-xs text-white">✕</span>
          </button>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-2xl text-slate-400">
            +
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                setPhotos([...photos, ...Array.from(e.target.files ?? [])].slice(0, MAX_PHOTOS));
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-slate-500">{t.photosHint}</p>

      <div className="grid gap-x-3 sm:grid-cols-2">
        <label className={label}>
          {t.postcode}
          <input name="postcode" required maxLength={8} placeholder="3061 AB" autoComplete="postal-code" className={`${input} mt-1 font-normal uppercase`} />
        </label>
        <label className={label}>
          {t.budget}
          <input name="budget" maxLength={60} placeholder={t.budgetHint} className={`${input} mt-1 font-normal`} />
        </label>
      </div>

      <p className={label}>{t.when}</p>
      <div className="flex flex-wrap gap-2">
        {TIMINGS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTiming(k)}
            className={`rounded-full border px-3 py-1.5 text-sm ${timing === k ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
          >
            {t.timing[k]}
          </button>
        ))}
      </div>

      <p className="mb-1 mt-6 text-base font-semibold">{t.you}</p>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <label className={label}>
          {t.name}
          <input name="name" required maxLength={80} autoComplete="name" className={`${input} mt-1 font-normal`} />
        </label>
        <label className={label}>
          {t.email}
          <input name="email" type="email" required maxLength={160} autoComplete="email" className={`${input} mt-1 font-normal`} />
        </label>
        <label className={label}>
          {t.phone}
          <input name="phone" type="tel" maxLength={30} autoComplete="tel" className={`${input} mt-1 font-normal`} />
          <span className="mt-1 block text-xs font-normal text-slate-500">{t.phoneHint}</span>
        </label>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <p className="pt-3 text-sm text-slate-600">🔒 {t.privacy}</p>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy || !type}
        className="mt-2 w-full rounded-2xl bg-orange-600 px-4 py-3.5 text-lg font-bold text-white disabled:opacity-50"
      >
        {busy ? "…" : t.submit}
      </button>
    </form>
  );
}
