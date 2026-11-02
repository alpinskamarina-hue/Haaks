// Material lists: products from shops that the worker sends to the client.
// Shop prices are what the client pays, so they include btw (21%).

import { parseAmount, roundCents, short, type QuoteLine } from "./quotes";

export type MaterialItem = {
  id: string;
  url: string | null;
  title: string;
  image: string | null;
  store: string | null;
  unit_price: number; // incl. btw
  quantity: number;
  unit: string;
};

export type MaterialList = {
  id: string;
  user_id: string;
  order_id: string | null;
  title: string;
  client_name: string | null;
  items: MaterialItem[];
  status: "draft" | "sent" | "accepted";
  buyer: "worker" | "client" | null;
  public_token: string;
  viewed_at: string | null;
  accepted_at: string | null;
  accepted_name: string | null;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
};

export const MAX_ITEMS = 60;

export const STATUS_COLOR = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
} as const;
export const MATERIAL_VAT = 21;

const STORES: [RegExp, string][] = [
  [/(^|\.)praxis\.nl$/, "Praxis"],
  [/(^|\.)gamma\.nl$/, "Gamma"],
  [/(^|\.)karwei\.nl$/, "Karwei"],
  [/(^|\.)hornbach\.nl$/, "Hornbach"],
  [/(^|\.)hubo\.nl$/, "Hubo"],
  [/(^|\.)bouwmaat\.nl$/, "Bouwmaat"],
  [/(^|\.)bol\.com$/, "bol"],
  [/(^|\.)tegeldepot\.nl$/, "Tegeldepot"],
  [/(^|\.)x2o\.nl$/, "X2O"],
  [/(^|\.)sanitairwinkel\.nl$/, "Sanitairwinkel"],
  [/(^|\.)ikea\.com$/, "IKEA"],
  [/(^|\.)amazon\.nl$/, "Amazon"],
  [/(^|\.)toolstation\.nl$/, "Toolstation"],
  [/(^|\.)fixet\.nl$/, "Fixet"],
];

// "Praxis" for praxis.nl, otherwise the domain without www.
export function storeName(url: string | null) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return STORES.find(([re]) => re.test(host))?.[1] ?? host;
  } catch {
    return null;
  }
}

export function itemTotal(item: Pick<MaterialItem, "unit_price" | "quantity">) {
  return roundCents((Number(item.unit_price) || 0) * (Number(item.quantity) || 0));
}

export function listTotal(items: MaterialItem[]) {
  return roundCents(items.reduce((sum, i) => sum + itemTotal(i), 0));
}

const httpUrl = (v: unknown) => {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 1000) : null;
  } catch {
    return null;
  }
};

// Validates what the browser sends.
export function cleanItems(input: unknown): MaterialItem[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_ITEMS).flatMap((raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const title = short(r.title, 300);
    if (!title) return [];
    const price = parseAmount(r.unit_price);
    const qty = parseAmount(r.quantity);
    const url = httpUrl(r.url);
    return [
      {
        id: short(r.id, 40) || crypto.randomUUID(),
        url,
        title,
        image: httpUrl(r.image),
        store: short(r.store, 60) || storeName(url),
        unit_price: Number.isFinite(price) && price >= 0 && price < 1_000_000 ? roundCents(price) : 0,
        quantity: Number.isFinite(qty) && qty > 0 && qty < 100_000 ? Math.round(qty * 100) / 100 : 1,
        unit: short(r.unit, 20) || "st",
      },
    ];
  });
}

// Invoice lines: one per product, price excluding btw.
export function toInvoiceLines(items: MaterialItem[]): QuoteLine[] {
  return items.map((i) => ({
    kind: "material",
    description: [i.title, i.store ? `(${i.store})` : ""].filter(Boolean).join(" ").slice(0, 300),
    quantity: i.quantity,
    unit: i.unit,
    unit_price: roundCents(i.unit_price / (1 + MATERIAL_VAT / 100)),
    vat_rate: MATERIAL_VAT,
  }));
}

// --- Reading a product page -------------------------------------------------

export type ProductInfo = { title: string | null; image: string | null; price: number | null; store: string | null };

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, key: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decode(content) : null;
}

function asPrice(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseAmount(typeof v === "string" ? v : "");
  return Number.isFinite(n) && n > 0 ? roundCents(n) : null;
}

function findProduct(node: unknown, depth = 0): Record<string, unknown> | null {
  if (!node || typeof node !== "object" || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findProduct(n, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return obj;
  return findProduct(obj["@graph"], depth + 1) ?? findProduct(obj.mainEntity, depth + 1);
}

function offerPrice(offers: unknown): number | null {
  if (!offers) return null;
  if (Array.isArray(offers)) {
    for (const o of offers) {
      const p = offerPrice(o);
      if (p) return p;
    }
    return null;
  }
  const o = offers as Record<string, unknown>;
  return (
    asPrice(o.price) ??
    asPrice(o.lowPrice) ??
    asPrice((o.priceSpecification as Record<string, unknown> | undefined)?.price) ??
    offerPrice(o.offers)
  );
}

function imageUrl(v: unknown, base: string): string | null {
  const raw = Array.isArray(v) ? v[0] : v && typeof v === "object" ? (v as Record<string, unknown>).url : v;
  if (typeof raw !== "string" || !raw) return null;
  try {
    return httpUrl(new URL(raw, base).toString());
  } catch {
    return null;
  }
}

// Name, photo and price from a shop's product page: schema.org data first, then meta tags.
export function parseProductHtml(html: string, url: string): ProductInfo {
  let product: Record<string, unknown> | null = null;
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      product = findProduct(JSON.parse(m[1]!.trim()));
    } catch {
      product = null;
    }
    if (product) break;
  }
  const title =
    (typeof product?.name === "string" ? decode(product.name) : null) ??
    meta(html, "og:title") ??
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]!) : null);
  const image = imageUrl(product?.image, url) ?? imageUrl(meta(html, "og:image"), url);
  const price =
    offerPrice(product?.offers) ??
    asPrice(meta(html, "product:price:amount")) ??
    asPrice(meta(html, "og:price:amount")) ??
    asPrice(meta(html, "price"));
  return { title: title ? title.slice(0, 300) : null, image, price, store: storeName(url) };
}
