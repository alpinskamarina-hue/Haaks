"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/app/actions";
import { LANG_NAMES, LANGS, type Lang } from "@/lib/i18n";

export function LanguageSwitcher({ current, label }: { current: Lang; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1"
        value={current}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await setLanguage(e.target.value);
            router.refresh();
          })
        }
      >
        {LANGS.map((l) => (
          <option key={l} value={l}>
            {LANG_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
