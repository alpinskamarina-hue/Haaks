import type { Lang } from "@/lib/i18n";

// Texts of the letter card in the employee chat. Machine-assisted translations: review before launch.
export type StaffLetterDict = {
  title: string;
  deadline: string;
  daysLeft: string; // {n}
  today: string;
  overdue: string;
  amount: string;
  reference: string;
  payTo: string;
  steps: string;
  reply: string;
  copy: string;
  copied: string;
  remind: string; // {date}
  reminded: string; // {date}
  failed: string;
  note: string;
  urgency: { low: string; medium: string; high: string };
};

const D: Record<Lang, StaffLetterDict> = {
  ru: {
    title: "Письмо",
    deadline: "Срок",
    daysLeft: "осталось {n} дн.",
    today: "сегодня!",
    overdue: "срок прошёл",
    amount: "Сумма",
    reference: "Betalingskenmerk",
    payTo: "Куда платить",
    steps: "Что сделать",
    reply: "Ответ на нидерландском",
    copy: "📋 Скопировать ответ",
    copied: "✓ Скопировано",
    remind: "⏰ Напомнить {date} в 09:00",
    reminded: "✓ Напомню {date} в 09:00",
    failed: "Не получилось. Попробуйте ещё раз.",
    note: "Сотрудник может ошибиться: сверяйте суммы и сроки с самим письмом.",
    urgency: { low: "Для информации", medium: "Нужно ответить", high: "Срочно" },
  },
  uk: {
    title: "Лист",
    deadline: "Термін",
    daysLeft: "залишилось {n} дн.",
    today: "сьогодні!",
    overdue: "термін минув",
    amount: "Сума",
    reference: "Betalingskenmerk",
    payTo: "Куди платити",
    steps: "Що зробити",
    reply: "Відповідь нідерландською",
    copy: "📋 Скопіювати відповідь",
    copied: "✓ Скопійовано",
    remind: "⏰ Нагадати {date} о 09:00",
    reminded: "✓ Нагадаю {date} о 09:00",
    failed: "Не вийшло. Спробуйте ще раз.",
    note: "Співробітник може помилитися: звіряйте суми й терміни із самим листом.",
    urgency: { low: "Для інформації", medium: "Треба відповісти", high: "Терміново" },
  },
  pl: {
    title: "List",
    deadline: "Termin",
    daysLeft: "zostało {n} dni",
    today: "dzisiaj!",
    overdue: "termin minął",
    amount: "Kwota",
    reference: "Betalingskenmerk",
    payTo: "Gdzie zapłacić",
    steps: "Co zrobić",
    reply: "Odpowiedź po niderlandzku",
    copy: "📋 Kopiuj odpowiedź",
    copied: "✓ Skopiowano",
    remind: "⏰ Przypomnij {date} o 09:00",
    reminded: "✓ Przypomnę {date} o 09:00",
    failed: "Nie udało się. Spróbuj jeszcze raz.",
    note: "Asystent może się pomylić: sprawdź kwoty i terminy w samym liście.",
    urgency: { low: "Do wiadomości", medium: "Trzeba odpowiedzieć", high: "Pilne" },
  },
  ro: {
    title: "Scrisoare",
    deadline: "Termen",
    daysLeft: "mai sunt {n} zile",
    today: "azi!",
    overdue: "termenul a trecut",
    amount: "Sumă",
    reference: "Betalingskenmerk",
    payTo: "Unde plătiți",
    steps: "Ce trebuie făcut",
    reply: "Răspuns în neerlandeză",
    copy: "📋 Copiază răspunsul",
    copied: "✓ Copiat",
    remind: "⏰ Amintește-mi pe {date} la 09:00",
    reminded: "✓ Îți amintesc pe {date} la 09:00",
    failed: "Nu a mers. Încercați din nou.",
    note: "Asistentul poate greși: verificați sumele și termenele în scrisoare.",
    urgency: { low: "Informativ", medium: "Trebuie răspuns", high: "Urgent" },
  },
  tr: {
    title: "Mektup",
    deadline: "Son tarih",
    daysLeft: "{n} gün kaldı",
    today: "bugün!",
    overdue: "süre geçti",
    amount: "Tutar",
    reference: "Betalingskenmerk",
    payTo: "Ödeme hesabı",
    steps: "Ne yapmalı",
    reply: "Hollandaca cevap",
    copy: "📋 Cevabı kopyala",
    copied: "✓ Kopyalandı",
    remind: "⏰ {date} 09:00'da hatırlat",
    reminded: "✓ {date} 09:00'da hatırlatırım",
    failed: "Olmadı. Tekrar deneyin.",
    note: "Asistan yanılabilir: tutarları ve tarihleri mektubun kendisinden kontrol edin.",
    urgency: { low: "Bilgi için", medium: "Cevap gerekli", high: "Acil" },
  },
  en: {
    title: "Letter",
    deadline: "Deadline",
    daysLeft: "{n} days left",
    today: "today!",
    overdue: "deadline passed",
    amount: "Amount",
    reference: "Payment reference",
    payTo: "Pay to",
    steps: "What to do",
    reply: "Reply in Dutch",
    copy: "📋 Copy reply",
    copied: "✓ Copied",
    remind: "⏰ Remind me {date} at 09:00",
    reminded: "✓ I'll remind you {date} at 09:00",
    failed: "That didn't work. Please try again.",
    note: "The assistant can make mistakes: check amounts and dates against the letter itself.",
    urgency: { low: "For information", medium: "Needs a reply", high: "Urgent" },
  },
  nl: {
    title: "Brief",
    deadline: "Termijn",
    daysLeft: "nog {n} dagen",
    today: "vandaag!",
    overdue: "termijn verlopen",
    amount: "Bedrag",
    reference: "Betalingskenmerk",
    payTo: "Betalen aan",
    steps: "Wat te doen",
    reply: "Antwoord in het Nederlands",
    copy: "📋 Antwoord kopiëren",
    copied: "✓ Gekopieerd",
    remind: "⏰ Herinner mij op {date} om 09:00",
    reminded: "✓ Ik herinner u op {date} om 09:00",
    failed: "Dat lukte niet. Probeer het nog eens.",
    note: "De assistent kan zich vergissen: controleer bedragen en data in de brief zelf.",
    urgency: { low: "Ter informatie", medium: "Antwoord nodig", high: "Dringend" },
  },
};

export const getStaffLetterDict = (lang: Lang): StaffLetterDict => D[lang] ?? D.en;
