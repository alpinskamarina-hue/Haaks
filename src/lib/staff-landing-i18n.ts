import type { Lang } from "./i18n";

// Landing block «Цифровой сотрудник: как он работает» (Nasim, 2026-11-08).
// Machine-assisted translations: have a native speaker review before launch.
export type StaffLandingDict = {
  badge: string;
  title: string;
  lead: string;
  steps: { icon: string; title: string; text: string }[];
  choose: string;
  cta: string;
  note: string;
  chat: { found: string; job: string; why: string; draftTitle: string; draft: string; send: string; role: string };
};

const DICTS: Record<Lang, StaffLandingDict> = {
  ru: {
    badge: "Новое · тариф Ultra",
    title: "Цифровой сотрудник, который работает за вас",
    lead: "Личный помощник на вашем языке. Сам ищет заказы, пишет клиентам на голландском и разбирается с бумагами.",
    steps: [
      { icon: "🔎", title: "Каждый час смотрит ленту", text: "Находит новые заказы по вашей профессии и району и приносит их в чат." },
      { icon: "✍️", title: "Готовит ответ на голландском", text: "На вашем языке объясняет, почему заказ подходит, и пишет вежливый ответ клиенту." },
      { icon: "👆", title: "Вы нажимаете «Отправить»", text: "Ответ можно поправить. Без вашего нажатия он никому ничего не отправляет." },
      { icon: "📷", title: "Помогает с письмами и бумагами", text: "Пришлите фото письма из налоговой: объяснит, что делать, и подготовит ответ. Считает btw за квартал." },
    ],
    choose: "Выберите лицо и имя, обращение на «вы» или «ты» и характер: коротко, подробно или с юмором.",
    cta: "Попробовать 3 дня бесплатно",
    note: "Без карты. Потом сами решаете, оставить ли Ultra.",
    chat: {
      found: "Нашёл заказ для вас",
      job: "Плитка в ванной, 6 м² · Schiedam",
      why: "12 км от вас, есть бюджет. Ответ готов, проверьте и отправьте.",
      draftTitle: "🇳🇱 Ответ клиенту",
      draft: "Goedendag, ik ben tegelzetter in de regio Rotterdam en kom graag langs om te kijken…",
      send: "✉️ Отправить клиенту",
      role: "Цифровой сотрудник · на связи",
    },
  },
  uk: {
    badge: "Нове · тариф Ultra",
    title: "Цифровий співробітник, який працює за вас",
    lead: "Особистий помічник вашою мовою. Сам шукає замовлення, пише клієнтам нідерландською і розбирається з паперами.",
    steps: [
      { icon: "🔎", title: "Щогодини дивиться стрічку", text: "Знаходить нові замовлення за вашою професією і районом і приносить їх у чат." },
      { icon: "✍️", title: "Готує відповідь нідерландською", text: "Вашою мовою пояснює, чому замовлення підходить, і пише ввічливу відповідь клієнту." },
      { icon: "👆", title: "Ви натискаєте «Надіслати»", text: "Відповідь можна виправити. Без вашого натискання він нікому нічого не надсилає." },
      { icon: "📷", title: "Допомагає з листами й паперами", text: "Надішліть фото листа з податкової: пояснить, що робити, і підготує відповідь. Рахує btw за квартал." },
    ],
    choose: "Оберіть обличчя та ім'я, звертання на «ви» чи «ти» і характер: коротко, докладно або з гумором.",
    cta: "Спробувати 3 дні безкоштовно",
    note: "Без картки. Потім самі вирішуєте, чи залишити Ultra.",
    chat: {
      found: "Знайшов замовлення для вас",
      job: "Плитка у ванній, 6 м² · Schiedam",
      why: "12 км від вас, є бюджет. Відповідь готова, перевірте й надішліть.",
      draftTitle: "🇳🇱 Відповідь клієнту",
      draft: "Goedendag, ik ben tegelzetter in de regio Rotterdam en kom graag langs om te kijken…",
      send: "✉️ Надіслати клієнту",
      role: "Цифровий співробітник · на зв'язку",
    },
  },
  pl: {
    badge: "Nowość · pakiet Ultra",
    title: "Cyfrowy pracownik, który pracuje za Ciebie",
    lead: "Osobisty asystent w Twoim języku. Sam szuka zleceń, pisze do klientów po niderlandzku i ogarnia papiery.",
    steps: [
      { icon: "🔎", title: "Co godzinę przegląda zlecenia", text: "Znajduje nowe zlecenia dla Twojego zawodu i okolicy i przynosi je do czatu." },
      { icon: "✍️", title: "Przygotowuje odpowiedź po niderlandzku", text: "W Twoim języku wyjaśnia, dlaczego zlecenie pasuje, i pisze uprzejmą odpowiedź do klienta." },
      { icon: "👆", title: "Ty klikasz «Wyślij»", text: "Odpowiedź możesz poprawić. Bez Twojego kliknięcia niczego nikomu nie wysyła." },
      { icon: "📷", title: "Pomaga z listami i papierami", text: "Wyślij zdjęcie listu z urzędu skarbowego: wyjaśni, co zrobić, i przygotuje odpowiedź. Liczy btw za kwartał." },
    ],
    choose: "Wybierz twarz i imię, formę «Pan/Pani» lub «ty» i charakter: krótko, szczegółowo lub z humorem.",
    cta: "Wypróbuj 3 dni za darmo",
    note: "Bez karty. Potem sam decydujesz, czy zostać przy Ultra.",
    chat: {
      found: "Znalazłem dla Ciebie zlecenie",
      job: "Płytki w łazience, 6 m² · Schiedam",
      why: "12 km od Ciebie, jest budżet. Odpowiedź gotowa, sprawdź i wyślij.",
      draftTitle: "🇳🇱 Odpowiedź do klienta",
      draft: "Goedendag, ik ben tegelzetter in de regio Rotterdam en kom graag langs om te kijken…",
      send: "✉️ Wyślij klientowi",
      role: "Cyfrowy pracownik · online",
    },
  },
  ro: {
    badge: "Nou · abonament Ultra",
    title: "Un angajat digital care lucrează pentru tine",
    lead: "Asistent personal în limba ta. Caută singur lucrări, le scrie clienților în neerlandeză și se ocupă de hârtii.",
    steps: [
      { icon: "🔎", title: "Verifică fluxul în fiecare oră", text: "Găsește lucrări noi pentru meseria și zona ta și le aduce în chat." },
      { icon: "✍️", title: "Pregătește răspunsul în neerlandeză", text: "Îți explică în limba ta de ce lucrarea se potrivește și scrie un răspuns politicos clientului." },
      { icon: "👆", title: "Tu apeși «Trimite»", text: "Poți corecta răspunsul. Fără apăsarea ta nu trimite nimic nimănui." },
      { icon: "📷", title: "Ajută cu scrisori și acte", text: "Trimite poza unei scrisori de la fisc: îți explică ce să faci și pregătește răspunsul. Calculează btw pe trimestru." },
    ],
    choose: "Alege fața și numele, formula «dumneavoastră» sau «tu» și caracterul: scurt, detaliat sau cu umor.",
    cta: "Încearcă 3 zile gratuit",
    note: "Fără card. Apoi decizi singur dacă păstrezi Ultra.",
    chat: {
      found: "Am găsit o lucrare pentru tine",
      job: "Faianță în baie, 6 m² · Schiedam",
      why: "La 12 km de tine, are buget. Răspunsul e gata, verifică și trimite.",
      draftTitle: "🇳🇱 Răspuns pentru client",
      draft: "Goedendag, ik ben tegelzetter in de regio Rotterdam en kom graag langs om te kijken…",
      send: "✉️ Trimite clientului",
      role: "Angajat digital · online",
    },
  },
  tr: {
    badge: "Yeni · Ultra paket",
    title: "Sizin yerinize çalışan dijital çalışan",
    lead: "Kendi dilinizde kişisel asistan. Kendisi iş arar, müşterilere Hollandaca yazar ve evrak işlerini halleder.",
    steps: [
      { icon: "🔎", title: "Her saat akışa bakar", text: "Mesleğinize ve bölgenize uygun yeni işleri bulur ve sohbete getirir." },
      { icon: "✍️", title: "Hollandaca cevap hazırlar", text: "İşin neden uygun olduğunu sizin dilinizde açıklar ve müşteriye kibar bir cevap yazar." },
      { icon: "👆", title: "Siz «Gönder»e basarsınız", text: "Cevabı düzeltebilirsiniz. Siz dokunmadan kimseye bir şey göndermez." },
      { icon: "📷", title: "Mektup ve evrakta yardım eder", text: "Vergi dairesinden gelen mektubun fotoğrafını gönderin: ne yapacağınızı açıklar ve cevabı hazırlar. Çeyreklik btw'yi hesaplar." },
    ],
    choose: "Yüzünü ve adını, «siz» ya da «sen» hitabını ve karakterini seçin: kısa, detaylı veya esprili.",
    cta: "3 gün ücretsiz deneyin",
    note: "Kart gerekmez. Sonra Ultra'da kalıp kalmayacağınıza siz karar verirsiniz.",
    chat: {
      found: "Size uygun bir iş buldum",
      job: "Banyo fayansı, 6 m² · Schiedam",
      why: "Size 12 km, bütçesi var. Cevap hazır, kontrol edip gönderin.",
      draftTitle: "🇳🇱 Müşteriye cevap",
      draft: "Goedendag, ik ben tegelzetter in de regio Rotterdam en kom graag langs om te kijken…",
      send: "✉️ Müşteriye gönder",
      role: "Dijital çalışan · çevrimiçi",
    },
  },
  en: {
    badge: "New · Ultra plan",
    title: "A digital employee who works for you",
    lead: "A personal assistant in your language. Finds jobs, writes to clients in Dutch and sorts out your paperwork.",
    steps: [
      { icon: "🔎", title: "Checks the feed every hour", text: "Finds new jobs for your trade and area and brings them into the chat." },
      { icon: "✍️", title: "Prepares a reply in Dutch", text: "Explains in your language why the job fits and writes a polite reply to the client." },
      { icon: "👆", title: "You tap «Send»", text: "You can edit the reply. Without your tap it never sends anything to anyone." },
      { icon: "📷", title: "Helps with letters and paperwork", text: "Send a photo of a tax office letter: it explains what to do and drafts a reply. It works out your quarterly btw." },
    ],
    choose: "Pick a face and a name, formal or informal, and a character: short, detailed or with humour.",
    cta: "Try it free for 3 days",
    note: "No card needed. Afterwards you decide whether to keep Ultra.",
    chat: {
      found: "I found a job for you",
      job: "Bathroom tiling, 6 m² · Schiedam",
      why: "12 km from you, has a budget. The reply is ready: check it and send.",
      draftTitle: "🇳🇱 Reply to the client",
      draft: "Goedendag, ik ben tegelzetter in de regio Rotterdam en kom graag langs om te kijken…",
      send: "✉️ Send to client",
      role: "Digital employee · online",
    },
  },
  nl: {
    badge: "Nieuw · Ultra-abonnement",
    title: "Een digitale medewerker die voor u werkt",
    lead: "Een persoonlijke assistent in uw eigen taal. Zoekt klussen, schrijft klanten in het Nederlands en regelt uw papierwerk.",
    steps: [
      { icon: "🔎", title: "Kijkt elk uur in de feed", text: "Vindt nieuwe klussen voor uw vak en regio en brengt ze in de chat." },
      { icon: "✍️", title: "Maakt een antwoord in het Nederlands", text: "Legt in uw taal uit waarom de klus past en schrijft een net antwoord aan de klant." },
      { icon: "👆", title: "U tikt op «Versturen»", text: "U kunt het antwoord aanpassen. Zonder uw tik verstuurt hij niets naar niemand." },
      { icon: "📷", title: "Helpt met brieven en papierwerk", text: "Stuur een foto van een brief van de Belastingdienst: hij legt uit wat u moet doen en maakt een antwoord. Rekent uw kwartaal-btw uit." },
    ],
    choose: "Kies een gezicht en naam, «u» of «je» en een karakter: kort, uitgebreid of met humor.",
    cta: "Probeer 3 dagen gratis",
    note: "Geen creditcard nodig. Daarna beslist u zelf of u Ultra houdt.",
    chat: {
      found: "Ik heb een klus voor u gevonden",
      job: "Badkamer betegelen, 6 m² · Schiedam",
      why: "12 km van u, er is budget. Het antwoord staat klaar: controleer en verstuur.",
      draftTitle: "🇳🇱 Antwoord aan de klant",
      draft: "Goedendag, ik ben tegelzetter in de regio Rotterdam en kom graag langs om te kijken…",
      send: "✉️ Stuur naar klant",
      role: "Digitale medewerker · online",
    },
  },
};

export function getStaffLanding(lang: Lang): StaffLandingDict {
  return DICTS[lang];
}
