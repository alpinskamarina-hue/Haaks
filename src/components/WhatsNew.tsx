"use client";

import Link from "next/link";
import { useState } from "react";
import { Mascot } from "@/components/Mascot";

// «Что нового»: shown once to builders who used Haaks before the update, until «Понятно».
export const WHATS_NEW_COOKIE = "haaks_whats_new";
export const WHATS_NEW_VERSION = "2026-11-07";

export function WhatsNew({
  items,
  t,
}: {
  items: { icon: string; text: string; href: string }[];
  t: { title: string; intro: string; ok: string; all: string };
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const close = () => {
    document.cookie = `${WHATS_NEW_COOKIE}=${WHATS_NEW_VERSION}; path=/; max-age=${365 * 86400}; samesite=lax`;
    setHidden(true);
  };
  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
      <div className="flex items-start gap-3">
        <Mascot size={64} className="shrink-0" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold">✨ {t.title}</h2>
          <p className="text-sm text-slate-700">{t.intro}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="flex items-start gap-3 rounded-xl bg-white p-3 text-sm shadow-sm">
              <span className="text-xl leading-none">{i.icon}</span>
              <span className="min-w-0 flex-1">{i.text}</span>
              <span className="shrink-0 text-orange-700">→</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={close} className="rounded-lg bg-sky-700 px-3 py-2.5 font-bold text-white">
          {t.ok}
        </button>
        <Link href="/dashboard/help" className="rounded-lg border border-sky-300 bg-white px-3 py-2.5 text-center font-semibold text-sky-900">
          {t.all}
        </Link>
      </div>
    </section>
  );
}
