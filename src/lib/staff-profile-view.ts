import { getDict, type Lang } from "@/lib/i18n";
import type { StaffDocChange } from "@/lib/staff-passport";
import { PROFILE_FIELDS, type StaffProfileChange } from "@/lib/staff-profile";
import type { StaffProfileDict } from "@/lib/staff-profile-i18n";
import { getWorkerDict, radiusText, yearsText } from "@/lib/worker-profile-text";

export type ProfileRow = { label: string; before: string | null; after: string };

// The profile card's rows in the worker's language: field, what was there, what will be saved.
export function profileRows(change: StaffProfileChange, lang: Lang, d: StaffProfileDict): ProfileRow[] {
  const w = getWorkerDict(lang);
  const names = (map: Record<string, string>, v: unknown) => (Array.isArray(v) ? v.map((x) => map[x] ?? String(x)).join(", ") : null);
  const show = (f: string, v: unknown): string | null => {
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length)) return null;
    switch (f) {
      case "trades": return names(w.trades, v);
      case "languages": return names(w.spoken, v);
      case "equipment": return names(w.equipment, v);
      case "vehicle": return w.vehicle[v as keyof typeof w.vehicle] ?? String(v);
      case "tools": return w.tools[v as keyof typeof w.tools] ?? String(v);
      case "works_with": return w.worksWith[v as keyof typeof w.worksWith] ?? String(v);
      case "travel_km": return radiusText(w, Number(v));
      case "hourly_rate": return w.perHour.replace("{n}", String(v));
      case "experience_years": return yearsText(w, lang, Number(v));
      default: return Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? d.yes : String(v);
    }
  };
  return PROFILE_FIELDS.flatMap((f) => {
    if (!(f in change.changes)) return [];
    const after = show(f, change.changes[f]);
    const before = show(f, change.before?.[f]);
    return after && after !== before ? [{ label: d.fields[f], before, after }] : [];
  });
}

export type DocView = { kind: string; rows: { label: string; value: string }[]; summary: string; warnings: string[]; fills: string[]; remind: boolean };

// The passport card in the worker's language: document type, read fields, warnings.
export function docView(c: StaffDocChange, lang: Lang, d: StaffProfileDict): DocView {
  const t = getDict(lang);
  const date = (v: string) => v.split("-").reverse().join(".");
  const rows = [
    c.holder_name && { label: d.fields.full_name, value: c.holder_name },
    c.document_number && { label: t.number, value: c.document_number },
    c.issued_on && { label: t.issued, value: date(c.issued_on) },
    c.expires_on && { label: t.expires, value: date(c.expires_on) },
    c.insurer && { label: t.insurer, value: c.insurer },
    c.coverage_amount && { label: t.coverage, value: c.coverage_amount },
  ].filter((r): r is { label: string; value: string } => !!r);
  const fills = (["company_name", "kvk_number", "btw_number"] as const).flatMap((f) => (c.profile?.[f] ? [`${d.fields[f]}: ${c.profile[f]}`] : []));
  const remind = !!c.expires_on && new Date(c.expires_on).getTime() - 30 * 86400000 > Date.now();
  return { kind: t[`docType_${c.doc_type}`], rows, summary: c.summary, warnings: c.warnings ?? [], fills, remind };
}
