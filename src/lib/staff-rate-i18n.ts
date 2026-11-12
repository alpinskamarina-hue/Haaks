import type { Lang } from "@/lib/i18n";

// Texts for rating the digital employee's answers (like / dislike + reason).
export const STAFF_RATE_REASONS = ["wrong", "unclear", "language", "long", "other"] as const;
export type StaffRateReason = (typeof STAFF_RATE_REASONS)[number];

export type StaffRateDict = {
  like: string;
  dislike: string;
  thanks: string;
  why: string;
  reasons: Record<StaffRateReason, string>;
  comment: string;
  send: string;
  skip: string;
  note: string;
};

const DICTS: Record<Lang, StaffRateDict> = {
  ru: {
    like: "Хороший ответ",
    dislike: "Плохой ответ",
    thanks: "Спасибо за оценку",
    why: "Что не так?",
    reasons: { wrong: "Неправильно", unclear: "Непонятно", language: "Не на моём языке", long: "Слишком длинно", other: "Другое" },
    comment: "Комментарий (можно пропустить)",
    send: "Отправить",
    skip: "Пропустить",
    note: "Оценённый вопрос и ответ видит команда Haaks, чтобы улучшить сотрудника.",
  },
  uk: {
    like: "Гарна відповідь",
    dislike: "Погана відповідь",
    thanks: "Дякуємо за оцінку",
    why: "Що не так?",
    reasons: { wrong: "Неправильно", unclear: "Незрозуміло", language: "Не моєю мовою", long: "Занадто довго", other: "Інше" },
    comment: "Коментар (можна пропустити)",
    send: "Надіслати",
    skip: "Пропустити",
    note: "Оцінене питання й відповідь бачить команда Haaks, щоб покращити помічника.",
  },
  pl: {
    like: "Dobra odpowiedź",
    dislike: "Zła odpowiedź",
    thanks: "Dziękujemy za ocenę",
    why: "Co jest nie tak?",
    reasons: { wrong: "Błędnie", unclear: "Niejasno", language: "Nie w moim języku", long: "Za długo", other: "Inne" },
    comment: "Komentarz (można pominąć)",
    send: "Wyślij",
    skip: "Pomiń",
    note: "Ocenione pytanie i odpowiedź widzi zespół Haaks, aby ulepszyć asystenta.",
  },
  ro: {
    like: "Răspuns bun",
    dislike: "Răspuns slab",
    thanks: "Mulțumim pentru evaluare",
    why: "Ce nu e în regulă?",
    reasons: { wrong: "Greșit", unclear: "Neclar", language: "Nu în limba mea", long: "Prea lung", other: "Altceva" },
    comment: "Comentariu (opțional)",
    send: "Trimite",
    skip: "Sari peste",
    note: "Întrebarea și răspunsul evaluate sunt văzute de echipa Haaks, pentru a îmbunătăți asistentul.",
  },
  tr: {
    like: "İyi cevap",
    dislike: "Kötü cevap",
    thanks: "Değerlendirmeniz için teşekkürler",
    why: "Sorun ne?",
    reasons: { wrong: "Yanlış", unclear: "Anlaşılmıyor", language: "Benim dilimde değil", long: "Çok uzun", other: "Diğer" },
    comment: "Yorum (isteğe bağlı)",
    send: "Gönder",
    skip: "Geç",
    note: "Değerlendirilen soru ve cevabı, asistanı geliştirmek için Haaks ekibi görür.",
  },
  en: {
    like: "Good answer",
    dislike: "Bad answer",
    thanks: "Thanks for the rating",
    why: "What was wrong?",
    reasons: { wrong: "Wrong", unclear: "Unclear", language: "Not in my language", long: "Too long", other: "Other" },
    comment: "Comment (optional)",
    send: "Send",
    skip: "Skip",
    note: "The Haaks team sees a rated question and answer, to improve the assistant.",
  },
  nl: {
    like: "Goed antwoord",
    dislike: "Slecht antwoord",
    thanks: "Bedankt voor je beoordeling",
    why: "Wat klopte er niet?",
    reasons: { wrong: "Onjuist", unclear: "Onduidelijk", language: "Niet in mijn taal", long: "Te lang", other: "Anders" },
    comment: "Opmerking (optioneel)",
    send: "Versturen",
    skip: "Overslaan",
    note: "Het Haaks-team ziet een beoordeelde vraag en antwoord, om de assistent te verbeteren.",
  },
};

export function getStaffRateDict(lang: Lang): StaffRateDict {
  return DICTS[lang];
}
