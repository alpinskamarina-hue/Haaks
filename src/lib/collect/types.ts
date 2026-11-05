import type { Lang } from "@/lib/i18n";

// One job as the collectors write it into feed_items.
export type CollectedItem = {
  source: "bekendmakingen" | "tenderned";
  source_name: string;
  source_url: string;
  kind: "permit" | "tender";
  title: string;
  summary: string;
  translations: Partial<Record<Lang, { title: string; summary: string }>>;
  trades: string[];
  city: string | null;
  region: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  timing: string | null;
  budget: string | null;
  contact: string | null;
  published_at: string;
  // Tenders: the day after the closing date; the feed hides the item then.
  expires_at?: string | null;
  fingerprint: string;
};

export const COLLECT_LANGS: Lang[] = ["nl", "en", "ru", "uk", "pl", "ro", "tr"];

export function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}
