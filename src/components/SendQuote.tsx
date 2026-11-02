"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markQuoteSent } from "@/app/quotes-actions";
import { WhatsAppSoon } from "@/components/WhatsAppSoon";
import type { Lang } from "@/lib/i18n";

// "Send to client": opens WhatsApp or e-mail with the Dutch message and the offer link,
// or copies it for a Telegram post. The worker sends it; Haaks marks the offer as sent
// so the client can press "Akkoord".
export function SendQuote({
  quoteId,
  message,
  email,
  original,
  labels,
  lang,
}: {
  lang: Lang;
  quoteId: string;
  message: string;
  email: string;
  original: string | null;
  labels: { whatsapp: string; email: string; copy: string; copied: string; original: string };
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const markSent = async () => {
    await markQuoteSent(quoteId);
    router.refresh();
  };
  const open = async (href: string) => {
    await markQuoteSent(quoteId);
    window.location.href = href;
  };
  const copy = async (thenOpen?: string) => {
    await navigator.clipboard.writeText(message).catch(() => undefined);
    // Opened right away, before any await, or the phone's browser blocks the new tab.
    if (thenOpen) window.open(thenOpen, "_blank");
    setCopied(true);
    await markSent();
  };
  const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => open(email)} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
        ✉ {labels.email}
      </button>
      {original && (
        <button type="button" onClick={() => copy(original)} className={button}>
          {labels.original}
        </button>
      )}
      <button type="button" onClick={() => copy()} className={button}>
        {copied ? `✓ ${labels.copied}` : `⧉ ${labels.copy}`}
      </button>
      <WhatsAppSoon lang={lang} />
    </div>
  );
}
