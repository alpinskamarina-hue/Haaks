"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markMaterialListSent } from "@/app/materials-actions";

// WhatsApp, e-mail or copy: the worker sends the Dutch message with the link
// from their own phone; Haaks marks the list as sent so the client can agree.
export function SendMaterials({
  listId,
  message,
  subject,
  labels,
}: {
  listId: string;
  message: string;
  subject: string;
  labels: { copy: string; copied: string };
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const open = async (href: string) => {
    await markMaterialListSent(listId);
    window.location.href = href;
  };
  const copy = async () => {
    await navigator.clipboard.writeText(message).catch(() => undefined);
    setCopied(true);
    await markMaterialListSent(listId);
    router.refresh();
  };
  const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => open(`https://wa.me/?text=${encodeURIComponent(message)}`)}
        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
      >
        WhatsApp
      </button>
      <button
        type="button"
        onClick={() => open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`)}
        className={button}
      >
        E-mail
      </button>
      <button type="button" onClick={copy} className={button}>
        {copied ? `✓ ${labels.copied}` : `⧉ ${labels.copy}`}
      </button>
    </div>
  );
}
