"use client";

import { useState } from "react";
import { WhatsAppSoon } from "@/components/WhatsAppSoon";
import type { Lang } from "@/lib/i18n";

// Opens an e-mail with the Dutch message and the review link, or copies it.
export function SendReview({
  lang,
  message,
  subject,
  labels,
}: {
  lang: Lang;
  message: string;
  subject: string;
  labels: { email: string; copy: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
      >
        ✉ {labels.email}
      </a>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(message).catch(() => undefined);
          setCopied(true);
        }}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
      >
        {copied ? `✓ ${labels.copied}` : `⧉ ${labels.copy}`}
      </button>
      <WhatsAppSoon lang={lang} />
    </div>
  );
}
