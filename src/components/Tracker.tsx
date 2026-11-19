"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Counts one page view per page for the admin analytics. No cookies: the first source is kept in
// this browser's localStorage only to credit a later sign-up; a tab session marks the entry page.
const FIRST = "haaks_first";
const SESSION = "haaks_visit";

function read(store: () => Storage, key: string) {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
}
function write(store: () => Storage, key: string, value: string) {
  try {
    store().setItem(key, value);
  } catch {
    /* private mode */
  }
}

export function Tracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/zz")) return;
    const q = new URLSearchParams(window.location.search);
    const entry = !read(() => sessionStorage, SESSION);
    if (entry) write(() => sessionStorage, SESSION, "1");
    let first: { s?: string; c?: string } = {};
    try {
      first = JSON.parse(read(() => localStorage, FIRST) ?? "{}") as { s?: string; c?: string };
    } catch {
      first = {};
    }
    const payload = {
      path: pathname,
      referrer: entry ? document.referrer : null,
      entry,
      utm_source: q.get("utm_source"),
      utm_medium: q.get("utm_medium"),
      utm_campaign: q.get("utm_campaign"),
      ref: q.get("ref"),
      lang: navigator.language,
      first_source: first.s ?? null,
      first_campaign: first.c ?? null,
    };
    fetch("/api/t", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), keepalive: true })
      .then((r) => r.json() as Promise<{ source?: string | null; campaign?: string | null }>)
      .then((r) => {
        if (!first.s && r?.source) write(() => localStorage, FIRST, JSON.stringify({ s: r.source, c: r.campaign ?? undefined }));
      })
      .catch(() => {});
  }, [pathname]);
  return null;
}
