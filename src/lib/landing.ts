// Landing page texts for visitors who are not signed in.
// Machine-assisted translations: have a native speaker review before launch.

import type { IconName } from "@/components/icons";
import type { Lang } from "./i18n";

type Item = { title: string; text: string };

export type LandingDict = {
  login: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaNote: string;
  problemsTitle: string;
  problems: Item[];
  featuresTitle: string;
  features: (Item & { icon: IconName })[];
  stepsTitle: string;
  steps: Item[];
  langTitle: string;
  langText: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  signupTitle: string;
  signupText: string;
  leadCard: { found: string; match: string; reply: string };
  footer: string;
};

const icons: IconName[] = ["passport", "quote", "invoice", "camera", "search", "home"];

// Finding clients is the main reason to join, so it is shown first.
const order = [4, 0, 1, 2, 3, 5];

const withIcons = (items: Item[]) => order.map((i) => ({ ...items[i], icon: icons[i] }));

const en: LandingDict = {
  login: "Sign in",
  badge: "For self-employed construction workers in the Netherlands",
  title: "Find clients and handle all ZZP paperwork in your language",
  subtitle:
    "Haaks shows you jobs that fit you and helps you reply in Dutch. Quotes, invoices, receipts and documents for contractors in one place.",
  cta: "Sign up for free",
  ctaNote: "Free. No card needed. Only your email.",
  problemsTitle: "Sound familiar?",
  problems: [
    {
      title: "The contractor wants papers again",
      text: "KvK extract, VCA, insurance. Every new site asks for the same documents, and something has always expired.",
    },
    {
      title: "Dutch quotes and invoices are hard",
      text: "One wrong line about VAT or btw verlegd and the invoice comes back. Without good Dutch it takes hours.",
    },
    {
      title: "Clients pay late",
      text: "Almost half of ZZP workers get paid late. Without a clear invoice and a reminder the money waits for weeks.",
    },
    {
      title: "Middlemen take your margin",
      text: "Agencies and job sites take a cut or charge for every contact, even when there is no job.",
    },
  ],
  featuresTitle: "What Haaks does for you",
  features: withIcons([
    {
      title: "ZZP passport in one link",
      text: "Upload KvK, VCA and insurance once. The contractor gets one link with everything, and you see when a document expires.",
    },
    {
      title: "Quotes in Dutch",
      text: "Describe the job in your language and add photos. You get a neat Dutch quote, and the client accepts it online with one button.",
    },
    {
      title: "Correct invoices",
      text: "Normal VAT, btw verlegd or KOR: the right text is added for you. Your KvK, VAT number and IBAN come from your profile. Save as PDF.",
    },
    {
      title: "Receipts and quarterly VAT",
      text: "Take a photo of a receipt from the building store. Costs are linked to the job, and you see the VAT for the quarter.",
    },
    {
      title: "Finding clients",
      text: "Paste a post or screenshot with a job. You see whether it fits you and get a ready reply in Dutch. No fee per contact.",
    },
    {
      title: "Everything on your phone",
      text: "One overview: what to send, what to pay, which documents expire. Works in the browser, no app to install.",
    },
  ]),
  stepsTitle: "How it works",
  steps: [
    { title: "Sign up", text: "Enter your email and choose a password." },
    { title: "Fill in your profile", text: "KvK number, VAT number, trade and documents. It takes about 10 minutes." },
    { title: "Work", text: "Send the passport link to contractors, make quotes and invoices in minutes." },
  ],
  langTitle: "In your language",
  langText:
    "Polski, Română, Українська, Русский, English and Nederlands. You read and write in your language, the client sees everything in Dutch.",
  faqTitle: "Questions",
  faq: [
    {
      q: "Is it really free?",
      a: "Yes. Signing up and using the service is free right now. If paid options come later, we will tell you in advance and you decide yourself.",
    },
    {
      q: "Do I need a KvK registration?",
      a: "For working as ZZP, yes. Haaks explains in your language which documents you need and where to get them.",
    },
    {
      q: "Is my data safe?",
      a: "Your documents are only visible to you and to people you send the link to. Do not upload your passport, ID card or BSN: they are not needed.",
    },
    {
      q: "Is this an agency or a middleman?",
      a: "No. You work directly with your clients. Haaks takes no cut from your jobs.",
    },
  ],
  signupTitle: "Start for free",
  signupText: "Choose an email and password. Confirm your address once with the link we send, then just sign in with your password.",
  leadCard: { found: "New job for you", match: "fits you", reply: "Reply in Dutch" },
  footer: "Haaks: tools for self-employed construction workers in the Netherlands.",
};

const ru: LandingDict = {
  login: "Войти",
  badge: "Для самозанятых строителей в Нидерландах",
  title: "Находите заказчиков и ведите все бумаги ZZP на родном языке",
  subtitle:
    "Haaks показывает подходящие заказы и помогает ответить клиенту на нидерландском. Сметы, счета, чеки и документы для подрядчиков в одном месте.",
  cta: "Зарегистрироваться бесплатно",
  ctaNote: "Бесплатно. Без карты. Нужна только почта.",
  problemsTitle: "Знакомо?",
  problems: [
    {
      title: "Подрядчик опять просит бумаги",
      text: "Выписка KvK, VCA, страховка. Каждый новый объект требует те же документы, и что-то всегда просрочено.",
    },
    {
      title: "Предложения и счета на нидерландском — это сложно",
      text: "Одна неверная строчка про НДС или btw verlegd, и счёт возвращают. Без хорошего нидерландского уходят часы.",
    },
    {
      title: "Заказчики платят с опозданием",
      text: "Почти половине ZZP платят поздно. Без понятного счёта и напоминания деньги ждут неделями.",
    },
    {
      title: "Посредники забирают вашу маржу",
      text: "Агентства и сайты с заказами берут процент или деньги за каждый контакт, даже если заказа нет.",
    },
  ],
  featuresTitle: "Что Haaks делает за вас",
  features: withIcons([
    {
      title: "Паспорт ZZP в одной ссылке",
      text: "Загрузите KvK, VCA и страховки один раз. Подрядчик получает одну ссылку со всем сразу, а вы видите, когда документ истекает.",
    },
    {
      title: "Предложения на нидерландском",
      text: "Опишите работу на своём языке и добавьте фото. Получите аккуратное предложение (offerte) на нидерландском, а заказчик примет его онлайн одной кнопкой.",
    },
    {
      title: "Правильные счета",
      text: "Обычный НДС, btw verlegd или KOR: нужный текст добавится сам. KvK, номер НДС и IBAN берутся из профиля. Сохранение в PDF.",
    },
    {
      title: "Чеки и НДС за квартал",
      text: "Сфотографируйте чек из строительного магазина. Расходы привязываются к заказу, и вы видите НДС за квартал.",
    },
    {
      title: "Поиск заказчиков",
      text: "Вставьте объявление или скриншот с заказом. Вы увидите, подходит ли он вам, и получите готовый ответ на нидерландском. Без оплаты за контакт.",
    },
    {
      title: "Всё в телефоне",
      text: "Одна сводка: что отправить, что оплатить, какие документы истекают. Работает в браузере, ничего устанавливать не нужно.",
    },
  ]),
  stepsTitle: "Как это работает",
  steps: [
    { title: "Регистрация", text: "Введите почту и придумайте пароль." },
    { title: "Заполните профиль", text: "Номер KvK, номер НДС, профессия и документы. Около 10 минут." },
    { title: "Работайте", text: "Отправляйте ссылку на паспорт подрядчикам, делайте предложения и счета за минуты." },
  ],
  langTitle: "На вашем языке",
  langText:
    "Polski, Română, Українська, Русский, English и Nederlands. Вы читаете и пишете на своём языке, а заказчик видит всё на нидерландском.",
  faqTitle: "Вопросы",
  faq: [
    {
      q: "Это правда бесплатно?",
      a: "Да. Регистрация и работа с сервисом сейчас бесплатны. Если позже появятся платные функции, мы заранее предупредим, и вы решите сами.",
    },
    {
      q: "Нужна ли регистрация в KvK?",
      a: "Для работы как ZZP — да. Haaks на вашем языке объясняет, какие документы нужны и где их взять.",
    },
    {
      q: "Мои данные в безопасности?",
      a: "Ваши документы видите только вы и те, кому вы отправили ссылку. Не загружайте паспорт, ID-карту и BSN: они не нужны.",
    },
    {
      q: "Это агентство или посредник?",
      a: "Нет. Вы работаете с заказчиками напрямую. Haaks не берёт процент с ваших заказов.",
    },
  ],
  signupTitle: "Начните бесплатно",
  signupText: "Укажите почту и пароль. Один раз подтвердите адрес по ссылке из письма, дальше просто входите по паролю.",
  leadCard: { found: "Новый заказ для вас", match: "подходит", reply: "Ответить на нидерландском" },
  footer: "Haaks: инструменты для самозанятых строителей в Нидерландах.",
};

const uk: LandingDict = {
  login: "Увійти",
  badge: "Для самозайнятих будівельників у Нідерландах",
  title: "Знаходьте замовників і ведіть усі папери ZZP рідною мовою",
  subtitle:
    "Haaks показує замовлення, що вам підходять, і допомагає відповісти клієнту нідерландською. Кошториси, рахунки, чеки й документи для підрядників в одному місці.",
  cta: "Зареєструватися безкоштовно",
  ctaNote: "Безкоштовно. Без картки. Потрібна лише пошта.",
  problemsTitle: "Знайомо?",
  problems: [
    {
      title: "Підрядник знову просить папери",
      text: "Виписка KvK, VCA, страховка. Кожен новий об'єкт вимагає ті самі документи, і щось завжди прострочене.",
    },
    {
      title: "Пропозиції та рахунки нідерландською — це складно",
      text: "Один неправильний рядок про ПДВ або btw verlegd, і рахунок повертають. Без доброї нідерландської йдуть години.",
    },
    {
      title: "Замовники платять із запізненням",
      text: "Майже половині ZZP платять пізно. Без зрозумілого рахунку й нагадування гроші чекають тижнями.",
    },
    {
      title: "Посередники забирають вашу маржу",
      text: "Агентства та сайти із замовленнями беруть відсоток або гроші за кожен контакт, навіть якщо замовлення немає.",
    },
  ],
  featuresTitle: "Що Haaks робить за вас",
  features: withIcons([
    {
      title: "Паспорт ZZP в одному посиланні",
      text: "Завантажте KvK, VCA та страховки один раз. Підрядник отримує одне посилання з усім одразу, а ви бачите, коли документ спливає.",
    },
    {
      title: "Пропозиції нідерландською",
      text: "Опишіть роботу своєю мовою й додайте фото. Отримаєте акуратну пропозицію (offerte) нідерландською, а замовник прийме її онлайн однією кнопкою.",
    },
    {
      title: "Правильні рахунки",
      text: "Звичайний ПДВ, btw verlegd або KOR: потрібний текст додасться сам. KvK, номер ПДВ та IBAN беруться з профілю. Збереження в PDF.",
    },
    {
      title: "Чеки та ПДВ за квартал",
      text: "Сфотографуйте чек із будівельного магазину. Витрати прив'язуються до замовлення, і ви бачите ПДВ за квартал.",
    },
    {
      title: "Пошук замовників",
      text: "Вставте оголошення або скриншот із замовленням. Ви побачите, чи воно вам підходить, і отримаєте готову відповідь нідерландською. Без оплати за контакт.",
    },
    {
      title: "Усе в телефоні",
      text: "Один огляд: що надіслати, що оплатити, які документи спливають. Працює в браузері, нічого встановлювати не треба.",
    },
  ]),
  stepsTitle: "Як це працює",
  steps: [
    { title: "Реєстрація", text: "Введіть пошту й придумайте пароль." },
    { title: "Заповніть профіль", text: "Номер KvK, номер ПДВ, професія та документи. Близько 10 хвилин." },
    { title: "Працюйте", text: "Надсилайте посилання на паспорт підрядникам, робіть пропозиції й рахунки за хвилини." },
  ],
  langTitle: "Вашою мовою",
  langText:
    "Polski, Română, Українська, Русский, English і Nederlands. Ви читаєте й пишете своєю мовою, а замовник бачить усе нідерландською.",
  faqTitle: "Питання",
  faq: [
    {
      q: "Це справді безкоштовно?",
      a: "Так. Реєстрація та робота із сервісом зараз безкоштовні. Якщо пізніше з'являться платні функції, ми попередимо заздалегідь, і ви вирішите самі.",
    },
    {
      q: "Чи потрібна реєстрація в KvK?",
      a: "Для роботи як ZZP — так. Haaks вашою мовою пояснює, які документи потрібні та де їх взяти.",
    },
    {
      q: "Мої дані в безпеці?",
      a: "Ваші документи бачите лише ви та ті, кому ви надіслали посилання. Не завантажуйте паспорт, ID-картку та BSN: вони не потрібні.",
    },
    {
      q: "Це агентство чи посередник?",
      a: "Ні. Ви працюєте із замовниками напряму. Haaks не бере відсоток із ваших замовлень.",
    },
  ],
  signupTitle: "Почніть безкоштовно",
  signupText: "Вкажіть пошту й пароль. Один раз підтвердьте адресу за посиланням із листа, далі просто входьте за паролем.",
  leadCard: { found: "Нове замовлення для вас", match: "підходить", reply: "Відповісти нідерландською" },
  footer: "Haaks: інструменти для самозайнятих будівельників у Нідерландах.",
};

const pl: LandingDict = {
  login: "Zaloguj się",
  badge: "Dla samozatrudnionych budowlańców w Holandii",
  title: "Znajduj klientów i prowadź całą papierologię ZZP w swoim języku",
  subtitle:
    "Haaks pokazuje zlecenia, które do Ciebie pasują, i pomaga odpowiedzieć po niderlandzku. Oferty, faktury, paragony i dokumenty dla wykonawców w jednym miejscu.",
  cta: "Zarejestruj się za darmo",
  ctaNote: "Za darmo. Bez karty. Wystarczy e-mail.",
  problemsTitle: "Brzmi znajomo?",
  problems: [
    {
      title: "Wykonawca znowu chce papiery",
      text: "Wyciąg z KvK, VCA, ubezpieczenie. Każda nowa budowa wymaga tych samych dokumentów i zawsze coś jest nieważne.",
    },
    {
      title: "Oferty i faktury po niderlandzku są trudne",
      text: "Jedna zła linijka o VAT albo btw verlegd i faktura wraca. Bez dobrego niderlandzkiego to godziny pracy.",
    },
    {
      title: "Klienci płacą z opóźnieniem",
      text: "Prawie połowa ZZP dostaje pieniądze za późno. Bez jasnej faktury i przypomnienia pieniądze czekają tygodniami.",
    },
    {
      title: "Pośrednicy zabierają Twoją marżę",
      text: "Agencje i portale ze zleceniami biorą procent albo opłatę za każdy kontakt, nawet gdy zlecenia nie ma.",
    },
  ],
  featuresTitle: "Co Haaks robi za Ciebie",
  features: withIcons([
    {
      title: "Paszport ZZP w jednym linku",
      text: "Wgraj KvK, VCA i ubezpieczenia raz. Wykonawca dostaje jeden link ze wszystkim, a Ty widzisz, kiedy dokument wygasa.",
    },
    {
      title: "Oferty po niderlandzku",
      text: "Opisz pracę w swoim języku i dodaj zdjęcia. Dostajesz porządną ofertę (offerte) po niderlandzku, a klient akceptuje ją online jednym przyciskiem.",
    },
    {
      title: "Poprawne faktury",
      text: "Zwykły VAT, btw verlegd albo KOR: właściwy tekst dodaje się sam. KvK, numer VAT i IBAN z Twojego profilu. Zapis do PDF.",
    },
    {
      title: "Paragony i VAT za kwartał",
      text: "Zrób zdjęcie paragonu z marketu budowlanego. Koszty są przypisane do zlecenia i widzisz VAT za kwartał.",
    },
    {
      title: "Szukanie klientów",
      text: "Wklej ogłoszenie albo zrzut ekranu ze zleceniem. Zobaczysz, czy pasuje, i dostaniesz gotową odpowiedź po niderlandzku. Bez opłat za kontakt.",
    },
    {
      title: "Wszystko w telefonie",
      text: "Jeden przegląd: co wysłać, co zapłacić, które dokumenty wygasają. Działa w przeglądarce, nic nie trzeba instalować.",
    },
  ]),
  stepsTitle: "Jak to działa",
  steps: [
    { title: "Rejestracja", text: "Wpisz e-mail i wymyśl hasło." },
    { title: "Uzupełnij profil", text: "Numer KvK, numer VAT, zawód i dokumenty. Około 10 minut." },
    { title: "Pracuj", text: "Wysyłaj link do paszportu wykonawcom, rób oferty i faktury w kilka minut." },
  ],
  langTitle: "W Twoim języku",
  langText:
    "Polski, Română, Українська, Русский, English i Nederlands. Czytasz i piszesz w swoim języku, a klient widzi wszystko po niderlandzku.",
  faqTitle: "Pytania",
  faq: [
    {
      q: "Czy to naprawdę za darmo?",
      a: "Tak. Rejestracja i korzystanie z serwisu są teraz bezpłatne. Jeśli później pojawią się płatne opcje, uprzedzimy wcześniej i sam zdecydujesz.",
    },
    {
      q: "Czy potrzebuję rejestracji w KvK?",
      a: "Do pracy jako ZZP tak. Haaks wyjaśnia w Twoim języku, jakie dokumenty są potrzebne i skąd je wziąć.",
    },
    {
      q: "Czy moje dane są bezpieczne?",
      a: "Twoje dokumenty widzisz tylko Ty i osoby, którym wyślesz link. Nie wgrywaj paszportu, dowodu osobistego ani BSN: nie są potrzebne.",
    },
    {
      q: "Czy to agencja albo pośrednik?",
      a: "Nie. Pracujesz z klientami bezpośrednio. Haaks nie bierze prowizji od Twoich zleceń.",
    },
  ],
  signupTitle: "Zacznij za darmo",
  signupText: "Podaj e-mail i hasło. Raz potwierdź adres linkiem z wiadomości, potem logujesz się hasłem.",
  leadCard: { found: "Nowe zlecenie dla Ciebie", match: "pasuje", reply: "Odpowiedz po niderlandzku" },
  footer: "Haaks: narzędzia dla samozatrudnionych budowlańców w Holandii.",
};

const ro: LandingDict = {
  login: "Autentificare",
  badge: "Pentru constructorii independenți din Țările de Jos",
  title: "Găsește clienți și ține toate actele de ZZP în limba ta",
  subtitle:
    "Haaks îți arată lucrările potrivite și te ajută să răspunzi în olandeză. Oferte, facturi, bonuri și documente pentru antreprenori într-un singur loc.",
  cta: "Înregistrează-te gratuit",
  ctaNote: "Gratuit. Fără card. Doar adresa de e-mail.",
  problemsTitle: "Îți sună cunoscut?",
  problems: [
    {
      title: "Antreprenorul cere iar acte",
      text: "Extras KvK, VCA, asigurare. Fiecare șantier nou cere aceleași documente și mereu ceva a expirat.",
    },
    {
      title: "Ofertele și facturile în olandeză sunt grele",
      text: "Un singur rând greșit despre TVA sau btw verlegd și factura se întoarce. Fără olandeză bună durează ore.",
    },
    {
      title: "Clienții plătesc târziu",
      text: "Aproape jumătate dintre ZZP sunt plătiți cu întârziere. Fără o factură clară și un memento, banii așteaptă săptămâni.",
    },
    {
      title: "Intermediarii îți iau marja",
      text: "Agențiile și site-urile de lucrări iau un procent sau bani pentru fiecare contact, chiar dacă nu iese nicio lucrare.",
    },
  ],
  featuresTitle: "Ce face Haaks pentru tine",
  features: withIcons([
    {
      title: "Pașaport ZZP într-un singur link",
      text: "Încarci o dată KvK, VCA și asigurările. Antreprenorul primește un link cu tot, iar tu vezi când expiră un document.",
    },
    {
      title: "Oferte în olandeză",
      text: "Descrie lucrarea în limba ta și adaugă poze. Primești o ofertă (offerte) îngrijită în olandeză, iar clientul o acceptă online cu un singur buton.",
    },
    {
      title: "Facturi corecte",
      text: "TVA normal, btw verlegd sau KOR: textul potrivit se adaugă singur. KvK, codul TVA și IBAN vin din profil. Salvare ca PDF.",
    },
    {
      title: "Bonuri și TVA pe trimestru",
      text: "Fotografiază bonul de la magazinul de construcții. Costurile se leagă de lucrare și vezi TVA-ul pe trimestru.",
    },
    {
      title: "Găsirea clienților",
      text: "Lipește un anunț sau o captură cu o lucrare. Vezi dacă ți se potrivește și primești un răspuns gata scris în olandeză. Fără taxă pe contact.",
    },
    {
      title: "Totul pe telefon",
      text: "O singură privire de ansamblu: ce trimiți, ce plătești, ce documente expiră. Merge în browser, nu instalezi nimic.",
    },
  ]),
  stepsTitle: "Cum funcționează",
  steps: [
    { title: "Înregistrare", text: "Scrie adresa de e-mail și alege o parolă." },
    { title: "Completează profilul", text: "Număr KvK, cod TVA, meserie și documente. Cam 10 minute." },
    { title: "Lucrează", text: "Trimite linkul pașaportului antreprenorilor, fă oferte și facturi în câteva minute." },
  ],
  langTitle: "În limba ta",
  langText:
    "Polski, Română, Українська, Русский, English și Nederlands. Citești și scrii în limba ta, iar clientul vede totul în olandeză.",
  faqTitle: "Întrebări",
  faq: [
    {
      q: "Chiar este gratuit?",
      a: "Da. Înregistrarea și folosirea serviciului sunt acum gratuite. Dacă mai târziu apar opțiuni plătite, te anunțăm din timp și decizi singur.",
    },
    {
      q: "Am nevoie de înregistrare la KvK?",
      a: "Pentru a lucra ca ZZP, da. Haaks îți explică în limba ta ce documente îți trebuie și de unde le iei.",
    },
    {
      q: "Datele mele sunt în siguranță?",
      a: "Documentele tale le vezi doar tu și cei cărora le trimiți linkul. Nu încărca pașaportul, buletinul sau BSN-ul: nu sunt necesare.",
    },
    {
      q: "Este o agenție sau un intermediar?",
      a: "Nu. Lucrezi direct cu clienții tăi. Haaks nu ia comision din lucrările tale.",
    },
  ],
  signupTitle: "Începe gratuit",
  signupText: "Alege e-mailul și parola. Confirmă o dată adresa cu linkul primit, apoi intri doar cu parola.",
  leadCard: { found: "Lucrare nouă pentru tine", match: "potrivire", reply: "Răspunde în olandeză" },
  footer: "Haaks: unelte pentru constructorii independenți din Țările de Jos.",
};

const nl: LandingDict = {
  login: "Inloggen",
  badge: "Voor zzp'ers in de bouw in Nederland",
  title: "Vind klanten en regel je zzp-administratie in je eigen taal",
  subtitle:
    "Haaks laat klussen zien die bij je passen en helpt je in het Nederlands te reageren. Offertes, facturen, bonnetjes en documenten voor opdrachtgevers op één plek.",
  cta: "Gratis aanmelden",
  ctaNote: "Gratis. Geen creditcard. Alleen je e-mailadres.",
  problemsTitle: "Herkenbaar?",
  problems: [
    {
      title: "De aannemer wil weer papieren",
      text: "KvK-uittreksel, VCA, verzekering. Elke nieuwe bouwplaats vraagt dezelfde documenten en er is altijd iets verlopen.",
    },
    {
      title: "Offertes en facturen in het Nederlands zijn lastig",
      text: "Eén verkeerde regel over btw of btw verlegd en de factuur komt terug. Zonder goed Nederlands kost het uren.",
    },
    {
      title: "Klanten betalen te laat",
      text: "Bijna de helft van de zzp'ers wordt te laat betaald. Zonder duidelijke factuur en herinnering wacht het geld weken.",
    },
    {
      title: "Tussenpersonen nemen je marge",
      text: "Bureaus en klussensites nemen een percentage of laten je betalen per contact, ook als er geen klus komt.",
    },
  ],
  featuresTitle: "Wat Haaks voor je doet",
  features: withIcons([
    {
      title: "Zzp-paspoort in één link",
      text: "Upload KvK, VCA en verzekeringen één keer. De opdrachtgever krijgt één link met alles, en jij ziet wanneer een document verloopt.",
    },
    {
      title: "Offertes in het Nederlands",
      text: "Beschrijf de klus in je eigen taal en voeg foto's toe. Je krijgt een nette Nederlandse offerte, en de klant gaat online akkoord met één knop.",
    },
    {
      title: "Correcte facturen",
      text: "Gewone btw, btw verlegd of KOR: de juiste tekst komt er vanzelf op. KvK, btw-id en IBAN komen uit je profiel. Opslaan als pdf.",
    },
    {
      title: "Bonnetjes en btw per kwartaal",
      text: "Maak een foto van de bon van de bouwmarkt. Kosten worden aan de klus gekoppeld en je ziet de btw per kwartaal.",
    },
    {
      title: "Klanten vinden",
      text: "Plak een oproep of screenshot van een klus. Je ziet of hij bij je past en krijgt een kant-en-klaar antwoord in het Nederlands. Geen kosten per contact.",
    },
    {
      title: "Alles op je telefoon",
      text: "Eén overzicht: wat versturen, wat betalen, welke documenten verlopen. Werkt in de browser, niets te installeren.",
    },
  ]),
  stepsTitle: "Zo werkt het",
  steps: [
    { title: "Aanmelden", text: "Vul je e-mailadres in en kies een wachtwoord." },
    { title: "Profiel invullen", text: "KvK-nummer, btw-id, vak en documenten. Ongeveer 10 minuten." },
    { title: "Aan het werk", text: "Stuur de paspoortlink naar opdrachtgevers, maak offertes en facturen in een paar minuten." },
  ],
  langTitle: "In je eigen taal",
  langText:
    "Polski, Română, Українська, Русский, English en Nederlands. Jij leest en schrijft in je eigen taal, de klant ziet alles in het Nederlands.",
  faqTitle: "Vragen",
  faq: [
    {
      q: "Is het echt gratis?",
      a: "Ja. Aanmelden en gebruiken is nu gratis. Als er later betaalde opties komen, laten we dat vooraf weten en beslis je zelf.",
    },
    {
      q: "Heb ik een KvK-inschrijving nodig?",
      a: "Om als zzp'er te werken wel. Haaks legt in je eigen taal uit welke documenten je nodig hebt en waar je ze haalt.",
    },
    {
      q: "Zijn mijn gegevens veilig?",
      a: "Je documenten zijn alleen zichtbaar voor jou en voor wie je de link stuurt. Upload geen paspoort, ID-kaart of BSN: die zijn niet nodig.",
    },
    {
      q: "Is dit een bureau of tussenpersoon?",
      a: "Nee. Je werkt rechtstreeks met je klanten. Haaks neemt geen percentage van je klussen.",
    },
  ],
  signupTitle: "Begin gratis",
  signupText: "Kies je e-mailadres en wachtwoord. Bevestig je adres één keer via de link in de mail, daarna log je in met je wachtwoord.",
  leadCard: { found: "Nieuwe klus voor jou", match: "match", reply: "Reageer in het Nederlands" },
  footer: "Haaks: hulpmiddelen voor zzp'ers in de bouw in Nederland.",
};

const dicts: Record<Lang, LandingDict> = { en, ru, uk, pl, ro, nl };

export function getLanding(lang: Lang): LandingDict {
  return dicts[lang];
}
