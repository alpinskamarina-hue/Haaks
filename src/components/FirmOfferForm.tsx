"use client";

import { useState, useTransition } from "react";
import { recordFirmOffer } from "@/app/dashboard/leads/firms/actions";

type Texts = { edit: string; whatsapp: string; email: string; copy: string; copied: string; noEmail: string; error: string; limit: string };

// The Dutch message for one firm, editable, sent through the builder's own WhatsApp or mail app.
export function FirmOfferForm({
  firmId,
  initial,
  subject,
  wa,
  email,
  t,
}: {
  firmId: string;
  initial: string;
  subject: string;
  wa: string | null;
  email: string | null;
  t: Texts;
}) {
  const [text, setText] = useState(initial);
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const send = (channel: "whatsapp" | "email" | "copy") =>
    start(async () => {
      setNote(null);
      if (channel === "copy") {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          setNote(t.error);
          return;
        }
      }
      const res = await recordFirmOffer(firmId, channel);
      if ("error" in res) {
        setNote(res.error === "limit" ? t.limit : t.error);
        return;
      }
      if (channel === "whatsapp" && wa) window.location.href = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
      else if (channel === "email" && email)
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      else setNote(t.copied);
    });

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {t.edit}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm leading-relaxed"
        />
      </label>
      <div className="flex gap-2">
        {wa && (
          <button
            type="button"
            disabled={pending}
            onClick={() => send("whatsapp")}
            className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {t.whatsapp}
          </button>
        )}
        {email && (
          <button
            type="button"
            disabled={pending}
            onClick={() => send("email")}
            className="flex-1 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {t.email}
          </button>
        )}
      </div>
      {!email && <p className="text-sm text-slate-500">{t.noEmail}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() => send("copy")}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-60"
      >
        {t.copy}
      </button>
      {note && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{note}</p>}
    </div>
  );
}
