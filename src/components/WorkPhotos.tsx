"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addWorkPhoto, removeWorkPhoto } from "@/app/profile-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { Dict } from "@/lib/i18n";
import { prepareUpload } from "@/lib/prepare-upload";
import { createClient } from "@/lib/supabase/client";
import { MAX_WORK_PHOTOS } from "@/lib/worker-profile";
import type { WorkerDict } from "@/lib/worker-profile-text";

// 3–6 photos of finished jobs, shown to clients in the passport.
export function WorkPhotos({
  t,
  w,
  userId,
  photos,
}: {
  t: Dict;
  w: WorkerDict;
  userId: string;
  photos: { path: string; url: string | null }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const room = MAX_WORK_PHOTOS - photos.length;

  async function upload(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, room);
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    for (const file of files) {
      const prepared = await prepareUpload(file);
      if ("error" in prepared || prepared.mimeType === "application/pdf") {
        setError(`${file.name}: ${"error" in prepared && prepared.error === "too_big" ? t.fileTooBig : t.unsupportedFile}`);
        continue;
      }
      const path = `${userId}/work/${crypto.randomUUID()}.${prepared.ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, prepared.file, { contentType: prepared.mimeType });
      if (upErr) {
        console.error(upErr);
        setError(`${file.name}: ${t.uploadFailed}`);
        continue;
      }
      try {
        await addWorkPhoto(path);
      } catch (err) {
        console.error(err);
        await supabase.storage.from("documents").remove([path]);
        setError(`${file.name}: ${t.uploadFailed}`);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <div key={p.path} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
            {p.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            )}
            <form action={removeWorkPhoto} className="absolute right-1 top-1">
              <input type="hidden" name="path" value={p.path} />
              <ConfirmButton
                message={w.removePhotoConfirm}
                className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-sm text-white"
              >
                ✕
              </ConfirmButton>
            </form>
          </div>
        ))}
        {room > 0 && (
          <label
            className={`grid aspect-square cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 text-center text-sm text-slate-500 ${busy ? "opacity-60" : ""}`}
          >
            <span>
              <span className="block text-2xl">+</span>
              {busy ? t.uploading : w.addPhoto}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              className="sr-only"
              onChange={(e) => upload(e.target.files)}
            />
          </label>
        )}
      </div>
      {room <= 0 && <p className="mt-2 text-xs text-slate-500">{w.photosMax}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
