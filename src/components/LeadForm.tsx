"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addLead } from "@/app/leads-actions";
import { MAX_FILE_BYTES } from "@/lib/documents";
import type { Dict } from "@/lib/i18n";
import { PHOTO_MIME } from "@/lib/quotes";
import { createClient } from "@/lib/supabase/client";

// Paste a post from a Facebook/WhatsApp/Telegram group, or a screenshot of it.
export function LeadForm({ t, userId }: { t: Dict; userId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !image) return;
    setBusy(true);
    setError(null);
    try {
      let uploaded = null;
      if (image) {
        const ext = image.name.includes(".") ? image.name.split(".").pop() : "jpg";
        const path = `${userId}/leads/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await createClient()
          .storage.from("documents")
          .upload(path, image, { contentType: image.type });
        if (uploadError) throw new Error(uploadError.message);
        uploaded = { path, mimeType: image.type };
      }
      const { id } = await addLead({ text, image: uploaded });
      router.push(`/dashboard/leads/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
        rows={4}
        placeholder={t.leadPastePlaceholder}
        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          🖼 {image ? image.name : t.leadScreenshot}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={PHOTO_MIME.join(",")}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && (f.size > MAX_FILE_BYTES || !PHOTO_MIME.includes(f.type))) {
              setError(f.size > MAX_FILE_BYTES ? t.fileTooBig : "JPG, PNG, WEBP");
              return;
            }
            setImage(f);
          }}
        />
        <button
          disabled={busy || (!text.trim() && !image)}
          className="ml-auto rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {busy ? t.leadAnalyzing : `✨ ${t.leadAnalyze}`}
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
