import type { Lang } from "@/lib/i18n";
import { en } from "./en";
import { nl } from "./nl";
import { pl } from "./pl";
import { ro } from "./ro";
import { ru } from "./ru";
import { tr } from "./tr";
import { GUIDE_IDS, type GuideId, type HelpTexts } from "./types";
import { uk } from "./uk";

export { GUIDE_IDS, type GuideId, type HelpTexts };

const TEXTS: Record<Lang, HelpTexts> = { pl, ro, uk, ru, tr, en, nl };

export function getHelp(lang: Lang): HelpTexts {
  return TEXTS[lang] ?? TEXTS.en;
}

// Where each guide leads, its icon, and which pages open it from the «?» button.
export const GUIDE_META: Record<GuideId, { icon: string; href: string; paths: string[] }> = {
  profile: { icon: "👤", href: "/dashboard/profile", paths: ["/dashboard/profile", "/dashboard/onboarding"] },
  feed: { icon: "📰", href: "/dashboard/leads/feed", paths: ["/dashboard/leads", "/dashboard/search", "/dashboard/replies"] },
  notify: { icon: "🔔", href: "/dashboard/settings#notify", paths: [] },
  passport: { icon: "🪪", href: "/dashboard/passport", paths: ["/dashboard/passport", "/dashboard/works"] },
  quotes: { icon: "📝", href: "/dashboard/quotes", paths: ["/dashboard/quotes"] },
  orders: { icon: "🧰", href: "/dashboard/orders", paths: ["/dashboard/orders"] },
  materials: { icon: "🧱", href: "/dashboard/materials", paths: ["/dashboard/materials"] },
  invoices: { icon: "🧾", href: "/dashboard/invoices", paths: ["/dashboard/invoices"] },
  accountant: { icon: "📁", href: "/dashboard/accountant", paths: ["/dashboard/accountant"] },
  trips: { icon: "🚗", href: "/dashboard/trips", paths: ["/dashboard/trips", "/dashboard/cards"] },
  reviews: { icon: "⭐", href: "/dashboard/reviews", paths: ["/dashboard/reviews"] },
  helpers: { icon: "👷", href: "/dashboard/helpers", paths: ["/dashboard/helpers"] },
  plan: { icon: "⚙️", href: "/dashboard/settings", paths: ["/dashboard/settings", "/dashboard/plan", "/dashboard/password"] },
};

export function isGuideId(value: string): value is GuideId {
  return (GUIDE_IDS as readonly string[]).includes(value);
}

// The guide for the page the builder is on, or null (home, help itself) for the list of all guides.
export function guideForPath(path: string): GuideId | null {
  for (const id of GUIDE_IDS) {
    if (GUIDE_META[id].paths.some((p) => path === p || path.startsWith(`${p}/`))) return id;
  }
  return null;
}
