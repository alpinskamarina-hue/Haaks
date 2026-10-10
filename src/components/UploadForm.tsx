"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDocument } from "@/app/actions";
import { ACCEPTED_MIME, DOC_TYPES, MAX_FILE_BYTES } from "@/lib/documents";
import type { Dict } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function UploadForm({ t, userId }: { t: Dict; userId: string }) {
  const router = useRouter();
  const [docType, setDocType] = useState<string>("kvk_extract");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "reading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(t.fileTooBig);
      return;
    }
    setError(null);
    setStatus("uploading");

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setStatus("idle");
      return;
    }

    setStatus("reading");
    try {
      await addDocument({ path, fileName: file.name, mimeType: file.type, docType });
      setFile(null);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm font-medium">
        {t.docType}
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
        >
          {DOC_TYPES.map((type) => (
            <option key={type} value={type}>
              {t[`docType_${type}`]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {t.chooseFile}
        <input
          type="file"
          required
          accept={ACCEPTED_MIME.join(",")}
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2"
        />
      </label>
      <button
        type="submit"
        disabled={!file || status !== "idle"}
        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {status === "uploading" ? t.uploading : status === "reading" ? t.reading : t.upload}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
