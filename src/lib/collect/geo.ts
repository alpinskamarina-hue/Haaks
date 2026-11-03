// Places on the map from PDOK Locatieserver (free, no key, by the Dutch government).

const PDOK = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

export type Place = { lat: number; lng: number; place: string | null; gemeente: string | null };

const cache = new Map<string, Promise<Place | null>>();

async function lookup(q: string, type: string): Promise<Place | null> {
  const url = `${PDOK}?q=${encodeURIComponent(q)}&fq=type:${type}&rows=1&fl=centroide_ll,woonplaatsnaam,gemeentenaam`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const doc = (await res.json())?.response?.docs?.[0];
    const point = /POINT\(([\d.]+) ([\d.]+)\)/.exec(doc?.centroide_ll ?? "");
    if (!point) return null;
    return {
      lng: Number(point[1]),
      lat: Number(point[2]),
      place: doc.woonplaatsnaam ?? null,
      gemeente: doc.gemeentenaam ?? null,
    };
  } catch {
    return null;
  }
}

function cached(key: string, run: () => Promise<Place | null>) {
  if (!cache.has(key)) cache.set(key, run());
  return cache.get(key)!;
}

// "3034RD" -> the middle of that postcode area.
export const postcodePlace = (postcode: string) => cached(`pc:${postcode}`, () => lookup(postcode, "postcode"));
// "Rakstraat Rotterdam" -> the street.
export const streetPlace = (street: string, place: string) => cached(`weg:${street}|${place}`, () => lookup(`${street} ${place}`, "weg"));
// "Schiedam" -> the municipality.
export const gemeentePlace = (name: string) => cached(`gem:${name}`, () => lookup(name, "gemeente"));

// Runs fn over the list, a few at a time, so the free services are not flooded.
export async function mapLimit<T, R>(list: T[], limit: number, fn: (item: T) => Promise<R>) {
  const out: R[] = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await fn(list[i]);
      }
    }),
  );
  return out;
}
