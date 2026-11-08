// Construction vacancies (ZZP and staff jobs) from Google Jobs, read through Treg -> DataForSEO
// ($0.0012 per search of 20 jobs). Every hour the cron posts the searches; DataForSEO sends each
// result to /api/vacancies/postback within about a minute, and new jobs go to the feed at once.
// Needs TREG_TOKEN in the environment; without it nothing is searched.
// We keep the title, company, place, rate and the link to the original ad, never the ad's text.

import { createHash } from "crypto";
import type { Lang } from "@/lib/i18n";
import { TRADE_LABELS, workerTrades } from "@/lib/feed";
import { cityCoords } from "@/lib/worker-profile";
import { gemeentePlace } from "./geo";
import { COLLECT_LANGS, type CollectedItem } from "./types";

const TREG_POST = "https://treg.to/call/dataforseo.x.serp-google-jobs-task-post";
const KEEP_DAYS = 21;

// One search per kind of building work in the whole country.
// `trade` is the feed trade key when the search word itself says it.
export const VACANCY_SEARCHES: { q: string; trade?: string }[] = [
  { q: "tegelzetter", trade: "tegelzetter" },
  { q: "timmerman", trade: "timmerman" },
  { q: "stukadoor", trade: "stukadoor" },
  { q: "schilder bouw", trade: "schilder" },
  { q: "loodgieter", trade: "loodgieter" },
  { q: "elektricien", trade: "elektricien" },
  { q: "metselaar", trade: "metselaar" },
  { q: "dakdekker", trade: "dakdekker" },
  { q: "klusjesman", trade: "klusjesman" },
  { q: "bouwvakker", trade: "aannemer" },
  { q: "grondwerker", trade: "aannemer" },
  { q: "steigerbouwer", trade: "aannemer" },
  { q: "betonvlechter", trade: "aannemer" },
  { q: "vloerenlegger", trade: "timmerman" },
  { q: "installatiemonteur", trade: "loodgieter" },
  { q: "voeger", trade: "metselaar" },
  { q: "zzp bouw" },
  { q: "zzp timmerman", trade: "timmerman" },
  { q: "zzp tegelzetter", trade: "tegelzetter" },
  { q: "zzp schilder", trade: "schilder" },
];

export type GoogleJob = {
  type?: string;
  job_id?: string;
  title?: string;
  employer_name?: string | null;
  location?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  salary?: string | null;
  contract_type?: string | null;
  timestamp?: string | null;
  time_ago?: string | null;
};

// Office jobs, internships and managers are no work for a builder on site.
const OFFICE =
  /projectleider|projectmanager|project\s*manager|projectdirecteur|realisatiemanager|conceptontwikkelaar|werkvoorbereider|werkorganisator|calculator|tekenaar|engineer|adviseur|manager|planner|inkoper|commercieel|verkoper|binnendienst|recruiter|docent|stage|afstudeer|trainee|teamleider|directeur|coördinator|coordinator|kunstschilder/i;
const FREELANCE = /\bzzp|zelfstandig|freelance|onderaannem|op\s+contractbasis/i;

// Bureaus that place builders: shown with a mark «через бюро», since Haaks promises no intermediaries.
const BUREAU =
  /recruit|uitzend|detach|flex|personeel|staff|bemiddel|werving|interim|talent|\bjobs?\b|vacature|meestersgilde|fleox|ymatch|vnom|randstad|tempo-team|adecco|manpower|olympia|start ?people|covebo|\botto\b|continu|bureau techniek|building heroes/i;

export function isBureau(name: string | null | undefined) {
  return !!name && BUREAU.test(name);
}

// Secret part of the postback address, made from CRON_SECRET (no extra setting needed).
export function postbackKey() {
  const secret = process.env.CRON_SECRET;
  return secret ? createHash("sha256").update(`vacancies:${secret}`).digest("hex").slice(0, 32) : null;
}

// Ask Google Jobs for all searches at once; the answers come to the postback address.
export async function postVacancySearches(site: string) {
  const token = process.env.TREG_TOKEN;
  const key = postbackKey();
  if (!token || !key) return { posted: 0, error: "TREG_TOKEN or CRON_SECRET not set" };
  const postback = `${site}/api/vacancies/postback?key=${key}&tag=$tag`;
  const tasks = VACANCY_SEARCHES.map((s, i) => ({
    keyword: s.q,
    location_name: "Netherlands",
    language_code: "nl",
    depth: 20,
    tag: String(i),
    postback_url: postback,
    postback_data: "advanced",
  }));
  const res = await fetch(TREG_POST, {
    method: "POST",
    headers: { "x-treg-token": token, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(tasks),
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  if (!res.ok) return { posted: 0, error: `Treg ${res.status}: ${text.slice(0, 200)}` };
  const body = JSON.parse(text) as { tasks?: { status_code?: number; status_message?: string }[] };
  const ok = (body.tasks ?? []).filter((t) => t.status_code === 20100).length;
  const failed = (body.tasks ?? []).filter((t) => t.status_code !== 20100).map((t) => t.status_message);
  return { posted: ok, ...(failed.length ? { error: failed.slice(0, 3).join("; ") } : {}) };
}

// "8 dagen geleden", "3 uur geleden", "2 weken geleden" -> days ago; null when unknown.
function daysAgoText(text: string | null | undefined) {
  const m = /(\d+)\+?\s*(minuut|minuten|uur|uren|dag|dagen|week|weken|maand|maanden)/i.exec(text ?? "");
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("minu") || unit.startsWith("uur") || unit.startsWith("uren")) return 0;
  if (unit.startsWith("dag")) return n;
  if (unit.startsWith("week")) return n * 7;
  return n * 30;
}

// The rate stays in Dutch ("per uur"), as builders see it on every Dutch job site.
// Google shows "€ 36-€ 42 per maand" for what is an hourly rate: below €200 it is per hour.
function rateText(raw: string | null | undefined) {
  if (!raw) return null;
  const clean = raw.replace(/ /g, " ").replace(/\s+/g, " ").trim();
  if (/mln|miljoen/i.test(clean)) return null;
  const amounts = [...clean.matchAll(/€\s?([\d.,]+)\s?(K)?/gi)].map((m) => {
    const digits = m[2] ? m[1].replace(",", ".") : m[1].replace(/\./g, "").replace(",", ".");
    return Math.round(Number(digits) * (m[2] ? 1000 : 1) * 100) / 100;
  });
  if (!amounts.length || amounts.some((a) => !Number.isFinite(a))) return null;
  const range = amounts.map((a) => `€${a.toLocaleString("nl-NL")}`).join("–");
  if (amounts[0] < 200 || /uur|hour/i.test(clean)) return `${range} per uur`;
  return /maand|month/i.test(clean) ? `${range} per maand` : /jaar|year/i.test(clean) ? `${range} per jaar` : range;
}

function cleanCity(location: string | null | undefined) {
  const city = (location ?? "").replace(/\(.*?\)/g, "").split(",")[0].trim();
  return !city || /^(nederland|netherlands|heel nederland|anywhere|op afstand)$/i.test(city) ? null : city;
}

async function placeOf(city: string | null) {
  if (!city) return null;
  const known = cityCoords(city);
  if (known) return { ...known, gemeente: city };
  const geo = await gemeentePlace(city).catch(() => null);
  return geo ? { lat: geo.lat, lng: geo.lng, gemeente: geo.gemeente ?? city } : null;
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

const TEXTS: Record<Lang, { title: string; builder: string; firm: string; bureau: string; zzp: string; staff: string; more: string }> = {
  nl: { builder: "bouwvakker", title: "Vacature", firm: "Bedrijf", bureau: "via bureau", zzp: "Voor zzp'ers.", staff: "In loondienst.", more: "Reageren via de vacaturesite." },
  en: { builder: "construction worker", title: "Job", firm: "Company", bureau: "through an agency", zzp: "For ZZP (self-employed).", staff: "Employed job.", more: "Apply on the job site." },
  ru: { builder: "строитель", title: "Вакансия", firm: "Компания", bureau: "через бюро", zzp: "Для ZZP.", staff: "Работа в штат.", more: "Отклик — на сайте вакансии." },
  uk: { builder: "будівельник", title: "Вакансія", firm: "Компанія", bureau: "через бюро", zzp: "Для ZZP.", staff: "Робота в штат.", more: "Відгук — на сайті вакансії." },
  pl: { builder: "budowlaniec", title: "Oferta pracy", firm: "Firma", bureau: "przez biuro", zzp: "Dla ZZP.", staff: "Praca na etat.", more: "Zgłoszenie na stronie oferty." },
  ro: { builder: "muncitor în construcții", title: "Loc de muncă", firm: "Firmă", bureau: "prin agenție", zzp: "Pentru ZZP.", staff: "Angajare cu contract.", more: "Aplici pe site-ul anunțului." },
  tr: { builder: "inşaat işçisi", title: "İş ilanı", firm: "Firma", bureau: "aracı büro ile", zzp: "ZZP için.", staff: "Kadrolu iş.", more: "Başvuru ilan sitesinde." },
};

// One Google Jobs answer -> feed items (only building work on site, not older than 3 weeks).
export async function vacancyItems(jobs: GoogleJob[], trade?: string): Promise<CollectedItem[]> {
  const out: CollectedItem[] = [];
  for (const job of jobs) {
    if (job.type && job.type !== "google_jobs_item") continue;
    const title = (job.title ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
    if (!title || !job.source_url || OFFICE.test(title) || /stage|intern/i.test(job.contract_type ?? "")) continue;
    const trades = [...new Set([...workerTrades(title), ...(trade ? [trade] : [])])];
    if (!trades.length) {
      // A general search ("zzp bouw"): keep only titles that name building work.
      if (!/bouw|vakman|aannemer|renovatie|onderhoud/i.test(title)) continue;
      trades.push("aannemer");
    }
    const stamp = job.timestamp ? Date.parse(job.timestamp.replace(" +00:00", "Z").replace(" ", "T")) : NaN;
    const days = Number.isFinite(stamp) ? (Date.now() - stamp) / 86400000 : daysAgoText(job.time_ago);
    if (days !== null && days > KEEP_DAYS) continue;
    // Unknown date: not shown as brand new.
    const published = new Date(Number.isFinite(stamp) ? stamp : Date.now() - (days ?? 3) * 86400000);
    const company = (job.employer_name ?? "").replace(/^confidential$/i, "").trim();
    const via = (job.source_name ?? "").replace(/^via\s+/i, "").trim();
    // «via» is usually just the job site, so it counts only when the employer is unknown.
    const bureau = company ? isBureau(company) : isBureau(via);
    const zzp = FREELANCE.test(`${title} ${job.contract_type ?? ""}`);
    const city = cleanCity(job.location);
    const place = await placeOf(city);
    const rate = rateText(job.salary);

    const translations: CollectedItem["translations"] = {};
    for (const lang of COLLECT_LANGS) {
      const t = TEXTS[lang];
      const work = trades.map((k) => (k === "aannemer" ? t.builder : (TRADE_LABELS[k]?.[lang] ?? k))).join(", ");
      translations[lang] = {
        title: lang === "nl" ? title : `${t.title}${zzp ? " ZZP" : ""}: ${work}${city ? `, ${city}` : ""}`,
        summary: [
          lang === "nl" ? "" : `«${title}».`,
          zzp ? t.zzp : t.staff,
          company || via ? `${t.firm}: ${company || via}${bureau ? ` (${t.bureau})` : ""}.` : "",
          t.more,
        ]
          .filter(Boolean)
          .join(" "),
      };
    }
    out.push({
      source: "googlejobs",
      source_name: company || via || null,
      source_url: job.source_url,
      kind: "business",
      title,
      summary: translations.nl!.summary,
      translations,
      trades,
      city,
      region: place?.gemeente ?? city,
      postcode: null,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      timing: zzp ? "ZZP" : null,
      budget: rate,
      contact: null,
      published_at: published.toISOString(),
      expires_at: new Date(published.getTime() + 30 * 86400000).toISOString(),
      // The same job is often posted on several sites: one card per title + company + city.
      fingerprint: `googlejobs-${norm(`${title} ${company || via} ${city ?? ""}`).slice(0, 180)}`,
    });
  }
  return out;
}
