// Texts for «О компании» in «Фирмы рядом». Machine-assisted translations.
import type { Lang } from "@/lib/i18n";

export type FirmAboutDict = {
  button: string;
  title: string;
  kmAway: string;
  hiresZzp: string;
  vacancies: string;
  years: Record<"one" | "few" | "many" | "other", string>;
  sinceYear: string;
  staff: string;
  what: string;
  works: string;
  aiNote: string;
  loading: string;
  noSite: string;
  siteFailed: string;
  noText: string;
  google: string;
};

const DICT: Record<Lang, FirmAboutDict> = {
  ru: {
    button: "🔍 О компании",
    title: "О компании",
    kmAway: "{n} км от вас",
    hiresZzp: "✓ Берут ZZP",
    vacancies: "Есть вакансии",
    years: { one: "{n} год", few: "{n} года", many: "{n} лет", other: "{n} лет" },
    sinceYear: "на рынке (с {y})",
    staff: "сотрудников",
    what: "Чем занимаются",
    works: "Какие работы",
    aiNote: "Кратко пересказано с их сайта · {date}",
    loading: "Читаем сайт фирмы…",
    noSite: "У фирмы нет сайта. Мы знаем только данные из Google Maps.",
    siteFailed: "Сайт фирмы сейчас не открывается. Попробуем снова через несколько дней.",
    noText: "Пересказ пока не готов. Откройте страницу ещё раз чуть позже.",
    google: "В Google Maps",
  },
  uk: {
    button: "🔍 Про компанію",
    title: "Про компанію",
    kmAway: "{n} км від вас",
    hiresZzp: "✓ Беруть ZZP",
    vacancies: "Є вакансії",
    years: { one: "{n} рік", few: "{n} роки", many: "{n} років", other: "{n} років" },
    sinceYear: "на ринку (з {y})",
    staff: "працівників",
    what: "Чим займаються",
    works: "Які роботи",
    aiNote: "Коротко переказано з їхнього сайту · {date}",
    loading: "Читаємо сайт фірми…",
    noSite: "У фірми немає сайту. Ми знаємо лише дані з Google Maps.",
    siteFailed: "Сайт фірми зараз не відкривається. Спробуємо знову за кілька днів.",
    noText: "Переказ ще не готовий. Відкрийте сторінку ще раз трохи пізніше.",
    google: "У Google Maps",
  },
  pl: {
    button: "🔍 O firmie",
    title: "O firmie",
    kmAway: "{n} km od ciebie",
    hiresZzp: "✓ Biorą ZZP",
    vacancies: "Mają oferty pracy",
    years: { one: "{n} rok", few: "{n} lata", many: "{n} lat", other: "{n} lat" },
    sinceYear: "na rynku (od {y})",
    staff: "pracowników",
    what: "Czym się zajmują",
    works: "Jakie prace",
    aiNote: "Krótko streszczone z ich strony · {date}",
    loading: "Czytamy stronę firmy…",
    noSite: "Firma nie ma strony. Znamy tylko dane z Google Maps.",
    siteFailed: "Strona firmy teraz się nie otwiera. Spróbujemy ponownie za kilka dni.",
    noText: "Streszczenie nie jest jeszcze gotowe. Otwórz stronę ponownie trochę później.",
    google: "W Google Maps",
  },
  ro: {
    button: "🔍 Despre firmă",
    title: "Despre firmă",
    kmAway: "La {n} km de tine",
    hiresZzp: "✓ Lucrează cu ZZP",
    vacancies: "Au locuri de muncă",
    years: { one: "{n} an", few: "{n} ani", many: "{n} de ani", other: "{n} de ani" },
    sinceYear: "pe piață (din {y})",
    staff: "angajați",
    what: "Ce fac",
    works: "Ce lucrări",
    aiNote: "Rezumat scurt de pe site-ul lor · {date}",
    loading: "Citim site-ul firmei…",
    noSite: "Firma nu are site. Știm doar datele din Google Maps.",
    siteFailed: "Site-ul firmei nu se deschide acum. Încercăm din nou peste câteva zile.",
    noText: "Rezumatul nu e gata încă. Deschide pagina din nou puțin mai târziu.",
    google: "În Google Maps",
  },
  tr: {
    button: "🔍 Firma hakkında",
    title: "Firma hakkında",
    kmAway: "Size {n} km",
    hiresZzp: "✓ ZZP ile çalışıyor",
    vacancies: "İş ilanları var",
    years: { one: "{n} yıl", few: "{n} yıl", many: "{n} yıl", other: "{n} yıl" },
    sinceYear: "piyasada ({y} yılından beri)",
    staff: "çalışan",
    what: "Ne yapıyorlar",
    works: "Hangi işler",
    aiNote: "Sitelerinden kısa özet · {date}",
    loading: "Firmanın sitesini okuyoruz…",
    noSite: "Firmanın sitesi yok. Sadece Google Maps bilgilerini biliyoruz.",
    siteFailed: "Firmanın sitesi şu an açılmıyor. Birkaç gün sonra tekrar deneyeceğiz.",
    noText: "Özet henüz hazır değil. Sayfayı biraz sonra tekrar açın.",
    google: "Google Maps'te",
  },
  en: {
    button: "🔍 About the firm",
    title: "About the firm",
    kmAway: "{n} km from you",
    hiresZzp: "✓ Works with ZZP",
    vacancies: "Has job openings",
    years: { one: "{n} year", few: "{n} years", many: "{n} years", other: "{n} years" },
    sinceYear: "in business (since {y})",
    staff: "employees",
    what: "What they do",
    works: "Kinds of work",
    aiNote: "Short summary of their website · {date}",
    loading: "Reading the firm's website…",
    noSite: "The firm has no website. We only know the Google Maps details.",
    siteFailed: "The firm's website doesn't open right now. We'll try again in a few days.",
    noText: "The summary isn't ready yet. Open the page again a bit later.",
    google: "On Google Maps",
  },
  nl: {
    button: "🔍 Over het bedrijf",
    title: "Over het bedrijf",
    kmAway: "{n} km van je",
    hiresZzp: "✓ Werkt met zzp'ers",
    vacancies: "Heeft vacatures",
    years: { one: "{n} jaar", few: "{n} jaar", many: "{n} jaar", other: "{n} jaar" },
    sinceYear: "actief (sinds {y})",
    staff: "medewerkers",
    what: "Wat ze doen",
    works: "Soorten werk",
    aiNote: "Korte samenvatting van hun website · {date}",
    loading: "We lezen de website van het bedrijf…",
    noSite: "Het bedrijf heeft geen website. We kennen alleen de gegevens uit Google Maps.",
    siteFailed: "De website van het bedrijf opent nu niet. We proberen het over een paar dagen opnieuw.",
    noText: "De samenvatting is nog niet klaar. Open de pagina straks opnieuw.",
    google: "In Google Maps",
  },
};

export function getFirmAboutDict(lang: Lang): FirmAboutDict {
  return DICT[lang] ?? DICT.en;
}

export function yearsText(t: FirmAboutDict, lang: Lang, n: number) {
  const form = new Intl.PluralRules(lang).select(n) as keyof FirmAboutDict["years"];
  return (t.years[form] ?? t.years.other).replace("{n}", String(n));
}
