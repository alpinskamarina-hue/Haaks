import type { Lang } from "@/lib/i18n";

// Texts of the «Что помнит сотрудник» block in the employee settings.
export type StaffMemoryDict = { title: string; note: string; empty: string; forget: string; clear: string; clearConfirm: string };

const DICTS: Record<Lang, StaffMemoryDict> = {
  ru: {
    title: "Что помнит сотрудник",
    note: "Важное из ваших разговоров: клиенты, ставки, договорённости. Можно сказать сотруднику «запомни, что…». Пароли, номера карт и BSN он не сохраняет.",
    empty: "Пока ничего. Сотрудник начнёт запоминать важное после следующих разговоров.",
    forget: "Удалить",
    clear: "Очистить всю память",
    clearConfirm: "Удалить всё, что помнит сотрудник?",
  },
  uk: {
    title: "Що пам'ятає співробітник",
    note: "Важливе з ваших розмов: клієнти, ставки, домовленості. Можна сказати співробітнику «запам'ятай, що…». Паролі, номери карток і BSN він не зберігає.",
    empty: "Поки нічого. Співробітник почне запам'ятовувати важливе після наступних розмов.",
    forget: "Видалити",
    clear: "Очистити всю пам'ять",
    clearConfirm: "Видалити все, що пам'ятає співробітник?",
  },
  pl: {
    title: "Co pamięta pracownik",
    note: "Ważne rzeczy z waszych rozmów: klienci, stawki, ustalenia. Możesz powiedzieć «zapamiętaj, że…». Haseł, numerów kart i BSN nie zapisuje.",
    empty: "Na razie nic. Pracownik zacznie zapamiętywać ważne rzeczy po kolejnych rozmowach.",
    forget: "Usuń",
    clear: "Wyczyść całą pamięć",
    clearConfirm: "Usunąć wszystko, co pamięta pracownik?",
  },
  ro: {
    title: "Ce ține minte angajatul",
    note: "Lucruri importante din discuții: clienți, tarife, înțelegeri. Poți spune «ține minte că…». Parolele, numerele de card și BSN nu le salvează.",
    empty: "Deocamdată nimic. Angajatul va începe să rețină lucrurile importante după următoarele discuții.",
    forget: "Șterge",
    clear: "Golește toată memoria",
    clearConfirm: "Ștergi tot ce ține minte angajatul?",
  },
  tr: {
    title: "Çalışanın hatırladıkları",
    note: "Konuşmalarınızdan önemli şeyler: müşteriler, ücretler, anlaşmalar. «Şunu hatırla…» diyebilirsiniz. Şifreleri, kart numaralarını ve BSN'yi kaydetmez.",
    empty: "Henüz bir şey yok. Çalışan sonraki konuşmalardan sonra önemli şeyleri hatırlamaya başlayacak.",
    forget: "Sil",
    clear: "Tüm hafızayı temizle",
    clearConfirm: "Çalışanın hatırladığı her şey silinsin mi?",
  },
  en: {
    title: "What your employee remembers",
    note: "Important things from your talks: clients, rates, agreements. You can say «remember that…». Passwords, card numbers and BSN are never saved.",
    empty: "Nothing yet. Your employee will start remembering important things after your next talks.",
    forget: "Delete",
    clear: "Clear all memory",
    clearConfirm: "Delete everything your employee remembers?",
  },
  nl: {
    title: "Wat je medewerker onthoudt",
    note: "Belangrijke dingen uit jullie gesprekken: klanten, tarieven, afspraken. Je kunt zeggen «onthoud dat…». Wachtwoorden, kaartnummers en BSN worden nooit bewaard.",
    empty: "Nog niets. Je medewerker gaat belangrijke dingen onthouden na de volgende gesprekken.",
    forget: "Verwijderen",
    clear: "Hele geheugen wissen",
    clearConfirm: "Alles wissen wat je medewerker onthoudt?",
  },
};

export const getStaffMemoryDict = (lang: Lang): StaffMemoryDict => DICTS[lang] ?? DICTS.en;
