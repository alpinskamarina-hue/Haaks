"use client";

import { useState } from "react";

export type PackDoc = {
  label: string;
  url?: string;
  mime: string;
  lines: string[];
};

export type PackCover = {
  title: string;
  pack: string;
  name: string;
  rows: [string, string][];
  documentsTitle: string;
  docs: { label: string; detail: string }[];
  none: string;
  online: string;
  url: string;
  qr: string;
  made: string;
  failed: string;
};

const A4: [number, number] = [595.28, 841.89];
const M = 48;

// Builds one PDF in the browser: a cover page with the builder's details and a QR to the online
// passport, then every document shown in the passport (PDF pages copied, photos placed on A4).
// Built client-side so big scans do not hit the server's response size limit.
export function PassportPack({
  cover,
  docs,
  fileName,
  label,
  busyLabel,
  errorLabel,
  className,
}: {
  cover: PackCover;
  docs: PackDoc[];
  fileName: string;
  label: string;
  busyLabel: string;
  errorLabel: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function make() {
    setBusy(true);
    setError(false);
    try {
      const bytes = await buildPack(cover, docs);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 60_000);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={make} disabled={busy} className={className}>
        📄 {busy ? busyLabel : label}
      </button>
      {error && <span className="mt-1 text-xs text-red-700">{errorLabel}</span>}
    </span>
  );
}

async function buildPack(cover: PackCover, docs: PackDoc[]) {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regBytes, boldBytes] = await Promise.all(
    ["/fonts/NotoSans-Regular.ttf", "/fonts/NotoSans-Bold.ttf"].map((u) =>
      fetch(u).then((r) => {
        if (!r.ok) throw new Error(`font ${u}`);
        return r.arrayBuffer();
      }),
    ),
  );
  const font = await pdf.embedFont(regBytes, { subset: false });
  const bold = await pdf.embedFont(boldBytes, { subset: false });
  pdf.setTitle(`${cover.title} ${cover.name}`.trim());
  pdf.setCreator("Haaks");

  const ink = rgb(0.06, 0.09, 0.16);
  const grey = rgb(0.39, 0.45, 0.55);
  const orange = rgb(0.92, 0.35, 0.05);
  const width = A4[0] - 2 * M;

  const fit = (text: string, size: number, f = font, max = width) => {
    if (f.widthOfTextAtSize(text, size) <= max) return text;
    let t = text;
    while (t.length > 1 && f.widthOfTextAtSize(`${t}…`, size) > max) t = t.slice(0, -1);
    return `${t}…`;
  };
  const wrap = (text: string, size: number, max = width) => {
    const out: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > max && line) {
        out.push(line);
        line = word;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  };

  // Cover page.
  const page = pdf.addPage(A4);
  page.drawRectangle({ x: 0, y: A4[1] - 10, width: A4[0], height: 10, color: orange });
  let y = A4[1] - M - 10;
  page.drawText(cover.title.toUpperCase(), { x: M, y, size: 11, font: bold, color: orange });
  page.drawText(cover.pack, { x: M + bold.widthOfTextAtSize(cover.title.toUpperCase(), 11) + 10, y, size: 11, font, color: grey });
  y -= 40;
  page.drawText(fit(cover.name || "—", 26, bold), { x: M, y, size: 26, font: bold, color: ink });
  y -= 34;
  for (const [k, v] of cover.rows) {
    page.drawText(k, { x: M, y, size: 11, font, color: grey });
    page.drawText(fit(v, 11, bold, width - 140), { x: M + 140, y, size: 11, font: bold, color: ink });
    y -= 19;
  }
  y -= 18;
  page.drawText(cover.documentsTitle, { x: M, y, size: 15, font: bold, color: ink });
  y -= 22;
  if (!cover.docs.length) {
    page.drawText(cover.none, { x: M, y, size: 11, font, color: grey });
    y -= 18;
  }
  for (const d of cover.docs) {
    page.drawText("•", { x: M, y, size: 11, font: bold, color: orange });
    page.drawText(fit(d.label, 11, bold, width - 14), { x: M + 14, y, size: 11, font: bold, color: ink });
    y -= 16;
    if (d.detail) {
      for (const line of wrap(d.detail, 10, width - 14).slice(0, 3)) {
        page.drawText(line, { x: M + 14, y, size: 10, font, color: grey });
        y -= 14;
      }
      y -= 4;
    }
    if (y < 220) break;
  }

  const qr = await pdf.embedPng(cover.qr);
  page.drawImage(qr, { x: M, y: M + 26, width: 110, height: 110 });
  page.drawText(cover.online, { x: M + 126, y: M + 112, size: 12, font: bold, color: ink });
  wrap(cover.url, 10, width - 126).forEach((line, i) =>
    page.drawText(line, { x: M + 126, y: M + 94 - i * 14, size: 10, font, color: rgb(0.11, 0.3, 0.85) }),
  );
  page.drawText(cover.made, { x: M, y: M, size: 9, font, color: grey });

  // Documents.
  for (const doc of docs) {
    try {
      if (!doc.url) throw new Error("no url");
      const res = await fetch(doc.url);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const buf = await res.arrayBuffer();
      if (doc.mime === "application/pdf") {
        const src = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await pdf.copyPages(src, src.getPageIndices());
        pages.forEach((p) => pdf.addPage(p));
        continue;
      }
      const img =
        doc.mime === "image/png"
          ? await pdf.embedPng(buf)
          : doc.mime === "image/jpeg"
            ? await pdf.embedJpg(buf)
            : await pdf.embedJpg(await toJpeg(new Blob([buf], { type: doc.mime })));
      const p = pdf.addPage(A4);
      p.drawText(fit(doc.label, 12, bold), { x: M, y: A4[1] - M, size: 12, font: bold, color: ink });
      doc.lines.slice(0, 2).forEach((line, i) =>
        p.drawText(fit(line, 9), { x: M, y: A4[1] - M - 16 - i * 13, size: 9, font, color: grey }),
      );
      const top = A4[1] - M - 50;
      const scale = Math.min(width / img.width, (top - M) / img.height, 1.5);
      const w = img.width * scale;
      const h = img.height * scale;
      p.drawImage(img, { x: (A4[0] - w) / 2, y: top - h, width: w, height: h });
    } catch (err) {
      console.error(err);
      const p = pdf.addPage(A4);
      p.drawText(fit(doc.label, 14, bold), { x: M, y: A4[1] - M - 10, size: 14, font: bold, color: ink });
      wrap(cover.failed.replace("{doc}", doc.label), 11).forEach((line, i) =>
        p.drawText(line, { x: M, y: A4[1] - M - 40 - i * 16, size: 11, font, color: grey }),
      );
      p.drawText(fit(cover.url, 10), { x: M, y: A4[1] - M - 90, size: 10, font, color: rgb(0.11, 0.3, 0.85) });
    }
  }
  return pdf.save();
}

// Photos in other formats (webp, gif…) go through a canvas so pdf-lib can embed them.
async function toJpeg(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  if (!out) throw new Error("no jpeg");
  return out.arrayBuffer();
}
