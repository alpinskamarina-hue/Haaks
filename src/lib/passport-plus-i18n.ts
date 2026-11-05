import type { Lang } from "@/lib/i18n";

// Texts for the passport page additions: upload buttons on readiness, «Отправить подрядчику»,
// and when the passport was last opened.
const ru = {
  upload: "Загрузить",
  fill: "Заполнить",
  sendTitle: "Отправить подрядчику",
  sendHint: "Готовое письмо на нидерландском со ссылкой на паспорт.",
  whatsapp: "WhatsApp",
  email: "E-mail",
  copyText: "Скопировать текст",
  copied: "✓ Скопировано",
  qrHint: "Покажите QR на объекте: подрядчик наведёт камеру и увидит паспорт.",
  opened: "Открывали {n} раз",
  lastOpened: "последний раз {when}",
  never: "Ещё никто не открывал",
  today: "сегодня в {time}",
  yesterday: "вчера в {time}",
  offNote: "Паспорт выключен: по ссылке его сейчас не видно.",
};

type Dict = typeof ru;

const DICTS: Record<Lang, Dict> = {
  ru,
  uk: {
    upload: "Завантажити",
    fill: "Заповнити",
    sendTitle: "Надіслати підряднику",
    sendHint: "Готовий лист нідерландською з посиланням на паспорт.",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copyText: "Скопіювати текст",
    copied: "✓ Скопійовано",
    qrHint: "Покажіть QR на об'єкті: підрядник наведе камеру і побачить паспорт.",
    opened: "Відкривали {n} разів",
    lastOpened: "востаннє {when}",
    never: "Ще ніхто не відкривав",
    today: "сьогодні о {time}",
    yesterday: "вчора о {time}",
    offNote: "Паспорт вимкнено: за посиланням його зараз не видно.",
  },
  pl: {
    upload: "Wgraj",
    fill: "Uzupełnij",
    sendTitle: "Wyślij wykonawcy",
    sendHint: "Gotowa wiadomość po niderlandzku z linkiem do paszportu.",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copyText: "Kopiuj tekst",
    copied: "✓ Skopiowano",
    qrHint: "Pokaż kod QR na budowie: wykonawca zeskanuje go aparatem i zobaczy paszport.",
    opened: "Otwarto {n} razy",
    lastOpened: "ostatnio {when}",
    never: "Nikt jeszcze nie otworzył",
    today: "dziś o {time}",
    yesterday: "wczoraj o {time}",
    offNote: "Paszport jest wyłączony: pod linkiem nie jest teraz widoczny.",
  },
  ro: {
    upload: "Încarcă",
    fill: "Completează",
    sendTitle: "Trimite antreprenorului",
    sendHint: "Mesaj gata în neerlandeză, cu linkul spre pașaport.",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copyText: "Copiază textul",
    copied: "✓ Copiat",
    qrHint: "Arată codul QR pe șantier: antreprenorul îl scanează cu camera și vede pașaportul.",
    opened: "Deschis de {n} ori",
    lastOpened: "ultima dată {when}",
    never: "Încă nu l-a deschis nimeni",
    today: "azi la {time}",
    yesterday: "ieri la {time}",
    offNote: "Pașaportul este oprit: acum nu se vede la link.",
  },
  tr: {
    upload: "Yükle",
    fill: "Doldur",
    sendTitle: "Yükleniciye gönder",
    sendHint: "Pasaport linkiyle hazır Hollandaca mesaj.",
    whatsapp: "WhatsApp",
    email: "E-posta",
    copyText: "Metni kopyala",
    copied: "✓ Kopyalandı",
    qrHint: "QR kodunu şantiyede gösterin: yüklenici kamerayla okutup pasaportu görür.",
    opened: "{n} kez açıldı",
    lastOpened: "son {when}",
    never: "Henüz kimse açmadı",
    today: "bugün {time}",
    yesterday: "dün {time}",
    offNote: "Pasaport kapalı: şu an linkte görünmüyor.",
  },
  en: {
    upload: "Upload",
    fill: "Fill in",
    sendTitle: "Send to a contractor",
    sendHint: "A ready Dutch message with the link to your passport.",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copyText: "Copy text",
    copied: "✓ Copied",
    qrHint: "Show the QR code on site: the contractor points a camera at it and sees your passport.",
    opened: "Opened {n} times",
    lastOpened: "last {when}",
    never: "Nobody has opened it yet",
    today: "today at {time}",
    yesterday: "yesterday at {time}",
    offNote: "Your passport is off: the link shows nothing right now.",
  },
  nl: {
    upload: "Uploaden",
    fill: "Invullen",
    sendTitle: "Naar een opdrachtgever sturen",
    sendHint: "Een kant-en-klaar bericht met de link naar je paspoort.",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copyText: "Tekst kopiëren",
    copied: "✓ Gekopieerd",
    qrHint: "Laat de QR-code zien op de bouw: de opdrachtgever scant hem en ziet je paspoort.",
    opened: "{n} keer geopend",
    lastOpened: "laatst {when}",
    never: "Nog door niemand geopend",
    today: "vandaag om {time}",
    yesterday: "gisteren om {time}",
    offNote: "Je paspoort staat uit: via de link is nu niets te zien.",
  },
};

export type PassportPlusDict = Dict;
export const getPassportPlusDict = (lang: Lang) => DICTS[lang];

const ITEM_NL = {
  kvk_number: "KvK-nummer",
  btw_number: "btw-nummer",
  kvk_extract: "KvK-uittreksel",
  vca: "VCA-certificaat",
  avb: "AVB-verzekering",
} as const;

// The message a builder sends to a contractor: always Dutch, lists only what is really in the passport.
export function passportMessage(opts: {
  url: string;
  name: string;
  trade: string;
  ready: Partial<Record<keyof typeof ITEM_NL, boolean>>;
}) {
  const items = (Object.keys(ITEM_NL) as (keyof typeof ITEM_NL)[])
    .filter((k) => opts.ready[k])
    .map((k) => ITEM_NL[k]);
  const list =
    items.length === 0
      ? "mijn gegevens"
      : items.length === 1
        ? items[0]
        : `${items.slice(0, -1).join(", ")} en ${items[items.length - 1]}`;
  const sign = [opts.name, opts.trade].filter(Boolean).join(" · ");
  const subject = `ZZP-paspoort${opts.name ? ` ${opts.name}` : ""}`;
  const body =
    `Goedendag,\n\nHierbij mijn ZZP-paspoort met ${list}. ` +
    `Alles staat op één plek, inclusief de documenten:\n${opts.url}\n\n` +
    `Met vriendelijke groet,\n${sign}`.trimEnd();
  return { subject, body };
}
