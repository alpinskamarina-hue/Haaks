import type Anthropic from "@anthropic-ai/sdk";
import { DOC_TYPES, docStatus, type DocType } from "@/lib/documents";
import { cleanDate } from "@/lib/extract";

// Step 2 of «Сотрудник сам заполняет данные»: the worker sends a photo of a KvK extract, VCA
// certificate or AVB/CAR policy in the chat; the employee reads it and prepares a passport card.
export const STAFF_PASSPORT_TOOL: Anthropic.Tool = {
  name: "add_to_passport",
  description:
    "Prepare adding the document on the worker's latest photo to their ZZP passport (KvK extract, VCA certificate, AVB or CAR insurance). Shown as a card with the read fields and an «Add to passport» button; nothing is saved until they tap it. Only what is printed on the document; null when missing. Never for ID cards, passports, driving licences or bank cards.",
  input_schema: {
    type: "object",
    properties: {
      doc_type: { type: "string", enum: [...DOC_TYPES], description: "kvk_extract, vca, avb (bedrijfsaansprakelijkheid), car (Construction All Risks), other" },
      holder_name: { type: ["string", "null"] },
      document_number: { type: ["string", "null"], description: "Certificate or policy number" },
      issued_on: { type: ["string", "null"], description: "YYYY-MM-DD; for a KvK extract the extract date" },
      expires_on: { type: ["string", "null"], description: "YYYY-MM-DD; end of validity or of the insurance period" },
      insurer: { type: ["string", "null"] },
      coverage_amount: { type: ["string", "null"], description: "e.g. € 2.500.000 per aanspraak" },
      company_name: { type: ["string", "null"], description: "KvK extract: handelsnaam" },
      kvk_number: { type: ["string", "null"], description: "KvK extract: 8 digits" },
      btw_number: { type: ["string", "null"], description: "btw-id if printed" },
      summary: { type: "string", description: "One or two plain sentences about the document, in the worker's language" },
      warnings: { type: "array", items: { type: "string" }, description: "In the worker's language: expired, unreadable, KvK extract older than 3 months, wrong document…" },
    },
    required: ["doc_type", "summary"],
  },
};

export type StaffDocChange = {
  type: "document";
  doc_type: DocType;
  image_path: string;
  holder_name: string | null;
  document_number: string | null;
  issued_on: string | null;
  expires_on: string | null;
  insurer: string | null;
  coverage_amount: string | null;
  summary: string;
  warnings: string[];
  // Empty profile fields a KvK extract fills (never overwrites what the worker typed).
  profile: { company_name?: string; kvk_number?: string; btw_number?: string };
};

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.replace(/\s+/g, " ").trim().slice(0, max) : null);

export function toDocChange(raw: unknown, imagePath: string, current: { company_name?: unknown; kvk_number?: unknown; btw_number?: unknown }): StaffDocChange | null {
  const a = (raw ?? {}) as Record<string, unknown>;
  const docType = (DOC_TYPES as readonly string[]).includes(String(a.doc_type)) ? (a.doc_type as DocType) : null;
  if (!docType) return null;
  const profile: StaffDocChange["profile"] = {};
  if (docType === "kvk_extract") {
    const company = str(a.company_name, 120);
    const kvk = str(a.kvk_number, 20)?.replace(/\D/g, "");
    const btw = str(a.btw_number, 20)?.replace(/[\s.]/g, "").toUpperCase();
    if (company && !current.company_name) profile.company_name = company;
    if (kvk && /^\d{8}$/.test(kvk) && !current.kvk_number) profile.kvk_number = kvk;
    if (btw && /^NL\d{9}B\d{2}$/.test(btw) && !current.btw_number) profile.btw_number = btw;
  }
  return {
    type: "document",
    doc_type: docType,
    image_path: imagePath,
    holder_name: str(a.holder_name, 120),
    document_number: str(a.document_number, 60),
    issued_on: cleanDate(str(a.issued_on, 10)),
    expires_on: cleanDate(str(a.expires_on, 10)),
    insurer: str(a.insurer, 120),
    coverage_amount: str(a.coverage_amount, 80),
    summary: str(a.summary, 400) ?? "",
    warnings: Array.isArray(a.warnings) ? a.warnings.flatMap((w) => (str(w, 200) ? [str(w, 200)!] : [])).slice(0, 4) : [],
    profile,
  };
}

// What the employee knows about the passport: documents, their state, and what is missing.
export function passportState(docs: { doc_type: string; issued_on: string | null; expires_on: string | null }[]) {
  const shown = docs.map((d) => {
    const s = docStatus(d as { doc_type: DocType; issued_on: string | null; expires_on: string | null });
    return `${d.doc_type}${d.expires_on ? ` valid until ${d.expires_on}` : ""}${d.issued_on && d.doc_type === "kvk_extract" ? ` dated ${d.issued_on}` : ""} (${s})`;
  });
  const has = (t: string) => docs.some((d) => d.doc_type === t && docStatus(d as { doc_type: DocType; issued_on: string | null; expires_on: string | null }) !== "expired");
  const missing = ["kvk_extract", "vca", "avb"].filter((t) => !has(t));
  return `ZZP passport documents: ${shown.join("; ") || "none"}.\nMissing for a full passport (valid): ${missing.join(", ") || "nothing"}.`;
}
