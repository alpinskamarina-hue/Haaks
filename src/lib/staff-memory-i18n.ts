import type { Lang } from "@/lib/i18n";

// Texts of the «Что помнит сотрудник» block in the employee settings.
export type StaffMemoryDict = {
  title: string;
  note: string;
  empty: string;
  forget: string;
  clear: string;
  clearConfirm: string;
  remTitle: string;
  remNote: string;
  remEmpty: string;
};

const DICTS: Record<Lang, StaffMemoryDict> = {
  ru: {
    title: "Что помнит сотрудник",
    note: "Важное из ваших разговоров: клиенты, ставки, договорённости. Можно сказать сотруднику «запомни, что…». Пароли, номера карт и BSN он не сохраняет.",
    empty:
      "Пока ничего. Сотрудник начнёт запоминать важное после следующих разговоров.",
    forget: "Удалить",
    clear: "Очистить всю память",
    clearConfirm: "Удалить всё, что помнит сотрудник?",
    remTitle: "Напоминания",
    remNote:
      "Скажите сотруднику «напомни в пятницу в 9 позвонить Jansen». Напоминание придёт на телефон примерно в это время.",
    remEmpty: "Напоминаний пока нет.",
  },
  uk: {
    title: "Що пам'ятає співробітник",
    note: "Важливе з ваших розмов: клієнти, ставки, домовленості. Можна сказати співробітнику «запам'ятай, що…». Паролі, номери карток і BSN він не зберігає.",
    empty:
      "Поки нічого. Співробітник почне запам'ятовувати важливе після наступних розмов.",
    forget: "Видалити",
    clear: "Очистити всю пам'ять",
    clearConfirm: "Видалити все, що пам'ятає співробітник?",
    remTitle: "Нагадування",
    remNote:
      "Скажіть співробітнику «нагадай у п'ятницю о 9 подзвонити Jansen». Нагадування прийде на телефон приблизно в цей час.",
    remEmpty: "Нагадувань поки немає.",
  },
  pl: {
    title: "Co pamięta pracownik",
    note: "Ważne rzeczy z waszych rozmów: klienci, stawki, ustalenia. Możesz powiedzieć «zapamiętaj, że…». Haseł, numerów kart i BSN nie zapisuje.",
    empty:
      "Na razie nic. Pracownik zacznie zapamiętywać ważne rzeczy po kolejnych rozmowach.",
    forget: "Usuń",
    clear: "Wyczyść całą pamięć",
    clearConfirm: "Usunąć wszystko, co pamięta pracownik?",
    remTitle: "Przypomnienia",
    remNote:
      "Powiedz pracownikowi «przypomnij w piątek o 9, żeby zadzwonić do Jansena». Przypomnienie przyjdzie na telefon mniej więcej o tej porze.",
    remEmpty: "Na razie brak przypomnień.",
  },
  ro: {
    title: "Ce ține minte angajatul",
    note: "Lucruri importante din discuții: clienți, tarife, înțelegeri. Poți spune «ține minte că…». Parolele, numerele de card și BSN nu le salvează.",
    empty:
      "Deocamdată nimic. Angajatul va începe să rețină lucrurile importante după următoarele discuții.",
    forget: "Șterge",
    clear: "Golește toată memoria",
    clearConfirm: "Ștergi tot ce ține minte angajatul?",
    remTitle: "Mementouri",
    remNote:
      "Spune-i angajatului «amintește-mi vineri la 9 să-l sun pe Jansen». Mementoul vine pe telefon cam la ora aceea.",
    remEmpty: "Deocamdată nu ai mementouri.",
  },
  tr: {
    title: "Çalışanın hatırladıkları",
    note: "Konuşmalarınızdan önemli şeyler: müşteriler, ücretler, anlaşmalar. «Şunu hatırla…» diyebilirsiniz. Şifreleri, kart numaralarını ve BSN'yi kaydetmez.",
    empty:
      "Henüz bir şey yok. Çalışan sonraki konuşmalardan sonra önemli şeyleri hatırlamaya başlayacak.",
    forget: "Sil",
    clear: "Tüm hafızayı temizle",
    clearConfirm: "Çalışanın hatırladığı her şey silinsin mi?",
    remTitle: "Hatırlatmalar",
    remNote:
      "Çalışana «cuma saat 9'da Jansen'i aramamı hatırlat» deyin. Hatırlatma telefona yaklaşık o saatte gelir.",
    remEmpty: "Henüz hatırlatma yok.",
  },
  en: {
    title: "What your employee remembers",
    note: "Important things from your talks: clients, rates, agreements. You can say «remember that…». Passwords, card numbers and BSN are never saved.",
    empty:
      "Nothing yet. Your employee will start remembering important things after your next talks.",
    forget: "Delete",
    clear: "Clear all memory",
    clearConfirm: "Delete everything your employee remembers?",
    remTitle: "Reminders",
    remNote:
      "Tell your employee «remind me on Friday at 9 to call Jansen». The reminder comes to your phone around that time.",
    remEmpty: "No reminders yet.",
  },
  nl: {
    title: "Wat je medewerker onthoudt",
    note: "Belangrijke dingen uit jullie gesprekken: klanten, tarieven, afspraken. Je kunt zeggen «onthoud dat…». Wachtwoorden, kaartnummers en BSN worden nooit bewaard.",
    empty:
      "Nog niets. Je medewerker gaat belangrijke dingen onthouden na de volgende gesprekken.",
    forget: "Verwijderen",
    clear: "Hele geheugen wissen",
    clearConfirm: "Alles wissen wat je medewerker onthoudt?",
    remTitle: "Herinneringen",
    remNote:
      "Zeg tegen je medewerker «herinner me vrijdag om 9 uur om Jansen te bellen». De herinnering komt rond dat tijdstip op je telefoon.",
    remEmpty: "Nog geen herinneringen.",
  },
};

export const getStaffMemoryDict = (lang: Lang): StaffMemoryDict =>
  DICTS[lang] ?? DICTS.en;
