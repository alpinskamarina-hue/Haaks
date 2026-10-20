"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDict, isLang, type Dict } from "@/lib/i18n";

// Shown instead of the bare Next.js error page when something in the cabinet
// fails (no connection, session expired), in the worker's own language.
export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const [t, setT] = useState<Dict>(getDict("en"));
  useEffect(() => {
    console.error(error);
    const lang = document.documentElement.lang;
    if (isLang(lang)) setT(getDict(lang));
  }, [error]);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">{t.errorTitle}</h1>
      <p className="text-slate-600">{t.errorHint}</p>
      <div className="flex justify-center gap-2">
        <button onClick={reset} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white">
          {t.errorRetry}
        </button>
        <Link href="/dashboard" className="rounded-lg border border-slate-300 px-4 py-2">
          {t.navHome}
        </Link>
      </div>
    </main>
  );
}
