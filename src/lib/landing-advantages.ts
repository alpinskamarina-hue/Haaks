// Landing blocks built from the Nov 2026 competitor research (/mnt/project-files/research/konkurenty-nl-2026.md).
// Competitor prices are shown per category, without brand names; ranges come from the competitors' own sites.
// Machine-assisted translations: have a native speaker review before launch.
import type { Lang } from "./i18n";

type Item = { title: string; text: string };
type Cost = { who: string; cost: string; unit: string };

export type AdvantagesDict = {
  heroTitle: string;
  heroSubtitle: string;
  pills: string[];
  costTitle: string;
  costLead: string;
  costRows: Cost[];
  costUs: Cost;
  costNote: string;
  earlyTitle: string;
  earlyLead: string;
  earlySteps: string[];
  early: Item[];
  bundleTitle: string;
  bundleLead: string;
  bundle: { name: string; price: string }[];
  bundleTotal: [string, string];
  bundleUs: [string, string];
  bundleNote: string;
  trustTitle: string;
  trustLead: string;
  trust: (Item & { tag: string })[];
  moneyTitle: string;
  moneyLead: string;
  money: Item[];
  onlyTitle: string;
  onlyText: string;
  onlyNote: string;
  faq: { q: string; a: string }[];
};

const en: AdvantagesDict = {
  heroTitle: "Jobs before anyone else. No commission. In your language.",
  heroSubtitle:
    "Haaks finds new building projects all over the Netherlands, helps you reply in Dutch and handles all ZZP paperwork: quotes, invoices, hours, documents.",
  pills: ["0% commission", "€0 per contact", "7 languages", "Permits from all NL"],
  costTitle: "What one job costs you",
  costLead: "Others charge for every contact or take a cut of your work. Even when the client picks someone else.",
  costRows: [
    { who: "Job websites", cost: "€3–96", unit: "per contact" },
    { who: "Middleman services", cost: "15%", unit: "of every job" },
    { who: "Building permit lists", cost: "€59–199", unit: "per month" },
    { who: "Agencies", cost: "their margin", unit: "on every hour" },
  ],
  costUs: { who: "Haaks", cost: "€0 per contact", unit: "0% commission" },
  costNote: "Prices from the websites of these services, November 2026.",
  earlyTitle: "A job before others see it",
  earlyLead: "When a home owner gets a building permit, they are still looking for a builder. Haaks shows it to you first.",
  earlySteps: ["New permit near you", "Letter to the owner in Dutch", "Quote and invoice"],
  early: [
    { title: "All of the Netherlands, every day", text: "New building permits from every municipality. Only the ones that fit your trade and area." },
    { title: "Tenders and companies", text: "TenderNed tenders and jobs from construction companies in the same feed." },
    { title: "Straight to your phone", text: "A notification or Telegram message as soon as a fitting job appears." },
  ],
  bundleTitle: "One service instead of four",
  bundleLead: "What a ZZP builder usually pays for every month:",
  bundle: [
    { name: "Job website (contacts)", price: "€3–96 each" },
    { name: "Building permit list", price: "€59" },
    { name: "Invoicing software", price: "€15–39" },
    { name: "Translator for letters and quotes", price: "time and mistakes" },
  ],
  bundleTotal: ["Total", "over €100 a month"],
  bundleUs: ["Haaks Pro, all in one", "€29 · founders €19"],
  bundleNote: "There is also a free plan: your own paperwork without limits.",
  trustTitle: "Companies trust you",
  trustLead: "Since 2026 the tax office checks for “fake ZZP”. Haaks shows the client that you are a real entrepreneur.",
  trust: [
    { tag: "✓ Wet DBA", title: "Real entrepreneur", text: "Your own clients, prices and invoices. Counted from your work." },
    { tag: "ZZP passport", title: "All documents in one link", text: "KvK, VCA, insurance. You see when something expires." },
    { tag: "★★★★★", title: "Only honest reviews", text: "A review can only be left after a real deal." },
    { tag: "KvK checked", title: "Checked companies", text: "Companies in the feed are checked in the KvK register." },
  ],
  moneyTitle: "Get paid faster",
  moneyLead: "Almost half of ZZP workers get paid late. Haaks helps you get your money on time.",
  money: [
    { title: "Hours → invoice", text: "Enter your hours, the contractor approves them by link, the invoice is ready." },
    { title: "“Pay now” button in the invoice", text: "The client pays by link. If not, Haaks reminds you on day 7 and 14." },
    { title: "Your accountant is happy", text: "Correct btw, btw verlegd, KOR. Quarterly archive and e-invoices (UBL) for the accountant." },
  ],
  onlyTitle: "The only service like this in your language",
  onlyText:
    "We checked more than 30 services for builders in the Netherlands. None of them works in Polish, Romanian, Ukrainian, Russian or Turkish.",
  onlyNote: "You write in your language, the client sees everything in Dutch.",
  faq: [
    {
      q: "How is Haaks better than job websites?",
      a: "You do not pay for contacts and you do not give away a percentage. You see jobs from building permits before others, and everything is in your language.",
    },
    {
      q: "Is it free?",
      a: "Yes, there is a free plan: profile, passport, quotes and invoices without limits. Pro (€29 a month) opens the whole feed at once and sends notifications.",
    },
  ],
};

const ru: AdvantagesDict = {
  heroTitle: "Заказы раньше других. Без комиссии. На вашем языке.",
  heroSubtitle:
    "Haaks находит новые стройки по всей стране, помогает ответить на голландском и ведёт все бумаги ZZP: предложения, счета, часы, документы.",
  pills: ["0% комиссии", "€0 за контакт", "7 языков", "Разрешения по всей NL"],
  costTitle: "Сколько стоит найти один заказ",
  costLead: "Другие берут деньги за каждый контакт или процент с вашей работы. Даже если заказчик выбрал не вас.",
  costRows: [
    { who: "Сайты заказов", cost: "€3–96", unit: "за контакт" },
    { who: "Сервисы-посредники", cost: "15%", unit: "с каждого заказа" },
    { who: "Списки разрешений", cost: "€59–199", unit: "в месяц" },
    { who: "Агентства", cost: "своя маржа", unit: "с каждого часа" },
  ],
  costUs: { who: "Haaks", cost: "€0 за контакт", unit: "0% комиссии" },
  costNote: "Цены с сайтов этих сервисов, ноябрь 2026.",
  earlyTitle: "Заказ раньше, чем его увидят другие",
  earlyLead: "Когда владелец дома получает разрешение на стройку, он ещё ищет строителя. Haaks показывает это вам первым.",
  earlySteps: ["Новое разрешение рядом", "Письмо владельцу на голландском", "Предложение и счёт"],
  early: [
    { title: "Вся Голландия, каждый день", text: "Новые разрешения на стройку из всех гмин. Только те, что подходят вашей профессии и району." },
    { title: "Тендеры и компании", text: "Тендеры TenderNed и объявления строительных компаний в одной ленте." },
    { title: "Сразу на телефон", text: "Уведомление или Telegram, как только появился подходящий заказ." },
  ],
  bundleTitle: "Один сервис вместо четырёх",
  bundleLead: "За что строитель ZZP обычно платит каждый месяц:",
  bundle: [
    { name: "Сайт заказов (контакты)", price: "€3–96 за каждый" },
    { name: "Список разрешений на стройку", price: "€59" },
    { name: "Программа для счетов", price: "€15–39" },
    { name: "Переводчик для писем и предложений", price: "время и ошибки" },
  ],
  bundleTotal: ["Итого", "больше €100 в месяц"],
  bundleUs: ["Haaks Pro, всё вместе", "€29 · основатели €19"],
  bundleNote: "Есть и бесплатный тариф: свои бумаги без ограничений.",
  trustTitle: "Компании вам доверяют",
  trustLead: "С 2026 года налоговая проверяет «фиктивных ZZP». Haaks показывает заказчику, что вы настоящий предприниматель.",
  trust: [
    { tag: "✓ Wet DBA", title: "Настоящий предприниматель", text: "Свои клиенты, свои цены, свои счета. Считается из вашей работы." },
    { tag: "ZZP-паспорт", title: "Все документы одной ссылкой", text: "KvK, VCA, страховка. Видно, когда что истекает." },
    { tag: "★★★★★", title: "Только честные отзывы", text: "Отзыв можно оставить только после реальной сделки." },
    { tag: "KvK проверен", title: "Проверенные компании", text: "Компании в ленте проверены по реестру KvK." },
  ],
  moneyTitle: "Деньги приходят быстрее",
  moneyLead: "Почти половине ZZP платят с опозданием. Haaks помогает получить деньги вовремя.",
  money: [
    { title: "Часы → счёт", text: "Вносите часы, подрядчик подтверждает по ссылке, счёт готов сам." },
    { title: "Кнопка «Оплатить» в счёте", text: "Клиент платит по ссылке. Если не заплатил, Haaks напомнит вам на 7-й и 14-й день." },
    { title: "Бухгалтер доволен", text: "Правильный btw, btw verlegd, KOR. Архив за квартал и электронные счета (UBL) для бухгалтера." },
  ],
  onlyTitle: "Единственный такой сервис на вашем языке",
  onlyText:
    "Мы проверили больше 30 сервисов для строителей в Нидерландах. Ни один не работает на польском, румынском, украинском, русском или турецком.",
  onlyNote: "Вы пишете на своём языке, заказчик видит всё на голландском.",
  faq: [
    {
      q: "Чем Haaks лучше сайтов заказов?",
      a: "Вы не платите за контакты и не отдаёте процент. Заказы из разрешений вы видите раньше других, и всё на вашем языке.",
    },
    {
      q: "Это бесплатно?",
      a: "Да, есть бесплатный тариф: профиль, паспорт, предложения и счета без ограничений. Pro (€29 в месяц) открывает всю ленту сразу и присылает уведомления.",
    },
  ],
};

const uk: AdvantagesDict = {
  heroTitle: "Замовлення раніше за інших. Без комісії. Вашою мовою.",
  heroSubtitle:
    "Haaks знаходить нові будови по всій країні, допомагає відповісти нідерландською і веде всі папери ZZP: пропозиції, рахунки, години, документи.",
  pills: ["0% комісії", "€0 за контакт", "7 мов", "Дозволи по всій NL"],
  costTitle: "Скільки коштує знайти одне замовлення",
  costLead: "Інші беруть гроші за кожен контакт або відсоток з вашої роботи. Навіть якщо замовник обрав не вас.",
  costRows: [
    { who: "Сайти замовлень", cost: "€3–96", unit: "за контакт" },
    { who: "Сервіси-посередники", cost: "15%", unit: "з кожного замовлення" },
    { who: "Списки дозволів", cost: "€59–199", unit: "на місяць" },
    { who: "Агентства", cost: "своя маржа", unit: "з кожної години" },
  ],
  costUs: { who: "Haaks", cost: "€0 за контакт", unit: "0% комісії" },
  costNote: "Ціни з сайтів цих сервісів, листопад 2026.",
  earlyTitle: "Замовлення раніше, ніж його побачать інші",
  earlyLead: "Коли власник будинку отримує дозвіл на будівництво, він ще шукає будівельника. Haaks показує це вам першим.",
  earlySteps: ["Новий дозвіл поруч", "Лист власнику нідерландською", "Пропозиція і рахунок"],
  early: [
    { title: "Усі Нідерланди, щодня", text: "Нові дозволи на будівництво з усіх громад. Лише ті, що підходять вашій професії та району." },
    { title: "Тендери і компанії", text: "Тендери TenderNed та оголошення будівельних компаній в одній стрічці." },
    { title: "Одразу на телефон", text: "Сповіщення або Telegram, щойно з'явилося відповідне замовлення." },
  ],
  bundleTitle: "Один сервіс замість чотирьох",
  bundleLead: "За що будівельник ZZP зазвичай платить щомісяця:",
  bundle: [
    { name: "Сайт замовлень (контакти)", price: "€3–96 за кожен" },
    { name: "Список дозволів на будівництво", price: "€59" },
    { name: "Програма для рахунків", price: "€15–39" },
    { name: "Перекладач для листів і пропозицій", price: "час і помилки" },
  ],
  bundleTotal: ["Разом", "понад €100 на місяць"],
  bundleUs: ["Haaks Pro, усе разом", "€29 · засновники €19"],
  bundleNote: "Є і безкоштовний тариф: свої папери без обмежень.",
  trustTitle: "Компанії вам довіряють",
  trustLead: "З 2026 року податкова перевіряє «фіктивних ZZP». Haaks показує замовнику, що ви справжній підприємець.",
  trust: [
    { tag: "✓ Wet DBA", title: "Справжній підприємець", text: "Свої клієнти, свої ціни, свої рахунки. Рахується з вашої роботи." },
    { tag: "ZZP-паспорт", title: "Усі документи одним посиланням", text: "KvK, VCA, страховка. Видно, коли що закінчується." },
    { tag: "★★★★★", title: "Лише чесні відгуки", text: "Відгук можна залишити лише після реальної угоди." },
    { tag: "KvK перевірено", title: "Перевірені компанії", text: "Компанії в стрічці перевірені за реєстром KvK." },
  ],
  moneyTitle: "Гроші приходять швидше",
  moneyLead: "Майже половині ZZP платять із запізненням. Haaks допомагає отримати гроші вчасно.",
  money: [
    { title: "Години → рахунок", text: "Вносите години, підрядник підтверджує за посиланням, рахунок готовий сам." },
    { title: "Кнопка «Оплатити» в рахунку", text: "Клієнт платить за посиланням. Якщо не заплатив, Haaks нагадає вам на 7-й і 14-й день." },
    { title: "Бухгалтер задоволений", text: "Правильний btw, btw verlegd, KOR. Архів за квартал і електронні рахунки (UBL) для бухгалтера." },
  ],
  onlyTitle: "Єдиний такий сервіс вашою мовою",
  onlyText:
    "Ми перевірили понад 30 сервісів для будівельників у Нідерландах. Жоден не працює польською, румунською, українською, російською чи турецькою.",
  onlyNote: "Ви пишете своєю мовою, замовник бачить усе нідерландською.",
  faq: [
    {
      q: "Чим Haaks кращий за сайти замовлень?",
      a: "Ви не платите за контакти і не віддаєте відсоток. Замовлення з дозволів ви бачите раніше за інших, і все вашою мовою.",
    },
    {
      q: "Це безкоштовно?",
      a: "Так, є безкоштовний тариф: профіль, паспорт, пропозиції і рахунки без обмежень. Pro (€29 на місяць) відкриває всю стрічку одразу і надсилає сповіщення.",
    },
  ],
};

const pl: AdvantagesDict = {
  heroTitle: "Zlecenia przed innymi. Bez prowizji. W Twoim języku.",
  heroSubtitle:
    "Haaks znajduje nowe budowy w całej Holandii, pomaga odpowiedzieć po niderlandzku i prowadzi wszystkie papiery ZZP: oferty, faktury, godziny, dokumenty.",
  pills: ["0% prowizji", "€0 za kontakt", "7 języków", "Pozwolenia z całej NL"],
  costTitle: "Ile kosztuje znalezienie jednego zlecenia",
  costLead: "Inni biorą pieniądze za każdy kontakt albo procent od Twojej pracy. Nawet gdy klient wybrał kogoś innego.",
  costRows: [
    { who: "Portale ze zleceniami", cost: "€3–96", unit: "za kontakt" },
    { who: "Serwisy-pośrednicy", cost: "15%", unit: "od każdego zlecenia" },
    { who: "Listy pozwoleń", cost: "€59–199", unit: "miesięcznie" },
    { who: "Agencje", cost: "swoja marża", unit: "od każdej godziny" },
  ],
  costUs: { who: "Haaks", cost: "€0 za kontakt", unit: "0% prowizji" },
  costNote: "Ceny ze stron tych serwisów, listopad 2026.",
  earlyTitle: "Zlecenie, zanim zobaczą je inni",
  earlyLead: "Gdy właściciel domu dostaje pozwolenie na budowę, dopiero szuka wykonawcy. Haaks pokazuje to Tobie pierwszemu.",
  earlySteps: ["Nowe pozwolenie w pobliżu", "List do właściciela po niderlandzku", "Oferta i faktura"],
  early: [
    { title: "Cała Holandia, codziennie", text: "Nowe pozwolenia na budowę ze wszystkich gmin. Tylko te, które pasują do Twojego zawodu i rejonu." },
    { title: "Przetargi i firmy", text: "Przetargi TenderNed i ogłoszenia firm budowlanych w jednym miejscu." },
    { title: "Od razu na telefon", text: "Powiadomienie albo Telegram, gdy tylko pojawi się pasujące zlecenie." },
  ],
  bundleTitle: "Jeden serwis zamiast czterech",
  bundleLead: "Za co budowlaniec ZZP zwykle płaci co miesiąc:",
  bundle: [
    { name: "Portal ze zleceniami (kontakty)", price: "€3–96 za każdy" },
    { name: "Lista pozwoleń na budowę", price: "€59" },
    { name: "Program do faktur", price: "€15–39" },
    { name: "Tłumacz do listów i ofert", price: "czas i błędy" },
  ],
  bundleTotal: ["Razem", "ponad €100 miesięcznie"],
  bundleUs: ["Haaks Pro, wszystko razem", "€29 · założyciele €19"],
  bundleNote: "Jest też darmowy plan: własne papiery bez limitów.",
  trustTitle: "Firmy Ci ufają",
  trustLead: "Od 2026 roku urząd skarbowy sprawdza „fikcyjnych ZZP”. Haaks pokazuje klientowi, że jesteś prawdziwym przedsiębiorcą.",
  trust: [
    { tag: "✓ Wet DBA", title: "Prawdziwy przedsiębiorca", text: "Własni klienci, własne ceny, własne faktury. Liczone z Twojej pracy." },
    { tag: "Paszport ZZP", title: "Wszystkie dokumenty w jednym linku", text: "KvK, VCA, ubezpieczenie. Widać, kiedy co wygasa." },
    { tag: "★★★★★", title: "Tylko uczciwe opinie", text: "Opinię można zostawić tylko po prawdziwej transakcji." },
    { tag: "KvK sprawdzone", title: "Sprawdzone firmy", text: "Firmy w ogłoszeniach są sprawdzone w rejestrze KvK." },
  ],
  moneyTitle: "Pieniądze przychodzą szybciej",
  moneyLead: "Prawie połowa ZZP dostaje zapłatę z opóźnieniem. Haaks pomaga dostać pieniądze na czas.",
  money: [
    { title: "Godziny → faktura", text: "Wpisujesz godziny, wykonawca główny potwierdza je linkiem, faktura gotowa sama." },
    { title: "Przycisk „Zapłać” w fakturze", text: "Klient płaci przez link. Jeśli nie zapłaci, Haaks przypomni Ci 7. i 14. dnia." },
    { title: "Księgowy zadowolony", text: "Poprawny btw, btw verlegd, KOR. Archiwum kwartalne i e-faktury (UBL) dla księgowego." },
  ],
  onlyTitle: "Jedyny taki serwis w Twoim języku",
  onlyText:
    "Sprawdziliśmy ponad 30 serwisów dla budowlańców w Holandii. Żaden nie działa po polsku, rumuńsku, ukraińsku, rosyjsku ani turecku.",
  onlyNote: "Piszesz w swoim języku, klient widzi wszystko po niderlandzku.",
  faq: [
    {
      q: "Czym Haaks jest lepszy od portali ze zleceniami?",
      a: "Nie płacisz za kontakty i nie oddajesz procentu. Zlecenia z pozwoleń widzisz przed innymi i wszystko jest w Twoim języku.",
    },
    {
      q: "Czy to jest darmowe?",
      a: "Tak, jest darmowy plan: profil, paszport, oferty i faktury bez limitów. Pro (€29 miesięcznie) od razu otwiera wszystkie zlecenia i wysyła powiadomienia.",
    },
  ],
};

const ro: AdvantagesDict = {
  heroTitle: "Lucrări înaintea altora. Fără comision. În limba ta.",
  heroSubtitle:
    "Haaks găsește șantiere noi în toată Olanda, te ajută să răspunzi în neerlandeză și ține toate actele ZZP: oferte, facturi, ore, documente.",
  pills: ["0% comision", "€0 pe contact", "7 limbi", "Autorizații din toată NL"],
  costTitle: "Cât costă să găsești o lucrare",
  costLead: "Alții cer bani pentru fiecare contact sau un procent din munca ta. Chiar dacă clientul a ales pe altcineva.",
  costRows: [
    { who: "Site-uri de lucrări", cost: "€3–96", unit: "pe contact" },
    { who: "Servicii intermediare", cost: "15%", unit: "din fiecare lucrare" },
    { who: "Liste de autorizații", cost: "€59–199", unit: "pe lună" },
    { who: "Agenții", cost: "marja lor", unit: "din fiecare oră" },
  ],
  costUs: { who: "Haaks", cost: "€0 pe contact", unit: "0% comision" },
  costNote: "Prețuri de pe site-urile acestor servicii, noiembrie 2026.",
  earlyTitle: "O lucrare înainte s-o vadă alții",
  earlyLead: "Când proprietarul primește autorizația de construire, încă își caută constructor. Haaks ți-o arată ție primul.",
  earlySteps: ["Autorizație nouă lângă tine", "Scrisoare către proprietar în neerlandeză", "Ofertă și factură"],
  early: [
    { title: "Toată Olanda, în fiecare zi", text: "Autorizații de construire noi din toate comunele. Doar cele potrivite meseriei și zonei tale." },
    { title: "Licitații și firme", text: "Licitații TenderNed și anunțuri ale firmelor de construcții în același loc." },
    { title: "Direct pe telefon", text: "Notificare sau Telegram imediat ce apare o lucrare potrivită." },
  ],
  bundleTitle: "Un serviciu în loc de patru",
  bundleLead: "Ce plătește de obicei un constructor ZZP în fiecare lună:",
  bundle: [
    { name: "Site de lucrări (contacte)", price: "€3–96 fiecare" },
    { name: "Listă de autorizații de construire", price: "€59" },
    { name: "Program de facturare", price: "€15–39" },
    { name: "Traducător pentru scrisori și oferte", price: "timp și greșeli" },
  ],
  bundleTotal: ["Total", "peste €100 pe lună"],
  bundleUs: ["Haaks Pro, totul la un loc", "€29 · fondatori €19"],
  bundleNote: "Există și un plan gratuit: actele tale fără limite.",
  trustTitle: "Firmele au încredere în tine",
  trustLead: "Din 2026 fiscul verifică „ZZP fictivi”. Haaks îi arată clientului că ești un antreprenor adevărat.",
  trust: [
    { tag: "✓ Wet DBA", title: "Antreprenor adevărat", text: "Clienți proprii, prețuri proprii, facturi proprii. Calculat din munca ta." },
    { tag: "Pașaport ZZP", title: "Toate documentele într-un link", text: "KvK, VCA, asigurare. Vezi când expiră ceva." },
    { tag: "★★★★★", title: "Doar recenzii cinstite", text: "O recenzie se poate lăsa doar după o colaborare reală." },
    { tag: "KvK verificat", title: "Firme verificate", text: "Firmele din flux sunt verificate în registrul KvK." },
  ],
  moneyTitle: "Banii vin mai repede",
  moneyLead: "Aproape jumătate din ZZP sunt plătiți cu întârziere. Haaks te ajută să primești banii la timp.",
  money: [
    { title: "Ore → factură", text: "Introduci orele, antreprenorul le confirmă prin link, factura e gata singură." },
    { title: "Buton „Plătește” în factură", text: "Clientul plătește prin link. Dacă nu plătește, Haaks îți amintește în ziua 7 și 14." },
    { title: "Contabilul e mulțumit", text: "btw corect, btw verlegd, KOR. Arhivă trimestrială și facturi electronice (UBL) pentru contabil." },
  ],
  onlyTitle: "Singurul serviciu de acest fel în limba ta",
  onlyText:
    "Am verificat peste 30 de servicii pentru constructori în Olanda. Niciunul nu funcționează în poloneză, română, ucraineană, rusă sau turcă.",
  onlyNote: "Tu scrii în limba ta, clientul vede totul în neerlandeză.",
  faq: [
    {
      q: "Cu ce e mai bun Haaks decât site-urile de lucrări?",
      a: "Nu plătești pentru contacte și nu dai procent. Vezi lucrările din autorizații înaintea altora, și totul e în limba ta.",
    },
    {
      q: "Este gratuit?",
      a: "Da, există un plan gratuit: profil, pașaport, oferte și facturi fără limite. Pro (€29 pe lună) deschide imediat tot fluxul și trimite notificări.",
    },
  ],
};

const tr: AdvantagesDict = {
  heroTitle: "İşler herkesten önce. Komisyon yok. Kendi dilinde.",
  heroSubtitle:
    "Haaks tüm Hollanda'da yeni şantiyeleri bulur, Felemenkçe cevap vermene yardım eder ve tüm ZZP evraklarını yönetir: teklifler, faturalar, saatler, belgeler.",
  pills: ["%0 komisyon", "Kişi başı €0", "7 dil", "Tüm NL'den izinler"],
  costTitle: "Bir iş bulmak sana kaça mal oluyor",
  costLead: "Diğerleri her iletişim için para ya da işinden yüzde alır. Müşteri başkasını seçse bile.",
  costRows: [
    { who: "İş siteleri", cost: "€3–96", unit: "iletişim başına" },
    { who: "Aracı servisler", cost: "%15", unit: "her işten" },
    { who: "İnşaat izni listeleri", cost: "€59–199", unit: "aylık" },
    { who: "Ajanslar", cost: "kendi payları", unit: "her saatten" },
  ],
  costUs: { who: "Haaks", cost: "İletişim başına €0", unit: "%0 komisyon" },
  costNote: "Fiyatlar bu servislerin sitelerinden, Kasım 2026.",
  earlyTitle: "Başkaları görmeden iş",
  earlyLead: "Ev sahibi inşaat izni aldığında hâlâ usta arıyordur. Haaks bunu ilk sana gösterir.",
  earlySteps: ["Yakınında yeni izin", "Sahibine Felemenkçe mektup", "Teklif ve fatura"],
  early: [
    { title: "Tüm Hollanda, her gün", text: "Tüm belediyelerden yeni inşaat izinleri. Sadece mesleğine ve bölgene uyanlar." },
    { title: "İhaleler ve firmalar", text: "TenderNed ihaleleri ve inşaat firmalarının ilanları tek akışta." },
    { title: "Hemen telefonuna", text: "Uygun bir iş çıkar çıkmaz bildirim ya da Telegram." },
  ],
  bundleTitle: "Dört yerine tek servis",
  bundleLead: "Bir ZZP ustası genelde her ay neye para öder:",
  bundle: [
    { name: "İş sitesi (iletişimler)", price: "her biri €3–96" },
    { name: "İnşaat izni listesi", price: "€59" },
    { name: "Fatura programı", price: "€15–39" },
    { name: "Mektup ve teklifler için çevirmen", price: "zaman ve hatalar" },
  ],
  bundleTotal: ["Toplam", "ayda €100'den fazla"],
  bundleUs: ["Haaks Pro, hepsi bir arada", "€29 · kurucular €19"],
  bundleNote: "Ücretsiz plan da var: kendi evrakların sınırsız.",
  trustTitle: "Firmalar sana güvenir",
  trustLead: "2026'dan beri vergi dairesi “sahte ZZP” kontrol ediyor. Haaks müşteriye gerçek bir girişimci olduğunu gösterir.",
  trust: [
    { tag: "✓ Wet DBA", title: "Gerçek girişimci", text: "Kendi müşterilerin, fiyatların, faturaların. İşinden hesaplanır." },
    { tag: "ZZP pasaportu", title: "Tüm belgeler tek linkte", text: "KvK, VCA, sigorta. Neyin süresi dolduğunu görürsün." },
    { tag: "★★★★★", title: "Sadece dürüst yorumlar", text: "Yorum sadece gerçek bir işten sonra bırakılabilir." },
    { tag: "KvK kontrol edildi", title: "Kontrol edilmiş firmalar", text: "Akıştaki firmalar KvK sicilinde kontrol edilir." },
  ],
  moneyTitle: "Para daha hızlı gelir",
  moneyLead: "ZZP'lerin neredeyse yarısına geç ödeme yapılıyor. Haaks paranı zamanında almana yardım eder.",
  money: [
    { title: "Saatler → fatura", text: "Saatlerini gir, yüklenici link ile onaylar, fatura kendiliğinden hazır." },
    { title: "Faturada “Öde” butonu", text: "Müşteri link ile öder. Ödemezse Haaks sana 7. ve 14. gün hatırlatır." },
    { title: "Muhasebecin memnun", text: "Doğru btw, btw verlegd, KOR. Muhasebeci için çeyrek arşivi ve e-faturalar (UBL)." },
  ],
  onlyTitle: "Kendi dilinde bu türden tek servis",
  onlyText:
    "Hollanda'da ustalar için 30'dan fazla servisi inceledik. Hiçbiri Lehçe, Rumence, Ukraynaca, Rusça veya Türkçe çalışmıyor.",
  onlyNote: "Sen kendi dilinde yazarsın, müşteri her şeyi Felemenkçe görür.",
  faq: [
    {
      q: "Haaks iş sitelerinden neden daha iyi?",
      a: "İletişim için para ödemezsin ve yüzde vermezsin. İnşaat izinlerinden gelen işleri herkesten önce görürsün, hepsi kendi dilinde.",
    },
    {
      q: "Ücretsiz mi?",
      a: "Evet, ücretsiz plan var: profil, pasaport, teklifler ve faturalar sınırsız. Pro (ayda €29) tüm akışı hemen açar ve bildirim gönderir.",
    },
  ],
};

const nl: AdvantagesDict = {
  heroTitle: "Klussen eerder dan anderen. Geen commissie. In je eigen taal.",
  heroSubtitle:
    "Haaks vindt nieuwe bouwprojecten in heel Nederland, helpt je in het Nederlands te reageren en regelt al je ZZP-papierwerk: offertes, facturen, uren, documenten.",
  pills: ["0% commissie", "€0 per contact", "7 talen", "Vergunningen uit heel NL"],
  costTitle: "Wat één klus je kost",
  costLead: "Anderen rekenen per contact of nemen een deel van je werk. Ook als de klant een ander kiest.",
  costRows: [
    { who: "Klussenwebsites", cost: "€3–96", unit: "per contact" },
    { who: "Bemiddelingsdiensten", cost: "15%", unit: "van elke klus" },
    { who: "Vergunningenlijsten", cost: "€59–199", unit: "per maand" },
    { who: "Uitzendbureaus", cost: "hun marge", unit: "op elk uur" },
  ],
  costUs: { who: "Haaks", cost: "€0 per contact", unit: "0% commissie" },
  costNote: "Prijzen van de websites van deze diensten, november 2026.",
  earlyTitle: "Een klus voordat anderen hem zien",
  earlyLead: "Als een huiseigenaar een bouwvergunning krijgt, zoekt hij nog een vakman. Haaks laat het jou als eerste zien.",
  earlySteps: ["Nieuwe vergunning bij jou", "Brief aan de eigenaar in het Nederlands", "Offerte en factuur"],
  early: [
    { title: "Heel Nederland, elke dag", text: "Nieuwe bouwvergunningen uit alle gemeenten. Alleen wat past bij je vak en regio." },
    { title: "Aanbestedingen en bedrijven", text: "TenderNed-aanbestedingen en vacatures van bouwbedrijven in één overzicht." },
    { title: "Direct op je telefoon", text: "Een melding of Telegram-bericht zodra er een passende klus is." },
  ],
  bundleTitle: "Eén dienst in plaats van vier",
  bundleLead: "Waar een ZZP-vakman meestal elke maand voor betaalt:",
  bundle: [
    { name: "Klussenwebsite (contacten)", price: "€3–96 per stuk" },
    { name: "Lijst met bouwvergunningen", price: "€59" },
    { name: "Factuurprogramma", price: "€15–39" },
    { name: "Vertaler voor brieven en offertes", price: "tijd en fouten" },
  ],
  bundleTotal: ["Totaal", "meer dan €100 per maand"],
  bundleUs: ["Haaks Pro, alles in één", "€29 · oprichters €19"],
  bundleNote: "Er is ook een gratis plan: je eigen papierwerk zonder limiet.",
  trustTitle: "Bedrijven vertrouwen je",
  trustLead: "Sinds 2026 controleert de Belastingdienst op „schijnzelfstandigheid”. Haaks laat de opdrachtgever zien dat je een echte ondernemer bent.",
  trust: [
    { tag: "✓ Wet DBA", title: "Echte ondernemer", text: "Eigen klanten, eigen prijzen, eigen facturen. Berekend uit je werk." },
    { tag: "ZZP-paspoort", title: "Alle documenten in één link", text: "KvK, VCA, verzekering. Je ziet wanneer iets verloopt." },
    { tag: "★★★★★", title: "Alleen eerlijke reviews", text: "Een review kan alleen na een echte opdracht." },
    { tag: "KvK gecontroleerd", title: "Gecontroleerde bedrijven", text: "Bedrijven in het overzicht zijn gecontroleerd in het KvK-register." },
  ],
  moneyTitle: "Sneller betaald",
  moneyLead: "Bijna de helft van de ZZP'ers wordt te laat betaald. Haaks helpt je op tijd je geld te krijgen.",
  money: [
    { title: "Uren → factuur", text: "Vul je uren in, de opdrachtgever keurt ze goed via een link, de factuur staat klaar." },
    { title: "Knop „Nu betalen” in de factuur", text: "De klant betaalt via een link. Zo niet, dan herinnert Haaks je op dag 7 en 14." },
    { title: "Je boekhouder is blij", text: "Juiste btw, btw verlegd, KOR. Kwartaalarchief en e-facturen (UBL) voor de boekhouder." },
  ],
  onlyTitle: "De enige dienst zoals deze in je eigen taal",
  onlyText:
    "We hebben meer dan 30 diensten voor vakmensen in Nederland bekeken. Geen enkele werkt in het Pools, Roemeens, Oekraïens, Russisch of Turks.",
  onlyNote: "Jij schrijft in je eigen taal, de klant ziet alles in het Nederlands.",
  faq: [
    {
      q: "Waarom is Haaks beter dan klussenwebsites?",
      a: "Je betaalt niet per contact en je staat geen percentage af. Klussen uit bouwvergunningen zie je eerder dan anderen, en alles in je eigen taal.",
    },
    {
      q: "Is het gratis?",
      a: "Ja, er is een gratis plan: profiel, paspoort, offertes en facturen zonder limiet. Pro (€29 per maand) opent direct het hele overzicht en stuurt meldingen.",
    },
  ],
};

const dicts: Record<Lang, AdvantagesDict> = { en, ru, uk, pl, ro, tr, nl };

export function getAdvantages(lang: Lang): AdvantagesDict {
  return dicts[lang] ?? en;
}
