"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveWork } from "@/app/works-actions";
import type { Dict } from "@/lib/i18n";
import { prepareUpload } from "@/lib/prepare-upload";
import { createClient } from "@/lib/supabase/client";
import { MAX_AFTER, MAX_BEFORE } from "@/lib/works";
import type { WorksDict } from "@/lib/works-i18n";

// A photo already in storage (path) or picked now and uploaded on save (file).
type Photo = { key: string; url: string; path?: string; file?: File };

export type WorkFormInitial = {
  id?: string;
  order_id?: string | null;
  title: string;
  description: string;
  trade: string;
  city: string;
  month: string;
  before: { path: string; url: string }[];
  after: { path: string; url: string }[];
};

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5";

export function WorkForm({
  w,
  t,
  userId,
  trades,
  initial,
}: {
  w: WorksDict;
  t: Dict;
  userId: string;
  trades: { id: string; name: string }[];
  initial: WorkFormInitial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [trade, setTrade] = useState(initial.trade);
  const [city, setCity] = useState(initial.city);
  const [month, setMonth] = useState(initial.month);
  const [description, setDescription] = useState(initial.description);
  const [before, setBefore] = useState<Photo[]>(initial.before.map((p) => ({ key: p.path, ...p })));
  const [after, setAfter] = useState<Photo[]>(initial.after.map((p) => ({ key: p.path, ...p })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!title.trim()) return setError(w.needTitle);
    if (!after.length) return setError(w.needPhoto);
    setBusy(true);
    const supabase = createClient();
    const uploaded: string[] = [];
    const upload = async (list: Photo[]) => {
      const paths: string[] = [];
      for (const p of list) {
        if (p.path) {
          paths.push(p.path);
          continue;
        }
        const prepared = await prepareUpload(p.file!);
        if ("error" in prepared || prepared.mimeType === "application/pdf") {
          throw new Error(`${p.file!.name}: ${"error" in prepared && prepared.error === "too_big" ? t.fileTooBig : t.unsupportedFile}`);
        }
        const path = `${userId}/work/${crypto.randomUUID()}.${prepared.ext}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, prepared.file, { contentType: prepared.mimeType });
        if (upErr) throw new Error(`${p.file!.name}: ${t.uploadFailed}`);
        uploaded.push(path);
        paths.push(path);
      }
      return paths;
    };
    try {
      const photos_before = await upload(before);
      const photos_after = await upload(after);
      const res = await saveWork({
        id: initial.id,
        order_id: initial.order_id ?? null,
        title,
        description,
        trade,
        city,
        month,
        photos_before,
        photos_after,
      });
      if (!res.ok) throw new Error(w.saveFailed);
      router.push(`/dashboard/works?saved=1#work-${res.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      if (uploaded.length) await supabase.storage.from("documents").remove(uploaded);
      setError(err instanceof Error ? err.message : w.saveFailed);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{w.name}</span>
        <input className={input} value={title} maxLength={100} placeholder={w.nameHint} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{w.trade}</span>
          <select className={input} value={trade} onChange={(e) => setTrade(e.target.value)}>
            <option value="">{w.noTrade}</option>
            {trades.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{w.city}</span>
          <input className={input} value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{w.month}</span>
        <input type="month" className={input} value={month} onChange={(e) => setMonth(e.target.value)} />
      </label>

      <PhotoPicker label={w.after} hint={w.afterHint} add={w.addPhoto} confirm={w.removePhotoConfirm} max={MAX_AFTER} photos={after} setPhotos={setAfter} disabled={busy} />
      <PhotoPicker label={w.before} hint={w.beforeHint} add={w.addPhoto} confirm={w.removePhotoConfirm} max={MAX_BEFORE} photos={before} setPhotos={setBefore} disabled={busy} />

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{w.description}</span>
        <textarea className={`${input} min-h-24`} value={description} maxLength={600} onChange={(e) => setDescription(e.target.value)} />
        <span className="mt-1 block text-xs text-slate-500">{w.descriptionHint}</span>
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {busy ? t.uploading : w.save}
      </button>
    </div>
  );
}

function PhotoPicker({
  label,
  hint,
  add,
  confirm,
  max,
  photos,
  setPhotos,
  disabled,
}: {
  label: string;
  hint: string;
  add: string;
  confirm: string;
  max: number;
  photos: Photo[];
  setPhotos: (p: Photo[]) => void;
  disabled: boolean;
}) {
  const room = max - photos.length;
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mb-2 text-xs text-slate-500">{hint}</p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <div key={p.key} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={disabled}
              aria-label="✕"
              onClick={() => {
                if (window.confirm(confirm)) setPhotos(photos.filter((x) => x.key !== p.key));
              }}
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-sm text-white"
            >
              ✕
            </button>
          </div>
        ))}
        {room > 0 && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 text-center text-sm text-slate-500">
            <span>
              <span className="block text-2xl">+</span>
              {add}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={disabled}
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).slice(0, room);
                setPhotos([...photos, ...files.map((file) => ({ key: crypto.randomUUID(), url: URL.createObjectURL(file), file }))]);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
