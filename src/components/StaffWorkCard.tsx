"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveStaffWork } from "@/app/staff-actions";
import type { StaffWorkDict } from "@/lib/staff-profile-i18n";

export type StaffWorkView = {
  title: string;
  description: string | null;
  meta: string;
  orderTitle: string | null;
  before: string[];
  after: string[];
  doneHref: string | null;
};

// A finished job the employee prepared from chat photos; only the worker's tap adds it to «Мои работы».
export function StaffWorkCard({ messageId, view, d }: { messageId: string; view: StaffWorkView; d: StaffWorkDict }) {
  const [href, setHref] = useState(view.doneHref);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const strip = (label: string, urls: string[]) =>
    urls.length > 0 && (
      <div className="mt-2">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {urls.map((u) => (
            <img key={u} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
      <p className="font-semibold">🛠 {d.title}: {view.title}</p>
      {view.meta && <p className="text-xs text-slate-500">{view.meta}</p>}
      {view.description && <p className="mt-1 text-slate-700">{view.description}</p>}
      {view.orderTitle && (
        <p className="mt-1 text-xs text-slate-500">
          {d.order}: {view.orderTitle}
        </p>
      )}
      {strip(d.before, view.before)}
      {strip(d.after, view.after)}
      {href ? (
        <Link href={href} className="mt-3 block rounded-xl bg-orange-600 py-2.5 text-center font-semibold text-white">
          ✓ {d.added} · {d.open}
        </Link>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(false);
              const res = await saveStaffWork(messageId);
              if ("href" in res) setHref(res.href);
              else setError(true);
            })
          }
          className="mt-3 w-full rounded-xl bg-orange-600 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : d.add}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{d.failed}</p>}
      {!href && <p className="mt-2 text-xs text-slate-500">🔒 {d.note}</p>}
    </div>
  );
}
