"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDocument } from "@/app/actions";
import { DOC_TYPES } from "@/lib/documents";
import type { Dict } from "@/lib/i18n";
import { prepareUpload } from "@/lib/prepare-upload";
import { createClient } from "@/lib/supabase/client";

export function UploadForm({ t, userId }: { t: Dict; userId: string }) {
  const router = useRouter();
  const [docType, setDocType] = useState<string>("kvk_extract");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "preparing" | "uploading" | "reading">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setStatus("preparing");

    const prepared = await prepareUpload(file);
    if ("error" in prepared) {
      setError(prepared.error === "too_big" ? t.fileTooBig : t.unsupportedFile);
      setStatus("idle");
      return;
    }

    setStatus("uploading");
    const path = `${userId}/${crypto.randomUUID()}.${prepared.ext}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, prepared.file, { contentType: prepared.mimeType });
    if (uploadError) {
      console.error(uploadError);
      setError(t.uploadFailed);
      setStatus("idle");
      return;
    }

    setStatus("reading");
    try {
      await addDocument({ path, fileName: file.name, mimeType: prepared.mimeType, docType });
      setFile(null);
      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      console.error(err);
      // Do not leave a file in storage that no document points to.
      await supabase.storage.from("documents").remove([path]);
      setError(t.uploadFailed);
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
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
          accept="application/pdf,image/*,.heic,.heif"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2"
        />
      </label>
      <button
        type="submit"
        disabled={!file || status !== "idle"}
        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {status === "preparing"
          ? t.preparing
          : status === "uploading"
            ? t.uploading
            : status === "reading"
              ? t.reading
              : t.upload}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
