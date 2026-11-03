// Permit publications (omgevingsvergunningen) from officielebekendmakingen.nl: a sign that
// building work is coming at an address. Open government data, no key or account needed.

import type { Lang } from "@/lib/i18n";
import { mapLimit, postcodePlace, streetPlace } from "./geo";
import { COLLECT_LANGS, daysAgo, type CollectedItem } from "./types";
import { workType } from "./work-types";

const SRU = "https://repository.overheid.nl/sru";
const TEXT = "https://zoek.officielebekendmakingen.nl";

// Trial region (Nasim, 2026-11-03): Rotterdam and its neighbours, Amsterdam, Utrecht.
// After a week of testing the whole country follows.
export const PERMIT_MUNICIPALITIES = [
  "Rotterdam",
  "Schiedam",
  "Vlaardingen",
  "Capelle aan den IJssel",
  "Barendrecht",
  "Ridderkerk",
  "Lansingerland",
  "Albrandswaard",
  "Krimpen aan den IJssel",
  "Nissewaard",
  "Maassluis",
  "Amsterdam",
  "Utrecht",
];

type Publication = { id: string; title: string; date: string; creator: string };

const tag = (xml: string, name: string) =>
  new RegExp(`<(?:\\w+:)?${name}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${name}>`).exec(xml)?.[1]?.trim() ?? "";

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

// Publications of one municipality since a date, with "vergunning" in the title.
async function listPublications(creator: string, since: string): Promise<Publication[]> {
  const query = `dt.creator="${creator}" AND dt.title any "omgevingsvergunning vergunning" AND dt.modified>=${since}`;
  const found: Publication[] = [];
  for (let start = 1; start < 1000; start += 100) {
    const url = `${SRU}?operation=searchRetrieve&version=2.0&maximumRecords=100&startRecord=${start}&query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`SRU ${creator}: ${res.status}`);
    const xml = await res.text();
    const records = xml.match(/<(?:\w+:)?record>[\s\S]*?<\/(?:\w+:)?record>/g) ?? [];
    for (const r of records) {
      const id = tag(r, "identifier");
      if (/^gmb-\d{4}-\d+$/.test(id)) found.push({ id, title: decode(tag(r, "title")), date: tag(r, "modified").slice(0, 10), creator });
    }
    const total = Number(tag(xml, "numberOfRecords") || 0);
    if (records.length < 100 || start + 100 > total) break;
  }
  return found;
}

// Only new and granted permits are a sign of work; refused or withdrawn ones are not.
function permitStatus(title: string) {
  const t = title.toLowerCase();
  if (/geweigerd|ingetrokken|buiten behandeling|niet ontvankelijk|verlenging|beslistermijn|ontwerp/.test(t)) return null;
  if (/verleend|besluit|toegekend/.test(t)) return "verleend" as const;
  if (/aanvraag|aangevraagd|ontvangen|ingediend/.test(t)) return "aangevraagd" as const;
  return null;
}

async function fullText(id: string) {
  try {
    const res = await fetch(`${TEXT}/${id}.xml`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return "";
    return decode((await res.text()).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

// Rotterdam: "De aanvraag betreft X op de locatie …"; Amsterdam: "Omschrijving: X Zaakadres: …";
// Utrecht puts the work in the title: "Aanvraag omgevingsvergunning, <work>, <address>, …".
function description(title: string, text: string) {
  const m = /(?:aanvraag betreft:?|Omschrijving:|Het betreft:?|voor het)\s*(.+?)(?:\s+op de locatie|\s+Zaakadres:|\s+Datum ontvangst|\s+Locatie:|\.\s|$)/i.exec(text);
  if (m && m[1].length > 6) return m[1].trim().slice(0, 240);
  const parts = title.split(",").map((p) => p.trim());
  const work = parts.find((p, i) => i > 0 && !/\d{4}\s?[A-Z]{2}/.test(p) && !/^GU-|^Z-|\d+$/.test(p) && p.length > 8);
  return (work ?? "").slice(0, 240);
}

// "Aanvraag omgevingsvergunning Kraaipanstraat" -> "Kraaipanstraat".
function cleanStreet(raw: string | undefined) {
  const street = (raw ?? "")
    .replace(/^.*?(omgevingsvergunning|vergunning|locatie|adres:?)\s+/i, "")
    .replace(/^(aan de|op de|te)\s+/i, "")
    .trim();
  return street.length >= 3 ? street : null;
}

const POSTCODE = /\b(\d{4})\s?([A-Z]{2})\b/;

// Street, postcode and place from the title or the text. The house number is left out:
// workers see the street and the postcode area, the exact address is in the publication.
function address(title: string, text: string, creator: string) {
  for (const source of [title, text]) {
    const pc = POSTCODE.exec(source);
    if (!pc) continue;
    const before = source.slice(Math.max(0, pc.index - 80), pc.index);
    const street = cleanStreet(/([A-Z][A-Za-zÀ-ÿ'.\- ]{2,50}?)\s+\d+[\w\-\s]{0,8}[,\s]*$/.exec(before)?.[1]);
    const after = source.slice(pc.index + pc[0].length).trim();
    const place = /^([A-Z][A-Za-zÀ-ÿ'\- ]{1,40}?)(?:[,.;]|\s+(?:Datum|GU-|Z-|De |Het |Omschrijving)|$)/.exec(after)?.[1]?.trim() ?? creator;
    return { street, postcode: `${pc[1]}${pc[2]}`, pc4: pc[1], place };
  }
  const street = cleanStreet(/(?:locatie|Zaakadres:)\s*([A-Z][A-Za-zÀ-ÿ'.\- ]{2,50}?)\s+\d+/.exec(text)?.[1]);
  return { street, postcode: null, pc4: null, place: creator };
}

const STATUS: Record<Lang, { aangevraagd: string; verleend: string }> = {
  nl: { aangevraagd: "Vergunning aangevraagd", verleend: "Vergunning verleend" },
  en: { aangevraagd: "Permit applied for", verleend: "Permit granted" },
  ru: { aangevraagd: "Подана заявка на разрешение", verleend: "Разрешение выдано" },
  uk: { aangevraagd: "Подано заявку на дозвіл", verleend: "Дозвіл видано" },
  pl: { aangevraagd: "Złożono wniosek o pozwolenie", verleend: "Pozwolenie wydane" },
  ro: { aangevraagd: "Cerere de autorizație depusă", verleend: "Autorizație acordată" },
};

const HINT: Record<Lang, string> = {
  nl: "Signaal: hier wordt binnenkort gebouwd. Het werk begint meestal 1 tot 3 maanden na de vergunning.",
  en: "A sign of building work coming here. Work usually starts 1 to 3 months after the permit.",
  ru: "Сигнал о будущей стройке. Работы обычно начинаются через 1–3 месяца после разрешения.",
  uk: "Сигнал про майбутнє будівництво. Роботи зазвичай починаються через 1–3 місяці після дозволу.",
  pl: "Sygnał, że wkrótce będzie tu budowa. Prace zwykle zaczynają się 1–3 miesiące po pozwoleniu.",
  ro: "Semn că aici urmează o construcție. Lucrările încep de obicei la 1–3 luni după autorizație.",
};

const DESC: Record<Lang, string> = {
  nl: "Omschrijving",
  en: "Description (Dutch)",
  ru: "Описание (нидерл.)",
  uk: "Опис (нідерл.)",
  pl: "Opis (niderl.)",
  ro: "Descriere (neerl.)",
};

async function toItem(pub: Publication): Promise<CollectedItem | null> {
  const status = permitStatus(pub.title);
  if (!status) return null;
  const text = await fullText(pub.id);
  const desc = description(pub.title, text);
  const work = workType(`${desc} ${pub.title}`);
  if (!work) return null;
  const where = address(pub.title, text, pub.creator);
  const geo = where.postcode
    ? await postcodePlace(where.postcode)
    : where.street
      ? await streetPlace(where.street, where.place)
      : null;
  const city = geo?.place ?? where.place;
  const spot = [where.street, where.pc4 ? `(${where.pc4})` : null].filter(Boolean).join(" ");
  const translations: CollectedItem["translations"] = {};
  for (const lang of COLLECT_LANGS) {
    const title = `${work.type.label[lang]}, ${spot ? `${spot}, ` : ""}${city}`;
    const summary = [`${STATUS[lang][status]} (${pub.date}).`, desc ? `${DESC[lang]}: «${desc}».` : "", HINT[lang]]
      .filter(Boolean)
      .join(" ");
    translations[lang] = { title, summary };
  }
  return {
    source: "bekendmakingen",
    source_name: `Gemeente ${pub.creator} · ${status === "verleend" ? "verleende" : "aanvraag"} omgevingsvergunning`,
    source_url: `${TEXT}/${pub.id}`,
    kind: "permit",
    title: translations.nl!.title,
    summary: translations.nl!.summary,
    translations,
    trades: work.trades,
    city,
    region: geo?.gemeente ?? pub.creator,
    postcode: where.postcode,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    timing: `vergunning ${status}`,
    budget: null,
    contact: null,
    published_at: `${pub.date}T09:00:00+01:00`,
    fingerprint: pub.id,
  };
}

export async function collectPermits(options: { since?: string; municipalities?: string[]; skip?: Set<string> } = {}) {
  const since = options.since ?? daysAgo(2);
  const errors: string[] = [];
  const lists = await mapLimit(options.municipalities ?? PERMIT_MUNICIPALITIES, 4, (m) =>
    listPublications(m, since).catch((e: Error) => {
      errors.push(e.message);
      return [] as Publication[];
    }),
  );
  const seen = new Set<string>();
  const pubs = lists.flat().filter((p) => !options.skip?.has(p.id) && !seen.has(p.id) && seen.add(p.id));
  const items = await mapLimit(pubs, 8, (p) => toItem(p).catch(() => null));
  return { found: pubs.length, items: items.filter((i): i is CollectedItem => !!i), errors };
}
