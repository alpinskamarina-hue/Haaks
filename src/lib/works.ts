// "Completed work": one finished job in a builder's portfolio, with before/after photos.
import type { Lang } from "@/lib/i18n";
import { TRADES } from "@/lib/worker-profile";

export const MAX_BEFORE = 3;
export const MAX_AFTER = 6;

export type Work = {
  id: string;
  user_id: string;
  order_id: string | null;
  title: string;
  description: string | null;
  trade: string | null;
  city: string | null;
  done_on: string | null;
  photos_before: string[];
  photos_after: string[];
  created_at: string;
};

export type WorkInput = {
  id?: string;
  order_id?: string | null;
  title: string;
  description: string;
  trade: string;
  city: string;
  month: string; // yyyy-mm or ""
  photos_before: string[];
  photos_after: string[];
};

const LOCALES: Record<Lang, string> = { ru: "ru-RU", uk: "uk-UA", pl: "pl-PL", ro: "ro-RO", tr: "tr-TR", en: "en-GB", nl: "nl-NL" };

// "September 2026" in the reader's language.
export function monthLabel(doneOn: string | null, lang: Lang) {
  if (!doneOn) return "";
  return new Intl.DateTimeFormat(LOCALES[lang], { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${doneOn}T00:00:00Z`));
}

// Checks and trims what the form sent; paths must be the builder's own work photos.
export function cleanWorkInput(input: WorkInput, userId: string) {
  const own = (list: unknown, max: number) =>
    (Array.isArray(list) ? list : [])
      .filter((p): p is string => typeof p === "string" && p.startsWith(`${userId}/work/`) && !p.includes(".."))
      .slice(0, max);
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const month = text(input.month, 7);
  return {
    title: text(input.title, 100),
    description: text(input.description, 600) || null,
    trade: (TRADES as readonly string[]).includes(String(input.trade)) ? String(input.trade) : null,
    city: text(input.city, 80) || null,
    done_on: /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? `${month}-01` : null,
    photos_before: own(input.photos_before, MAX_BEFORE),
    photos_after: own(input.photos_after, MAX_AFTER),
  };
}
