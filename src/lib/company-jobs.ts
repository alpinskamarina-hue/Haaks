import type { SupabaseClient } from "@supabase/supabase-js";
import { gemeentePlace, postcodePlace } from "@/lib/collect/geo";
import { emailEnabled } from "@/lib/email";
import { TRADE_LABELS, tradeLabel } from "@/lib/feed";
import { sendFeedEmails, sendFeedPush, sendFeedTelegram } from "@/lib/feed-notify";
import type { Lang } from "@/lib/i18n";
import { telegramEnabled } from "@/lib/telegram";

// A job a company (BV) posted for ZZP builders. Online jobs are copied into feed_items.
export type CompanyJob = {
  id: string;
  company_id: string;
  status: "pending" | "published" | "rejected" | "closed";
  title: string;
  description: string;
  trades: string[];
  city: string;
  postcode: string | null;
  start_date: string | null;
  weeks: number | null;
  people: number;
  rate_type: "hour" | "fixed" | "ask";
  rate: number | null;
  requirements: string[];
  opdracht_confirmed: boolean;
  reject_reason: string | null;
  feed_item_id: string | null;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
};

export type CompanyInfo = {
  company_name: string | null;
  kvk_number: string | null;
  full_name: string | null;
  phone: string | null;
  business_email: string | null;
};

export const JOB_TRADES = Object.keys(TRADE_LABELS);
export const JOB_REQUIREMENTS = ["vca", "tools", "transport", "avb", "language"] as const;
export type JobRequirement = (typeof JOB_REQUIREMENTS)[number];
// Free plan: jobs waiting or online at the same time (also checked in the database).
export const FREE_ACTIVE_JOBS = 3;
// How long a job stays in the feed.
export const JOB_DAYS = 30;

type FeedLang = Lang;

const REQ_LABELS: Record<JobRequirement, Record<FeedLang, string>> = {
  vca: { nl: "VCA", en: "VCA", ru: "VCA", uk: "VCA", pl: "VCA", ro: "VCA", tr: "VCA" },
  tools: { nl: "eigen gereedschap", en: "own tools", ru: "свой инструмент", uk: "власний інструмент", pl: "własne narzędzia", ro: "scule proprii", tr: "kendi aletleri" },
  transport: { nl: "eigen vervoer", en: "own transport", ru: "своя машина", uk: "власне авто", pl: "własny transport", ro: "mașină proprie", tr: "kendi aracı" },
  avb: { nl: "AVB-verzekering", en: "AVB insurance", ru: "страховка AVB", uk: "страховка AVB", pl: "ubezpieczenie AVB", ro: "asigurare AVB", tr: "AVB sigortası" },
  language: {
    nl: "Nederlands of Engels",
    en: "Dutch or English",
    ru: "нидерландский или английский",
    uk: "нідерландська або англійська",
    pl: "niderlandzki lub angielski",
    ro: "neerlandeză sau engleză",
    tr: "Hollandaca veya İngilizce",
  },
};

export const requirementLabel = (key: string, lang: Lang) => REQ_LABELS[key as JobRequirement]?.[lang] ?? key;

// Lines of a job card in each feed language, built from the form fields (no AI needed).
const FEED_TEXT: Record<
  FeedLang,
  {
    wanted: string;
    start: string;
    weeks: string;
    people: string;
    hour: string;
    fixed: string;
    ask: string;
    needs: string;
    original: string;
    originalZzp: string;
    helper: string;
  }
> = {
  nl: { wanted: "Gezocht", start: "Start: {d}", weeks: "{n} weken", people: "{n} personen", hour: "Tarief: €{x} per uur", fixed: "Projectprijs: €{x} voor het hele project", ask: "Tarief: in overleg", needs: "Nodig: {list}", original: "{text}", originalZzp: "{text}", helper: "Hulp gezocht" },
  en: { wanted: "Wanted", start: "Start: {d}", weeks: "{n} weeks", people: "{n} people", hour: "Rate: €{x} per hour", fixed: "Project price: €{x} for the whole project", ask: "Rate: to be agreed", needs: "Needed: {list}", original: "From the company (in Dutch): «{text}»", originalZzp: "From the builder: «{text}»", helper: "Helper wanted" },
  ru: { wanted: "Ищут", start: "Начало: {d}", weeks: "{n} нед.", people: "{n} чел.", hour: "Оплата: €{x} в час", fixed: "Проектно: €{x} за весь проект", ask: "Оплата: по договорённости", needs: "Нужно: {list}", original: "От компании (на нидерландском): «{text}»", originalZzp: "От строителя: «{text}»", helper: "Нужен помощник" },
  uk: { wanted: "Шукають", start: "Початок: {d}", weeks: "{n} тиж.", people: "{n} осіб", hour: "Оплата: €{x} за годину", fixed: "Проєктно: €{x} за весь проєкт", ask: "Оплата: за домовленістю", needs: "Потрібно: {list}", original: "Від компанії (нідерландською): «{text}»", originalZzp: "Від будівельника: «{text}»", helper: "Потрібен помічник" },
  pl: { wanted: "Szukają", start: "Start: {d}", weeks: "{n} tyg.", people: "{n} os.", hour: "Stawka: €{x} za godzinę", fixed: "Projektowo: €{x} za cały projekt", ask: "Stawka: do uzgodnienia", needs: "Wymagane: {list}", original: "Od firmy (po niderlandzku): «{text}»", originalZzp: "Od fachowca: «{text}»", helper: "Potrzebny pomocnik" },
  ro: { wanted: "Caută", start: "Început: {d}", weeks: "{n} săpt.", people: "{n} pers.", hour: "Tarif: €{x} pe oră", fixed: "Pe proiect: €{x} pentru tot proiectul", ask: "Tarif: de stabilit", needs: "Necesar: {list}", original: "De la firmă (în neerlandeză): «{text}»", originalZzp: "De la constructor: «{text}»", helper: "Caut ajutor" },
  tr: { wanted: "Aranıyor", start: "Başlangıç: {d}", weeks: "{n} hafta", people: "{n} kişi", hour: "Ücret: saatlik €{x}", fixed: "Proje fiyatı: tüm proje için €{x}", ask: "Ücret: anlaşmaya göre", needs: "Gerekli: {list}", original: "Firmadan (Hollandaca): «{text}»", originalZzp: "Ustadan: «{text}»", helper: "Yardımcı aranıyor" },
};

const put = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ""));

// "Ivan Petrov" -> "Ivan P."
export function shortName(full: string | null | undefined) {
  const [first, last] = (full ?? "").trim().split(/\s+/);
  return first ? `${first}${last ? ` ${last[0]}.` : ""}` : "ZZP";
}

// "2026-11-17" -> "17.11.2026"
export const dayMonthYear = (iso: string) => iso.split("-").reverse().join(".");

const money = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ","));

export function jobTexts(
  job: Pick<CompanyJob, "title" | "description" | "trades" | "city" | "start_date" | "weeks" | "people" | "rate_type" | "rate" | "requirements">,
  lang: FeedLang,
  // Posted by a builder who needs a helper (not a company).
  fromZzp = false,
) {
  const t = FEED_TEXT[lang];
  const trades = job.trades.map((tr) => tradeLabel(tr, lang)).join(", ");
  const title =
    lang === "nl"
      ? `${fromZzp ? `${t.helper}: ` : ""}${job.title}, ${job.city}`
      : `${fromZzp ? t.helper : t.wanted}: ${trades}${job.people > 1 ? ` ×${job.people}` : ""} · ${job.city}`;
  const when = [
    job.start_date ? put(t.start, { d: dayMonthYear(job.start_date) }) : null,
    job.weeks ? put(t.weeks, { n: job.weeks }) : null,
    put(t.people, { n: job.people }),
  ]
    .filter(Boolean)
    .join(" · ");
  const pay = job.rate_type === "ask" || !job.rate ? t.ask : put(job.rate_type === "hour" ? t.hour : t.fixed, { x: money(job.rate) });
  const needs = job.requirements.length ? put(t.needs, { list: job.requirements.map((r) => requirementLabel(r, lang)).join(", ") }) : null;
  const lines = [lang === "nl" ? null : job.title, when, pay, needs, job.description.trim() ? put(fromZzp ? t.originalZzp : t.original, { text: job.description.trim() }) : null];
  return { title, summary: lines.filter(Boolean).join("\n") };
}

// Phone numbers and e-mail addresses go through Haaks, not in the text of the job.
export function hasContactInText(text: string) {
  return /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text) || /(\+|00)?\d[\d\s().-]{7,}\d/.test(text);
}

const FEED_LANGS: FeedLang[] = ["en", "ru", "uk", "pl", "ro", "tr"];

// Puts an approved job into the feed and sends the alerts. Runs with the server account.
export async function publishCompanyJob(server: SupabaseClient, jobId: string, siteUrl: string) {
  const { data: job, error } = await server.from("company_jobs").select("*").eq("id", jobId).single<CompanyJob>();
  if (error || !job) throw new Error(error?.message ?? "Job not found");
  if (job.status === "published" && job.feed_item_id) return job;

  const { data: company } = await server
    .from("profiles")
    .select("company_name, kvk_number, full_name, phone, business_email, account_type")
    .eq("id", job.company_id)
    .single<CompanyInfo & { account_type: string }>();
  const fromZzp = company?.account_type === "worker";
  const place = (job.postcode ? await postcodePlace(job.postcode.replace(/\s/g, "")) : null) ?? (await gemeentePlace(job.city));
  const nl = jobTexts(job, "nl", fromZzp);
  const translations = Object.fromEntries(FEED_LANGS.map((lang) => [lang, jobTexts(job, lang, fromZzp)]));
  const now = new Date();
  const expires = new Date(now.getTime() + JOB_DAYS * 24 * 60 * 60 * 1000);

  const { data: item, error: insertError } = await server
    .from("feed_items")
    .insert({
      source: "haaks",
      // A builder is shown as "ZZP · Ivan P."; a company by its name.
      source_name: fromZzp ? `ZZP · ${shortName(company?.full_name)}` : (company?.company_name ?? "Bedrijf"),
      kind: "business",
      title: nl.title,
      summary: nl.summary,
      translations,
      trades: job.trades,
      city: job.city,
      postcode: job.postcode,
      region: place?.gemeente ?? job.city,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
      timing: job.start_date ? `${dayMonthYear(job.start_date)}${job.weeks ? ` · ${job.weeks} wk` : ""}` : null,
      budget: job.rate_type === "ask" || !job.rate ? null : job.rate_type === "hour" ? `€${money(job.rate)}/h` : `€${money(job.rate)}`,
      // Contacts open only after the company accepts a reply (job_replies).
      contact: null,
      published_at: now.toISOString(),
      expires_at: expires.toISOString(),
      fingerprint: `job-${job.id}`,
    })
    .select("id")
    .single<{ id: string }>();
  if (insertError || !item) throw new Error(insertError?.message ?? "Feed insert failed");

  const { error: updateError } = await server
    .from("company_jobs")
    .update({ status: "published", feed_item_id: item.id, published_at: now.toISOString(), expires_at: expires.toISOString(), reject_reason: null })
    .eq("id", job.id);
  if (updateError) throw new Error(updateError.message);
  // One approved job makes the company trusted: its next jobs go online at once.
  await server.from("profiles").update({ company_verified: true }).eq("id", job.company_id);

  // New job: alerts to fitting builders, like the job collector does.
  try {
    await Promise.all([
      emailEnabled() ? sendFeedEmails(server, "instant", siteUrl) : null,
      telegramEnabled() ? sendFeedTelegram(server, siteUrl) : null,
      sendFeedPush(server, siteUrl),
    ]);
  } catch (e) {
    console.error("Company job alerts failed", e);
  }
  return job;
}

// "Found people" or rejected: out of the feed.
export async function takeJobOffline(server: SupabaseClient, job: Pick<CompanyJob, "id" | "feed_item_id">, status: "closed" | "rejected", reason?: string) {
  const now = new Date().toISOString();
  if (job.feed_item_id) await server.from("feed_items").update({ expires_at: now }).eq("id", job.feed_item_id);
  const { error } = await server
    .from("company_jobs")
    .update({ status, reject_reason: status === "rejected" ? (reason ?? null) : null, expires_at: now })
    .eq("id", job.id);
  if (error) throw new Error(error.message);
}

export const isActive = (job: CompanyJob, now = Date.now()) =>
  job.status === "pending" || (job.status === "published" && (!job.expires_at || Date.parse(job.expires_at) > now));
