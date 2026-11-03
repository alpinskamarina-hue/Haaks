// "Report" button texts: builders report jobs in the feed (6 languages), companies report
// builder cards in the catalog (nl/en). Reasons are the ones the database accepts.
import type { Lang } from "@/lib/i18n";

export const JOB_REASONS = ["scam", "employment", "contacts", "other"] as const;
export const WORKER_REASONS = ["fake", "scam", "other"] as const;
export type ReportReason = (typeof JOB_REASONS)[number] | (typeof WORKER_REASONS)[number];

export type ReportDict = {
  report: string;
  send: string;
  sent: string;
  reasons: Record<ReportReason, string>;
};

const DICTS: Record<Lang, ReportDict> = {
  ru: {
    report: "Пожаловаться",
    send: "Отправить жалобу",
    sent: "Жалоба отправлена, Haaks проверит",
    reasons: {
      scam: "Похоже на обман",
      employment: "Это работа по найму, а не заказ для ZZP",
      contacts: "Контакты или спам в тексте",
      fake: "Ненастоящий профиль",
      other: "Другое",
    },
  },
  uk: {
    report: "Поскаржитися",
    send: "Надіслати скаргу",
    sent: "Скаргу надіслано, Haaks перевірить",
    reasons: {
      scam: "Схоже на обман",
      employment: "Це робота за наймом, а не замовлення для ZZP",
      contacts: "Контакти або спам у тексті",
      fake: "Несправжній профіль",
      other: "Інше",
    },
  },
  pl: {
    report: "Zgłoś",
    send: "Wyślij zgłoszenie",
    sent: "Zgłoszenie wysłane, Haaks to sprawdzi",
    reasons: {
      scam: "Wygląda na oszustwo",
      employment: "To praca na etat, nie zlecenie dla ZZP",
      contacts: "Kontakty lub spam w tekście",
      fake: "Fałszywy profil",
      other: "Inne",
    },
  },
  ro: {
    report: "Raportează",
    send: "Trimite raportul",
    sent: "Raport trimis, Haaks va verifica",
    reasons: {
      scam: "Pare o înșelătorie",
      employment: "Este un loc de muncă, nu o lucrare pentru ZZP",
      contacts: "Contacte sau spam în text",
      fake: "Profil fals",
      other: "Altceva",
    },
  },
  en: {
    report: "Report",
    send: "Send report",
    sent: "Report sent, Haaks will check it",
    reasons: {
      scam: "Looks like a scam",
      employment: "This is employment, not a job for a self-employed builder",
      contacts: "Contacts or spam in the text",
      fake: "Fake profile",
      other: "Other",
    },
  },
  nl: {
    report: "Melden",
    send: "Melding versturen",
    sent: "Melding verstuurd, Haaks kijkt ernaar",
    reasons: {
      scam: "Lijkt op oplichting",
      employment: "Dit is loondienst, geen opdracht voor een ZZP'er",
      contacts: "Contactgegevens of spam in de tekst",
      fake: "Nepprofiel",
      other: "Anders",
    },
  },
};

export const getReportDict = (lang: Lang) => DICTS[lang];

// Russian labels for the moderation page.
export const REASON_RU = DICTS.ru.reasons;
