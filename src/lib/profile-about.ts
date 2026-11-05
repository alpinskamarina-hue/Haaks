// «О себе» on the profile: a short Dutch text for clients, built from the builder's own data
// (name, trades, experience, strengths, area, languages). The builder can change the words.
// The same text in the builder's own language is shown as a translation.

import type { Lang } from "./i18n";
import { toLatin } from "./username";
import type { WorkerProfile } from "./worker-profile";
import { getWorkerDict } from "./worker-profile-text";

export const EXPERIENCE = [1, 3, 5, 10] as const; // 1–3, 3–5, 5–10, 10+ years
export type Experience = (typeof EXPERIENCE)[number];
export const STRENGTHS = ["neat", "on_time", "own_tools", "clean_up", "warranty"] as const;
export type Strength = (typeof STRENGTHS)[number];
export const ABOUT_MAX = 600;

export type AboutFacts = {
  lang: Lang;
  first: string;
  trades: string[];
  city: string | null;
  km: number | null;
  extra: string[];
  languages: string[];
};

type Gen = {
  intro: (first: string, trades: string, exp: string) => string;
  exp: Record<Experience, string>;
  and: string;
  strengths: Record<Strength, string>;
  strengthsLine: (list: string) => string;
  area: (city: string, km: number | null) => string;
  everywhere: string;
  also: (list: string) => string;
  speaks: (list: string) => string;
  lowerLanguages: boolean;
};

const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

const GEN: Record<Lang, Gen> = {
  nl: {
    intro: (f, t, e) => `Ik ben ${f}${t ? `, ${t}` : ", vakman in de bouw"}${e ? ` met ${e}` : ""}.`,
    exp: { 1: "1 tot 3 jaar ervaring", 3: "3 tot 5 jaar ervaring", 5: "5 tot 10 jaar ervaring", 10: "meer dan 10 jaar ervaring" },
    and: "en",
    strengths: {
      neat: "werk netjes", on_time: "kom op tijd", own_tools: "heb mijn eigen gereedschap",
      clean_up: "ruim alles op na het werk", warranty: "geef garantie op mijn werk",
    },
    strengthsLine: (l) => `Ik ${l}.`,
    area: (c, km) => `Ik werk in ${c}${km ? ` en omgeving (tot ${km} km)` : ""}.`,
    everywhere: "Ik werk in heel Nederland.",
    also: (l) => `Ook in ${l}.`,
    speaks: (l) => `Ik spreek ${l}.`,
    lowerLanguages: false,
  },
  en: {
    intro: (f, t, e) => `I'm ${f}${t ? ` — ${t}` : ", a construction worker"}${e ? `, ${e}` : ""}.`,
    exp: { 1: "1–3 years of experience", 3: "3–5 years of experience", 5: "5–10 years of experience", 10: "more than 10 years of experience" },
    and: "and",
    strengths: {
      neat: "work neatly", on_time: "arrive on time", own_tools: "have my own tools",
      clean_up: "clean up after the job", warranty: "give a guarantee on my work",
    },
    strengthsLine: (l) => `I ${l}.`,
    area: (c, km) => `I work in ${c}${km ? ` and around (up to ${km} km)` : ""}.`,
    everywhere: "I work all over the Netherlands.",
    also: (l) => `Also in ${l}.`,
    speaks: (l) => `I speak ${l}.`,
    lowerLanguages: false,
  },
  ru: {
    intro: (f, t, e) => `Я ${f}${t ? ` — ${t}` : ", строитель"}${e ? `, ${e}` : ""}.`,
    exp: { 1: "опыт 1–3 года", 3: "опыт 3–5 лет", 5: "опыт 5–10 лет", 10: "опыт больше 10 лет" },
    and: "и",
    strengths: {
      neat: "работаю аккуратно", on_time: "прихожу вовремя", own_tools: "работаю своим инструментом",
      clean_up: "убираю за собой", warranty: "даю гарантию на работу",
    },
    strengthsLine: (l) => `${cap(l)}.`,
    area: (c, km) => `Район работы: ${c}${km ? ` и до ${km} км вокруг` : ""}.`,
    everywhere: "Работаю по всем Нидерландам.",
    also: (l) => `Также: ${l}.`,
    speaks: (l) => `Говорю: ${l}.`,
    lowerLanguages: true,
  },
  uk: {
    intro: (f, t, e) => `Я ${f}${t ? ` — ${t}` : ", будівельник"}${e ? `, ${e}` : ""}.`,
    exp: { 1: "досвід 1–3 роки", 3: "досвід 3–5 років", 5: "досвід 5–10 років", 10: "досвід понад 10 років" },
    and: "і",
    strengths: {
      neat: "працюю акуратно", on_time: "приходжу вчасно", own_tools: "працюю своїм інструментом",
      clean_up: "прибираю за собою", warranty: "даю гарантію на роботу",
    },
    strengthsLine: (l) => `${cap(l)}.`,
    area: (c, km) => `Район роботи: ${c}${km ? ` і до ${km} км навколо` : ""}.`,
    everywhere: "Працюю по всіх Нідерландах.",
    also: (l) => `Також: ${l}.`,
    speaks: (l) => `Розмовляю: ${l}.`,
    lowerLanguages: true,
  },
  pl: {
    intro: (f, t, e) => `Jestem ${f}${t ? ` — ${t}` : ", budowlaniec"}${e ? `, ${e}` : ""}.`,
    exp: { 1: "1–3 lata doświadczenia", 3: "3–5 lat doświadczenia", 5: "5–10 lat doświadczenia", 10: "ponad 10 lat doświadczenia" },
    and: "i",
    strengths: {
      neat: "pracuję starannie", on_time: "przychodzę na czas", own_tools: "mam własne narzędzia",
      clean_up: "sprzątam po sobie", warranty: "daję gwarancję na pracę",
    },
    strengthsLine: (l) => `${cap(l)}.`,
    area: (c, km) => `Obszar pracy: ${c}${km ? ` i do ${km} km wokół` : ""}.`,
    everywhere: "Pracuję w całej Holandii.",
    also: (l) => `Także: ${l}.`,
    speaks: (l) => `Mówię: ${l}.`,
    lowerLanguages: true,
  },
  ro: {
    intro: (f, t, e) => `Sunt ${f}${t ? ` — ${t}` : ", constructor"}${e ? `, ${e}` : ""}.`,
    exp: { 1: "1–3 ani de experiență", 3: "3–5 ani de experiență", 5: "5–10 ani de experiență", 10: "peste 10 ani de experiență" },
    and: "și",
    strengths: {
      neat: "lucrez curat", on_time: "vin la timp", own_tools: "am sculele mele",
      clean_up: "fac curat după lucru", warranty: "ofer garanție pentru lucrare",
    },
    strengthsLine: (l) => `${cap(l)}.`,
    area: (c, km) => `Zona de lucru: ${c}${km ? ` și până la ${km} km în jur` : ""}.`,
    everywhere: "Lucrez în toată Olanda.",
    also: (l) => `De asemenea: ${l}.`,
    speaks: (l) => `Vorbesc: ${l}.`,
    lowerLanguages: true,
  },
  tr: {
    intro: (f, t, e) => `Ben ${f}${t ? ` — ${t}` : ", inşaat ustası"}${e ? `, ${e}` : ""}.`,
    exp: { 1: "1–3 yıl deneyim", 3: "3–5 yıl deneyim", 5: "5–10 yıl deneyim", 10: "10 yıldan fazla deneyim" },
    and: "ve",
    strengths: {
      neat: "temiz çalışırım", on_time: "zamanında gelirim", own_tools: "kendi aletlerim var",
      clean_up: "işten sonra temizlerim", warranty: "işime garanti veririm",
    },
    strengthsLine: (l) => `${cap(l)}.`,
    area: (c, km) => `Çalışma bölgesi: ${c}${km ? ` ve ${km} km çevresi` : ""}.`,
    everywhere: "Tüm Hollanda'da çalışırım.",
    also: (l) => `Ayrıca: ${l}.`,
    speaks: (l) => `Konuştuğum diller: ${l}.`,
    lowerLanguages: false,
  },
};

function list(items: string[], and: string) {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;
}

// The builder's data as words in one language.
export function aboutFacts(
  p: Pick<WorkerProfile, "trades" | "city" | "travel_km" | "extra_cities" | "languages">,
  fullName: string | null,
  lang: Lang,
): AboutFacts {
  const w = getWorkerDict(lang);
  const word = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const firstRaw = word && word === word.toLocaleUpperCase() ? cap(word.toLocaleLowerCase()) : word;
  // Clients read Dutch: a Cyrillic name is spelled in latin letters there.
  const first = lang === "nl" || lang === "en" || lang === "pl" || lang === "ro" || lang === "tr" ? cap(toLatin(firstRaw)) || firstRaw : firstRaw;
  const lower = (s: string) => s.toLocaleLowerCase(lang);
  return {
    lang,
    first,
    trades: p.trades.filter((id) => id !== "other").map((id) => lower((w.trades as Record<string, string>)[id] ?? "")).filter(Boolean),
    city: p.city,
    km: p.travel_km,
    extra: p.extra_cities,
    languages: p.languages.map((id) => {
      const name = (w.spoken as Record<string, string>)[id] ?? "";
      return GEN[lang].lowerLanguages ? lower(name) : name;
    }).filter(Boolean),
  };
}

export function aboutText(f: AboutFacts, exp: Experience | null, strengths: Strength[]) {
  const g = GEN[f.lang];
  const parts = [g.intro(f.first, list(f.trades, g.and), exp ? g.exp[exp] : "")];
  const picked = STRENGTHS.filter((s) => strengths.includes(s)).map((s) => g.strengths[s]);
  if (picked.length) parts.push(g.strengthsLine(list(picked, g.and)));
  if (f.km === 0) parts.push(g.everywhere);
  else if (f.city) parts.push(g.area(f.city, f.km));
  if (f.km !== 0 && f.extra.length) parts.push(g.also(f.extra.join(", ")));
  if (f.languages.length) parts.push(g.speaks(list(f.languages, g.and)));
  return parts.join(" ").slice(0, ABOUT_MAX);
}

export const isExperience = (v: unknown): v is Experience => (EXPERIENCE as readonly number[]).includes(Number(v));
export const cleanStrengths = (v: unknown): Strength[] =>
  (Array.isArray(v) ? v : String(v ?? "").split(",")).filter((x): x is Strength => (STRENGTHS as readonly string[]).includes(String(x)));

const ru = {
  seeAs: "👁 Так вас видит заказчик",
  open: "Открыть",
  noAbout: "Здесь будет ваш текст «О себе».",
  newcomer: "Новичок в Haaks",
  hidden: "🔒 Вас не найти",
  rClosed: "страница закрыта для заказчиков",
  rNoNick: "нет ника",
  rNoSearch: "вы скрыты из поиска строителей",
  enable: "Включить: @{nick}",
  enableHint: "Страница откроется, вас можно будет найти по нику. Ник меняется в Настройках.",
  aboutTitle: "✍️ О себе",
  aboutHint: "Клиенты читают это первым. Текст на нидерландском, он собирается сам из ваших данных.",
  expLabel: "Опыт",
  exp: { 1: "1–3 года", 3: "3–5 лет", 5: "5–10 лет", 10: "10+ лет" } as Record<Experience, string>,
  strengthsLabel: "Чем вы лучше других (можно несколько)",
  strengths: { neat: "Аккуратно", on_time: "Вовремя", own_tools: "Свой инструмент", clean_up: "Убираю за собой", warranty: "Гарантия" } as Record<Strength, string>,
  textLabel: "Готовый текст (можно поправить)",
  meaning: "Перевод:",
  edited: "Вы поправили текст сами, поэтому перевода нет.",
  rebuild: "↻ Собрать заново",
  save: "Сохранить",
  saved: "✓ Сохранено",
  nowTitle: "📅 Сейчас",
  free: "🟢 Свободен",
  freeFrom: "🟡 Свободен с…",
  busy: "🔴 Занят",
  fromLabel: "С какого числа",
  nowHint: "Заказчики видят это на вашей странице.",
  worksHint: "До и после. Это главное, что смотрит заказчик.",
  all: "Все →",
  addWork: "+ Добавить работу",
  reviewsEmpty: "Отзыв можно попросить только после настоящего заказа в Haaks:",
  steps: ["Закройте заказ", "Нажмите «⭐ Попросить отзыв»", "Клиент ставит звёзды по ссылке"],
  missingAbout: "Напишите пару строк «О себе»",
  missingWork: "Добавьте первую работу (до и после)",
};
export type AboutDict = typeof ru;

const en: AboutDict = {
  seeAs: "👁 How clients see you",
  open: "Open",
  noAbout: "Your «About me» text will be here.",
  newcomer: "New on Haaks",
  hidden: "🔒 Nobody can find you",
  rClosed: "your page is closed to clients",
  rNoNick: "no nickname",
  rNoSearch: "you are hidden from builder search",
  enable: "Turn on: @{nick}",
  enableHint: "Your page opens and people can find you by nickname. Change the nickname in Settings.",
  aboutTitle: "✍️ About me",
  aboutHint: "Clients read this first. The text is in Dutch and is made from your details.",
  expLabel: "Experience",
  exp: { 1: "1–3 years", 3: "3–5 years", 5: "5–10 years", 10: "10+ years" },
  strengthsLabel: "What makes you better (pick any)",
  strengths: { neat: "Neat", on_time: "On time", own_tools: "Own tools", clean_up: "I clean up", warranty: "Guarantee" },
  textLabel: "Ready text (you can change it)",
  meaning: "Translation:",
  edited: "You changed the text yourself, so there is no translation.",
  rebuild: "↻ Make it again",
  save: "Save",
  saved: "✓ Saved",
  nowTitle: "📅 Right now",
  free: "🟢 Free",
  freeFrom: "🟡 Free from…",
  busy: "🔴 Busy",
  fromLabel: "From which date",
  nowHint: "Clients see this on your page.",
  worksHint: "Before and after. This is what clients look at most.",
  all: "All →",
  addWork: "+ Add a job",
  reviewsEmpty: "You can ask for a review only after a real job in Haaks:",
  steps: ["Close the order", "Tap «⭐ Ask for a review»", "The client gives stars by the link"],
  missingAbout: "Write a few lines «About me»",
  missingWork: "Add your first job (before and after)",
};

const nl: AboutDict = {
  seeAs: "👁 Zo zien klanten je",
  open: "Openen",
  noAbout: "Hier komt je tekst «Over mij».",
  newcomer: "Nieuw op Haaks",
  hidden: "🔒 Niemand kan je vinden",
  rClosed: "je pagina is dicht voor klanten",
  rNoNick: "geen gebruikersnaam",
  rNoSearch: "je staat niet in het zoeken",
  enable: "Aanzetten: @{nick}",
  enableHint: "Je pagina gaat open en je bent te vinden op je naam. Wijzigen kan in Instellingen.",
  aboutTitle: "✍️ Over mij",
  aboutHint: "Klanten lezen dit als eerste. De tekst wordt gemaakt uit je gegevens.",
  expLabel: "Ervaring",
  exp: { 1: "1–3 jaar", 3: "3–5 jaar", 5: "5–10 jaar", 10: "10+ jaar" },
  strengthsLabel: "Waarin ben je beter (meerdere mogelijk)",
  strengths: { neat: "Netjes", on_time: "Op tijd", own_tools: "Eigen gereedschap", clean_up: "Ruim op", warranty: "Garantie" },
  textLabel: "Klare tekst (je kunt hem aanpassen)",
  meaning: "",
  edited: "",
  rebuild: "↻ Opnieuw maken",
  save: "Opslaan",
  saved: "✓ Opgeslagen",
  nowTitle: "📅 Nu",
  free: "🟢 Vrij",
  freeFrom: "🟡 Vrij vanaf…",
  busy: "🔴 Bezet",
  fromLabel: "Vanaf welke datum",
  nowHint: "Klanten zien dit op je pagina.",
  worksHint: "Voor en na. Hier kijken klanten het meest naar.",
  all: "Alle →",
  addWork: "+ Werk toevoegen",
  reviewsEmpty: "Een review vragen kan alleen na een echte klus in Haaks:",
  steps: ["Sluit de opdracht", "Tik «⭐ Review vragen»", "De klant geeft sterren via de link"],
  missingAbout: "Schrijf een paar regels «Over mij»",
  missingWork: "Voeg je eerste werk toe (voor en na)",
};

const uk: AboutDict = {
  seeAs: "👁 Так вас бачить замовник",
  open: "Відкрити",
  noAbout: "Тут буде ваш текст «Про себе».",
  newcomer: "Новачок у Haaks",
  hidden: "🔒 Вас не знайти",
  rClosed: "сторінка закрита для замовників",
  rNoNick: "немає ніка",
  rNoSearch: "вас приховано з пошуку будівельників",
  enable: "Увімкнути: @{nick}",
  enableHint: "Сторінка відкриється, вас можна буде знайти за ніком. Нік змінюється в Налаштуваннях.",
  aboutTitle: "✍️ Про себе",
  aboutHint: "Клієнти читають це першим. Текст нідерландською, він складається сам із ваших даних.",
  expLabel: "Досвід",
  exp: { 1: "1–3 роки", 3: "3–5 років", 5: "5–10 років", 10: "10+ років" },
  strengthsLabel: "Чим ви кращі за інших (можна кілька)",
  strengths: { neat: "Акуратно", on_time: "Вчасно", own_tools: "Свій інструмент", clean_up: "Прибираю за собою", warranty: "Гарантія" },
  textLabel: "Готовий текст (можна виправити)",
  meaning: "Переклад:",
  edited: "Ви виправили текст самі, тому перекладу немає.",
  rebuild: "↻ Скласти знову",
  save: "Зберегти",
  saved: "✓ Збережено",
  nowTitle: "📅 Зараз",
  free: "🟢 Вільний",
  freeFrom: "🟡 Вільний з…",
  busy: "🔴 Зайнятий",
  fromLabel: "З якого числа",
  nowHint: "Замовники бачать це на вашій сторінці.",
  worksHint: "До і після. Це головне, що дивиться замовник.",
  all: "Усі →",
  addWork: "+ Додати роботу",
  reviewsEmpty: "Відгук можна попросити лише після справжнього замовлення в Haaks:",
  steps: ["Закрийте замовлення", "Натисніть «⭐ Попросити відгук»", "Клієнт ставить зірки за посиланням"],
  missingAbout: "Напишіть кілька рядків «Про себе»",
  missingWork: "Додайте першу роботу (до і після)",
};

const pl: AboutDict = {
  seeAs: "👁 Tak widzi cię klient",
  open: "Otwórz",
  noAbout: "Tu będzie twój tekst «O mnie».",
  newcomer: "Nowy w Haaks",
  hidden: "🔒 Nikt cię nie znajdzie",
  rClosed: "strona jest zamknięta dla klientów",
  rNoNick: "brak nicku",
  rNoSearch: "jesteś ukryty w wyszukiwarce",
  enable: "Włącz: @{nick}",
  enableHint: "Strona się otworzy i będzie można cię znaleźć po nicku. Nick zmienisz w Ustawieniach.",
  aboutTitle: "✍️ O mnie",
  aboutHint: "Klienci czytają to najpierw. Tekst po niderlandzku, składa się sam z twoich danych.",
  expLabel: "Doświadczenie",
  exp: { 1: "1–3 lata", 3: "3–5 lat", 5: "5–10 lat", 10: "10+ lat" },
  strengthsLabel: "Czym jesteś lepszy (można kilka)",
  strengths: { neat: "Starannie", on_time: "Na czas", own_tools: "Własne narzędzia", clean_up: "Sprzątam po sobie", warranty: "Gwarancja" },
  textLabel: "Gotowy tekst (można poprawić)",
  meaning: "Tłumaczenie:",
  edited: "Poprawiłeś tekst sam, więc nie ma tłumaczenia.",
  rebuild: "↻ Złóż od nowa",
  save: "Zapisz",
  saved: "✓ Zapisano",
  nowTitle: "📅 Teraz",
  free: "🟢 Wolny",
  freeFrom: "🟡 Wolny od…",
  busy: "🔴 Zajęty",
  fromLabel: "Od jakiej daty",
  nowHint: "Klienci widzą to na twojej stronie.",
  worksHint: "Przed i po. To klient ogląda najpierw.",
  all: "Wszystkie →",
  addWork: "+ Dodaj pracę",
  reviewsEmpty: "O opinię można poprosić tylko po prawdziwym zleceniu w Haaks:",
  steps: ["Zamknij zlecenie", "Kliknij «⭐ Poproś o opinię»", "Klient daje gwiazdki przez link"],
  missingAbout: "Napisz kilka zdań «O mnie»",
  missingWork: "Dodaj pierwszą pracę (przed i po)",
};

const ro: AboutDict = {
  seeAs: "👁 Așa te vede clientul",
  open: "Deschide",
  noAbout: "Aici va fi textul tău «Despre mine».",
  newcomer: "Nou pe Haaks",
  hidden: "🔒 Nu te găsește nimeni",
  rClosed: "pagina e închisă pentru clienți",
  rNoNick: "nu ai nume de utilizator",
  rNoSearch: "ești ascuns din căutare",
  enable: "Pornește: @{nick}",
  enableHint: "Pagina se deschide și te pot găsi după nume. Îl schimbi în Setări.",
  aboutTitle: "✍️ Despre mine",
  aboutHint: "Clienții citesc asta primul. Textul e în olandeză și se face din datele tale.",
  expLabel: "Experiență",
  exp: { 1: "1–3 ani", 3: "3–5 ani", 5: "5–10 ani", 10: "10+ ani" },
  strengthsLabel: "De ce ești mai bun (poți alege mai multe)",
  strengths: { neat: "Curat", on_time: "La timp", own_tools: "Scule proprii", clean_up: "Fac curat", warranty: "Garanție" },
  textLabel: "Text gata (îl poți schimba)",
  meaning: "Traducere:",
  edited: "Ai schimbat textul singur, așa că nu e traducere.",
  rebuild: "↻ Fă-l din nou",
  save: "Salvează",
  saved: "✓ Salvat",
  nowTitle: "📅 Acum",
  free: "🟢 Liber",
  freeFrom: "🟡 Liber de la…",
  busy: "🔴 Ocupat",
  fromLabel: "De la ce dată",
  nowHint: "Clienții văd asta pe pagina ta.",
  worksHint: "Înainte și după. La asta se uită clientul cel mai mult.",
  all: "Toate →",
  addWork: "+ Adaugă o lucrare",
  reviewsEmpty: "Poți cere o recenzie doar după o lucrare reală în Haaks:",
  steps: ["Închide comanda", "Apasă «⭐ Cere recenzie»", "Clientul dă stele prin link"],
  missingAbout: "Scrie câteva rânduri «Despre mine»",
  missingWork: "Adaugă prima lucrare (înainte și după)",
};

const tr: AboutDict = {
  seeAs: "👁 Müşteri sizi böyle görüyor",
  open: "Aç",
  noAbout: "«Hakkımda» yazınız burada olacak.",
  newcomer: "Haaks'ta yeni",
  hidden: "🔒 Sizi kimse bulamıyor",
  rClosed: "sayfanız müşterilere kapalı",
  rNoNick: "kullanıcı adı yok",
  rNoSearch: "usta aramasında gizlisiniz",
  enable: "Aç: @{nick}",
  enableHint: "Sayfanız açılır ve kullanıcı adınızla bulunursunuz. Ayarlar'dan değiştirebilirsiniz.",
  aboutTitle: "✍️ Hakkımda",
  aboutHint: "Müşteriler önce bunu okur. Metin Felemenkçe ve bilgilerinizden kendiliğinden oluşur.",
  expLabel: "Deneyim",
  exp: { 1: "1–3 yıl", 3: "3–5 yıl", 5: "5–10 yıl", 10: "10+ yıl" },
  strengthsLabel: "Sizi farklı kılan (birkaç tane seçebilirsiniz)",
  strengths: { neat: "Temiz iş", on_time: "Zamanında", own_tools: "Kendi aletlerim", clean_up: "Temizlerim", warranty: "Garanti" },
  textLabel: "Hazır metin (değiştirebilirsiniz)",
  meaning: "Çeviri:",
  edited: "Metni kendiniz değiştirdiniz, bu yüzden çeviri yok.",
  rebuild: "↻ Yeniden oluştur",
  save: "Kaydet",
  saved: "✓ Kaydedildi",
  nowTitle: "📅 Şu an",
  free: "🟢 Müsait",
  freeFrom: "🟡 Şu tarihten müsait…",
  busy: "🔴 Meşgul",
  fromLabel: "Hangi tarihten",
  nowHint: "Müşteriler bunu sayfanızda görür.",
  worksHint: "Öncesi ve sonrası. Müşterinin en çok baktığı yer.",
  all: "Tümü →",
  addWork: "+ İş ekle",
  reviewsEmpty: "Yorum ancak Haaks'taki gerçek bir işten sonra istenebilir:",
  steps: ["Siparişi kapatın", "«⭐ Yorum iste»ye basın", "Müşteri bağlantıdan yıldız verir"],
  missingAbout: "«Hakkımda» için birkaç satır yazın",
  missingWork: "İlk işinizi ekleyin (öncesi ve sonrası)",
};

const DICTS: Record<Lang, AboutDict> = { ru, en, nl, uk, pl, ro, tr };
export function getAboutDict(lang: Lang): AboutDict {
  return DICTS[lang];
}
