import type { Lang } from "@/lib/i18n";

// One job in the order feed, as feed_for_me() returns it to the signed-in worker.
export type FeedItem = {
  id: string;
  source: "telegram" | "bekendmakingen" | "email" | "tenderned" | "haaks" | null;
  source_name: string | null;
  source_url: string | null;
  kind: "private" | "business" | "permit" | "tender";
  title: string | null;
  summary: string | null;
  translations: Partial<Record<Lang, { title?: string; summary?: string }>>;
  trades: string[];
  city: string | null;
  timing: string | null;
  budget: string | null;
  contact: string | null;
  published_at: string;
  is_demo: boolean;
  // Newer than 24 hours for a free worker: only city and trades are known.
  locked: boolean;
};

export type FeedEmailMode = "off" | "daily" | "instant";

// Dutch trade keys stored on feed items, and words that point to them in the
// free-text "trade" field of a worker's profile (any of the cabinet languages).
const TRADE_WORDS: Record<string, string[]> = {
  tegelzetter: ["tegel", "tile", "tiling", "плит", "кафел", "плитк", "glazur", "płyt", "plytk", "faian", "gresie"],
  timmerman: ["timmer", "carpent", "joiner", "плотн", "столяр", "тесл", "cieśl", "ciesl", "stolarz", "tâmplar", "tamplar", "dulgher", "laminat", "ламинат", "ламінат", "vloer"],
  stukadoor: ["stuka", "plaster", "штукат", "tynk", "ipsos", "tencuial"],
  schilder: ["schilder", "painter", "маляр", "malarz", "zugrav", "zugrăv", "vopsit"],
  loodgieter: ["loodgiet", "plumb", "сантех", "hydraulik", "instalator", "instalat"],
  elektricien: ["elektric", "electric", "электр", "електр", "elektryk"],
  metselaar: ["metsel", "mason", "brick", "камен", "кладк", "мурар", "murarz", "zidar"],
  dakdekker: ["dakdek", "roof", "кровел", "покрів", "dekarz", "acoperi"],
  aannemer: ["aannemer", "contractor", "подряд", "підряд", "budowlan", "construct", "строит", "будів"],
  klusjesman: ["klus", "handyman", "мастер на все", "złota rączka", "zlota raczka"],
};

export const TRADE_LABELS: Record<string, Partial<Record<Lang, string>>> = {
  tegelzetter: { en: "tiler", ru: "плиточник", uk: "плиточник", pl: "glazurnik", ro: "faianțar", nl: "tegelzetter" },
  timmerman: { en: "carpenter", ru: "плотник", uk: "тесляр", pl: "cieśla", ro: "tâmplar", nl: "timmerman" },
  stukadoor: { en: "plasterer", ru: "штукатур", uk: "штукатур", pl: "tynkarz", ro: "tencuitor", nl: "stukadoor" },
  schilder: { en: "painter", ru: "маляр", uk: "маляр", pl: "malarz", ro: "zugrav", nl: "schilder" },
  loodgieter: { en: "plumber", ru: "сантехник", uk: "сантехнік", pl: "hydraulik", ro: "instalator", nl: "loodgieter" },
  elektricien: { en: "electrician", ru: "электрик", uk: "електрик", pl: "elektryk", ro: "electrician", nl: "elektricien" },
  metselaar: { en: "bricklayer", ru: "каменщик", uk: "муляр", pl: "murarz", ro: "zidar", nl: "metselaar" },
  dakdekker: { en: "roofer", ru: "кровельщик", uk: "покрівельник", pl: "dekarz", ro: "acoperișar", nl: "dakdekker" },
  aannemer: { en: "contractor", ru: "подрядчик", uk: "підрядник", pl: "wykonawca", ro: "antreprenor", nl: "aannemer" },
  klusjesman: { en: "handyman", ru: "мастер", uk: "майстер", pl: "złota rączka", ro: "meșter", nl: "klusjesman" },
};

export function tradeLabel(key: string, lang: Lang) {
  return TRADE_LABELS[key]?.[lang] ?? TRADE_LABELS[key]?.en ?? key;
}

// Trade keys a worker's free-text trade points to, e.g. "Tegelzetter" or "плиточник" -> ["tegelzetter"].
export function workerTrades(trade: string | null | undefined) {
  const text = (trade ?? "").toLowerCase();
  if (!text.trim()) return [];
  return Object.entries(TRADE_WORDS)
    .filter(([key, words]) => text.includes(key) || words.some((w) => text.includes(w)))
    .map(([key]) => key);
}

export function workerRegions(regions: string | null | undefined) {
  return (regions ?? "")
    .split(/[,;\n]/)
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
}

// 0-100: trade counts most, then the worker's cities. No distance yet (needs postcodes).
export function feedScore(item: Pick<FeedItem, "trades" | "city">, trades: string[], regions: string[]) {
  const tradeFit = trades.length === 0 ? 0.5 : item.trades.some((t) => trades.includes(t)) ? 1 : 0;
  const city = (item.city ?? "").toLowerCase();
  const regionFit = regions.length === 0 ? 0.5 : city && regions.some((r) => city.includes(r) || r.includes(city)) ? 1 : 0;
  return Math.round(tradeFit * 60 + regionFit * 35 + 5);
}

export function feedText(item: FeedItem, lang: Lang) {
  const local = item.translations[lang];
  return {
    title: local?.title || item.title || "",
    summary: local?.summary || item.summary || "",
  };
}

export function sourceLabel(item: Pick<FeedItem, "source" | "source_name">) {
  const base: Record<NonNullable<FeedItem["source"]>, string> = {
    telegram: "Telegram",
    bekendmakingen: "Omgevingsvergunning",
    email: "E-mail",
    tenderned: "TenderNed",
    haaks: "Haaks",
  };
  if (!item.source) return "";
  const name = item.source_name;
  if (!name || name === base[item.source]) return base[item.source];
  return item.source === "bekendmakingen" || item.source === "tenderned" ? name : `${base[item.source]} · ${name}`;
}

export function timeAgo(iso: string, lang: Lang) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}
