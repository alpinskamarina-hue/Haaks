import type { Lang } from "@/lib/i18n";

// «Фраза дня» on the home screen: one short phrase a day, the same for everyone, each in their
// own language. Every weekday has its own theme. Written for builders (no celebrity quotes).
export type Theme = "start" | "craft" | "safety" | "patience" | "rest" | "family";
type Quote = Record<Lang, string>;

// Weekday (0 = Sunday) -> theme.
const THEME_OF_DAY: Theme[] = ["family", "start", "craft", "safety", "patience", "rest", "family"];

export const QUOTES: Record<Theme, Quote[]> = {
  start: [
    {
      ru: "Неделю строят как стену: первый ряд самый важный.",
      uk: "Тиждень будують як стіну: перший ряд найважливіший.",
      pl: "Tydzień buduje się jak ścianę: pierwsza warstwa jest najważniejsza.",
      ro: "Săptămâna se construiește ca un zid: primul rând e cel mai important.",
      tr: "Hafta da duvar gibi örülür: en önemlisi ilk sıradır.",
      en: "A week is built like a wall: the first row matters most.",
      nl: "Een week bouw je als een muur: de eerste laag is het belangrijkst.",
    },
    {
      ru: "Начни с самого трудного, дальше пойдёт легче.",
      uk: "Почни з найважчого, далі піде легше.",
      pl: "Zacznij od najtrudniejszego, potem pójdzie łatwiej.",
      ro: "Începe cu ce e mai greu, apoi va merge mai ușor.",
      tr: "En zor işle başla, gerisi daha kolay gelir.",
      en: "Start with the hardest job, the rest gets easier.",
      nl: "Begin met het zwaarste klusje, de rest gaat daarna makkelijker.",
    },
    {
      ru: "Новая неделя — чистый лист. Нарисуй на нём хорошую работу.",
      uk: "Новий тиждень — чистий аркуш. Намалюй на ньому гарну роботу.",
      pl: "Nowy tydzień to czysta kartka. Narysuj na niej dobrą robotę.",
      ro: "O săptămână nouă e o foaie albă. Desenează pe ea o treabă bună.",
      tr: "Yeni hafta temiz bir sayfa. Üzerine güzel bir iş çiz.",
      en: "A new week is a clean sheet. Draw some good work on it.",
      nl: "Een nieuwe week is een schoon blad. Teken er goed werk op.",
    },
  ],
  craft: [
    {
      ru: "Ровный шов — твоя подпись, даже если её никто не читает.",
      uk: "Рівний шов — твій підпис, навіть якщо його ніхто не читає.",
      pl: "Równa fuga to twój podpis, nawet jeśli nikt go nie czyta.",
      ro: "Un rost drept e semnătura ta, chiar dacă nimeni n-o citește.",
      tr: "Düzgün bir derz senin imzandır, kimse okumasa bile.",
      en: "A straight joint is your signature, even if nobody reads it.",
      nl: "Een strakke voeg is je handtekening, ook als niemand hem leest.",
    },
    {
      ru: "Семь раз отмерь, один раз отрежь, и домой вовремя.",
      uk: "Сім разів відміряй, один раз відріж, і додому вчасно.",
      pl: "Dwa razy mierz, raz tnij i wracaj do domu na czas.",
      ro: "Măsoară de două ori, taie o dată și ajungi acasă la timp.",
      tr: "İki kere ölç, bir kere kes, eve vaktinde dön.",
      en: "Measure twice, cut once, and get home on time.",
      nl: "Twee keer meten, één keer zagen, en op tijd naar huis.",
    },
    {
      ru: "Хорошую работу видно и через десять лет.",
      uk: "Добру роботу видно і через десять років.",
      pl: "Dobrą robotę widać nawet po dziesięciu latach.",
      ro: "O treabă bună se vede și după zece ani.",
      tr: "İyi iş on yıl sonra bile belli olur.",
      en: "Good work still shows ten years later.",
      nl: "Goed werk zie je na tien jaar nog steeds.",
    },
  ],
  safety: [
    {
      ru: "Каска на голове дороже любого заказа. Дома тебя ждут.",
      uk: "Каска на голові дорожча за будь-яке замовлення. Вдома на тебе чекають.",
      pl: "Kask na głowie jest cenniejszy niż każde zlecenie. W domu ktoś na ciebie czeka.",
      ro: "Casca de pe cap valorează mai mult decât orice lucrare. Acasă te așteaptă cineva.",
      tr: "Baretin her işten daha değerli. Evde seni bekleyenler var.",
      en: "Your helmet is worth more than any job. Someone is waiting for you at home.",
      nl: "Je helm is meer waard dan welke klus ook. Thuis wacht er iemand op je.",
    },
    {
      ru: "Лучше потерять пять минут, чем один палец.",
      uk: "Краще втратити п'ять хвилин, ніж один палець.",
      pl: "Lepiej stracić pięć minut niż jeden palec.",
      ro: "Mai bine pierzi cinci minute decât un deget.",
      tr: "Beş dakika kaybetmek, bir parmak kaybetmekten iyidir.",
      en: "Better to lose five minutes than one finger.",
      nl: "Liever vijf minuten kwijt dan één vinger.",
    },
    {
      ru: "Защитные очки не красят, зато глаза сохраняют.",
      uk: "Захисні окуляри не прикрашають, зате очі бережуть.",
      pl: "Okulary ochronne nie dodają urody, ale chronią oczy.",
      ro: "Ochelarii de protecție nu te fac mai frumos, dar îți păstrează ochii.",
      tr: "Koruyucu gözlük seni güzelleştirmez ama gözlerini korur.",
      en: "Safety glasses won't make you handsome, but they keep your eyes.",
      nl: "Een veiligheidsbril staat niet mooi, maar je houdt je ogen.",
    },
  ],
  patience: [
    {
      ru: "Тяжёлые дни тоже заканчиваются. А сделанная работа остаётся.",
      uk: "Важкі дні теж минають. А зроблена робота залишається.",
      pl: "Ciężkie dni też mijają. A zrobiona robota zostaje.",
      ro: "Și zilele grele trec. Dar munca făcută rămâne.",
      tr: "Zor günler de geçer. Ama yapılan iş kalır.",
      en: "Hard days end too. The work you did stays.",
      nl: "Zware dagen gaan ook voorbij. Het werk dat je deed, blijft.",
    },
    {
      ru: "Медленно, но ровно лучше, чем быстро и заново.",
      uk: "Повільно, але рівно краще, ніж швидко і заново.",
      pl: "Wolno, ale równo jest lepiej niż szybko i od nowa.",
      ro: "Încet, dar drept e mai bine decât repede și de la capăt.",
      tr: "Yavaş ama düzgün, hızlı yapıp baştan başlamaktan iyidir.",
      en: "Slow and straight beats fast and do it again.",
      nl: "Langzaam en recht is beter dan snel en opnieuw.",
    },
    {
      ru: "Каждый мастер когда-то был учеником, который не сдался.",
      uk: "Кожен майстер колись був учнем, який не здався.",
      pl: "Każdy fachowiec był kiedyś uczniem, który się nie poddał.",
      ro: "Fiecare meșter a fost cândva un ucenic care nu a renunțat.",
      tr: "Her usta bir zamanlar pes etmeyen bir çıraktı.",
      en: "Every master was once an apprentice who didn't give up.",
      nl: "Elke vakman was ooit een leerling die niet opgaf.",
    },
  ],
  rest: [
    {
      ru: "Инструмент почищен, счёт отправлен. Выходные заслужены.",
      uk: "Інструмент почищено, рахунок надіслано. Вихідні заслужені.",
      pl: "Narzędzia wyczyszczone, faktura wysłana. Weekend zasłużony.",
      ro: "Sculele sunt curate, factura e trimisă. Weekendul e meritat.",
      tr: "Aletler temiz, fatura gönderildi. Hafta sonunu hak ettin.",
      en: "Tools cleaned, invoice sent. You've earned the weekend.",
      nl: "Gereedschap schoon, factuur verstuurd. Het weekend is verdiend.",
    },
    {
      ru: "Отдых тоже часть работы: уставшие руки ошибаются.",
      uk: "Відпочинок теж частина роботи: втомлені руки помиляються.",
      pl: "Odpoczynek to też część pracy: zmęczone ręce się mylą.",
      ro: "Odihna face și ea parte din muncă: mâinile obosite greșesc.",
      tr: "Dinlenmek de işin parçası: yorgun eller hata yapar.",
      en: "Rest is part of the job too: tired hands make mistakes.",
      nl: "Rust hoort ook bij het werk: moeie handen maken fouten.",
    },
    {
      ru: "Неделя построена. Отдыхай, ты это заработал.",
      uk: "Тиждень збудовано. Відпочивай, ти це заробив.",
      pl: "Tydzień zbudowany. Odpocznij, zasłużyłeś.",
      ro: "Săptămâna e construită. Odihnește-te, ai meritat-o.",
      tr: "Hafta tamam. Dinlen, bunu hak ettin.",
      en: "The week is built. Rest, you've earned it.",
      nl: "De week staat. Rust uit, je hebt het verdiend.",
    },
  ],
  family: [
    {
      ru: "Строишь чужие дома, чтобы в своём было тепло.",
      uk: "Будуєш чужі будинки, щоб у своєму було тепло.",
      pl: "Budujesz cudze domy, żeby w twoim było ciepło.",
      ro: "Construiești case pentru alții, ca în a ta să fie cald.",
      tr: "Başkalarının evlerini yapıyorsun ki kendi evin sıcak olsun.",
      en: "You build other people's houses so your own home stays warm.",
      nl: "Je bouwt huizen voor anderen, zodat het in je eigen huis warm is.",
    },
    {
      ru: "Лучший проект — время с близкими.",
      uk: "Найкращий проєкт — час із рідними.",
      pl: "Najlepszy projekt to czas z bliskimi.",
      ro: "Cel mai bun proiect e timpul petrecut cu cei dragi.",
      tr: "En güzel proje, sevdiklerinle geçen zamandır.",
      en: "The best project is time with the people you love.",
      nl: "Het mooiste project is tijd met je dierbaren.",
    },
    {
      ru: "Ты далеко от дома, но каждый день работаешь ради него.",
      uk: "Ти далеко від дому, але щодня працюєш заради нього.",
      pl: "Jesteś daleko od domu, ale każdego dnia pracujesz dla niego.",
      ro: "Ești departe de casă, dar muncești pentru ea în fiecare zi.",
      tr: "Evinden uzaktasın ama her gün onun için çalışıyorsun.",
      en: "You're far from home, but every day you work for it.",
      nl: "Je bent ver van huis, maar elke dag werk je ervoor.",
    },
  ],
};

// Today's phrase (by Dutch date): the weekday picks the theme, the week number the phrase.
export function quoteOfDay(day: string, lang: Lang) {
  const date = new Date(`${day}T12:00:00Z`);
  const theme = THEME_OF_DAY[date.getUTCDay()];
  const list = QUOTES[theme];
  const week = Math.floor(date.getTime() / (7 * 86400000));
  // Saturday and Sunday share a theme: give them different phrases.
  const shift = date.getUTCDay() === 6 ? 1 : 0;
  const quote = list[(week + shift) % list.length];
  return { theme, text: quote[lang] ?? quote.en };
}

const LABELS: Record<Lang, { title: string; share: string; hide: string; saved: string; brand: string }> = {
  ru: { title: "Фраза дня", share: "Поделиться", hide: "Убрать до завтра", saved: "Картинка сохранена", brand: "Haaks · для строителей ZZP" },
  uk: { title: "Фраза дня", share: "Поділитися", hide: "Прибрати до завтра", saved: "Картинку збережено", brand: "Haaks · для будівельників ZZP" },
  pl: { title: "Zdanie dnia", share: "Udostępnij", hide: "Ukryj do jutra", saved: "Obraz zapisany", brand: "Haaks · dla budowlańców ZZP" },
  ro: { title: "Gândul zilei", share: "Distribuie", hide: "Ascunde până mâine", saved: "Imagine salvată", brand: "Haaks · pentru constructori ZZP" },
  tr: { title: "Günün sözü", share: "Paylaş", hide: "Yarına kadar gizle", saved: "Resim kaydedildi", brand: "Haaks · ZZP ustaları için" },
  en: { title: "Thought of the day", share: "Share", hide: "Hide until tomorrow", saved: "Picture saved", brand: "Haaks · for ZZP builders" },
  nl: { title: "Spreuk van de dag", share: "Delen", hide: "Verbergen tot morgen", saved: "Afbeelding opgeslagen", brand: "Haaks · voor zzp-vakmensen" },
};
export const getQuoteLabels = (lang: Lang) => LABELS[lang];
