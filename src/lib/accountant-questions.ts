import type { Lang } from "@/lib/i18n";

// Questions the accountant picks (in Dutch) and answers the builder taps (in their own language).
// Fixed texts on both sides, so each side reads its own language without a translator.
export const QUESTION_KINDS = ["business", "what", "unreadable", "company", "paid", "other"] as const;
export type QuestionKind = (typeof QUESTION_KINDS)[number];
export const ANSWER_KINDS = ["work", "private", "newphoto", "paid", "other"] as const;
export type AnswerKind = (typeof ANSWER_KINDS)[number];

export const QUESTION_NL: Record<QuestionKind, string> = {
  business: "Is dit zakelijk of privé?",
  what: "Waarvoor is deze aankoop?",
  unreadable: "De bon is onleesbaar. Kun je een nieuwe foto sturen?",
  company: "Kun je een factuur op bedrijfsnaam vragen?",
  paid: "Is deze factuur betaald? Wanneer?",
  other: "Andere vraag",
};

export const ANSWER_NL: Record<AnswerKind, string> = {
  work: "Zakelijk, voor het werk.",
  private: "Privé, mag eruit.",
  newphoto: "Ik stuur een nieuwe foto.",
  paid: "Ja, betaald.",
  other: "",
};

type Texts = { q: Record<QuestionKind, string>; a: Record<AnswerKind, string> };
const T: Record<Lang, Texts> = {
  ru: {
    q: { business: "Это для работы или личное?", what: "Для чего эта покупка?", unreadable: "Чек не читается. Пришлите новое фото?", company: "Можете взять счёт на фирму?", paid: "Этот счёт оплачен? Когда?", other: "Другой вопрос" },
    a: { work: "Для работы", private: "Личное, уберите", newphoto: "Пришлю новое фото", paid: "Да, оплачен", other: "Свой ответ" },
  },
  uk: {
    q: { business: "Це для роботи чи особисте?", what: "Для чого ця покупка?", unreadable: "Чек не читається. Надішлете нове фото?", company: "Можете взяти рахунок на фірму?", paid: "Цей рахунок оплачено? Коли?", other: "Інше питання" },
    a: { work: "Для роботи", private: "Особисте, приберіть", newphoto: "Надішлю нове фото", paid: "Так, оплачено", other: "Своя відповідь" },
  },
  pl: {
    q: { business: "To służbowe czy prywatne?", what: "Na co jest ten zakup?", unreadable: "Paragon nieczytelny. Wyślesz nowe zdjęcie?", company: "Możesz poprosić o fakturę na firmę?", paid: "Ta faktura jest opłacona? Kiedy?", other: "Inne pytanie" },
    a: { work: "Służbowe", private: "Prywatne, usuńcie", newphoto: "Wyślę nowe zdjęcie", paid: "Tak, opłacona", other: "Własna odpowiedź" },
  },
  ro: {
    q: { business: "E pentru lucru sau personal?", what: "Pentru ce e această cumpărătură?", unreadable: "Bonul nu se citește. Trimiți o poză nouă?", company: "Poți cere factură pe firmă?", paid: "Factura e plătită? Când?", other: "Altă întrebare" },
    a: { work: "Pentru lucru", private: "Personal, scoateți-l", newphoto: "Trimit o poză nouă", paid: "Da, plătită", other: "Răspunsul meu" },
  },
  tr: {
    q: { business: "Bu iş için mi, özel mi?", what: "Bu alım ne için?", unreadable: "Fiş okunmuyor. Yeni fotoğraf gönderir misiniz?", company: "Şirket adına fatura isteyebilir misiniz?", paid: "Bu fatura ödendi mi? Ne zaman?", other: "Başka soru" },
    a: { work: "İş için", private: "Özel, çıkarın", newphoto: "Yeni fotoğraf göndereceğim", paid: "Evet, ödendi", other: "Kendi cevabım" },
  },
  en: {
    q: { business: "Is this for work or private?", what: "What is this purchase for?", unreadable: "The receipt can't be read. Can you send a new photo?", company: "Can you get an invoice in the company name?", paid: "Is this invoice paid? When?", other: "Other question" },
    a: { work: "For work", private: "Private, leave it out", newphoto: "I'll send a new photo", paid: "Yes, paid", other: "My own answer" },
  },
  nl: { q: { ...QUESTION_NL, other: "Andere vraag" }, a: { work: "Zakelijk", private: "Privé", newphoto: "Nieuwe foto volgt", paid: "Betaald", other: "Eigen antwoord" } },
};
export const questionTexts = (lang: Lang) => T[lang];

// Which quick answers fit which question.
export const ANSWERS_FOR: Record<QuestionKind, AnswerKind[]> = {
  business: ["work", "private", "other"],
  what: ["work", "private", "other"],
  unreadable: ["newphoto", "other"],
  company: ["other"],
  paid: ["paid", "other"],
  other: ["other"],
};

export const isQuestionKind = (v: unknown): v is QuestionKind => (QUESTION_KINDS as readonly string[]).includes(String(v));
export const isAnswerKind = (v: unknown): v is AnswerKind => (ANSWER_KINDS as readonly string[]).includes(String(v));
