import { cookies, headers } from "next/headers";
import { isLang, LANGS, type Lang } from "./i18n";

// Language for visitors who are not signed in: cookie first, then the browser.
export async function requestLang(): Promise<Lang> {
  const fromCookie = (await cookies()).get("lang")?.value;
  if (isLang(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2).toLowerCase();
    if (isLang(code)) return code;
  }
  return LANGS[0];
}

export async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
