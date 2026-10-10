export const DOC_TYPES = ["kvk_extract", "vca", "avb", "car", "other"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  trade: string | null;
  city: string | null;
  phone: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  business_address?: string | null;
  business_email?: string | null;
  iban?: string | null;
  language: string;
  passport_token: string;
  passport_enabled: boolean;
};

export type DocumentRow = {
  id: string;
  user_id: string;
  doc_type: DocType;
  file_path: string;
  file_name: string;
  mime_type: string;
  document_number: string | null;
  holder_name: string | null;
  issued_on: string | null;
  expires_on: string | null;
  insurer: string | null;
  coverage_amount: string | null;
  ai_summary: string | null;
  ai_warnings: string[];
  ai_status: "pending" | "done" | "failed" | "skipped";
  show_in_passport: boolean;
  created_at: string;
};

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const DAY = 24 * 60 * 60 * 1000;

export type DocStatus = "valid" | "expires_soon" | "expired" | "kvk_old";

// Contractors usually accept a KvK extract of at most three months old.
export function docStatus(doc: Pick<DocumentRow, "doc_type" | "issued_on" | "expires_on">, now = new Date()): DocStatus {
  if (doc.expires_on) {
    const left = new Date(doc.expires_on).getTime() - now.getTime();
    if (left < 0) return "expired";
    if (left < 30 * DAY) return "expires_soon";
  }
  if (doc.doc_type === "kvk_extract" && doc.issued_on) {
    if (now.getTime() - new Date(doc.issued_on).getTime() > 90 * DAY) return "kvk_old";
  }
  return "valid";
}

export const REQUIREMENTS = ["kvk_number", "btw_number", "kvk_extract", "vca", "avb"] as const;
export type Requirement = (typeof REQUIREMENTS)[number];

// What a worker needs before most construction sites let them in.
export function readiness(profile: Profile, docs: DocumentRow[]): Record<Requirement, boolean> {
  const hasValid = (type: DocType) =>
    docs.some((d) => d.doc_type === type && docStatus(d) !== "expired");
  return {
    kvk_number: Boolean(profile.kvk_number),
    btw_number: Boolean(profile.btw_number),
    kvk_extract: hasValid("kvk_extract"),
    vca: hasValid("vca"),
    avb: hasValid("avb"),
  };
}

export function kvkSearchUrl(kvk: string) {
  return `https://www.kvk.nl/zoeken/?source=all&q=${encodeURIComponent(kvk)}`;
}

export const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/";
export const VCA_REGISTER_URL = "https://cdr.ssvv.nl/";
