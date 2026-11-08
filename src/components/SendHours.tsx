"use client";

import { useState } from "react";
import { WhatsAppSoon } from "@/components/WhatsAppSoon";
import type { Lang } from "@/lib/i18n";

// E-mail or copy the Dutch message with the approval link (WhatsApp comes later).
export function SendHours({ message, subject, labels, lang }: { message: string; subject: string; labels: { copy: string; copied: string }; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(message).catch(() => undefined);
    setCopied(true);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
      >
        ✉ E-mail
      </a>
      <button type="button" onClick={copy} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium">
        {copied ? `✓ ${labels.copied}` : `⧉ ${labels.copy}`}
      </button>
      <WhatsAppSoon lang={lang} />
    </div>
  );
}
