// Texts for vacancy cards in the feed (source Google Jobs). Machine-assisted translations.
import type { Lang } from "@/lib/i18n";

export type VacancyDict = { apply: string; bureau: string; bureauHint: string; badge: string };

const DICT: Record<Lang, VacancyDict> = {
  ru: { apply: "Откликнуться на вакансию", bureau: "через бюро", bureauHint: "Вакансию разместило бюро-посредник, а не сама фирма.", badge: "Вакансия" },
  uk: { apply: "Відгукнутися на вакансію", bureau: "через бюро", bureauHint: "Вакансію розмістило бюро-посередник, а не сама фірма.", badge: "Вакансія" },
  pl: { apply: "Odpowiedz na ofertę", bureau: "przez biuro", bureauHint: "Ofertę dodało biuro pośrednictwa, nie sama firma.", badge: "Oferta pracy" },
  ro: { apply: "Aplică la anunț", bureau: "prin agenție", bureauHint: "Anunțul e pus de o agenție, nu de firma însăși.", badge: "Loc de muncă" },
  tr: { apply: "İlana başvur", bureau: "aracı büro", bureauHint: "İlanı firmanın kendisi değil, aracı bir büro verdi.", badge: "İş ilanı" },
  en: { apply: "Apply for this job", bureau: "via agency", bureauHint: "Posted by an agency, not by the firm itself.", badge: "Job" },
  nl: { apply: "Reageer op de vacature", bureau: "via bureau", bureauHint: "Geplaatst door een bemiddelingsbureau, niet door het bedrijf zelf.", badge: "Vacature" },
};

export function getVacancyDict(lang: Lang): VacancyDict {
  return DICT[lang] ?? DICT.en;
}
