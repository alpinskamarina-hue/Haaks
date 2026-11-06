"use client";

import { useState } from "react";
import type { AccountantPack } from "@/lib/accountant-pack";

// Builds the accountant's ZIP in the browser: invoice PDFs, the btw overview, receipt photos and the tables.
export function AccountantZip({
  pack,
  urls,
  label,
  busyLabel,
  errorLabel,
}: {
  pack: AccountantPack;
  urls: Record<string, string>; // receipt path -> signed link
  label: string;
  busyLabel: string;
  errorLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function build() {
    setBusy(true);
    setFailed(false);
    try {
      const [{ zipSync, strToU8 }, pdf] = await Promise.all([import("fflate"), import("@/lib/invoice-pdf")]);
      const fonts = await pdf.loadFonts(window.location.origin);
      const files: Record<string, Uint8Array> = {};
      for (const { name, invoice } of pack.invoices) files[name] = await pdf.invoicePdf(invoice, pack.profile, fonts);
      files[pack.overviewName] = await pdf.overviewPdf(pack.overview, fonts);
      for (const [name, text] of Object.entries(pack.texts)) files[name] = strToU8(text);
      await Promise.all(
        pack.receipts.map(async (r) => {
          const url = urls[r.path];
          if (!url) return;
          const res = await fetch(url);
          if (res.ok) files[r.name] = new Uint8Array(await res.arrayBuffer());
        }),
      );
      const zip = zipSync(files, { level: 6 });
      const href = URL.createObjectURL(new Blob([zip as BlobPart], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = href;
      a.download = pack.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 60_000);
    } catch (e) {
      console.error(e);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={build}
        disabled={busy}
        className="block w-full rounded-2xl bg-orange-600 px-4 py-3.5 text-center text-lg font-bold text-white shadow-sm disabled:opacity-70"
      >
        {busy ? busyLabel : label}
      </button>
      {failed && <p className="mt-2 text-center text-sm font-medium text-red-700">{errorLabel}</p>}
    </div>
  );
}
