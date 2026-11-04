// Permit publications (omgevingsvergunningen) from officielebekendmakingen.nl: a sign that
// building work is coming at an address. Open government data, no key or account needed.

import type { Lang } from "@/lib/i18n";
import { mapLimit, postcodePlace, streetPlace } from "./geo";
import { COLLECT_LANGS, daysAgo, type CollectedItem } from "./types";
import { workType } from "./work-types";

const SRU = "https://repository.overheid.nl/sru";
const TEXT = "https://zoek.officielebekendmakingen.nl";

// Since 2026-11-04 permits come from every municipality in the Netherlands (one search without
// a municipality). A list here still works for a manual run with ?cities=.
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

const SEARCH = 'dt.title any "omgevingsvergunning vergunning"';

function parseRecords(xml: string, creator?: string) {
  const found: Publication[] = [];
  for (const r of xml.match(/<(?:\w+:)?record>[\s\S]*?<\/(?:\w+:)?record>/g) ?? []) {
    const id = tag(r, "identifier");
    // gmb- = Gemeenteblad: municipalities only (not water boards or provinces).
    if (/^gmb-\d{4}-\d+$/.test(id)) {
      found.push({ id, title: decode(tag(r, "title")), date: tag(r, "modified").slice(0, 10), creator: creator ?? decode(tag(r, "creator")) });
    }
  }
  return found;
}

async function sruPage(query: string, start: number) {
  const url = `${SRU}?operation=searchRetrieve&version=2.0&maximumRecords=100&startRecord=${start}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`SRU ${start}: ${res.status}`);
  return res.text();
}

// Publications of one municipality since a date, with "vergunning" in the title.
async function listPublications(creator: string, since: string): Promise<Publication[]> {
  const query = `dt.creator="${creator}" AND ${SEARCH} AND dt.modified>=${since}`;
  const found: Publication[] = [];
  for (let start = 1; start < 1000; start += 100) {
    const xml = await sruPage(query, start);
    const records = xml.match(/<(?:\w+:)?record>/g)?.length ?? 0;
    found.push(...parseRecords(xml, creator));
    const total = Number(tag(xml, "numberOfRecords") || 0);
    if (records < 100 || start + 100 > total) break;
  }
  return found;
}

// The whole country: about 1,400 publications a day, read 100 at a time, a few pages at once.
async function listAllPublications(since: string): Promise<Publication[]> {
  const query = `${SEARCH} AND dt.modified>=${since}`;
  const first = await sruPage(query, 1);
  const total = Math.min(Number(tag(first, "numberOfRecords") || 0), 8000);
  const starts: number[] = [];
  for (let start = 101; start <= total; start += 100) starts.push(start);
  const pages = await mapLimit(starts, 6, (start) => sruPage(query, start).catch(() => ""));
  return [first, ...pages].flatMap((xml) => parseRecords(xml));
}

// Only new and granted permits are a sign of work; refused or withdrawn ones are not.
// "skip" for those, null when the title does not say (Schiedam: "omgevingsvergunning <address>").
function permitStatus(text: string) {
  const t = text.toLowerCase();
  if (/geweigerd|weigeren|weigering|ingetrokken|intrekking|buiten behandeling|niet ontvankelijk|verlenging|beslistermijn|ontwerp/.test(t)) return "skip" as const;
  if (/verleend|verlenen|besluit|toegekend/.test(t)) return "verleend" as const;
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
  tr: { aangevraagd: "İnşaat izni başvurusu yapıldı", verleend: "İnşaat izni verildi" },
};

const HINT: Record<Lang, string> = {
  nl: "Signaal: hier wordt binnenkort gebouwd. Het werk begint meestal 1 tot 3 maanden na de vergunning.",
  en: "A sign of building work coming here. Work usually starts 1 to 3 months after the permit.",
  ru: "Сигнал о будущей стройке. Работы обычно начинаются через 1–3 месяца после разрешения.",
  uk: "Сигнал про майбутнє будівництво. Роботи зазвичай починаються через 1–3 місяці після дозволу.",
  pl: "Sygnał, że wkrótce będzie tu budowa. Prace zwykle zaczynają się 1–3 miesiące po pozwoleniu.",
  ro: "Semn că aici urmează o construcție. Lucrările încep de obicei la 1–3 luni după autorizație.",
  tr: "Burada yakında inşaat başlayacağına dair bir işaret. İşler genellikle izinden 1–3 ay sonra başlar.",
};

const DESC: Record<Lang, string> = {
  nl: "Omschrijving",
  en: "Description (Dutch)",
  ru: "Описание (нидерл.)",
  uk: "Опис (нідерл.)",
  pl: "Opis (niderl.)",
  ro: "Descriere (neerl.)",
  tr: "Açıklama (Hollandaca)",
};

async function toItem(pub: Publication): Promise<CollectedItem | null> {
  const fromTitle = permitStatus(pub.title);
  if (fromTitle === "skip" || !/vergunning/i.test(pub.title)) return null;
  const text = await fullText(pub.id);
  const fromText = fromTitle ?? permitStatus(text.slice(0, 400));
  if (!fromText || fromText === "skip") return null;
  const status = fromText;
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

// One run: list the publications, then read and sort out the new ones until the time is up.
// Later runs of the day continue where this one stopped (done ones are skipped by id).
// "rejected" are publications that are no building work: they are remembered so they are not read again.
export async function collectPermits(
  options: { since?: string; municipalities?: string[]; skip?: Set<string>; deadline?: number } = {},
) {
  const since = options.since ?? daysAgo(2);
  const errors: string[] = [];
  const lists = options.municipalities?.length
    ? await mapLimit(options.municipalities, 4, (m) =>
        listPublications(m, since).catch((e: Error) => {
          errors.push(e.message);
          return [] as Publication[];
        }),
      )
    : [
        await listAllPublications(since).catch((e: Error) => {
          errors.push(e.message);
          return [] as Publication[];
        }),
      ];
  const seen = new Set<string>();
  const pubs = lists
    .flat()
    .filter((p) => !options.skip?.has(p.id) && !seen.has(p.id) && seen.add(p.id))
    // Newest first, so a busy day still brings the freshest permits.
    .sort((a, b) => b.date.localeCompare(a.date));
  const deadline = options.deadline ?? Infinity;
  const rejected: string[] = [];
  let left = 0;
  const items = await mapLimit(pubs, 10, async (p) => {
    if (Date.now() > deadline) {
      left++;
      return null;
    }
    const item = await toItem(p).catch(() => undefined);
    if (item === null) rejected.push(p.id);
    return item ?? null;
  });
  return { found: pubs.length, left, items: items.filter((i): i is CollectedItem => !!i), rejected, errors };
}
