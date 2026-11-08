"use client";

import { useActionState, useState } from "react";
import type { ClientReplyState } from "@/app/feed-actions";
import { PHRASES, type ClientCardDict } from "@/lib/client-request-i18n";

// The reply to a private client's job: tick ready phrases (the client reads them in Dutch) and
// add an own line. Opens from one main button so the card stays calm.
export function ClientReplyForm({
  action,
  t,
  quotaLine,
}: {
  action: (prev: ClientReplyState, formData: FormData) => Promise<ClientReplyState>;
  t: ClientCardDict;
  quotaLine?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});
  if (!open) {
    return (
      <div>
        <button type="button" onClick={() => setOpen(true)} className="w-full rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white">
          🙋 {t.reply}
        </button>
        <p className="mt-1 text-xs text-slate-500">{t.replyHint}</p>
        {quotaLine && <p className="mt-1 text-xs font-medium text-orange-800">{quotaLine}</p>}
      </div>
    );
  }
  return (
    <form action={formAction} className="rounded-xl border border-orange-200 bg-orange-50 p-3">
      <p className="text-sm font-semibold">{t.phrasesTitle}</p>
      <div className="mt-2 space-y-1.5">
        {PHRASES.map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="phrase" value={p} className="h-4 w-4 accent-orange-600" />
            {t.phrases[p]}
          </label>
        ))}
      </div>
      <label className="mt-3 block text-sm font-medium">
        {t.message}
        <textarea
          name="message"
          maxLength={1000}
          rows={3}
          placeholder={t.messageHint}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
        />
      </label>
      {state.error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{t.errors[state.error]}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
          {pending ? "…" : t.send}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5">
          ✕
        </button>
      </div>
    </form>
  );
}
