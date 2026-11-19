// Site analytics helpers: where a visitor came from, and paths without private tokens.

const OWN = /(^|\.)haaks(-nl)?\.vercel\.app$|(^|\.)haaks\.nl$|^localhost$/;

// Known sources, in the order they are checked. The value is shown on the admin page.
const SOURCES: [RegExp, string][] = [
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)yandex\./, "yandex"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/, "telegram"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(viber\.com)$/, "viber"],
  [/(^|\.)(marktplaats\.nl)$/, "marktplaats"],
  [/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai)$/, "ai"],
];
const UTM: Record<string, string> = { fb: "facebook", ig: "instagram", wa: "whatsapp", tg: "telegram" };

export function refHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

export const isOwnHost = (host: string | null) => !!host && OWN.test(host);

// The source of an entry: utm/ref tag first, then the referrer, then "direct" (or "share" for shared job links).
export function sourceOf(host: string | null, utmSource: string | null, path: string): string {
  if (utmSource) {
    const s = utmSource.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
    if (s) return UTM[s] ?? s;
  }
  if (host && !isOwnHost(host)) {
    for (const [re, name] of SOURCES) if (re.test(host)) return name;
    return host.slice(0, 40);
  }
  if (path.startsWith("/job/") || path.startsWith("/p/") || path.startsWith("/u/") || path.startsWith("/@")) return "share";
  return "direct";
}

// Public pages carry private tokens and ids in the path; keep only their kind.
export function cleanPath(path: string): string {
  const p = path.split(/[?#]/)[0].slice(0, 200) || "/";
  return p
    .replace(/^\/(p|q|f|m|r|klus|uren|a)\/[^/]+/, "/$1/…")
    .replace(/^\/(job|u)\/[^/]+/, "/$1/…")
    .replace(/^\/@[^/]+/, "/@…")
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/…");
}

export const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|vercel|facebookexternalhit|whatsapp\/|telegrambot|python|curl|wget/i;

export const SOURCE_LABELS: Record<string, string> = {
  google: "🔍 Google",
  bing: "🔍 Bing",
  duckduckgo: "🔍 DuckDuckGo",
  yandex: "🔍 Yandex",
  facebook: "📘 Facebook",
  instagram: "📸 Instagram",
  whatsapp: "💬 WhatsApp",
  telegram: "✈️ Telegram",
  linkedin: "💼 LinkedIn",
  tiktok: "🎵 TikTok",
  youtube: "▶️ YouTube",
  viber: "💜 Viber",
  marktplaats: "🛒 Marktplaats",
  ai: "🤖 ChatGPT / ИИ",
  direct: "🔗 Прямой заход",
  share: "↗ Поделились ссылкой",
};
