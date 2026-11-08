// «Предложить себя» in «Фирмы рядом»: a ready Dutch intro from the builder's profile, sent through the
// builder's own WhatsApp or e-mail (Haaks sends nothing itself), and the firm's e-mail from its website.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lang } from "@/lib/i18n";
import { getWorkerDict } from "@/lib/worker-profile-text";

export type OfferProfile = {
  full_name: string | null;
  phone: string | null;
  city: string | null;
  trades: string[] | null;
  hourly_rate: number | string | null;
  available: boolean | null;
  available_from: string | null;
  passport_token: string | null;
  passport_enabled: boolean | null;
  username: string | null;
};

export type OfferLinks = { passport: string | null; page: string | null };

export function offerLinks(p: OfferProfile, site: string): OfferLinks {
  const open = Boolean(p.passport_enabled && p.passport_token);
  return {
    passport: open ? `${site}/p/${p.passport_token}` : null,
    page: open && p.username ? `${site}/@${p.username}` : null,
  };
}

function tradeNames(p: OfferProfile, lang: Lang) {
  const names = getWorkerDict(lang).trades as Record<string, string>;
  return (p.trades ?? []).filter((t) => t !== "other").slice(0, 2).map((t) => (names[t] ?? t).toLowerCase());
}

// Only a future date is worth naming; otherwise "direct beschikbaar".
function fromDate(p: OfferProfile, lang: Lang) {
  if (!p.available_from) return null;
  const d = new Date(`${p.available_from}T12:00:00`);
  if (Number.isNaN(d.getTime()) || d.getTime() < Date.now()) return null;
  const locale = { nl: "nl-NL", en: "en-GB", ru: "ru-RU", uk: "uk-UA", pl: "pl-PL", ro: "ro-RO", tr: "tr-TR" }[lang];
  return d.toLocaleDateString(locale, { day: "numeric", month: "long" });
}

const rateOf = (p: OfferProfile) => {
  const n = Number(p.hourly_rate);
  return n > 0 ? String(Math.round(n * 100) / 100).replace(".", ",") : null;
};

// The message the firm reads, always in Dutch.
export function offerTextNl(p: OfferProfile, links: OfferLinks) {
  const name = p.full_name?.trim() || "";
  const trades = tradeNames(p, "nl");
  const what = trades.length ? `zelfstandig ${trades.join(" en ")} (ZZP)` : "zelfstandig vakman in de bouw (ZZP)";
  const from = fromDate(p, "nl");
  const rate = rateOf(p);
  const lines = [
    "Goedendag,",
    "",
    `${name ? `Mijn naam is ${name}, ` : "Ik ben "}${what}${p.city ? ` uit ${p.city}` : ""}. Ik zoek werk als onderaannemer${
      from ? ` en ben beschikbaar vanaf ${from}` : p.available === false ? "" : " en ben direct beschikbaar"
    }${rate ? `, tarief € ${rate} per uur` : ""}.`,
  ];
  if (links.passport || links.page) {
    lines.push("");
    if (links.passport) lines.push(`Mijn documenten (KvK, VCA, verzekering): ${links.passport}`);
    if (links.page) lines.push(`Mijn werk en reviews: ${links.page}`);
  }
  lines.push("", "Heeft u werk voor mij? Ik hoor graag van u.", "", "Met vriendelijke groet,");
  if (name) lines.push(name);
  if (p.phone) lines.push(p.phone);
  return lines.join("\n");
}

// Values for the short meaning of the message in the builder's own language.
export function gistValues(p: OfferProfile, lang: Lang) {
  return { trade: tradeNames(p, lang).join(", "), city: p.city ?? "", from: fromDate(p, lang) ?? "", rate: rateOf(p) ?? "" };
}
export type GistValues = ReturnType<typeof gistValues>;

// Dutch mobile numbers (06… / +316…) can get a WhatsApp message.
export function waNumber(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
  if (/^06\d{8}$/.test(digits)) return `31${digits.slice(1)}`;
  if (/^316\d{8}$/.test(digits)) return digits;
  return null;
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const JUNK = /\.(png|jpe?g|gif|webp|svg)$|@(sentry|wixpress|example|domain)\.|^(no-?reply|noreply)@/i;

function pickEmail(html: string, host: string) {
  const found = [...new Set((html.match(EMAIL) ?? []).map((e) => e.toLowerCase()))].filter((e) => !JUNK.test(e));
  if (!found.length) return null;
  const base = host.replace(/^www\./, "");
  return found.find((e) => e.endsWith(`@${base}`)) ?? found.find((e) => /^(info|contact|mail|kantoor|offerte)@/.test(e)) ?? found[0];
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(5000),
    headers: { "user-agent": "Mozilla/5.0 (compatible; Haaks)", accept: "text/html" },
  });
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return "";
  return (await res.text()).slice(0, 600_000);
}

// Looks once on the firm's website (home page, then a contact page) and stores what it finds.
export async function lookupFirmEmail(server: SupabaseClient, firm: { id: string; website: string | null }) {
  let email: string | null = null;
  try {
    const site = firm.website ? new URL(firm.website) : null;
    if (site && /^https?:$/.test(site.protocol)) {
      const home = await fetchText(site.toString());
      email = pickEmail(home, site.hostname);
      if (!email) {
        const contact = home.match(/href="([^"]*contact[^"]*)"/i)?.[1];
        const next = contact ? new URL(contact, site) : new URL("/contact", site);
        if (next.hostname.replace(/^www\./, "") === site.hostname.replace(/^www\./, "")) {
          email = pickEmail(await fetchText(next.toString()), site.hostname);
        }
      }
    }
  } catch {
    // Unreachable site: remember that we looked.
  }
  await server.from("nearby_firms").update({ email, email_checked_at: new Date().toISOString() }).eq("id", firm.id);
  return email;
}
