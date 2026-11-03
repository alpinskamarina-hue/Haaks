// Typical kinds of building work in Dutch permit texts, with the trades they need and a
// name in every cabinet language. This is how a collected permit gets its translations
// without an AI key: the Dutch description stays as it is, the kind of work is translated.

import type { Lang } from "@/lib/i18n";

export type WorkType = {
  id: string;
  match: RegExp;
  trades: string[];
  label: Record<Lang, string>;
};

// Order matters: the first match names the job, every match adds its trades.
export const WORK_TYPES: WorkType[] = [
  {
    id: "dakkapel",
    match: /dakkapel/,
    trades: ["timmerman", "dakdekker"],
    label: { nl: "Dakkapel", en: "Dormer window", ru: "Мансардное окно (dakkapel)", uk: "Мансардне вікно (dakkapel)", pl: "Lukarna (dakkapel)", ro: "Lucarnă (dakkapel)" },
  },
  {
    id: "dakterras",
    match: /dakterras/,
    trades: ["timmerman", "dakdekker"],
    label: { nl: "Dakterras", en: "Roof terrace", ru: "Терраса на крыше", uk: "Тераса на даху", pl: "Taras na dachu", ro: "Terasă pe acoperiș" },
  },
  {
    id: "optopping",
    match: /optop|dakopbouw|extra (bouw)?laag|extra verdieping|bouwlaag/,
    trades: ["aannemer", "timmerman", "metselaar"],
    label: { nl: "Extra verdieping", en: "Extra storey", ru: "Надстройка этажа", uk: "Надбудова поверху", pl: "Nadbudowa piętra", ro: "Etaj suplimentar" },
  },
  {
    id: "nieuwbouw",
    match: /nieuwbouw|nieuw te bouwen|(bouwen|realiseren|oprichten) van (een |\d+ )?(nieuwe )?(woning|woningen|appartement|bedrijfs|kantoor|bedrijfspand)/,
    trades: ["aannemer", "metselaar", "timmerman"],
    label: { nl: "Nieuwbouw", en: "New building", ru: "Новое строительство", uk: "Нове будівництво", pl: "Nowa budowa", ro: "Construcție nouă" },
  },
  {
    id: "sloop",
    match: /sloop|slopen/,
    trades: ["aannemer", "klusjesman"],
    label: { nl: "Sloopwerk", en: "Demolition", ru: "Снос / демонтаж", uk: "Знесення / демонтаж", pl: "Rozbiórka", ro: "Demolare" },
  },
  {
    id: "uitbouw",
    match: /uitbouw|aanbouw|serre|vergrot|uitbreid|uitbreiding/,
    trades: ["aannemer", "metselaar", "timmerman"],
    label: { nl: "Uitbouw", en: "House extension", ru: "Пристройка к дому", uk: "Прибудова до будинку", pl: "Rozbudowa domu", ro: "Extindere casă" },
  },
  {
    id: "bijgebouw",
    match: /bijgebouw|carport|schuur|tuinhuis|overkapping|berging|blokhut|veranda/,
    trades: ["timmerman", "klusjesman"],
    label: { nl: "Bijgebouw of overkapping", en: "Shed or canopy", ru: "Сарай, навес или постройка в саду", uk: "Сарай, навіс або садова споруда", pl: "Budynek gospodarczy lub wiata", ro: "Anexă sau copertină" },
  },
  {
    id: "badkamer",
    match: /badkamer|keuken|sanitair|toilet/,
    trades: ["tegelzetter", "loodgieter"],
    label: { nl: "Badkamer of keuken", en: "Bathroom or kitchen", ru: "Ванная или кухня", uk: "Ванна або кухня", pl: "Łazienka lub kuchnia", ro: "Baie sau bucătărie" },
  },
  {
    id: "kozijnen",
    match: /kozijn|\bramen\b|\braam\b|\bpui\b|puien|voordeur|deuren|beglazing|glas/,
    trades: ["timmerman"],
    label: { nl: "Kozijnen, ramen of deuren", en: "Window frames, windows or doors", ru: "Рамы, окна или двери", uk: "Рами, вікна або двері", pl: "Ramy, okna lub drzwi", ro: "Tâmplărie, ferestre sau uși" },
  },
  {
    id: "gevel",
    match: /gevel|isolat|isoleren|stucwerk|metselwerk|voegwerk/,
    trades: ["metselaar", "stukadoor", "schilder"],
    label: { nl: "Gevelwerk", en: "Facade work", ru: "Работы по фасаду", uk: "Роботи з фасаду", pl: "Prace elewacyjne", ro: "Lucrări la fațadă" },
  },
  {
    id: "installatie",
    match: /zonnepan|warmtepomp|airco|laadpaal|installatie/,
    trades: ["elektricien", "loodgieter"],
    label: { nl: "Installaties", en: "Installations (solar, heat pump)", ru: "Инсталляции (солнечные панели, тепловой насос)", uk: "Інсталяції (сонячні панелі, тепловий насос)", pl: "Instalacje (panele, pompa ciepła)", ro: "Instalații (panouri, pompă de căldură)" },
  },
  {
    id: "dak",
    match: /\bdak|dakrand|dakgoot|dakbedekking|nokverhoging/,
    trades: ["dakdekker"],
    label: { nl: "Dakwerk", en: "Roof work", ru: "Работы по крыше", uk: "Роботи з даху", pl: "Prace dachowe", ro: "Lucrări la acoperiș" },
  },
  {
    id: "verbouw",
    match: /verbouw|renovat|renoveren|splits|transform|interne|inpandig|fundering|constructie|draagmuur|herstel|restaur|wijzigen van (de |het )?(woning|pand|gebouw)|interieur/,
    trades: ["aannemer", "timmerman", "stukadoor"],
    label: { nl: "Verbouwing", en: "Renovation", ru: "Перестройка / ремонт", uk: "Перебудова / ремонт", pl: "Przebudowa / remont", ro: "Renovare" },
  },
];

// Building work, but no clearer kind found.
const GENERIC: WorkType = {
  id: "bouw",
  match: /bouw|plaatsen|wijzig|verander|aanleg/,
  trades: ["aannemer"],
  label: { nl: "Bouwwerk", en: "Building work", ru: "Строительные работы", uk: "Будівельні роботи", pl: "Prace budowlane", ro: "Lucrări de construcție" },
};

// Permits that are not building work for a vakman: trees, signs, events, use of a place.
const NOT_WORK = /\bkap(pen)?\b|kapvergunning|\bboom|bomen|reclame|uitrit|uitweg|evenement|exploitatie|standplaats|terras(?!.*dak)|steiger|\bbrug|ligplaats|alcohol|drank|horeca|gebruik(en)? van (de |het )?(gronden|openbare)/;

// What kind of work a permit text describes, or null when it is not building work.
export function workType(text: string) {
  const t = text.toLowerCase();
  const hits = WORK_TYPES.filter((w) => w.match.test(t));
  if (!hits.length) {
    if (NOT_WORK.test(t) || !GENERIC.match.test(t)) return null;
    return { type: GENERIC, trades: GENERIC.trades };
  }
  return { type: hits[0], trades: [...new Set(hits.flatMap((h) => h.trades))] };
}
