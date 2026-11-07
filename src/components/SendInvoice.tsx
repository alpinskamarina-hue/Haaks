"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markInvoiceSent } from "@/app/invoices-actions";
import { WhatsAppSoon } from "@/components/WhatsAppSoon";
import type { Lang } from "@/lib/i18n";
import type { SendKind } from "@/lib/invoice-messages";

// «Send to client» / «Remind»: the Dutch e-mail is ready and can be changed. The builder's own mail
// app sends it (Haaks has no mail server yet); Haaks marks the invoice sent or counts the reminder.
export function SendInvoice({
  invoiceId,
  kind,
  email,
  subject,
  message,
  lang,
  labels,
}: {
  invoiceId: string;
  kind: SendKind;
  email: string;
  subject: string;
  message: string;
  lang: Lang;
  labels: { title: string; hint: string; to: string; placeholder: string; text: string; tr: string; send: string; note: string; copy: string; copied: string };
}) {
  const router = useRouter();
  const [to, setTo] = useState(email);
  const [text, setText] = useState(message);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    await markInvoiceSent(invoiceId, kind, to);
    window.location.href = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    setBusy(false);
    router.refresh();
  };
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(true);
    await markInvoiceSent(invoiceId, kind, to);
    router.refresh();
  };
  const field = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base";

  return (
    <section id="send" className="scroll-mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
      <h2 className="text-lg font-bold">{labels.title}</h2>
      <p className="mt-1 text-sm text-slate-700">{labels.hint}</p>
      <label className="mt-3 block text-sm font-medium">
        {labels.to}
        <input type="email" inputMode="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder={labels.placeholder} className={field} />
      </label>
      <label className="mt-3 block text-sm font-medium">
        {labels.text}
        <textarea lang="nl" value={text} onChange={(e) => setText(e.target.value)} rows={9} className={`${field} text-sm leading-relaxed`} />
      </label>
      {labels.tr && <p className="mt-1 text-xs text-slate-600">{labels.tr}</p>}
      <button type="button" onClick={send} disabled={busy} className="mt-3 w-full rounded-lg bg-orange-600 px-4 py-3 font-bold text-white disabled:opacity-60">
        {labels.send}
      </button>
      <p className="mt-1 text-center text-xs text-slate-500">{labels.note}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={copy} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium">
          {copied ? labels.copied : labels.copy}
        </button>
        <WhatsAppSoon lang={lang} />
      </div>
    </section>
  );
}
