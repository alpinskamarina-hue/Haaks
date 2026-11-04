"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLanguage } from "@/app/actions";
import { Flag } from "@/components/Flag";
import { LANG_NAMES, LANGS, type Lang } from "@/lib/i18n";

// Language picker: the button shows the flag of the current language, the list shows
// all flags with the language name next to each.
// up: the list opens above the button; alignRight: the list grows to the left from the button's right edge
// (for a button on the right side of a phone screen).
export function LanguageSwitcher({ current, label, up, alignRight }: { current: Lang; label: string; up?: boolean; alignRight?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const choose = (l: Lang) => {
    setOpen(false);
    if (l === current) return;
    startTransition(async () => {
      await setLanguage(l);
      router.refresh();
    });
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={pending}
        aria-label={`${label}: ${LANG_NAMES[current]}`}
        aria-expanded={open}
        title={LANG_NAMES[current]}
        className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 disabled:opacity-50"
      >
        <Flag lang={current} />
        <svg viewBox="0 0 20 20" className="h-4 w-4 text-slate-500" aria-hidden="true">
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className={`absolute z-30 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ${
            `${up ? "bottom-full mb-1" : "mt-1"} ${alignRight || !up ? "right-0" : "left-0"}`
          }`}
        >
          {LANGS.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === current}
                onClick={() => choose(l)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  l === current ? "bg-orange-50 font-semibold text-orange-700" : "text-slate-700"
                }`}
              >
                <Flag lang={l} />
                {LANG_NAMES[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
