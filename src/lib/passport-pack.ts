import QRCode from "qrcode";
import type { PackCover, PackDoc } from "@/components/PassportPack";
import { docStatus, type DocumentRow, type Profile } from "@/lib/documents";
import { getPassportDict } from "@/lib/i18n";
import { PACK_TEXT } from "@/lib/passport-plus-i18n";
import { getWorkerDict } from "@/lib/worker-profile-text";

// Everything the PDF pack button needs, prepared on the server: cover texts in Dutch (or English),
// the documents shown in the passport with their signed links, and the QR to the online passport.
export async function packProps(opts: {
  profile: Profile & { trades?: string[] | null };
  documents: DocumentRow[];
  urlOf: (path: string) => string | undefined;
  passportUrl: string;
  lang: "nl" | "en";
}): Promise<{ cover: PackCover; docs: PackDoc[]; fileName: string }> {
  const { profile, lang } = opts;
  const t = getPassportDict(lang);
  const pt = PACK_TEXT[lang];
  const docs = opts.documents.filter((d) => d.show_in_passport);
  const trades = profile.trades ?? [];
  const tradeNames = getWorkerDict(lang).trades as Record<string, string>;
  const trade = trades.length ? trades.map((k) => tradeNames[k] ?? k).join(", ") : profile.trade;
  const date = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`)) : "";
  const statusText = (d: DocumentRow) => {
    const s = docStatus(d);
    return s === "valid" ? t.valid : { expired: t.expired, expires_soon: t.expiresSoon, kvk_old: t.kvkOld }[s];
  };
  const lines = (d: DocumentRow) =>
    [
      [d.document_number && `${t.number}: ${d.document_number}`, d.issued_on && `${t.issued}: ${date(d.issued_on)}`, d.expires_on && `${t.expires}: ${date(d.expires_on)}`]
        .filter(Boolean)
        .join("  ·  "),
      [d.insurer && `${t.insurer}: ${d.insurer}`, d.coverage_amount && `${t.coverage}: ${d.coverage_amount}`].filter(Boolean).join("  ·  "),
    ].filter(Boolean);

  const rows: [string, string | null | undefined][] = [
    [t.company, profile.company_name],
    [t.trade, trade],
    [t.city, profile.city],
    [t.phone, profile.phone],
    [t.kvk, profile.kvk_number],
    [t.btw, profile.btw_number],
  ];
  const name = profile.full_name ?? profile.company_name ?? "";
  const slug = name.normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "zzp";

  return {
    cover: {
      title: t.title,
      pack: pt.pack,
      name,
      rows: rows.filter((r): r is [string, string] => Boolean(r[1])),
      documentsTitle: t.documents,
      docs: docs.map((d) => ({
        label: t.docTypes[d.doc_type],
        detail: [statusText(d), ...lines(d)].join("  ·  "),
      })),
      none: pt.none,
      online: pt.online,
      url: opts.passportUrl,
      qr: await QRCode.toDataURL(opts.passportUrl, { margin: 1, width: 300 }),
      made: pt.made.replace("{d}", date(new Date().toISOString().slice(0, 10))),
      failed: pt.failed,
    },
    docs: docs.map((d) => ({ label: t.docTypes[d.doc_type], url: opts.urlOf(d.file_path), mime: d.mime_type, lines: lines(d) })),
    fileName: `ZZP-paspoort-${slug}.pdf`,
  };
}
