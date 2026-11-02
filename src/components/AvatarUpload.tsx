"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { removeAvatar, setAvatar } from "@/app/profile-actions";
import type { Dict } from "@/lib/i18n";
import { prepareUpload } from "@/lib/prepare-upload";
import { createClient } from "@/lib/supabase/client";
import type { WorkerDict } from "@/lib/worker-profile-text";

// Round profile photo: tap it to pick a photo from the gallery or take one.
export function AvatarUpload({
  t,
  w,
  userId,
  url,
  initials,
}: {
  t: Dict;
  w: WorkerDict;
  userId: string;
  url: string | null;
  initials: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const prepared = await prepareUpload(file);
    if ("error" in prepared || prepared.mimeType === "application/pdf") {
      setError("error" in prepared && prepared.error === "too_big" ? t.fileTooBig : t.unsupportedFile);
      setBusy(false);
      return;
    }
    const supabase = createClient();
    const path = `${userId}/avatar/${crypto.randomUUID()}.${prepared.ext}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, prepared.file, { contentType: prepared.mimeType });
    if (upErr) {
      console.error(upErr);
      setError(t.uploadFailed);
    } else {
      try {
        await setAvatar(path);
      } catch (err) {
        console.error(err);
        await supabase.storage.from("documents").remove([path]);
        setError(t.uploadFailed);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(w.avatarRemoveConfirm)) return;
    setBusy(true);
    await removeAvatar().catch(() => setError(t.uploadFailed));
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <label
        className={`relative h-20 w-20 cursor-pointer ${busy ? "opacity-60" : ""}`}
        aria-label={url ? w.avatarChange : w.avatarAdd}
      >
        <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-orange-100 text-2xl font-bold text-orange-700">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-orange-600 text-sm text-white ring-2 ring-white">
          📷
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={busy}
          className="sr-only"
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </label>
      <span className="text-xs text-orange-700">{busy ? t.uploading : url ? w.avatarChange : w.avatarAdd}</span>
      {url && !busy && (
        <button type="button" onClick={remove} className="text-xs text-slate-500 underline">
          {t.delete}
        </button>
      )}
      {error && <p className="max-w-[8rem] text-center text-xs text-red-700">{error}</p>}
    </div>
  );
}
