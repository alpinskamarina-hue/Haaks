import type { Lang } from "@/lib/i18n";

// Push and Telegram texts for passport reminders.
const ru = {
  soonTitle: "Скоро заканчивается: {doc}",
  soonBody: "Действует до {date}, осталось дней: {n}. Загрузите новый, чтобы паспорт был в порядке.",
  todayTitle: "Срок закончился: {doc}",
  todayBody: "Подрядчики теперь видят «Verlopen». Загрузите новый документ в паспорт.",
  viewTitle: "Ваш ZZP-паспорт открыли 👀",
  viewBody: "Кто-то сейчас смотрит ваш паспорт. Хороший момент позвонить подрядчику.",
  open: "Открыть паспорт",
};
type Dict = typeof ru;

const DICTS: Record<Lang, Dict> = {
  ru,
  uk: {
    soonTitle: "Скоро закінчується: {doc}",
    soonBody: "Діє до {date}, залишилось днів: {n}. Завантажте новий, щоб паспорт був у порядку.",
    todayTitle: "Термін закінчився: {doc}",
    todayBody: "Підрядники тепер бачать «Verlopen». Завантажте новий документ у паспорт.",
    viewTitle: "Ваш ZZP-паспорт відкрили 👀",
    viewBody: "Хтось зараз дивиться ваш паспорт. Гарний момент зателефонувати підряднику.",
    open: "Відкрити паспорт",
  },
  pl: {
    soonTitle: "Wkrótce wygasa: {doc}",
    soonBody: "Ważny do {date}, zostało dni: {n}. Wgraj nowy, żeby paszport był w porządku.",
    todayTitle: "Termin minął: {doc}",
    todayBody: "Wykonawcy widzą teraz «Verlopen». Wgraj nowy dokument do paszportu.",
    viewTitle: "Ktoś otworzył Twój paszport ZZP 👀",
    viewBody: "Ktoś właśnie ogląda Twój paszport. Dobry moment, żeby zadzwonić do wykonawcy.",
    open: "Otwórz paszport",
  },
  ro: {
    soonTitle: "Expiră curând: {doc}",
    soonBody: "Valabil până la {date}, mai sunt zile: {n}. Încarcă unul nou, ca pașaportul să fie în regulă.",
    todayTitle: "A expirat: {doc}",
    todayBody: "Antreprenorii văd acum «Verlopen». Încarcă un document nou în pașaport.",
    viewTitle: "Cineva ți-a deschis pașaportul ZZP 👀",
    viewBody: "Cineva se uită acum la pașaportul tău. Un moment bun să suni antreprenorul.",
    open: "Deschide pașaportul",
  },
  tr: {
    soonTitle: "Süresi doluyor: {doc}",
    soonBody: "{date} tarihine kadar geçerli, kalan gün: {n}. Pasaportunuz düzgün kalsın diye yenisini yükleyin.",
    todayTitle: "Süresi doldu: {doc}",
    todayBody: "Yükleniciler artık «Verlopen» görüyor. Pasaporta yeni belgeyi yükleyin.",
    viewTitle: "ZZP pasaportunuz açıldı 👀",
    viewBody: "Şu anda biri pasaportunuza bakıyor. Yükleniciyi aramak için iyi bir an.",
    open: "Pasaportu aç",
  },
  en: {
    soonTitle: "Expiring soon: {doc}",
    soonBody: "Valid until {date}, days left: {n}. Upload a new one to keep your passport in order.",
    todayTitle: "Expired: {doc}",
    todayBody: "Contractors now see “Verlopen”. Upload the new document to your passport.",
    viewTitle: "Someone opened your ZZP passport 👀",
    viewBody: "Someone is looking at your passport right now. A good moment to call the contractor.",
    open: "Open passport",
  },
  nl: {
    soonTitle: "Verloopt binnenkort: {doc}",
    soonBody: "Geldig tot {date}, nog {n} dagen. Upload een nieuwe, zodat je paspoort in orde blijft.",
    todayTitle: "Verlopen: {doc}",
    todayBody: "Opdrachtgevers zien nu “Verlopen”. Upload het nieuwe document in je paspoort.",
    viewTitle: "Je ZZP-paspoort is geopend 👀",
    viewBody: "Iemand bekijkt nu je paspoort. Een goed moment om de opdrachtgever te bellen.",
    open: "Paspoort openen",
  },
};

export const getPassportNotifyDict = (lang: Lang) => DICTS[lang];
