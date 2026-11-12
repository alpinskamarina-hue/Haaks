import type { Lang } from "@/lib/i18n";
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
