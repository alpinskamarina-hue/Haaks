// The extended worker profile: what they do, where, in which languages, with
// what transport and tools, and when they are free. Options are fixed lists
// (ids stored in the database) so the order feed and contractors can filter on them.

import type { DocumentRow } from "./documents";

export const TRADES = [
  "tiler",
  "plumber",
  "carpenter",
  "electrician",
  "painter",
  "bricklayer",
  "drywall",
  "plasterer",
  "roofer",
  "windows_doors",
  "flooring",
  "welder",
  "labourer",
  "other",
] as const;
export type TradeId = (typeof TRADES)[number];

export const LEVELS = ["beginner", "experienced", "master"] as const;
export type Level = (typeof LEVELS)[number];

export const SPOKEN = ["ru", "uk", "pl", "ro", "nl", "en", "de", "tr", "bg", "lt", "pt", "es"] as const;
export type SpokenId = (typeof SPOKEN)[number];

export const LANG_LEVELS = ["basic", "fluent", "native"] as const;
export type LangLevel = (typeof LANG_LEVELS)[number];

export const RADII = [15, 30, 50, 100, 0] as const; // 0 = the whole country
export const VEHICLES = ["none", "car", "van"] as const;
export const LICENCES = ["B", "BE", "C", "CE"] as const;
export const TOOLS = ["none", "hand", "full"] as const;
export const EQUIPMENT = ["tile_cutter", "mixer", "scaffolding", "laser_level", "trailer", "core_drill"] as const;
export const WORKS_WITH = ["solo", "team"] as const;
export const AVAILABILITY = ["full", "part"] as const;
export const MAX_WORK_PHOTOS = 6;

export type WorkerProfile = {
  city: string | null;
  trades: string[];
  trade_levels: Record<string, { level?: string; years?: number | null }>;
  home_lat: number | null;
  home_lng: number | null;
  travel_km: number | null;
  extra_cities: string[];
  languages: string[];
  language_levels: Record<string, string>;
  vehicle: string | null;
  licences: string[];
  tools: string | null;
  equipment: string[];
  works_with: string | null;
  team_size: number | null;
  hourly_rate: number | string | null;
  available: boolean;
  available_from: string | null;
  availability: string | null;
  work_photos: string[];
  onboarded_at: string | null;
};

// Arrays come back as null only if the migration has not run yet; keep the page working.
export function withDefaults(p: Partial<WorkerProfile>): WorkerProfile {
  return {
    city: p.city ?? null,
    trades: p.trades ?? [],
    trade_levels: p.trade_levels ?? {},
    home_lat: p.home_lat ?? null,
    home_lng: p.home_lng ?? null,
    travel_km: p.travel_km ?? null,
    extra_cities: p.extra_cities ?? [],
    languages: p.languages ?? [],
    language_levels: p.language_levels ?? {},
    vehicle: p.vehicle ?? null,
    licences: p.licences ?? [],
    tools: p.tools ?? null,
    equipment: p.equipment ?? [],
    works_with: p.works_with ?? null,
    team_size: p.team_size ?? null,
    hourly_rate: p.hourly_rate ?? null,
    available: p.available ?? false,
    available_from: p.available_from ?? null,
    availability: p.availability ?? null,
    work_photos: p.work_photos ?? [],
    onboarded_at: p.onboarded_at ?? null,
  };
}

// Places for the home-city field, with coordinates for the travel radius.
export const NL_CITIES: [string, number, number][] = [
  ["Amsterdam", 52.37, 4.9], ["Rotterdam", 51.92, 4.48], ["Den Haag", 52.08, 4.31], ["Utrecht", 52.09, 5.12],
  ["Eindhoven", 51.44, 5.48], ["Groningen", 53.22, 6.57], ["Tilburg", 51.56, 5.09], ["Almere", 52.37, 5.22],
  ["Breda", 51.59, 4.78], ["Nijmegen", 51.84, 5.86], ["Apeldoorn", 52.21, 5.97], ["Arnhem", 51.98, 5.91],
  ["Haarlem", 52.38, 4.64], ["Enschede", 52.22, 6.89], ["Amersfoort", 52.16, 5.39], ["Zaandam", 52.44, 4.83],
  ["'s-Hertogenbosch", 51.69, 5.3], ["Zwolle", 52.52, 6.08], ["Leiden", 52.16, 4.49], ["Zoetermeer", 52.06, 4.49],
  ["Maastricht", 50.85, 5.69], ["Dordrecht", 51.81, 4.67], ["Ede", 52.04, 5.66], ["Alphen aan den Rijn", 52.13, 4.66],
  ["Westland", 52.0, 4.2], ["Alkmaar", 52.63, 4.75], ["Emmen", 52.78, 6.9], ["Delft", 52.01, 4.36],
  ["Venlo", 51.37, 6.17], ["Deventer", 52.25, 6.16], ["Sittard", 51.0, 5.87], ["Helmond", 51.48, 5.66],
  ["Oss", 51.77, 5.52], ["Amstelveen", 52.3, 4.86], ["Hilversum", 52.22, 5.18], ["Heerlen", 50.89, 5.98],
  ["Nissewaard", 51.85, 4.33], ["Hoofddorp", 52.3, 4.69], ["Purmerend", 52.5, 4.95], ["Schiedam", 51.92, 4.4],
  ["Leeuwarden", 53.2, 5.8], ["Lelystad", 52.52, 5.47], ["Roosendaal", 51.53, 4.47], ["Vlaardingen", 51.91, 4.34],
  ["Gouda", 52.01, 4.71], ["Hoorn", 52.64, 5.06], ["Assen", 52.99, 6.56], ["Veenendaal", 52.03, 5.56],
  ["Bergen op Zoom", 51.49, 4.29], ["Capelle aan den IJssel", 51.93, 4.58], ["Nieuwegein", 52.03, 5.08],
  ["Zeist", 52.09, 5.23], ["Katwijk", 52.2, 4.4], ["Harderwijk", 52.34, 5.62], ["Den Helder", 52.96, 4.76],
  ["Doetinchem", 51.97, 6.29], ["Hengelo", 52.27, 6.79], ["Middelburg", 51.5, 3.61], ["Vlissingen", 51.44, 3.57],
  ["Goes", 51.5, 3.89], ["Roermond", 51.19, 5.99], ["Weert", 51.25, 5.71], ["Kampen", 52.56, 5.91],
  ["Heerenveen", 52.96, 5.92], ["Drachten", 53.11, 6.1], ["Tiel", 51.89, 5.43], ["Barneveld", 52.14, 5.59],
  ["Woerden", 52.09, 4.88], ["Gorinchem", 51.83, 4.97], ["Waalwijk", 51.68, 5.07], ["IJsselmuiden", 52.56, 5.93],
];

export function cityCoords(name: string | null) {
  const key = name?.trim().toLowerCase();
  const hit = NL_CITIES.find(([city]) => city.toLowerCase() === key);
  return hit ? { lat: hit[1], lng: hit[2] } : null;
}

const pick = <T extends readonly string[]>(list: T, v: unknown): T[number] | null =>
  typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T[number]) : null;
const pickMany = <T extends readonly string[]>(list: T, v: unknown): T[number][] =>
  Array.isArray(v) ? [...new Set(v.filter((x) => (list as readonly string[]).includes(x)))] : [];
const int = (v: unknown, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

// Validates what the browser sends; unknown ids and out-of-range numbers are dropped.
export function cleanProfileInput(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if ("trades" in input) {
    const trades = pickMany(TRADES, input.trades);
    const levels = (input.trade_levels ?? {}) as Record<string, { level?: unknown; years?: unknown }>;
    out.trades = trades;
    out.trade_levels = Object.fromEntries(
      trades.map((id) => [id, { level: pick(LEVELS, levels[id]?.level), years: int(levels[id]?.years, 0, 60) }]),
    );
  }
  if ("city" in input) {
    const city = typeof input.city === "string" ? input.city.trim().slice(0, 80) : "";
    const coords = cityCoords(city);
    out.city = city || null;
    out.home_lat = coords?.lat ?? null;
    out.home_lng = coords?.lng ?? null;
  }
  if ("travel_km" in input) out.travel_km = (RADII as readonly number[]).includes(Number(input.travel_km)) ? Number(input.travel_km) : null;
  if ("extra_cities" in input && Array.isArray(input.extra_cities)) {
    out.extra_cities = [...new Set(input.extra_cities.filter((c) => typeof c === "string" && c.trim()).map((c: string) => c.trim().slice(0, 80)))].slice(0, 10);
  }
  if ("languages" in input) {
    const langs = pickMany(SPOKEN, input.languages);
    const levels = (input.language_levels ?? {}) as Record<string, unknown>;
    out.languages = langs;
    out.language_levels = Object.fromEntries(langs.map((id) => [id, pick(LANG_LEVELS, levels[id]) ?? "basic"]));
  }
  if ("vehicle" in input) out.vehicle = pick(VEHICLES, input.vehicle);
  if ("licences" in input) out.licences = pickMany(LICENCES, input.licences);
  if ("tools" in input) out.tools = pick(TOOLS, input.tools);
  if ("equipment" in input) out.equipment = pickMany(EQUIPMENT, input.equipment);
  if ("works_with" in input) {
    out.works_with = pick(WORKS_WITH, input.works_with);
    out.team_size = out.works_with === "team" ? int(input.team_size, 2, 100) : null;
  }
  return out;
}

// How complete the profile is, and what to add next with how much it adds.
export type CompletenessItem = "trades" | "region" | "languages" | "vehicle" | "tools" | "team" | "rate" | "availability" | "photos" | "kvk";
const WEIGHTS: Record<CompletenessItem, number> = {
  trades: 15, region: 15, languages: 10, vehicle: 10, tools: 10, team: 5, rate: 10, availability: 5, photos: 15, kvk: 5,
};

export function completeness(p: WorkerProfile, docs: Pick<DocumentRow, "doc_type">[]) {
  const done: Record<CompletenessItem, boolean> = {
    trades: p.trades.length > 0,
    region: !!p.city && p.travel_km !== null,
    languages: p.languages.length > 0,
    vehicle: !!p.vehicle,
    tools: !!p.tools,
    team: !!p.works_with,
    rate: Number(p.hourly_rate) > 0,
    availability: p.available || !!p.available_from,
    photos: p.work_photos.length >= 3,
    kvk: docs.some((d) => d.doc_type === "kvk_extract"),
  };
  const items = Object.keys(WEIGHTS) as CompletenessItem[];
  const percent = items.reduce((sum, k) => sum + (done[k] ? WEIGHTS[k] : 0), 0);
  const missing = items.filter((k) => !done[k]).sort((a, b) => WEIGHTS[b] - WEIGHTS[a]).map((k) => ({ key: k, gain: WEIGHTS[k] }));
  return { percent, done: items.filter((k) => done[k]).length, total: items.length, missing };
}
