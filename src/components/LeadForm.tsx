"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addLead } from "@/app/leads-actions";
import type { Dict } from "@/lib/i18n";
import { prepareUpload } from "@/lib/prepare-upload";
import { PHOTO_MIME } from "@/lib/quotes";
import { createClient } from "@/lib/supabase/client";

// Paste a post from a Facebook/WhatsApp/Telegram group, or a screenshot of it.
export function LeadForm({ t, userId, aiEnabled }: { t: Dict; userId: string; aiEnabled: boolean }) {
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
    const supabase = createClient();
    let uploaded: { path: string; mimeType: string } | null = null;
    try {
      if (image) {
        const prepared = await prepareUpload(image);
        if ("error" in prepared || !PHOTO_MIME.includes(prepared.mimeType)) {
          setError("error" in prepared && prepared.error === "too_big" ? t.fileTooBig : t.unsupportedFile);
          setBusy(false);
          return;
        }
        const path = `${userId}/leads/${crypto.randomUUID()}.${prepared.ext}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, prepared.file, { contentType: prepared.mimeType });
        if (uploadError) throw uploadError;
        uploaded = { path, mimeType: prepared.mimeType };
      }
      const result = await addLead({ text, image: uploaded });
      if ("error" in result) throw new Error("addLead failed");
      router.push(`/dashboard/leads/${result.id}`);
    } catch (err) {
      console.error(err);
      // Do not leave a screenshot in storage that no lead points to.
      if (uploaded) await supabase.storage.from("documents").remove([uploaded.path]);
      setError(t.uploadFailed);
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
          className="max-w-full truncate rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          🖼 {image ? image.name : t.leadScreenshot}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            setError(null);
            setImage(e.target.files?.[0] ?? null);
            // Lets the same file be picked again after an error.
            e.target.value = "";
          }}
        />
        <button
          disabled={busy || (!text.trim() && !image)}
          className="ml-auto rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {aiEnabled ? (busy ? t.leadAnalyzing : `✨ ${t.leadAnalyze}`) : busy ? t.uploading : t.leadSave}
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
