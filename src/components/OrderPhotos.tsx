"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addOrderPhoto, deleteOrderPhoto } from "@/app/project-actions";
import { prepareUpload } from "@/lib/prepare-upload";
import { createClient } from "@/lib/supabase/client";

type Kind = "before" | "during" | "after";
export type OrderPhoto = { id: string; kind: Kind; url: string | null };

// Photos of one order, grouped before / during / after. Pick the group, then shoot or choose files.
export function OrderPhotos({
  orderId,
  userId,
  photos,
  labels,
  initialKind,
}: {
  orderId: string;
  userId: string;
  photos: OrderPhoto[];
  labels: { before: string; during: string; after: string; add: string; uploading: string; empty: string; del: string; failed: string };
  initialKind: Kind;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, 20);
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    for (const file of files) {
      const prepared = await prepareUpload(file);
      if ("error" in prepared || prepared.mimeType === "application/pdf") {
        setError(`${file.name}: ${labels.failed}`);
        continue;
      }
      const path = `${userId}/orders/${orderId}/${crypto.randomUUID()}.${prepared.ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, prepared.file, { contentType: prepared.mimeType });
      if (upErr) {
        console.error(upErr);
        setError(`${file.name}: ${labels.failed}`);
        continue;
      }
      try {
        await addOrderPhoto(orderId, path, kind);
      } catch (err) {
        console.error(err);
        await supabase.storage.from("documents").remove([path]);
        setError(`${file.name}: ${labels.failed}`);
      }
    }
    if (input.current) input.current.value = "";
    setBusy(false);
    router.refresh();
  }

  const kinds: Kind[] = ["before", "during", "after"];
  return (
    <div className="space-y-4">
      <div id="add" className="scroll-mt-4 space-y-2">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-lg py-1.5 ${kind === k ? "bg-white text-orange-700 shadow-sm" : "text-slate-600"}`}
            >
              {labels[k]}
            </button>
          ))}
        </div>
        <label className={`block cursor-pointer rounded-xl bg-orange-600 py-3 text-center font-bold text-white ${busy ? "opacity-60" : ""}`}>
          📸 {busy ? labels.uploading : `${labels.add} · ${labels[kind]}`}
          <input ref={input} type="file" accept="image/*" multiple disabled={busy} className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>

      {photos.length === 0 && <p className="text-sm text-slate-600">{labels.empty}</p>}
      {kinds.map((k) => {
        const list = photos.filter((p) => p.kind === k);
        if (!list.length) return null;
        return (
          <div key={k}>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              {labels[k]} · {list.length}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {list.map((p) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="h-full w-full object-cover" />
                    </a>
                  )}
                  <button
                    type="button"
                    aria-label={labels.del}
                    onClick={async () => {
                      if (!confirm(labels.del)) return;
                      await deleteOrderPhoto(p.id);
                      router.refresh();
                    }}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
