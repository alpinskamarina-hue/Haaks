import type { Lang } from "@/lib/i18n";

const SOON: Record<Lang, string> = {
  ru: "скоро",
  uk: "незабаром",
  pl: "wkrótce",
  ro: "în curând",
  tr: "yakında",
  en: "soon",
  nl: "binnenkort",
};

// WhatsApp sending is not connected yet: shown greyed out so workers know it is coming.
export function WhatsAppSoon({ lang }: { lang: Lang }) {
  return (
    <span
      aria-disabled="true"
      className="cursor-not-allowed rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-400"
    >
      WhatsApp · {SOON[lang]}
    </span>
  );
}
