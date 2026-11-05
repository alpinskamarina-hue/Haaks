// Works tenders (aanbestedingen "Werken") from TenderNed: open data (CC-0), no key needed.

import type { Lang } from "@/lib/i18n";
import { TRADE_LABELS } from "@/lib/feed";
import { cityCoords } from "@/lib/worker-profile";
import { gemeentePlace, mapLimit } from "./geo";
import { COLLECT_LANGS, daysAgo, type CollectedItem } from "./types";

const API = "https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties";

type Summary = {
  publicatieId: string | number;
  publicatieDatum: string;
  aanbestedingNaam?: string;
  opdrachtgeverNaam?: string;
  sluitingsDatum?: string | null;
  typePublicatie?: { code?: string; omschrijving?: string } | string;
  typeOpdracht?: { code?: string };
  typeOpdrachtCode?: { code?: string };
  opdrachtBeschrijving?: string;
};

type Detail = Summary & {
  aanvangOpdrachtDatum?: string | null;
  cpvCodes?: { isHoofdOpdracht?: boolean; code: string }[];
  nutsCodes?: { code: string; omschrijving?: string }[];
};

// CPV code start -> Dutch trade key. Anything else in 45… (construction) is for a contractor.
const CPV_TRADES: [string, string][] = [
  ["45421", "timmerman"],
  ["45422", "timmerman"],
  ["45442", "schilder"],
  ["45441", "timmerman"],
  ["45330", "loodgieter"],
  ["45332", "loodgieter"],
  ["45331", "loodgieter"],
  ["45310", "elektricien"],
  ["45311", "elektricien"],
  ["45315", "elektricien"],
  ["45261", "dakdekker"],
  ["45431", "tegelzetter"],
  ["45432", "timmerman"],
  ["45410", "stukadoor"],
  ["45324", "stukadoor"],
  ["45262.5", "metselaar"],
  ["452625", "metselaar"],
  ["45262", "metselaar"],
];

function cpvTrades(codes: Detail["cpvCodes"]) {
  const trades = new Set<string>();
  for (const { code } of codes ?? []) {
    const digits = code.replace(/-.*/, "");
    const hit = CPV_TRADES.find(([start]) => digits.startsWith(start.replace(".", "")));
    if (hit) trades.add(hit[1]);
  }
  if (!trades.size || (codes ?? []).some((c) => /^452[0-2]/.test(c.code))) trades.add("aannemer");
  return [...trades];
}

// The tender's region (NUTS-3 / COROP) -> its main city, when the buyer is not a municipality.
const REGION_CITY: [RegExp, string][] = [
  [/Rijnmond/i, "Rotterdam"],
  [/Amsterdam/i, "Amsterdam"],
  [/Utrecht/i, "Utrecht"],
  [/Gravenhage/i, "Den Haag"],
  [/Delft|Westland/i, "Delft"],
  [/Leiden|Bollenstreek/i, "Leiden"],
  [/Haarlem/i, "Haarlem"],
  [/Zaanstreek/i, "Zaanstad"],
  [/Alkmaar/i, "Alkmaar"],
  [/Gooi|Vechtstreek/i, "Hilversum"],
  [/IJmond/i, "Velsen"],
  [/Kop van Noord-Holland/i, "Den Helder"],
  [/Oost-Zuid-Holland/i, "Gouda"],
  [/Zuidoost-Zuid-Holland/i, "Dordrecht"],
  [/Flevoland/i, "Almere"],
  [/Twente/i, "Enschede"],
  [/Noord-Overijssel/i, "Zwolle"],
  [/Zuidwest-Overijssel/i, "Deventer"],
  [/Veluwe/i, "Apeldoorn"],
  [/Achterhoek/i, "Doetinchem"],
  [/Arnhem|Nijmegen/i, "Arnhem"],
  [/Zuidwest-Gelderland/i, "Tiel"],
  [/West-Noord-Brabant/i, "Breda"],
  [/Midden-Noord-Brabant/i, "Tilburg"],
  [/Noordoost-Noord-Brabant/i, "'s-Hertogenbosch"],
  [/Zuidoost-Noord-Brabant/i, "Eindhoven"],
  [/Noord-Limburg/i, "Venlo"],
  [/Midden-Limburg/i, "Roermond"],
  [/Zuid-Limburg/i, "Maastricht"],
  [/Zeeuwsch-Vlaanderen/i, "Terneuzen"],
  [/Zeeland/i, "Middelburg"],
  [/Groningen/i, "Groningen"],
  [/Friesland/i, "Leeuwarden"],
  [/Drenthe/i, "Assen"],
];

// Known cities use the same centre as the worker's home city (a municipality's own centre
// can be far off: Rotterdam's lies in the port).
async function placeOf(city: string) {
  const known = cityCoords(city);
  if (known) return { ...known, place: city, gemeente: city, city };
  const geo = await gemeentePlace(city);
  return geo ? { ...geo, city } : null;
}

async function tenderPlace(detail: Detail) {
  const gemeente = /Gemeente\s+(.+)$/i.exec(detail.opdrachtgeverNaam ?? "")?.[1]?.trim();
  if (gemeente) {
    const geo = await placeOf(gemeente);
    if (geo) return geo;
  }
  for (const nuts of detail.nutsCodes ?? []) {
    const city = REGION_CITY.find(([re]) => re.test(nuts.omschrijving ?? ""))?.[1];
    if (!city) continue;
    const geo = await placeOf(city);
    if (geo) return geo;
  }
  return null;
}

const TEXTS: Record<Lang, { title: string; buyer: string; work: string; until: string; start: string }> = {
  nl: { title: "Aanbesteding", buyer: "Opdrachtgever", work: "Werk voor", until: "Inschrijven tot", start: "Start van het werk" },
  en: { title: "Tender", buyer: "Client", work: "Work for", until: "Bids until", start: "Work starts" },
  ru: { title: "Тендер", buyer: "Заказчик", work: "Работа для", until: "Заявки до", start: "Начало работ" },
  uk: { title: "Тендер", buyer: "Замовник", work: "Робота для", until: "Заявки до", start: "Початок робіт" },
  pl: { title: "Przetarg", buyer: "Zamawiający", work: "Praca dla", until: "Oferty do", start: "Start prac" },
  ro: { title: "Licitație", buyer: "Client", work: "Lucrare pentru", until: "Oferte până la", start: "Începerea lucrărilor" },
  tr: { title: "İhale", buyer: "İşveren", work: "İş", until: "Son teklif tarihi", start: "İşin başlangıcı" },
};

const isWorks = (s: Summary) => (s.typeOpdracht?.code ?? s.typeOpdrachtCode?.code) === "W";
const publicationType = (s: Summary) => (typeof s.typePublicatie === "string" ? s.typePublicatie : s.typePublicatie?.omschrijving ?? "");

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`TenderNed ${res.status}`);
  return res.json() as Promise<T>;
}

function toItem(d: Detail, place: Awaited<ReturnType<typeof tenderPlace>>): CollectedItem {
  const name = (d.aanbestedingNaam ?? "").trim().slice(0, 160);
  const buyer = (d.opdrachtgeverNaam ?? "").trim();
  const closes = d.sluitingsDatum?.slice(0, 10) ?? null;
  const start = d.aanvangOpdrachtDatum?.slice(0, 10) ?? null;
  const trades = cpvTrades(d.cpvCodes);
  const city = place?.city ?? null;
  const translations: CollectedItem["translations"] = {};
  for (const lang of COLLECT_LANGS) {
    const t = TEXTS[lang];
    const work = trades.map((k) => TRADE_LABELS[k]?.[lang] ?? k).join(", ");
    translations[lang] = {
      title: `${t.title}: ${name}${city ? `, ${city}` : ""}`,
      summary: [`${t.buyer}: ${buyer}.`, `${t.work}: ${work}.`, closes ? `${t.until} ${closes}.` : "", start ? `${t.start}: ${start}.` : ""]
        .filter(Boolean)
        .join(" "),
    };
  }
  const nl = translations.nl!;
  return {
    source: "tenderned",
    source_name: buyer ? `TenderNed · ${buyer}` : "TenderNed",
    source_url: `https://www.tenderned.nl/aankondigingen/overzicht/${d.publicatieId}`,
    kind: "tender",
    title: nl.title,
    summary: `${nl.summary} ${(d.opdrachtBeschrijving ?? "").replace(/\s+/g, " ").slice(0, 300)}`.trim(),
    translations,
    trades,
    city,
    region: place?.gemeente ?? city,
    postcode: null,
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    timing: closes ? `inschrijven tot ${closes}` : null,
    budget: null,
    contact: null,
    published_at: new Date(`${d.publicatieDatum.slice(0, 19)}+01:00`).toISOString(),
    expires_at: closes ? new Date(`${closes}T23:59:59+01:00`).toISOString() : null,
    fingerprint: `tenderned-${d.publicatieId}`,
  };
}

// New works tenders in the whole country since a date (newest first in the API).
export async function collectTenders(options: { since?: string; skip?: Set<string> } = {}) {
  const since = options.since ?? daysAgo(2);
  const found: Summary[] = [];
  for (let page = 0; page < 15; page++) {
    const data = await getJson<{ content?: Summary[] }>(`${API}?page=${page}&size=100`);
    const list = data.content ?? [];
    found.push(...list.filter((s) => s.publicatieDatum.slice(0, 10) >= since));
    if (list.length < 100 || list.every((s) => s.publicatieDatum.slice(0, 10) < since)) break;
  }
  const works = found.filter(
    (s) =>
      isWorks(s) &&
      !/rectificatie|gegund|gunning|intrekking|resultaat|vooraankondiging|wijziging/i.test(publicationType(s)) &&
      !options.skip?.has(`tenderned-${s.publicatieId}`),
  );
  const items = await mapLimit(works, 6, async (s) => {
    try {
      const detail: Detail = { ...s, ...(await getJson<Detail>(`${API}/${s.publicatieId}`)) };
      return toItem(detail, await tenderPlace(detail));
    } catch {
      return null;
    }
  });
  return { found: works.length, items: items.filter((i): i is CollectedItem => !!i) };
}
