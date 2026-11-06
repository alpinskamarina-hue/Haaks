// Invoice and quarter overview as PDF files for the accountant's ZIP (Dutch, A4).
// Noto Sans is embedded so names in any alphabet print correctly.

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Profile } from "./documents";
import { invoiceTotals, vatNote, type Invoice } from "./invoices";
import { lineTotal } from "./quotes";

const A4: [number, number] = [595.28, 841.89];
const M = 50;
const ink = rgb(0.06, 0.09, 0.16);
const grey = rgb(0.4, 0.45, 0.53);
const line = rgb(0.8, 0.83, 0.87);

export const eur = (n: number) => `€ ${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const nlDate = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("nl-NL", { timeZone: "UTC" }) : "");

export type Fonts = { regular: Uint8Array; bold: Uint8Array };

export async function loadFonts(origin: string): Promise<Fonts> {
  const get = async (name: string) => {
    const r = await fetch(`${origin}/fonts/${name}`);
    if (!r.ok) throw new Error(`font ${name}`);
    return new Uint8Array(await r.arrayBuffer());
  };
  const [regular, bold] = await Promise.all([get("NotoSans-Regular.ttf"), get("NotoSans-Bold.ttf")]);
  return { regular, bold };
}

class Writer {
  page: PDFPage;
  y: number;
  constructor(
    private pdf: PDFDocument,
    public font: PDFFont,
    public bold: PDFFont,
  ) {
    this.page = pdf.addPage(A4);
    this.y = A4[1] - M;
  }
  need(h: number) {
    if (this.y - h < M) {
      this.page = this.pdf.addPage(A4);
      this.y = A4[1] - M;
    }
  }
  fit(text: string, size: number, f: PDFFont, max: number) {
    let s = text.replace(/\s+/g, " ");
    while (s && f.widthOfTextAtSize(s, size) > max) s = s.slice(0, -2);
    return s === text.replace(/\s+/g, " ") ? s : `${s}…`;
  }
  text(s: string, x: number, size = 10, f = this.font, color = ink, max = A4[0] - M - x) {
    this.page.drawText(this.fit(s, size, f, max), { x, y: this.y, size, font: f, color });
  }
  right(s: string, xRight: number, size = 10, f = this.font, color = ink) {
    this.page.drawText(s, { x: xRight - f.widthOfTextAtSize(s, size), y: this.y, size, font: f, color });
  }
  rule() {
    this.page.drawLine({ start: { x: M, y: this.y + 4 }, end: { x: A4[0] - M, y: this.y + 4 }, thickness: 0.6, color: line });
  }
}

async function newDoc(fonts: Fonts) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fonts.regular, { subset: false });
  const bold = await pdf.embedFont(fonts.bold, { subset: false });
  return { pdf, w: new Writer(pdf, font, bold) };
}

export async function invoicePdf(invoice: Invoice, worker: Profile, fonts: Fonts) {
  const { pdf, w } = await newDoc(fonts);
  const R = A4[0] - M;
  w.text("FACTUUR", M, 24, w.bold);
  w.y -= 40;
  const left = [invoice.client_name || "—", ...(invoice.client_address ?? "").split("\n"), invoice.client_kvk && `KvK: ${invoice.client_kvk}`, invoice.client_btw && `Btw-id: ${invoice.client_btw}`].filter(Boolean) as string[];
  const right = [worker.company_name || worker.full_name || "", worker.business_address, worker.kvk_number && `KvK: ${worker.kvk_number}`, worker.btw_number && `Btw-id: ${worker.btw_number}`, worker.iban && `IBAN: ${worker.iban}`, worker.phone && `Tel: ${worker.phone}`, worker.business_email && `E-mail: ${worker.business_email}`].filter(Boolean) as string[];
  const top = w.y;
  left.forEach((s, i) => {
    w.y = top - i * 14;
    w.text(s, M, 10, i === 0 ? w.bold : w.font, ink, 230);
  });
  right.forEach((s, i) => {
    w.y = top - i * 14;
    w.text(s, 320, 10, i === 0 ? w.bold : w.font, ink, R - 320);
  });
  w.y = top - Math.max(left.length, right.length) * 14 - 16;
  const meta = [
    ["Factuurnummer", invoice.number],
    ["Factuurdatum", nlDate(invoice.invoice_date)],
    ["Vervaldatum", nlDate(invoice.due_date)],
    ["Periode", invoice.work_period ?? ""],
    ["Project", invoice.project_address ?? ""],
  ].filter(([, v]) => v);
  for (const [k, v] of meta) {
    w.text(`${k}:`, M, 10, w.bold);
    w.text(v!, M + 100, 10);
    w.y -= 14;
  }
  w.y -= 14;
  w.text("Omschrijving", M, 9, w.bold, grey);
  w.right("Aantal", 360, 9, w.bold, grey);
  w.right("Prijs", 430, 9, w.bold, grey);
  w.right("Btw", 470, 9, w.bold, grey);
  w.right("Totaal", R, 9, w.bold, grey);
  w.y -= 6;
  w.rule();
  w.y -= 12;
  for (const l of invoice.lines) {
    w.need(16);
    w.text(l.description || "—", M, 10, w.font, ink, 250);
    w.right(`${Number(l.quantity).toLocaleString("nl-NL")} ${l.unit ?? ""}`.trim(), 360);
    w.right(eur(Number(l.unit_price)), 430);
    w.right(invoice.vat_mode === "normal" ? `${l.vat_rate}%` : "—", 470);
    w.right(eur(lineTotal(l)), R);
    w.y -= 16;
  }
  w.rule();
  w.y -= 14;
  const t = invoiceTotals(invoice.lines, invoice.vat_mode);
  const sumRow = (k: string, v: number, b = false) => {
    w.need(16);
    w.right(k, 430, 10, b ? w.bold : w.font);
    w.right(eur(v), R, 10, b ? w.bold : w.font);
    w.y -= 15;
  };
  sumRow("Subtotaal excl. btw", t.excl);
  for (const v of t.vatLines) sumRow(`Btw ${v.rate}% over ${eur(v.base)}`, v.vat);
  sumRow("Totaal", t.incl, true);
  const note = vatNote(invoice);
  if (note) {
    w.y -= 10;
    w.need(14);
    w.text(note, M, 9, w.font, grey);
  }
  return pdf.save();
}

export type OverviewInput = {
  name: string;
  kvk: string | null;
  btw: string | null;
  quarterLabel: string;
  deadline: string;
  rows: [string, string][];
  notes: string[];
};

export async function overviewPdf(o: OverviewInput, fonts: Fonts) {
  const { pdf, w } = await newDoc(fonts);
  const R = A4[0] - M;
  w.text(`Btw-overzicht ${o.quarterLabel}`, M, 20, w.bold);
  w.y -= 22;
  w.text([o.name, o.kvk && `KvK ${o.kvk}`, o.btw && `Btw-id ${o.btw}`].filter(Boolean).join("  ·  "), M, 10, w.font, grey);
  w.y -= 14;
  w.text(`Aangifte uiterlijk ${nlDate(o.deadline)}`, M, 10, w.font, grey);
  w.y -= 28;
  for (const [k, v] of o.rows) {
    if (!k) {
      w.y -= 8;
      continue;
    }
    w.text(k, M, 11);
    w.right(v, R, 11, w.bold);
    w.y -= 8;
    w.rule();
    w.y -= 12;
  }
  w.y -= 10;
  for (const n of o.notes) {
    w.need(14);
    w.text(n, M, 9, w.font, grey);
    w.y -= 13;
  }
  return pdf.save();
}
