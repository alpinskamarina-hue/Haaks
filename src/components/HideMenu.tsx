"use client";

import { useState, type ReactNode } from "react";
import { SubmitButton } from "@/components/SubmitButton";

type Choice = { key: string; label: string; action: () => Promise<void> };

// «Hide» asks why in one tap (bottom sheet on a phone); the reason can be skipped.
export function HideMenu({
  icon,
  label,
  title,
  hint,
  choices,
  skip,
  cancel,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  hint: string;
  choices: Choice[];
  skip: { label: string; action: () => Promise<void> };
  cancel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        {icon}
        {label}
      </button>
      {open && (
        <>
          <button type="button" aria-label={cancel} onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default bg-slate-900/40 sm:bg-transparent" />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-slate-200 bg-white p-5 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] sm:absolute sm:inset-x-auto sm:bottom-full sm:left-1/2 sm:mb-2 sm:w-80 sm:-translate-x-1/2 sm:rounded-2xl sm:p-4">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-slate-500">{hint}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={cancel} className="text-xl leading-none text-slate-400">
                ✕
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {choices.map((c) => (
                <form key={c.key} action={c.action}>
                  <SubmitButton className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:border-orange-500 hover:bg-orange-50 disabled:opacity-60">
                    {c.label}
                  </SubmitButton>
                </form>
              ))}
            </div>
            <form action={skip.action} className="mt-3">
              <SubmitButton className="text-sm font-semibold text-orange-700 disabled:opacity-60">{skip.label}</SubmitButton>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
