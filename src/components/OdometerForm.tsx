"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveOdometer } from "@/app/trips-actions";
import { prepareUpload } from "@/lib/prepare-upload";
import { createClient } from "@/lib/supabase/client";
import type { TripsDict } from "@/lib/trips-i18n";

// One odometer reading: the number (typed) and, if wanted, a photo of the dashboard as proof.
export function OdometerForm({ d, userId, today }: { d: TripsDict; userId: string; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(today);
  const [km, setKm] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-3 py-2.5 text-sm font-bold text-orange-800">
        {d.odoAdd}
      </button>
    );
  }

  async function save() {
    const value = Number(km.replace(/[^\d]/g, ""));
    if (!km.trim() || !(value >= 0)) return setError(true);
    setBusy(true);
    setError(false);
    const supabase = createClient();
    let photoPath: string | null = null;
    if (file) {
      const prepared = await prepareUpload(file);
      if (!("error" in prepared) && prepared.mimeType !== "application/pdf") {
        const path = `${userId}/odometer/${crypto.randomUUID()}.${prepared.ext}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, prepared.file, { contentType: prepared.mimeType });
        if (!upErr) photoPath = path;
      }
    }
    const res = await saveOdometer({ readOn: day, km: value, photoPath });
    setBusy(false);
    if (!res.ok) {
      if (photoPath) await supabase.storage.from("documents").remove([photoPath]);
      return setError(true);
    }
    setOpen(false);
    setKm("");
    setFile(null);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2" />
        <input
          value={km}
          onChange={(e) => setKm(e.target.value.replace(/[^\d ]/g, ""))}
          inputMode="numeric"
          placeholder={d.odoKm}
          className="rounded-lg border border-slate-300 px-2 py-2 font-mono text-lg"
        />
      </div>
      <label className="block cursor-pointer text-sm text-slate-600">
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <span className="inline-block rounded-lg border border-slate-300 px-3 py-2">📷 {file ? file.name.slice(0, 24) : d.odoPhoto}</span>
      </label>
      {error && <p className="text-sm text-red-700">{d.failed}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="flex-1 rounded-lg bg-orange-600 px-3 py-2.5 font-bold text-white disabled:opacity-60">
          {busy ? d.saving : d.save}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-700">
          {d.cancel}
        </button>
      </div>
    </div>
  );
}
