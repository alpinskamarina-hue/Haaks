// ZZP vacancies in construction from Google Jobs, read through Treg (a prepaid data service,
// about $0.015 per search of 10 jobs). Needs TREG_TOKEN in the environment; without it nothing is read.
// We keep the title, a short piece of the text and the link to the original ad, never the whole ad.

import type { Lang } from "@/lib/i18n";
import { TRADE_LABELS, workerTrades } from "@/lib/feed";
import { cityCoords } from "@/lib/worker-profile";
import { gemeentePlace, mapLimit } from "./geo";
import { COLLECT_LANGS, type CollectedItem } from "./types";

const TREG = "https://treg.to/call/serpapi.x.google-jobs";
const KEEP_DAYS = 21;

// One search per trade in the whole country, plus general searches in the biggest cities.
export const VACANCY_SEARCHES: { q: string; location: string; trade?: string }[] = [
  { q: "zzp tegelzetter", location: "Netherlands", trade: "tegelzetter" },
  { q: "zzp timmerman", location: "Netherlands", trade: "timmerman" },
  { q: "zzp stukadoor", location: "Netherlands", trade: "stukadoor" },
  { q: "zzp schilder", location: "Netherlands", trade: "schilder" },
  { q: "zzp loodgieter", location: "Netherlands", trade: "loodgieter" },
  { q: "zzp elektricien", location: "Netherlands", trade: "elektricien" },
  { q: "zzp metselaar", location: "Netherlands", trade: "metselaar" },
  { q: "zzp dakdekker", location: "Netherlands", trade: "dakdekker" },
  { q: "zzp klusjesman", location: "Netherlands", trade: "klusjesman" },
  { q: "zzp bouw", location: "Rotterdam, South Holland, Netherlands" },
  { q: "zzp bouw", location: "Amsterdam, North Holland, Netherlands" },
  { q: "zzp bouw", location: "Utrecht, Utrecht, Netherlands" },
  { q: "zzp bouw", location: "The Hague, South Holland, Netherlands" },
  { q: "zzp bouw", location: "Eindhoven, North Brabant, Netherlands" },
];

type Job = {
  title?: string;
  company_name?: string;
  location?: string;
  via?: string;
  description?: string;
  extensions?: string[];
  detected_extensions?: { posted_at?: string; salary?: string; schedule_type?: string };
  apply_options?: { title?: string; link?: string }[];
  share_link?: string;
  job_id?: string;
};

// Office jobs are no work for a builder on site.
const OFFICE = /projectleider|projectmanager|werkvoorbereider|calculator|tekenaar|engineer|adviseur|manager|planner|inkoper|commercieel|verkoper|accountmanager|binnendienst|recruiter|monteur\s+service|docent/i;
const FREELANCE = /\bzzp|zelfstandig|freelance|onderaannem|op\s+contractbasis/i;

// Bureaus that place ZZP'ers: shown with a mark «через бюро», since Haaks promises no intermediaries.
export const BUREAU = /recruit|uitzend|detach|flex|personeel|staff|bemiddel|werving|interim|talent|jobs?\b|vacature|meestersgilde|fleox|ymatch|vnom|randstad|tempo-team|adecco|manpower|olympia|start ?people|covebo|\botto\b/i;

export function isBureau(name: string | null | undefined) {
  return !!name && BUREAU.test(name);
}

// "8 dagen geleden", "3 uur geleden", "2 weken geleden" -> days ago; null when unknown.
function daysAgoText(text: string | undefined) {
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
function rateText(job: Job) {
  const raw = job.detected_extensions?.salary ?? job.extensions?.find((e) => e.includes("€"));
  if (!raw) return null;
  const clean = raw.replace(/ /g, " ").replace(/\s+/g, " ").trim();
  const amounts = [...clean.matchAll(/€\s?([\d.,]+)\s?(K)?/gi)].map((m) => Number(m[1].replace(/\./g, "").replace(",", ".")) * (m[2] ? 1000 : 1));
  if (!amounts.length) return null;
  const range = amounts.map((a) => `€${a % 1 ? a.toFixed(2) : a}`).join("–");
  if (amounts[0] < 200 || /uur|hour/i.test(clean)) return `${range} per uur`;
  return /maand|month/i.test(clean) ? `${range} per maand` : /jaar|year/i.test(clean) ? `${range} per jaar` : range;
}

function cleanCity(location: string | undefined) {
  const city = (location ?? "").replace(/\(.*?\)/g, "").split(",")[0].trim();
  return !city || /^(nederland|netherlands|heel nederland|anywhere)$/i.test(city) ? null : city;
}

async function placeOf(city: string | null) {
  if (!city) return null;
  const known = cityCoords(city);
  if (known) return { ...known, gemeente: city };
  const geo = await gemeentePlace(city).catch(() => null);
  return geo ? { lat: geo.lat, lng: geo.lng, gemeente: geo.gemeente ?? city } : null;
}

// Dutch mobile or landline in the ad text (most bureaus give one), for the «Позвонить» button.
function phoneIn(text: string) {
  const m = /(?:\+31\s?|0)(?:6[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}|[1-9]\d{1,2}[\s-]?\d{3}[\s-]?\d{3,4})\b/.exec(text);
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

const TEXTS: Record<Lang, { title: string; firm: string; bureau: string; rate: string; more: string; work: string }> = {
  nl: { title: "Vacature zzp", firm: "Bedrijf", bureau: "via bureau", rate: "Tarief", more: "Reageren via de vacaturesite.", work: "Werk" },
  en: { title: "ZZP vacancy", firm: "Company", bureau: "through an agency", rate: "Rate", more: "Apply on the job site.", work: "Work" },
  ru: { title: "Вакансия ZZP", firm: "Компания", bureau: "через бюро", rate: "Ставка", more: "Отклик — на сайте вакансии.", work: "Работа" },
  uk: { title: "Вакансія ZZP", firm: "Компанія", bureau: "через бюро", rate: "Ставка", more: "Відгук — на сайті вакансії.", work: "Робота" },
  pl: { title: "Oferta ZZP", firm: "Firma", bureau: "przez biuro", rate: "Stawka", more: "Zgłoszenie na stronie oferty.", work: "Praca" },
  ro: { title: "Post ZZP", firm: "Firmă", bureau: "prin agenție", rate: "Tarif", more: "Aplici pe site-ul anunțului.", work: "Lucru" },
  tr: { title: "ZZP iş ilanı", firm: "Firma", bureau: "aracı büro ile", rate: "Ücret", more: "Başvuru ilan sitesinde.", work: "İş" },
};

function toItem(job: Job, trade: string | undefined, place: Awaited<ReturnType<typeof placeOf>>, city: string | null): CollectedItem | null {
  const title = (job.title ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  const company = (job.company_name ?? "").trim();
  const link = job.apply_options?.find((a) => a.link && !/google\./.test(a.link))?.link ?? job.share_link;
  if (!title || !link) return null;
  const description = (job.description ?? "").replace(/\s+/g, " ").trim();
  const trades = [...new Set([...workerTrades(title), ...(trade ? [trade] : [])])];
  if (!trades.length) trades.push("aannemer");
  const days = daysAgoText(job.detected_extensions?.posted_at ?? job.extensions?.find((e) => /geleden|ago/i.test(e)));
  if (days !== null && days > KEEP_DAYS) return null;
  const published = new Date(Date.now() - (days ?? 1) * 86400000);
  const rate = rateText(job);
  const bureau = isBureau(company) || isBureau(job.via);

  const translations: CollectedItem["translations"] = {};
  for (const lang of COLLECT_LANGS) {
    const t = TEXTS[lang];
    const work = trades.map((k) => TRADE_LABELS[k]?.[lang] ?? k).join(", ");
    translations[lang] = {
      title: lang === "nl" ? title : `${t.title}: ${work}${city ? `, ${city}` : ""}`,
      summary: [
        lang === "nl" ? "" : `«${title}».`,
        company ? `${t.firm}: ${company}${bureau ? ` (${t.bureau})` : ""}.` : "",
        t.more,
      ]
        .filter(Boolean)
        .join(" "),
    };
  }
  return {
    source: "googlejobs",
    source_name: company || job.via || null,
    source_url: link,
    kind: "business",
    title,
    summary: `${translations.nl!.summary} ${description.slice(0, 240)}${description.length > 240 ? "…" : ""}`.trim(),
    translations,
    trades,
    city,
    region: place?.gemeente ?? city,
    postcode: null,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    timing: null,
    budget: rate,
    contact: phoneIn(description),
    published_at: published.toISOString(),
    expires_at: new Date(published.getTime() + 30 * 86400000).toISOString(),
    // The same job is often posted on several sites: one card per title + company + city.
    fingerprint: `googlejobs-${norm(`${title} ${company} ${city ?? ""}`).slice(0, 180)}`,
  };
}

async function search(token: string, s: (typeof VACANCY_SEARCHES)[number]) {
  const url = `${TREG}?${new URLSearchParams({ engine: "google_jobs", q: s.q, location: s.location, gl: "nl", hl: "nl" })}`;
  const res = await fetch(url, {
    headers: { "x-treg-token": token, "x-treg-route-max-cost": "0.03", accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Treg ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { jobs_results?: Job[] };
  return body.jobs_results ?? [];
}

export function vacanciesEnabled() {
  return !!process.env.TREG_TOKEN;
}

// Today's ZZP construction vacancies from all searches, without the ones already in the feed.
export async function collectVacancies(options: { skip?: Set<string>; searches?: typeof VACANCY_SEARCHES } = {}) {
  const token = process.env.TREG_TOKEN;
  if (!token) return { searches: 0, found: 0, items: [] as CollectedItem[], errors: ["TREG_TOKEN not set"] };
  const searches = options.searches ?? VACANCY_SEARCHES;
  const errors: string[] = [];
  const results = await mapLimit(searches, 4, async (s) => {
    try {
      return (await search(token, s)).map((job) => ({ job, trade: s.trade }));
    } catch (e) {
      errors.push(`${s.q} / ${s.location}: ${e instanceof Error ? e.message : e}`);
      return [];
    }
  });
  const found = results.flat();
  const fitting = found.filter(({ job }) => {
    const text = `${job.title ?? ""} ${(job.extensions ?? []).join(" ")} ${job.detected_extensions?.schedule_type ?? ""} ${(job.description ?? "").slice(0, 1500)}`;
    return FREELANCE.test(text) && !OFFICE.test(job.title ?? "");
  });
  const seen = new Set(options.skip);
  const items: CollectedItem[] = [];
  for (const { job, trade } of fitting) {
    const city = cleanCity(job.location);
    const item = toItem(job, trade, await placeOf(city), city);
    if (!item || seen.has(item.fingerprint)) continue;
    seen.add(item.fingerprint);
    items.push(item);
  }
  return { searches: searches.length, found: found.length, items, errors };
}
