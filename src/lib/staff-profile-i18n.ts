import type { Lang } from "@/lib/i18n";
import type { ProfileField } from "@/lib/staff-profile";

// Texts for the profile card the employee prepares, and for «Заполнить с сотрудником» on sign-up.
export type StaffProfileDict = {
  title: string;
  save: string;
  saved: string;
  open: string;
  note: string;
  failed: string;
  yes: string;
  fields: Record<ProfileField, string>;
};
export type StaffFillDict = { button: string; hint: string; greeting: string };

const PROFILE: Record<Lang, StaffProfileDict> = {
  ru: {
    title: "Данные для профиля", save: "Сохранить", saved: "Сохранено", open: "Открыть профиль", note: "Ничего не сохранится, пока вы не нажмёте «Сохранить».", failed: "Не получилось сохранить. Попробуйте ещё раз.", yes: "да",
    fields: { full_name: "Имя и фамилия", phone: "Телефон", company_name: "Название фирмы", kvk_number: "KvK", btw_number: "BTW-номер", iban: "IBAN", business_address: "Адрес фирмы", business_email: "E-mail фирмы", trades: "Профессии", city: "Город", travel_km: "Готов ездить", extra_cities: "Ещё города", languages: "Языки", hourly_rate: "Ставка в час", experience_years: "Опыт, лет", vehicle: "Транспорт", licences: "Права", tools: "Инструмент", equipment: "Оборудование", works_with: "Работаю", team_size: "Человек в бригаде", about: "О себе (для клиентов)" },
  },
  uk: {
    title: "Дані для профілю", save: "Зберегти", saved: "Збережено", open: "Відкрити профіль", note: "Нічого не збережеться, поки ви не натиснете «Зберегти».", failed: "Не вдалося зберегти. Спробуйте ще раз.", yes: "так",
    fields: { full_name: "Ім'я та прізвище", phone: "Телефон", company_name: "Назва фірми", kvk_number: "KvK", btw_number: "BTW-номер", iban: "IBAN", business_address: "Адреса фірми", business_email: "E-mail фірми", trades: "Професії", city: "Місто", travel_km: "Готовий їздити", extra_cities: "Ще міста", languages: "Мови", hourly_rate: "Ставка за годину", experience_years: "Досвід, років", vehicle: "Транспорт", licences: "Права", tools: "Інструмент", equipment: "Обладнання", works_with: "Працюю", team_size: "Людей у бригаді", about: "Про себе (для клієнтів)" },
  },
  pl: {
    title: "Dane do profilu", save: "Zapisz", saved: "Zapisano", open: "Otwórz profil", note: "Nic się nie zapisze, dopóki nie naciśniesz «Zapisz».", failed: "Nie udało się zapisać. Spróbuj jeszcze raz.", yes: "tak",
    fields: { full_name: "Imię i nazwisko", phone: "Telefon", company_name: "Nazwa firmy", kvk_number: "KvK", btw_number: "Numer BTW", iban: "IBAN", business_address: "Adres firmy", business_email: "E-mail firmy", trades: "Zawody", city: "Miasto", travel_km: "Dojazd", extra_cities: "Inne miasta", languages: "Języki", hourly_rate: "Stawka za godzinę", experience_years: "Doświadczenie, lata", vehicle: "Transport", licences: "Prawo jazdy", tools: "Narzędzia", equipment: "Sprzęt", works_with: "Pracuję", team_size: "Osób w ekipie", about: "O mnie (dla klientów)" },
  },
  ro: {
    title: "Date pentru profil", save: "Salvează", saved: "Salvat", open: "Deschide profilul", note: "Nimic nu se salvează până nu apeși «Salvează».", failed: "Nu s-a putut salva. Încearcă din nou.", yes: "da",
    fields: { full_name: "Nume și prenume", phone: "Telefon", company_name: "Numele firmei", kvk_number: "KvK", btw_number: "Număr BTW", iban: "IBAN", business_address: "Adresa firmei", business_email: "E-mail firmă", trades: "Meserii", city: "Oraș", travel_km: "Distanță de lucru", extra_cities: "Alte orașe", languages: "Limbi", hourly_rate: "Tarif pe oră", experience_years: "Experiență, ani", vehicle: "Transport", licences: "Permis", tools: "Scule", equipment: "Echipament", works_with: "Lucrez", team_size: "Oameni în echipă", about: "Despre mine (pentru clienți)" },
  },
  tr: {
    title: "Profil bilgileri", save: "Kaydet", saved: "Kaydedildi", open: "Profili aç", note: "«Kaydet»e basana kadar hiçbir şey kaydedilmez.", failed: "Kaydedilemedi. Tekrar deneyin.", yes: "evet",
    fields: { full_name: "Ad soyad", phone: "Telefon", company_name: "Firma adı", kvk_number: "KvK", btw_number: "BTW numarası", iban: "IBAN", business_address: "Firma adresi", business_email: "Firma e-postası", trades: "Meslekler", city: "Şehir", travel_km: "Gidebileceğim mesafe", extra_cities: "Diğer şehirler", languages: "Diller", hourly_rate: "Saatlik ücret", experience_years: "Deneyim, yıl", vehicle: "Araç", licences: "Ehliyet", tools: "Alet", equipment: "Ekipman", works_with: "Çalışma şekli", team_size: "Ekipteki kişi", about: "Hakkımda (müşteriler için)" },
  },
  en: {
    title: "Details for your profile", save: "Save", saved: "Saved", open: "Open profile", note: "Nothing is saved until you tap «Save».", failed: "Could not save. Please try again.", yes: "yes",
    fields: { full_name: "Name", phone: "Phone", company_name: "Company name", kvk_number: "KvK", btw_number: "BTW number", iban: "IBAN", business_address: "Company address", business_email: "Company e-mail", trades: "Trades", city: "Town", travel_km: "Ready to travel", extra_cities: "More towns", languages: "Languages", hourly_rate: "Hourly rate", experience_years: "Experience, years", vehicle: "Transport", licences: "Driving licence", tools: "Tools", equipment: "Equipment", works_with: "I work", team_size: "People in the team", about: "About me (for clients)" },
  },
  nl: {
    title: "Gegevens voor je profiel", save: "Opslaan", saved: "Opgeslagen", open: "Profiel openen", note: "Er wordt niets opgeslagen tot je op «Opslaan» tikt.", failed: "Opslaan lukte niet. Probeer het opnieuw.", yes: "ja",
    fields: { full_name: "Naam", phone: "Telefoon", company_name: "Bedrijfsnaam", kvk_number: "KvK", btw_number: "Btw-nummer", iban: "IBAN", business_address: "Bedrijfsadres", business_email: "E-mail bedrijf", trades: "Vakken", city: "Woonplaats", travel_km: "Reisafstand", extra_cities: "Meer plaatsen", languages: "Talen", hourly_rate: "Uurtarief", experience_years: "Ervaring, jaren", vehicle: "Vervoer", licences: "Rijbewijs", tools: "Gereedschap", equipment: "Materieel", works_with: "Ik werk", team_size: "Mensen in het team", about: "Over mij (voor klanten)" },
  },
};

const FILL: Record<Lang, StaffFillDict> = {
  ru: {
    button: "🎤 Заполнить голосом с сотрудником",
    hint: "Расскажите о себе голосом или текстом, сотрудник сам заполнит профиль. 3 дня Ultra бесплатно, без карты.",
    greeting: "Здравствуйте! Я {name}, ваш цифровой сотрудник. Давайте заполним ваш профиль. Нажмите 🎤 и расскажите о себе своими словами: как вас зовут, телефон, кем работаете и сколько лет, в каком городе живёте и как далеко готовы ездить, какие языки знаете. Если есть KvK, BTW-номер и IBAN, скажите и их. Я всё подготовлю, а вы проверите и нажмёте «Сохранить».",
  },
  uk: {
    button: "🎤 Заповнити голосом із співробітником",
    hint: "Розкажіть про себе голосом або текстом, співробітник сам заповнить профіль. 3 дні Ultra безкоштовно, без картки.",
    greeting: "Вітаю! Я {name}, ваш цифровий співробітник. Давайте заповнимо ваш профіль. Натисніть 🎤 і розкажіть про себе своїми словами: як вас звати, телефон, ким працюєте і скільки років, у якому місті живете і як далеко готові їздити, які мови знаєте. Якщо є KvK, BTW-номер та IBAN, скажіть і їх. Я все підготую, а ви перевірите й натиснете «Зберегти».",
  },
  pl: {
    button: "🎤 Wypełnij głosem z asystentem",
    hint: "Opowiedz o sobie głosem lub tekstem, asystent sam wypełni profil. 3 dni Ultra za darmo, bez karty.",
    greeting: "Dzień dobry! Jestem {name}, twój cyfrowy asystent. Wypełnijmy twój profil. Naciśnij 🎤 i opowiedz o sobie własnymi słowami: imię i nazwisko, telefon, czym się zajmujesz i od ilu lat, w jakim mieście mieszkasz i jak daleko możesz dojeżdżać, jakie znasz języki. Jeśli masz KvK, numer BTW i IBAN, podaj je też. Wszystko przygotuję, a ty sprawdzisz i naciśniesz «Zapisz».",
  },
  ro: {
    button: "🎤 Completează vocal cu asistentul",
    hint: "Spune despre tine vocal sau în scris, asistentul completează singur profilul. 3 zile Ultra gratuit, fără card.",
    greeting: "Bună! Sunt {name}, asistentul tău digital. Hai să completăm profilul. Apasă 🎤 și spune despre tine cu cuvintele tale: nume, telefon, ce meserie ai și de câți ani, în ce oraș locuiești și cât de departe poți merge, ce limbi vorbești. Dacă ai KvK, număr BTW și IBAN, spune-le și pe ele. Pregătesc totul, iar tu verifici și apeși «Salvează».",
  },
  tr: {
    button: "🎤 Asistanla sesli doldur",
    hint: "Kendinizi sesli ya da yazılı anlatın, asistan profili kendisi doldurur. 3 gün Ultra ücretsiz, kart gerekmez.",
    greeting: "Merhaba! Ben {name}, dijital asistanınız. Profilinizi birlikte dolduralım. 🎤'a basın ve kendinizi anlatın: adınız, telefonunuz, mesleğiniz ve kaç yıldır yaptığınız, hangi şehirde yaşadığınız ve ne kadar uzağa gidebileceğiniz, hangi dilleri bildiğiniz. KvK, BTW numarası ve IBAN varsa onları da söyleyin. Ben her şeyi hazırlarım, siz kontrol edip «Kaydet»e basarsınız.",
  },
  en: {
    button: "🎤 Fill in by voice with your assistant",
    hint: "Tell about yourself by voice or text and the assistant fills in your profile. 3 days of Ultra free, no card.",
    greeting: "Hello! I'm {name}, your digital assistant. Let's fill in your profile. Tap 🎤 and tell me about yourself in your own words: your name, phone, your trade and for how many years, the town you live in and how far you travel, which languages you speak. If you have a KvK, BTW number and IBAN, tell me those too. I'll prepare everything; you check it and tap «Save».",
  },
  nl: {
    button: "🎤 Invullen met je assistent, met je stem",
    hint: "Vertel over jezelf met je stem of in tekst; de assistent vult je profiel in. 3 dagen Ultra gratis, zonder kaart.",
    greeting: "Hallo! Ik ben {name}, je digitale assistent. Laten we je profiel invullen. Tik op 🎤 en vertel over jezelf: je naam, telefoon, je vak en hoeveel jaar, waar je woont en hoe ver je wilt reizen, welke talen je spreekt. Heb je een KvK, btw-nummer en IBAN, noem die ook. Ik zet alles klaar; jij controleert het en tikt op «Opslaan».",
  },
};

export const getStaffProfileDict = (lang: Lang): StaffProfileDict => PROFILE[lang] ?? PROFILE.en;
export const getStaffFillDict = (lang: Lang): StaffFillDict => FILL[lang] ?? FILL.en;
export const fillName = (text: string, name: string) => text.replace("{name}", name);
