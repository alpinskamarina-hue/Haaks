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

// Step 2: the passport card for a document photo sent in the chat.
export type StaffDocDict = { title: string; add: string; added: string; open: string; note: string; failed: string; remind: string; remindText: string; fills: string };

const DOC: Record<Lang, StaffDocDict> = {
  ru: { title: "В ZZP-паспорт", add: "Добавить в паспорт", added: "Добавлено в паспорт", open: "Открыть паспорт", note: "Ничего не добавится, пока вы не нажмёте кнопку.", failed: "Не получилось добавить. Попробуйте ещё раз.", remind: "Напомню за 30 дней до окончания срока.", remindText: "Через 30 дней заканчивается срок: {doc}. Закажите новый документ.", fills: "Заполню в профиле:" },
  uk: { title: "До ZZP-паспорта", add: "Додати в паспорт", added: "Додано в паспорт", open: "Відкрити паспорт", note: "Нічого не додасться, поки ви не натиснете кнопку.", failed: "Не вдалося додати. Спробуйте ще раз.", remind: "Нагадаю за 30 днів до закінчення терміну.", remindText: "Через 30 днів закінчується термін: {doc}. Замовте новий документ.", fills: "Заповню в профілі:" },
  pl: { title: "Do paszportu ZZP", add: "Dodaj do paszportu", added: "Dodano do paszportu", open: "Otwórz paszport", note: "Nic nie zostanie dodane, dopóki nie naciśniesz przycisku.", failed: "Nie udało się dodać. Spróbuj jeszcze raz.", remind: "Przypomnę 30 dni przed końcem ważności.", remindText: "Za 30 dni kończy się ważność: {doc}. Zamów nowy dokument.", fills: "Uzupełnię w profilu:" },
  ro: { title: "În pașaportul ZZP", add: "Adaugă în pașaport", added: "Adăugat în pașaport", open: "Deschide pașaportul", note: "Nimic nu se adaugă până nu apeși butonul.", failed: "Nu s-a putut adăuga. Încearcă din nou.", remind: "Îți amintesc cu 30 de zile înainte de expirare.", remindText: "Peste 30 de zile expiră: {doc}. Comandă un document nou.", fills: "Completez în profil:" },
  tr: { title: "ZZP pasaportuna", add: "Pasaporta ekle", added: "Pasaporta eklendi", open: "Pasaportu aç", note: "Butona basana kadar hiçbir şey eklenmez.", failed: "Eklenemedi. Tekrar deneyin.", remind: "Süresi bitmeden 30 gün önce hatırlatırım.", remindText: "30 gün sonra süresi bitiyor: {doc}. Yeni belge isteyin.", fills: "Profilde dolduracağım:" },
  en: { title: "To your ZZP passport", add: "Add to passport", added: "Added to passport", open: "Open passport", note: "Nothing is added until you tap the button.", failed: "Could not add it. Please try again.", remind: "I'll remind you 30 days before it runs out.", remindText: "In 30 days this runs out: {doc}. Order a new one.", fills: "I'll fill in your profile:" },
  nl: { title: "Naar je ZZP-paspoort", add: "Toevoegen aan paspoort", added: "Toegevoegd aan paspoort", open: "Paspoort openen", note: "Er wordt niets toegevoegd tot je op de knop tikt.", failed: "Toevoegen lukte niet. Probeer het opnieuw.", remind: "Ik herinner je 30 dagen voordat het verloopt.", remindText: "Over 30 dagen verloopt: {doc}. Vraag een nieuw document aan.", fills: "Ik vul in je profiel in:" },
};

export const getStaffDocDict = (lang: Lang): StaffDocDict => DOC[lang] ?? DOC.en;

// Step 3: order cards (new order, hours, receipt).
export type StaffOrderDict = { fixed: string; newTitle: string; hoursTitle: string; receiptTitle: string; client: string; address: string; rate: string; create: string; add: string; done: string; open: string; note: string; failed: string; h: string; total: string; receiptHint: string; invoiceTitle: string; hoursLine: string; materials: string; markup: string; makeInvoice: string; openInvoice: string; invoiceNote: string };

const ORDER: Record<Lang, StaffOrderDict> = {
  ru: { fixed: "Сумма заказа", newTitle: "Новый заказ", hoursTitle: "Часы к заказу", receiptTitle: "Чек к заказу", client: "Клиент", address: "Адрес", rate: "Ставка в час", create: "Создать заказ", add: "Добавить", done: "Готово", open: "Открыть заказ", note: "Ничего не сохранится, пока вы не нажмёте кнопку.", failed: "Не получилось. Попробуйте ещё раз.", h: "ч", total: "Всего", receiptHint: "После добавления Haaks сам прочитает сумму и btw.", invoiceTitle: "Счёт по заказу", hoursLine: "Часы", materials: "Материалы по чекам (без btw)", markup: "Наценка на материалы", makeInvoice: "Создать черновик счёта", openInvoice: "Открыть и проверить счёт", invoiceNote: "Клиенту ничего не уйдёт, пока вы сами не отправите." },
  uk: { fixed: "Сума замовлення", newTitle: "Нове замовлення", hoursTitle: "Години до замовлення", receiptTitle: "Чек до замовлення", client: "Клієнт", address: "Адреса", rate: "Ставка за годину", create: "Створити замовлення", add: "Додати", done: "Готово", open: "Відкрити замовлення", note: "Нічого не збережеться, поки ви не натиснете кнопку.", failed: "Не вдалося. Спробуйте ще раз.", h: "год", total: "Всього", receiptHint: "Після додавання Haaks сам прочитає суму і btw.", invoiceTitle: "Рахунок за замовленням", hoursLine: "Години", materials: "Матеріали за чеками (без btw)", markup: "Націнка на матеріали", makeInvoice: "Створити чернетку рахунку", openInvoice: "Відкрити й перевірити рахунок", invoiceNote: "Клієнту нічого не піде, поки ви самі не надішлете." },
  pl: { fixed: "Kwota zlecenia", newTitle: "Nowe zlecenie", hoursTitle: "Godziny do zlecenia", receiptTitle: "Paragon do zlecenia", client: "Klient", address: "Adres", rate: "Stawka za godzinę", create: "Utwórz zlecenie", add: "Dodaj", done: "Gotowe", open: "Otwórz zlecenie", note: "Nic się nie zapisze, dopóki nie naciśniesz przycisku.", failed: "Nie udało się. Spróbuj jeszcze raz.", h: "godz.", total: "Razem", receiptHint: "Po dodaniu Haaks sam odczyta kwotę i btw.", invoiceTitle: "Faktura za zlecenie", hoursLine: "Godziny", materials: "Materiały z paragonów (bez btw)", markup: "Marża na materiały", makeInvoice: "Utwórz szkic faktury", openInvoice: "Otwórz i sprawdź fakturę", invoiceNote: "Nic nie trafi do klienta, dopóki sam tego nie wyślesz." },
  ro: { fixed: "Suma comenzii", newTitle: "Comandă nouă", hoursTitle: "Ore la comandă", receiptTitle: "Bon la comandă", client: "Client", address: "Adresă", rate: "Tarif pe oră", create: "Creează comanda", add: "Adaugă", done: "Gata", open: "Deschide comanda", note: "Nimic nu se salvează până nu apeși butonul.", failed: "Nu a mers. Încearcă din nou.", h: "h", total: "Total", receiptHint: "După adăugare, Haaks citește singur suma și btw.", invoiceTitle: "Factură pentru comandă", hoursLine: "Ore", materials: "Materiale din bonuri (fără btw)", markup: "Adaos la materiale", makeInvoice: "Creează ciorna facturii", openInvoice: "Deschide și verifică factura", invoiceNote: "Nimic nu ajunge la client până nu trimiți tu." },
  tr: { fixed: "İş tutarı", newTitle: "Yeni iş", hoursTitle: "İşe saatler", receiptTitle: "İşe fiş", client: "Müşteri", address: "Adres", rate: "Saatlik ücret", create: "İşi oluştur", add: "Ekle", done: "Tamam", open: "İşi aç", note: "Butona basana kadar hiçbir şey kaydedilmez.", failed: "Olmadı. Tekrar deneyin.", h: "sa", total: "Toplam", receiptHint: "Ekledikten sonra Haaks tutarı ve btw'yi kendisi okur.", invoiceTitle: "İş için fatura", hoursLine: "Saatler", materials: "Fişlerden malzeme (btw hariç)", markup: "Malzeme kârı", makeInvoice: "Fatura taslağı oluştur", openInvoice: "Faturayı aç ve kontrol et", invoiceNote: "Siz göndermeden müşteriye hiçbir şey gitmez." },
  en: { fixed: "Job price", newTitle: "New order", hoursTitle: "Hours for the order", receiptTitle: "Receipt for the order", client: "Client", address: "Address", rate: "Hourly rate", create: "Create order", add: "Add", done: "Done", open: "Open order", note: "Nothing is saved until you tap the button.", failed: "That did not work. Please try again.", h: "h", total: "Total", receiptHint: "After adding, Haaks reads the amount and btw itself.", invoiceTitle: "Invoice for the order", hoursLine: "Hours", materials: "Materials from receipts (excl. btw)", markup: "Markup on materials", makeInvoice: "Create draft invoice", openInvoice: "Open and check the invoice", invoiceNote: "Nothing goes to the client until you send it yourself." },
  nl: { fixed: "Aanneemsom", newTitle: "Nieuwe klus", hoursTitle: "Uren bij de klus", receiptTitle: "Bon bij de klus", client: "Klant", address: "Adres", rate: "Uurtarief", create: "Klus maken", add: "Toevoegen", done: "Klaar", open: "Klus openen", note: "Er wordt niets opgeslagen tot je op de knop tikt.", failed: "Dat lukte niet. Probeer het opnieuw.", h: "u", total: "Totaal", receiptHint: "Na toevoegen leest Haaks zelf het bedrag en de btw.", invoiceTitle: "Factuur voor de klus", hoursLine: "Uren", materials: "Materialen van bonnen (excl. btw)", markup: "Opslag op materialen", makeInvoice: "Conceptfactuur maken", openInvoice: "Factuur openen en controleren", invoiceNote: "Er gaat niets naar de klant tot je het zelf verstuurt." },
};

export const getStaffOrderDict = (lang: Lang): StaffOrderDict => ORDER[lang] ?? ORDER.en;

// Price changes the employee prepares (order rate, quote or draft invoice lines).
export type StaffPriceDict = { title: string; change: string; changed: string; open: string; removed: string; added: string; note: string; failed: string; stale: string };

const PRICE: Record<Lang, StaffPriceDict> = {
  ru: { title: "Изменить цены", change: "Изменить", changed: "Изменено", open: "Открыть", removed: "удалить", added: "новая строка", note: "Ничего не изменится, пока вы не нажмёте «Изменить».", failed: "Не получилось изменить. Попробуйте ещё раз.", stale: "Документ уже изменился или отправлен. Попросите сотрудника подготовить заново." },
  uk: { title: "Змінити ціни", change: "Змінити", changed: "Змінено", open: "Відкрити", removed: "видалити", added: "новий рядок", note: "Нічого не зміниться, поки ви не натиснете «Змінити».", failed: "Не вдалося змінити. Спробуйте ще раз.", stale: "Документ уже змінився або надісланий. Попросіть співробітника підготувати знову." },
  pl: { title: "Zmień ceny", change: "Zmień", changed: "Zmieniono", open: "Otwórz", removed: "usuń", added: "nowa pozycja", note: "Nic się nie zmieni, dopóki nie naciśniesz «Zmień».", failed: "Nie udało się zmienić. Spróbuj jeszcze raz.", stale: "Dokument już się zmienił lub został wysłany. Poproś asystenta o nową wersję." },
  ro: { title: "Schimbă prețurile", change: "Schimbă", changed: "Schimbat", open: "Deschide", removed: "șterge", added: "rând nou", note: "Nimic nu se schimbă până nu apeși «Schimbă».", failed: "Nu s-a putut schimba. Încearcă din nou.", stale: "Documentul s-a schimbat deja sau a fost trimis. Cere asistentului să pregătească din nou." },
  tr: { title: "Fiyatları değiştir", change: "Değiştir", changed: "Değiştirildi", open: "Aç", removed: "sil", added: "yeni satır", note: "«Değiştir»e basana kadar hiçbir şey değişmez.", failed: "Değiştirilemedi. Tekrar deneyin.", stale: "Belge zaten değişti veya gönderildi. Asistandan yeniden hazırlamasını isteyin." },
  en: { title: "Change prices", change: "Change", changed: "Changed", open: "Open", removed: "remove", added: "new line", note: "Nothing changes until you tap «Change».", failed: "Could not change it. Please try again.", stale: "The document has changed or was sent already. Ask the assistant to prepare it again." },
  nl: { title: "Prijzen wijzigen", change: "Wijzigen", changed: "Gewijzigd", open: "Openen", removed: "verwijderen", added: "nieuwe regel", note: "Er verandert niets tot je op «Wijzigen» tikt.", failed: "Wijzigen lukte niet. Probeer het opnieuw.", stale: "Het document is al gewijzigd of verstuurd. Vraag de assistent het opnieuw klaar te zetten." },
};

export const getStaffPriceDict = (lang: Lang): StaffPriceDict => PRICE[lang] ?? PRICE.en;

// A finished job the employee prepares for «Мои работы» from chat photos.
export type StaffWorkDict = { title: string; before: string; after: string; order: string; add: string; added: string; open: string; note: string; failed: string };

const WORK: Record<Lang, StaffWorkDict> = {
  ru: { title: "В мои работы", before: "До", after: "После", order: "Заказ", add: "Добавить в мои работы", added: "Добавлено", open: "Открыть", note: "Ничего не сохранится, пока вы не нажмёте «Добавить». Клиенты увидят работу в паспорте и профиле.", failed: "Не получилось добавить. Попробуйте ещё раз." },
  uk: { title: "У мої роботи", before: "До", after: "Після", order: "Замовлення", add: "Додати в мої роботи", added: "Додано", open: "Відкрити", note: "Нічого не збережеться, поки ви не натиснете «Додати». Клієнти побачать роботу в паспорті й профілі.", failed: "Не вдалося додати. Спробуйте ще раз." },
  pl: { title: "Do moich prac", before: "Przed", after: "Po", order: "Zlecenie", add: "Dodaj do moich prac", added: "Dodano", open: "Otwórz", note: "Nic nie zostanie zapisane, dopóki nie naciśniesz «Dodaj». Klienci zobaczą pracę w paszporcie i profilu.", failed: "Nie udało się dodać. Spróbuj jeszcze raz." },
  ro: { title: "La lucrările mele", before: "Înainte", after: "După", order: "Comandă", add: "Adaugă la lucrările mele", added: "Adăugat", open: "Deschide", note: "Nimic nu se salvează până nu apeși «Adaugă». Clienții vor vedea lucrarea în pașaport și profil.", failed: "Nu s-a putut adăuga. Încearcă din nou." },
  tr: { title: "İşlerime", before: "Önce", after: "Sonra", order: "İş", add: "İşlerime ekle", added: "Eklendi", open: "Aç", note: "«Ekle»ye basana kadar hiçbir şey kaydedilmez. Müşteriler işi pasaportta ve profilde görür.", failed: "Eklenemedi. Tekrar deneyin." },
  en: { title: "To my work", before: "Before", after: "After", order: "Order", add: "Add to my work", added: "Added", open: "Open", note: "Nothing is saved until you tap «Add». Clients will see the work on your passport and profile.", failed: "Could not add it. Please try again." },
  nl: { title: "Naar mijn werk", before: "Voor", after: "Na", order: "Klus", add: "Toevoegen aan mijn werk", added: "Toegevoegd", open: "Openen", note: "Er wordt niets opgeslagen tot je op «Toevoegen» tikt. Klanten zien het werk in je paspoort en profiel.", failed: "Toevoegen lukte niet. Probeer het opnieuw." },
};

export const getStaffWorkDict = (lang: Lang): StaffWorkDict => WORK[lang] ?? WORK.en;
