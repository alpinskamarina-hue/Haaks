import type Anthropic from "@anthropic-ai/sdk";
import { ABOUT_MAX } from "@/lib/profile-about";
import { cleanProfileInput, EQUIPMENT, LANG_LEVELS, LEVELS, LICENCES, RADII, SPOKEN, TOOLS, TRADES, VEHICLES, WORKS_WITH } from "@/lib/worker-profile";

// Step 1 of «Сотрудник сам заполняет данные»: the worker tells about themselves (text or voice)
// and the employee prepares the profile fields as a card. Only the «Сохранить» tap saves them.
export const STAFF_PROFILE_TOOL: Anthropic.Tool = {
  name: "update_profile",
  description:
    "Prepare changes to the worker's own Haaks profile from what they told you. Shown as a card with old → new values and a «Save» button; nothing is saved until they tap it. Only include fields the worker actually gave. One card per answer.",
  input_schema: {
    type: "object",
    properties: {
      full_name: { type: "string", description: "First and last name" },
      phone: { type: "string" },
      company_name: { type: "string", description: "Trade name (handelsnaam), if any" },
      kvk_number: { type: "string", description: "8 digits" },
      btw_number: { type: "string", description: "NL…B01 btw-id" },
      iban: { type: "string" },
      business_address: { type: "string", description: "Street, house number, postcode, town" },
      business_email: { type: "string" },
      city: { type: "string", description: "Home town in the Netherlands, Dutch spelling" },
      travel_km: { type: "number", enum: [...RADII], description: "How far they travel; 0 = whole country" },
      extra_cities: { type: "array", items: { type: "string" }, description: "Other towns where they work" },
      trades: { type: "array", items: { type: "string", enum: [...TRADES] } },
      trade_levels: {
        type: "object",
        description: "Per trade id: { level: beginner|experienced|master, years: number }",
        additionalProperties: { type: "object", properties: { level: { type: "string", enum: [...LEVELS] }, years: { type: "number" } } },
      },
      languages: { type: "array", items: { type: "string", enum: [...SPOKEN] } },
      language_levels: { type: "object", description: "Per language id: basic|fluent|native", additionalProperties: { type: "string", enum: [...LANG_LEVELS] } },
      vehicle: { type: "string", enum: [...VEHICLES] },
      licences: { type: "array", items: { type: "string", enum: [...LICENCES] } },
      tools: { type: "string", enum: [...TOOLS] },
      equipment: { type: "array", items: { type: "string", enum: [...EQUIPMENT] } },
      works_with: { type: "string", enum: [...WORKS_WITH] },
      team_size: { type: "number" },
      hourly_rate: { type: "number", description: "Euro per hour excl. btw" },
      experience_years: { type: "number" },
      about: { type: "string", description: `A short text about the worker for clients, in Dutch, max ${ABOUT_MAX} characters, only from what they said` },
    },
  },
};

// The card stored on the answer: the cleaned new values and what the profile had before.
export type StaffProfileChange = { type: "profile"; changes: Record<string, unknown>; before: Record<string, unknown> };

// Profile columns the employee reads and may change.
export const PROFILE_SELECT =
  "full_name, phone, company_name, kvk_number, btw_number, iban, business_address, business_email, city, travel_km, extra_cities, trades, trade_levels, languages, language_levels, hourly_rate, experience_years, vehicle, licences, tools, equipment, works_with, team_size, about, onboarded_at";

const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.replace(/\s+/g, " ").trim().slice(0, max) : null);

// Cleans the model's (or a stored card's) fields into exactly what may be written to profiles.
export function cleanProfileChanges(raw: unknown): Record<string, unknown> {
  const a = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = cleanProfileInput(a);
  // cleanProfileInput turns a missing name/phone into null only when the key is present; drop empties.
  for (const k of Object.keys(out)) if (out[k] === null && !(k in a && a[k] === null) && !(out.city && (k === "home_lat" || k === "home_lng"))) delete out[k];
  if (typeof a.trades === "undefined") {
    delete out.trades;
    delete out.trade_levels;
  }
  const company = text(a.company_name, 120);
  if (company) out.company_name = company;
  const kvk = text(a.kvk_number, 20)?.replace(/\D/g, "");
  if (kvk && /^\d{8}$/.test(kvk)) out.kvk_number = kvk;
  const btw = text(a.btw_number, 20)?.replace(/[\s.]/g, "").toUpperCase();
  if (btw && /^NL\d{9}B\d{2}$/.test(btw)) out.btw_number = btw;
  const iban = text(a.iban, 40)?.replace(/\s/g, "").toUpperCase();
  if (iban && /^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(iban)) out.iban = iban;
  const address = text(a.business_address, 200);
  if (address) out.business_address = address;
  const email = text(a.business_email, 120);
  if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) out.business_email = email.toLowerCase();
  const rate = Number(a.hourly_rate);
  if (Number.isFinite(rate) && rate > 0 && rate < 1000) out.hourly_rate = Math.round(rate * 100) / 100;
  const years = Number(a.experience_years);
  if (Number.isInteger(years) && years >= 0 && years <= 60) out.experience_years = years;
  const about = typeof a.about === "string" ? a.about.replace(/\r/g, "").trim().slice(0, ABOUT_MAX) : "";
  if (about) out.about = about;
  return out;
}

// Fields shown on the card, in this order.
export const PROFILE_FIELDS = [
  "full_name", "phone", "company_name", "kvk_number", "btw_number", "iban", "business_address", "business_email",
  "trades", "city", "travel_km", "extra_cities", "languages", "hourly_rate", "experience_years",
  "vehicle", "licences", "tools", "equipment", "works_with", "team_size", "about",
] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

// What the employee should know about the profile: filled values and what is still missing.
export function profileState(p: Record<string, unknown>) {
  const shown = (v: unknown) => (Array.isArray(v) ? v.join(", ") : v === null || v === undefined || v === "" ? null : String(v));
  const filled = PROFILE_FIELDS.flatMap((f) => (shown(p[f]) ? [`${f}=${shown(p[f])!.slice(0, 80)}`] : []));
  const missing = PROFILE_FIELDS.filter((f) => !shown(p[f]) && !["extra_cities", "licences", "equipment", "team_size", "business_email", "about"].includes(f));
  return `Profile now: ${filled.join("; ") || "empty"}.\nStill missing in the profile: ${missing.join(", ") || "nothing important"}.`;
}

// Builds the card from the model's tool call; null when nothing usable or nothing new.
export function toProfileChange(raw: unknown, current: Record<string, unknown>): StaffProfileChange | null {
  const a = { ...((raw ?? {}) as Record<string, unknown>) };
  // Levels the worker did not mention stay as they were.
  const merge = (k: string) => ({ ...((current[k] as object | null) ?? {}), ...((a[k] as object | null) ?? {}) });
  if ("trades" in a) a.trade_levels = merge("trade_levels");
  if ("languages" in a) a.language_levels = merge("language_levels");
  const changes = cleanProfileChanges(a);
  const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const shown = PROFILE_FIELDS.filter((f) => f in changes && !same(changes[f], current[f]));
  if (!shown.length) return null;
  return { type: "profile", changes, before: Object.fromEntries(shown.map((f) => [f, current[f] ?? null])) };
}

// The profile has what sign-up asks for: then the cabinet stops sending the worker to sign-up.
export const signUpDone = (p: Record<string, unknown>) =>
  !!(typeof p.full_name === "string" && p.full_name.trim() && typeof p.phone === "string" && p.phone.trim() && Array.isArray(p.trades) && p.trades.length && p.city);
