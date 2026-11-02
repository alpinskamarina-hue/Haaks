import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { parseProductHtml, storeName, type ProductInfo } from "./materials";

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8000;

// Only public internet addresses: a pasted link must not reach our own network.
function privateAddress(ip: string) {
  if (ip.includes(":")) {
    const v6 = ip.toLowerCase();
    if (v6.startsWith("::ffff:")) return privateAddress(v6.slice(7));
    return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number) as [number, number];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

async function safeUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad protocol");
  if (url.username || url.password || (url.port && !["80", "443"].includes(url.port))) throw new Error("bad url");
  const host = url.hostname;
  if (isIP(host) || !host.includes(".") || /\.(local|internal|localhost)$/i.test(host)) throw new Error("bad host");
  const addrs = await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateAddress(a.address))) throw new Error("private host");
  return url;
}

// Reads a product page from a shop. Many shops block robots; then only the shop
// name is known and the worker types the name and price.
export async function fetchProductInfo(raw: string): Promise<ProductInfo> {
  const empty: ProductInfo = { title: null, image: null, price: null, store: storeName(raw) };
  try {
    let url = await safeUrl(raw);
    for (let hop = 0; hop < 4; hop++) {
      const res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "nl-NL,nl;q=0.9,en;q=0.8",
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = await safeUrl(new URL(res.headers.get("location")!, url).toString());
        continue;
      }
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html") || !res.body) return empty;
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      await reader.cancel().catch(() => undefined);
      const html = new TextDecoder().decode(Buffer.concat(chunks));
      const info = parseProductHtml(html, url.toString());
      return { ...info, store: info.store ?? empty.store };
    }
    return empty;
  } catch (err) {
    console.error("Product fetch failed", raw, err instanceof Error ? err.message : err);
    return empty;
  }
}
