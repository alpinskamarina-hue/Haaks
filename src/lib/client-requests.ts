// «Vakman gezocht»: jobs Dutch clients post on Haaks without an account (see migration
// 20261108200000_client_requests.sql). Here: the kinds of work, the feed texts in every
// builder language (no AI needed), (publishing lives in client-requests-server.ts).

import { TRADE_LABELS } from "@/lib/feed";
import type { Lang } from "@/lib/i18n";

export const REQUEST_DAYS = 7;
export const MAX_REPLIES = 5;
export const MAX_PHOTOS = 4;

export type ClientRequest = {
  id: string;
  token: string;
  status: "pending" | "published" | "rejected" | "closed";
  work_type: string;
  trades: string[];
  size: string | null;
  description: string;
  postcode: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  timing: Timing;
  budget: string | null;
  name: string;
  email: string;
  phone: string | null;
  lang: "nl" | "en";
  photos: string[];
  reject_reason: string | null;
  feed_item_id: string | null;
  chosen_reply_id: string | null;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
};

export const TIMINGS = ["asap", "weeks", "months", "price"] as const;
export type Timing = (typeof TIMINGS)[number];

// One row of my_client_replies(): a client card in the feed, with my own reply if I sent one.
export type MyClientReply = {
  feed_item_id: string;
  trades: string[];
  city: string | null;
  replied_at: string | null;
  replies: number;
  my_status: "sent" | "chosen" | "not_chosen" | null;
  request_open: boolean;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
};

// The tiles on the client page. `trades` are the feed trade keys of builders who get the job.
export const WORK_TYPES: { key: string; icon: string; trades: string[]; nl: string; en: string; sizeHint: { nl: string; en: string } }[] = [
  { key: "badkamer", icon: "🛁", trades: ["tegelzetter", "loodgieter"], nl: "Badkamer", en: "Bathroom", sizeHint: { nl: "bijv. badkamer 2×3 m, alles nieuw", en: "e.g. bathroom 2×3 m, all new" } },
  { key: "tegels", icon: "🧱", trades: ["tegelzetter"], nl: "Tegels", en: "Tiles", sizeHint: { nl: "bijv. ± 12 m² vloer + wand", en: "e.g. about 12 m² floor + wall" } },
  { key: "schilderen", icon: "🎨", trades: ["schilder"], nl: "Schilderen", en: "Painting", sizeHint: { nl: "bijv. 3 kamers, plafonds + muren", en: "e.g. 3 rooms, ceilings + walls" } },
  { key: "loodgieter", icon: "🚿", trades: ["loodgieter"], nl: "Loodgieter", en: "Plumbing", sizeHint: { nl: "bijv. lekkage onder het aanrecht", en: "e.g. leak under the sink" } },
  { key: "elektra", icon: "⚡", trades: ["elektricien"], nl: "Elektra", en: "Electrical", sizeHint: { nl: "bijv. 6 stopcontacten erbij", en: "e.g. 6 extra sockets" } },
  { key: "dak", icon: "🏠", trades: ["dakdekker"], nl: "Dak", en: "Roof", sizeHint: { nl: "bijv. plat dak ± 30 m²", en: "e.g. flat roof about 30 m²" } },
  { key: "vloer", icon: "🪵", trades: ["timmerman"], nl: "Vloer", en: "Floor", sizeHint: { nl: "bijv. laminaat ± 40 m²", en: "e.g. laminate about 40 m²" } },
  { key: "timmerwerk", icon: "🪚", trades: ["timmerman"], nl: "Timmerwerk", en: "Carpentry", sizeHint: { nl: "bijv. kast inbouwen, deuren afhangen", en: "e.g. built-in wardrobe, hang doors" } },
  { key: "stucwerk", icon: "🧰", trades: ["stukadoor"], nl: "Stucwerk", en: "Plastering", sizeHint: { nl: "bijv. 2 muren + plafond", en: "e.g. 2 walls + ceiling" } },
  { key: "metselwerk", icon: "🏗️", trades: ["metselaar"], nl: "Metselwerk", en: "Brickwork", sizeHint: { nl: "bijv. tuinmuur 8 m", en: "e.g. garden wall 8 m" } },
  { key: "verbouwing", icon: "🏡", trades: ["aannemer"], nl: "Verbouwing", en: "Renovation", sizeHint: { nl: "bijv. keuken + woonkamer", en: "e.g. kitchen + living room" } },
  { key: "klussen", icon: "🔧", trades: ["klusjesman"], nl: "Kleine klussen", en: "Small jobs", sizeHint: { nl: "bijv. lampen ophangen, kitwerk", en: "e.g. hang lamps, sealant" } },
];

export function workType(key: string) {
  return WORK_TYPES.find((w) => w.key === key);
}

// Dutch postcode "3061 AB" -> "3061AB"; null when it is no postcode.
export function cleanPostcode(input: string) {
  const pc = input.replace(/\s+/g, "").toUpperCase();
  return /^[1-9]\d{3}[A-Z]{2}$/.test(pc) ? pc : null;
}

// Builders see the client's first name only (contacts open after the client chooses).
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

export const FEED_TEXTS: Record<Lang, { title: string; size: string; when: Record<Timing, string>; budget: string; client: string; photos: string }> = {
  nl: { title: "Klant zoekt", size: "Omvang", when: { asap: "Zo snel mogelijk", weeks: "Binnen een paar weken", months: "Over 1–3 maanden", price: "Wil eerst een prijs" }, budget: "Budget", client: "Beschrijving van de klant", photos: "foto's" },
  en: { title: "Client is looking for", size: "Size", when: { asap: "As soon as possible", weeks: "Within a few weeks", months: "In 1–3 months", price: "Wants a price first" }, budget: "Budget", client: "Client's description (Dutch)", photos: "photos" },
  ru: { title: "Клиент ищет", size: "Объём", when: { asap: "Как можно скорее", weeks: "В ближайшие недели", months: "Через 1–3 месяца", price: "Сначала хочет узнать цену" }, budget: "Бюджет", client: "Описание клиента (по-голландски)", photos: "фото" },
  uk: { title: "Клієнт шукає", size: "Обсяг", when: { asap: "Якнайшвидше", weeks: "Найближчими тижнями", months: "Через 1–3 місяці", price: "Спершу хоче дізнатися ціну" }, budget: "Бюджет", client: "Опис клієнта (нідерландською)", photos: "фото" },
  pl: { title: "Klient szuka", size: "Zakres", when: { asap: "Jak najszybciej", weeks: "W najbliższych tygodniach", months: "Za 1–3 miesiące", price: "Najpierw chce poznać cenę" }, budget: "Budżet", client: "Opis klienta (po niderlandzku)", photos: "zdjęcia" },
  ro: { title: "Clientul caută", size: "Volum", when: { asap: "Cât mai repede", weeks: "În următoarele săptămâni", months: "Peste 1–3 luni", price: "Vrea întâi un preț" }, budget: "Buget", client: "Descrierea clientului (în olandeză)", photos: "poze" },
  tr: { title: "Müşteri arıyor", size: "Kapsam", when: { asap: "En kısa sürede", weeks: "Önümüzdeki haftalarda", months: "1–3 ay içinde", price: "Önce fiyat öğrenmek istiyor" }, budget: "Bütçe", client: "Müşterinin açıklaması (Felemenkçe)", photos: "fotoğraf" },
};

export function requestTexts(req: Pick<ClientRequest, "trades" | "city" | "size" | "timing" | "budget" | "description" | "photos">, lang: Lang) {
  const t = FEED_TEXTS[lang];
  const work = req.trades.map((k) => TRADE_LABELS[k]?.[lang] ?? k).join(", ");
  return {
    title: `${t.title}: ${work}${req.city ? `, ${req.city}` : ""}`,
    summary: [
      req.size ? `${t.size}: ${req.size}.` : "",
      `${t.when[req.timing]}.`,
      req.budget ? `${t.budget}: ${req.budget}.` : "",
      req.photos.length ? `📷 ${req.photos.length} ${t.photos}.` : "",
      `${t.client}: «${req.description.slice(0, 400)}${req.description.length > 400 ? "…" : ""}»`,
    ]
      .filter(Boolean)
      .join(" "),
  };
}
