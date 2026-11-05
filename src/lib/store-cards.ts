// «Мои карты»: store discount cards and the barcodes drawn for them at the till.
// Barcodes are drawn here as SVG (EAN-13 and Code 128 by hand, QR by the qrcode package on the server),
// so a clean code is shown even when the photo of the card is worn or blurry.

export type CardFormat = "ean13" | "code128" | "qr";

export type StoreCard = {
  id: string;
  user_id: string;
  store: string;
  custom_name: string | null;
  number: string;
  format: CardFormat;
  photo_path: string | null;
  created_at: string;
};

// Builder stores in the Netherlands. domains = shop sites, used to offer the card next to material links.
export const STORES: { key: string; name: string; color: string; domains: string[] }[] = [
  { key: "gamma", name: "Gamma", color: "#1d4ed8", domains: ["gamma.nl"] },
  { key: "karwei", name: "Karwei", color: "#16a34a", domains: ["karwei.nl"] },
  { key: "praxis", name: "Praxis", color: "#dc2626", domains: ["praxis.nl"] },
  { key: "hornbach", name: "Hornbach", color: "#ea580c", domains: ["hornbach.nl"] },
  { key: "bouwmaat", name: "Bouwmaat", color: "#0f766e", domains: ["bouwmaat.nl"] },
  { key: "hubo", name: "Hubo", color: "#be123c", domains: ["hubo.nl"] },
  { key: "bauhaus", name: "Bauhaus", color: "#b91c1c", domains: ["bauhaus.nl"] },
  { key: "stiho", name: "Stiho", color: "#1e3a8a", domains: ["stiho.nl"] },
  { key: "raab", name: "Raab Karcher", color: "#7c2d12", domains: ["raabkarcher.nl"] },
  { key: "wurth", name: "Würth", color: "#991b1b", domains: ["wurth.nl", "würth.nl"] },
];

export const OTHER_COLOR = "#475569";

export function storeOf(card: Pick<StoreCard, "store" | "custom_name">) {
  const known = STORES.find((s) => s.key === card.store);
  return { name: known?.name ?? (card.custom_name?.trim() || "—"), color: known?.color ?? OTHER_COLOR };
}

// The store whose site a link points to, if the builder may have its card.
export function storeForUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return STORES.find((s) => s.domains.some((d) => host === d || host.endsWith(`.${d}`))) ?? null;
  } catch {
    return null;
  }
}

export function cleanNumber(raw: string) {
  return raw.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 120);
}

function eanValid(digits: string) {
  const d = digits.split("").map(Number);
  const sum = d.slice(0, 12).reduce((s, x, i) => s + x * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === d[12];
}

// Which barcode to draw: what the phone read from the photo wins; a typed number becomes EAN-13
// when it is a valid one (UPC-A gets a leading 0), anything else Code 128.
export function chooseFormat(number: string, detected?: string | null): { format: CardFormat; number: string } {
  if (detected === "qr_code") return { format: "qr", number };
  const digits = number.replace(/\s/g, "");
  if (/^\d{12}$/.test(digits) && eanValid(`0${digits}`)) return { format: "ean13", number: `0${digits}` };
  if (/^\d{13}$/.test(digits) && eanValid(digits)) return { format: "ean13", number: digits };
  return { format: "code128", number: /^[\d\s]+$/.test(number) ? digits : number };
}

// ---- EAN-13 ----
const EAN_L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const EAN_R = EAN_L.map((p) => p.replace(/./g, (c) => (c === "0" ? "1" : "0")));
const EAN_G = EAN_R.map((p) => p.split("").reverse().join(""));
const EAN_PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

function ean13Modules(digits: string) {
  const d = digits.split("").map(Number);
  const parity = EAN_PARITY[d[0]];
  let bits = "101";
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === "L" ? EAN_L : EAN_G)[d[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += EAN_R[d[i]];
  bits += "101";
  return bits;
}

// ---- Code 128 ----
const C128 = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

function code128Modules(text: string) {
  const ascii = text.replace(/[^\x20-\x7e]/g, "");
  let values: number[];
  if (/^\d+$/.test(ascii) && ascii.length % 2 === 0 && ascii.length >= 4) {
    values = [105];
    for (let i = 0; i < ascii.length; i += 2) values.push(Number(ascii.slice(i, i + 2)));
  } else {
    values = [104, ...ascii.split("").map((c) => c.charCodeAt(0) - 32)];
  }
  const check = values.reduce((s, v, i) => s + v * (i === 0 ? 1 : i), 0) % 103;
  let bits = "";
  for (const v of [...values, check, 106]) {
    C128[v].split("").forEach((w, i) => (bits += (i % 2 ? "0" : "1").repeat(Number(w))));
  }
  return bits;
}

// A 1D barcode as SVG: black bars on white with a quiet zone, stretched to the box it is put in.
export function barcodeSvg(format: Exclude<CardFormat, "qr">, number: string) {
  const bits = format === "ean13" ? ean13Modules(number) : code128Modules(number);
  const quiet = 10;
  let rects = "";
  for (let i = 0; i < bits.length; ) {
    if (bits[i] !== "1") {
      i++;
      continue;
    }
    let j = i;
    while (bits[j] === "1") j++;
    rects += `<rect x="${i + quiet}" y="0" width="${j - i}" height="100"/>`;
    i = j;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bits.length + quiet * 2} 100" preserveAspectRatio="none" width="100%" height="100%" shape-rendering="crispEdges"><rect width="100%" height="100" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
}

// Exposed for tests.
export const _modules = { ean13Modules, code128Modules };
