// «Фирмы рядом»: construction firms near the builder (Google Maps, through Treg).
// Not jobs: firms a builder can offer themselves to as a subcontractor.
import type { Lang } from "@/lib/i18n";

export type FirmsDict = {
  title: string;
  intro: string;
  card: string;
  cardText: string;
  site: string;
  call: string;
  map: string;
  kmAway: string;
  reviews: string;
  empty: string;
  noHome: string;
  back: string;
  source: string;
  test: string;
};

const DICTS: Record<Lang, FirmsDict> = {
  ru: {
    title: "Фирмы рядом",
    intro:
      "Строительные фирмы рядом с вами. Это не заказы: позвоните или напишите им и предложите себя как субподрядчика.",
    card: "🏢 Фирмы рядом",
    cardText: "Строительные фирмы рядом: {n}",
    site: "Сайт",
    call: "Позвонить",
    map: "На карте",
    kmAway: "{n} км",
    reviews: "отзывов: {n}",
    empty: "Фирм рядом пока нет.",
    noHome: "Укажите город в профиле, чтобы видеть расстояние.",
    back: "← К ленте",
    source: "Источник: Google Maps",
    test: "Пробный раздел",
  },
  uk: {
    title: "Фірми поруч",
    intro:
      "Будівельні фірми поруч з вами. Це не замовлення: зателефонуйте або напишіть їм і запропонуйте себе як субпідрядника.",
    card: "🏢 Фірми поруч",
    cardText: "Будівельні фірми поруч: {n}",
    site: "Сайт",
    call: "Зателефонувати",
    map: "На карті",
    kmAway: "{n} км",
    reviews: "відгуків: {n}",
    empty: "Фірм поруч поки немає.",
    noHome: "Вкажіть місто в профілі, щоб бачити відстань.",
    back: "← До стрічки",
    source: "Джерело: Google Maps",
    test: "Пробний розділ",
  },
  pl: {
    title: "Firmy w pobliżu",
    intro:
      "Firmy budowlane w Twojej okolicy. To nie są zlecenia: zadzwoń lub napisz i zaproponuj się jako podwykonawca.",
    card: "🏢 Firmy w pobliżu",
    cardText: "Firmy budowlane w pobliżu: {n}",
    site: "Strona",
    call: "Zadzwoń",
    map: "Na mapie",
    kmAway: "{n} km",
    reviews: "opinii: {n}",
    empty: "Brak firm w pobliżu.",
    noHome: "Podaj miasto w profilu, aby widzieć odległość.",
    back: "← Do tablicy",
    source: "Źródło: Google Maps",
    test: "Sekcja testowa",
  },
  ro: {
    title: "Firme în apropiere",
    intro:
      "Firme de construcții din apropiere. Nu sunt comenzi: sună-le sau scrie-le și oferă-te ca subcontractor.",
    card: "🏢 Firme în apropiere",
    cardText: "Firme de construcții în apropiere: {n}",
    site: "Site",
    call: "Sună",
    map: "Pe hartă",
    kmAway: "{n} km",
    reviews: "recenzii: {n}",
    empty: "Încă nu sunt firme în apropiere.",
    noHome: "Completează orașul în profil ca să vezi distanța.",
    back: "← Înapoi la flux",
    source: "Sursa: Google Maps",
    test: "Secțiune de test",
  },
  tr: {
    title: "Yakındaki firmalar",
    intro:
      "Yakınınızdaki inşaat firmaları. Bunlar iş ilanı değil: arayın veya yazın ve kendinizi taşeron olarak önerin.",
    card: "🏢 Yakındaki firmalar",
    cardText: "Yakındaki inşaat firmaları: {n}",
    site: "Web sitesi",
    call: "Ara",
    map: "Haritada",
    kmAway: "{n} km",
    reviews: "{n} yorum",
    empty: "Yakında henüz firma yok.",
    noHome: "Mesafeyi görmek için profilinize şehrinizi ekleyin.",
    back: "← Akışa dön",
    source: "Kaynak: Google Maps",
    test: "Deneme bölümü",
  },
  en: {
    title: "Firms nearby",
    intro:
      "Construction firms near you. These are not jobs: call or write to them and offer yourself as a subcontractor.",
    card: "🏢 Firms nearby",
    cardText: "Construction firms nearby: {n}",
    site: "Website",
    call: "Call",
    map: "On the map",
    kmAway: "{n} km",
    reviews: "{n} reviews",
    empty: "No firms nearby yet.",
    noHome: "Add your city in the profile to see the distance.",
    back: "← Back to the feed",
    source: "Source: Google Maps",
    test: "Test section",
  },
  nl: {
    title: "Bedrijven in de buurt",
    intro:
      "Bouwbedrijven bij jou in de buurt. Dit zijn geen klussen: bel of mail ze en bied jezelf aan als onderaannemer.",
    card: "🏢 Bedrijven in de buurt",
    cardText: "Bouwbedrijven in de buurt: {n}",
    site: "Website",
    call: "Bellen",
    map: "Op de kaart",
    kmAway: "{n} km",
    reviews: "{n} reviews",
    empty: "Nog geen bedrijven in de buurt.",
    noHome: "Vul je plaats in je profiel in om de afstand te zien.",
    back: "← Terug naar de feed",
    source: "Bron: Google Maps",
    test: "Testonderdeel",
  },
};

export function getFirmsDict(lang: Lang): FirmsDict {
  return DICTS[lang] ?? DICTS.en;
}
