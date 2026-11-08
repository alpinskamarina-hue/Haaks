// Texts for «Vakman gezocht»: the client pages (Dutch / English) and the builder side in the feed
// (all app languages). Machine-assisted translations.
import type { Lang } from "@/lib/i18n";

export const PHRASES = ["visit", "this_week", "next_week", "quote", "experience", "materials"] as const;
export type Phrase = (typeof PHRASES)[number];

export type ClientDict = {
  brand: string;
  title: string;
  lead: string;
  what: string;
  size: string;
  describe: string;
  describeHint: string;
  photos: string;
  photosHint: string;
  postcode: string;
  when: string;
  timing: Record<"asap" | "weeks" | "months" | "price", string>;
  budget: string;
  budgetHint: string;
  you: string;
  name: string;
  email: string;
  phone: string;
  phoneHint: string;
  privacy: string;
  submit: string;
  promise: string[];
  errors: Record<"fields" | "postcode" | "email" | "limit" | "photo" | "failed", string>;
  // Request page
  yourJob: string;
  saveLink: string;
  saveLinkHint: string;
  copy: string;
  toWhatsapp: string;
  statusPending: string;
  statusPublished: string;
  statusRejected: string;
  statusClosed: string;
  repliesTitle: string;
  noReplies: string;
  replyCount: string;
  kmAway: string;
  reviews: string;
  works: string;
  contact: string;
  contactConfirm: string;
  chosen: string;
  chosenHint: string;
  call: string;
  mail: string;
  profile: string;
  stop: string;
  stopConfirm: string;
  phrases: Record<Phrase, string>;
  badges: Record<"kvk" | "vca" | "avb" | "passport", string>;
  footer: string;
};

const NL: ClientDict = {
  brand: "Vakman gezocht",
  title: "Vakman nodig?",
  lead: "Beschrijf je klus. Vakmensen bij jou in de buurt reageren. Gratis, zonder tussenpersoon en zonder commissie.",
  what: "Wat moet er gebeuren?",
  size: "Hoe groot is de klus?",
  describe: "Beschrijf de klus",
  describeHint: "Wat is er nu, wat wil je, zijn de materialen er al?",
  photos: "Foto's (max. 4)",
  photosHint: "Met foto's krijg je sneller een goede prijs.",
  postcode: "Postcode van de klus",
  when: "Wanneer?",
  timing: { asap: "Zo snel mogelijk", weeks: "Binnen een paar weken", months: "Over 1–3 maanden", price: "Eerst een prijs" },
  budget: "Budget (mag leeg)",
  budgetHint: "bijv. € 1.500",
  you: "Jouw gegevens",
  name: "Naam",
  email: "E-mail",
  phone: "Telefoon",
  phoneHint: "Alleen zichtbaar voor de vakman die jij kiest.",
  privacy: "Je e-mail en telefoon zijn verborgen. Alleen de vakman die jij kiest ziet ze.",
  submit: "Klus plaatsen →",
  promise: ["✓ Gratis voor jou", "✓ Max. 5 reacties, jij kiest", "✓ Vakmensen met KvK en reviews"],
  errors: {
    fields: "Vul de klus, de beschrijving (min. 10 tekens), je naam en e-mail in.",
    postcode: "Vul een Nederlandse postcode in, bijv. 3061 AB.",
    email: "Dit e-mailadres klopt niet.",
    limit: "Je hebt al 3 open klussen. Sluit er eerst een.",
    photo: "Een foto kon niet worden geüpload. Probeer een kleinere foto.",
    failed: "Er ging iets mis. Probeer het nog eens.",
  },
  yourJob: "Jouw klus",
  saveLink: "Bewaar deze link",
  saveLinkHint: "Via deze link zie je de reacties van vakmensen. Stuur hem naar jezelf, zodat je hem niet kwijtraakt.",
  copy: "Link kopiëren",
  toWhatsapp: "Naar mijn WhatsApp",
  statusPending: "We controleren je klus. Meestal binnen een paar uur staat hij online.",
  statusPublished: "Je klus is zichtbaar voor vakmensen in de buurt.",
  statusRejected: "Je klus is niet geplaatst.",
  statusClosed: "Deze klus is gesloten.",
  repliesTitle: "Reacties van vakmensen",
  noReplies: "Nog geen reacties. Vakmensen krijgen een melding; meestal reageren ze dezelfde dag.",
  replyCount: "{n} van max. {max} reacties",
  kmAway: "{n} km",
  reviews: "{n} reviews",
  works: "{n} foto's van werk",
  contact: "Contact opnemen",
  contactConfirm: "Kies je deze vakman? Hij ziet dan je naam, telefoon en e-mail. De andere vakmensen krijgen bericht dat je iemand hebt gekozen.",
  chosen: "Gekozen",
  chosenHint: "Bel of mail de vakman om een afspraak te maken.",
  call: "Bellen",
  mail: "Mailen",
  profile: "Profiel",
  stop: "Ik zoek niet meer",
  stopConfirm: "Klus sluiten? Vakmensen kunnen dan niet meer reageren.",
  phrases: {
    visit: "Ik kan langskomen om te kijken.",
    this_week: "Ik kan deze week beginnen.",
    next_week: "Ik kan volgende week beginnen.",
    quote: "Ik stuur graag een offerte.",
    experience: "Ik heb veel ervaring met dit werk.",
    materials: "Ik kan ook de materialen regelen.",
  },
  badges: { kvk: "KvK", vca: "VCA", avb: "Verzekerd", passport: "ZZP-paspoort" },
  footer: "Haaks verbindt je direct met zelfstandige vakmensen. Je maakt zelf afspraken met de vakman.",
};

const EN: ClientDict = {
  brand: "Find a tradesperson",
  title: "Need a tradesperson?",
  lead: "Describe your job. Tradespeople near you reply. Free, no middleman and no commission.",
  what: "What needs doing?",
  size: "How big is the job?",
  describe: "Describe the job",
  describeHint: "What is there now, what do you want, are the materials there already?",
  photos: "Photos (max. 4)",
  photosHint: "Photos get you a good price faster.",
  postcode: "Postcode of the job",
  when: "When?",
  timing: { asap: "As soon as possible", weeks: "Within a few weeks", months: "In 1–3 months", price: "A price first" },
  budget: "Budget (optional)",
  budgetHint: "e.g. € 1,500",
  you: "Your details",
  name: "Name",
  email: "E-mail",
  phone: "Phone",
  phoneHint: "Only the tradesperson you choose sees it.",
  privacy: "Your e-mail and phone stay hidden. Only the tradesperson you choose sees them.",
  submit: "Post the job →",
  promise: ["✓ Free for you", "✓ Max. 5 replies, you choose", "✓ Tradespeople with KvK and reviews"],
  errors: {
    fields: "Fill in the job, the description (min. 10 characters), your name and e-mail.",
    postcode: "Enter a Dutch postcode, e.g. 3061 AB.",
    email: "This e-mail address is not right.",
    limit: "You already have 3 open jobs. Close one first.",
    photo: "A photo could not be uploaded. Try a smaller photo.",
    failed: "Something went wrong. Please try again.",
  },
  yourJob: "Your job",
  saveLink: "Save this link",
  saveLinkHint: "This link shows the replies from tradespeople. Send it to yourself so you don't lose it.",
  copy: "Copy link",
  toWhatsapp: "To my WhatsApp",
  statusPending: "We are checking your job. It is usually online within a few hours.",
  statusPublished: "Your job is visible to tradespeople nearby.",
  statusRejected: "Your job was not posted.",
  statusClosed: "This job is closed.",
  repliesTitle: "Replies from tradespeople",
  noReplies: "No replies yet. Tradespeople get a notification; most reply the same day.",
  replyCount: "{n} of max. {max} replies",
  kmAway: "{n} km",
  reviews: "{n} reviews",
  works: "{n} photos of work",
  contact: "Get in touch",
  contactConfirm: "Choose this tradesperson? They will see your name, phone and e-mail. The others are told you chose someone.",
  chosen: "Chosen",
  chosenHint: "Call or e-mail the tradesperson to make an appointment.",
  call: "Call",
  mail: "E-mail",
  profile: "Profile",
  stop: "I'm no longer looking",
  stopConfirm: "Close the job? Tradespeople can no longer reply.",
  phrases: {
    visit: "I can come and have a look.",
    this_week: "I can start this week.",
    next_week: "I can start next week.",
    quote: "I'm happy to send a quote.",
    experience: "I have a lot of experience with this work.",
    materials: "I can also arrange the materials.",
  },
  badges: { kvk: "KvK", vca: "VCA", avb: "Insured", passport: "ZZP passport" },
  footer: "Haaks connects you directly with self-employed tradespeople. You make the arrangements with the tradesperson yourself.",
};

export function getClientDict(lang: "nl" | "en"): ClientDict {
  return lang === "en" ? EN : NL;
}

// Builder side: the client card in the feed.
export type ClientCardDict = {
  badge: string;
  replied: string;
  full: string;
  reply: string;
  replyHint: string;
  phrasesTitle: string;
  message: string;
  messageHint: string;
  send: string;
  sent: string;
  chosen: string;
  notChosen: string;
  closed: string;
  clientContact: string;
  call: string;
  mail: string;
  phrases: Record<Phrase, string>;
  errors: Record<"request_closed" | "request_full" | "card_locked" | "free_limit" | "failed", string>;
  myTitle: string;
};

const CARD: Record<Lang, ClientCardDict> = {
  ru: {
    badge: "Клиент Haaks · ждёт ответа",
    replied: "Откликнулись {n} из {max}",
    full: "Уже 5 откликов — заявка закрыта для новых",
    reply: "Откликнуться",
    replyHint: "Клиент увидит ваш профиль, звёзды и работы. Телефоны откроются, когда клиент выберет вас.",
    phrasesTitle: "Готовые фразы (клиент прочитает по-голландски)",
    message: "Своё сообщение (лучше по-голландски или по-английски)",
    messageHint: "Например: Goedendag, ik kan woensdag komen kijken.",
    send: "Отправить отклик",
    sent: "Отклик отправлен · ждём выбора клиента",
    chosen: "Вас выбрали! Свяжитесь с клиентом",
    notChosen: "Клиент выбрал другого мастера",
    closed: "Заявка закрыта",
    clientContact: "Клиент",
    call: "Позвонить",
    mail: "Написать",
    phrases: { visit: "Могу приехать посмотреть", this_week: "Могу начать на этой неделе", next_week: "Могу начать на следующей неделе", quote: "Пришлю предложение с ценой", experience: "Большой опыт в такой работе", materials: "Могу взять на себя материалы" },
    errors: { request_closed: "Заявка уже закрыта.", request_full: "На заявку уже 5 откликов.", card_locked: "Сначала откройте карточку.", free_limit: "Лимит бесплатных откликов на сегодня исчерпан.", failed: "Не получилось отправить. Попробуйте ещё раз." },
    myTitle: "Заявки клиентов",
  },
  uk: {
    badge: "Клієнт Haaks · чекає відповіді",
    replied: "Відгукнулися {n} з {max}",
    full: "Вже 5 відгуків — заявка закрита для нових",
    reply: "Відгукнутися",
    replyHint: "Клієнт побачить ваш профіль, зірки й роботи. Телефони відкриються, коли клієнт обере вас.",
    phrasesTitle: "Готові фрази (клієнт прочитає нідерландською)",
    message: "Своє повідомлення (краще нідерландською або англійською)",
    messageHint: "Наприклад: Goedendag, ik kan woensdag komen kijken.",
    send: "Надіслати відгук",
    sent: "Відгук надіслано · чекаємо вибору клієнта",
    chosen: "Вас обрали! Зв'яжіться з клієнтом",
    notChosen: "Клієнт обрав іншого майстра",
    closed: "Заявку закрито",
    clientContact: "Клієнт",
    call: "Зателефонувати",
    mail: "Написати",
    phrases: { visit: "Можу приїхати подивитися", this_week: "Можу почати цього тижня", next_week: "Можу почати наступного тижня", quote: "Надішлю пропозицію з ціною", experience: "Великий досвід у такій роботі", materials: "Можу взяти на себе матеріали" },
    errors: { request_closed: "Заявку вже закрито.", request_full: "На заявку вже 5 відгуків.", card_locked: "Спершу відкрийте картку.", free_limit: "Ліміт безкоштовних відгуків на сьогодні вичерпано.", failed: "Не вдалося надіслати. Спробуйте ще раз." },
    myTitle: "Заявки клієнтів",
  },
  pl: {
    badge: "Klient Haaks · czeka na odpowiedź",
    replied: "Odpowiedziało {n} z {max}",
    full: "Już 5 odpowiedzi — zgłoszenie zamknięte dla nowych",
    reply: "Odpowiedz",
    replyHint: "Klient zobaczy twój profil, gwiazdki i prace. Telefony otworzą się, gdy klient cię wybierze.",
    phrasesTitle: "Gotowe zdania (klient przeczyta po niderlandzku)",
    message: "Twoja wiadomość (najlepiej po niderlandzku lub angielsku)",
    messageHint: "Np.: Goedendag, ik kan woensdag komen kijken.",
    send: "Wyślij odpowiedź",
    sent: "Odpowiedź wysłana · czekamy na wybór klienta",
    chosen: "Wybrano cię! Skontaktuj się z klientem",
    notChosen: "Klient wybrał innego fachowca",
    closed: "Zgłoszenie zamknięte",
    clientContact: "Klient",
    call: "Zadzwoń",
    mail: "Napisz",
    phrases: { visit: "Mogę przyjechać obejrzeć", this_week: "Mogę zacząć w tym tygodniu", next_week: "Mogę zacząć w przyszłym tygodniu", quote: "Wyślę ofertę z ceną", experience: "Duże doświadczenie w takiej pracy", materials: "Mogę też załatwić materiały" },
    errors: { request_closed: "Zgłoszenie jest już zamknięte.", request_full: "Zgłoszenie ma już 5 odpowiedzi.", card_locked: "Najpierw otwórz kartę.", free_limit: "Limit darmowych odpowiedzi na dziś wyczerpany.", failed: "Nie udało się wysłać. Spróbuj ponownie." },
    myTitle: "Zgłoszenia klientów",
  },
  ro: {
    badge: "Client Haaks · așteaptă răspuns",
    replied: "Au răspuns {n} din {max}",
    full: "Deja 5 răspunsuri — cererea e închisă pentru alții",
    reply: "Răspunde",
    replyHint: "Clientul îți vede profilul, stelele și lucrările. Telefoanele se deschid când clientul te alege.",
    phrasesTitle: "Fraze gata făcute (clientul le citește în olandeză)",
    message: "Mesajul tău (de preferat în olandeză sau engleză)",
    messageHint: "De ex.: Goedendag, ik kan woensdag komen kijken.",
    send: "Trimite răspunsul",
    sent: "Răspuns trimis · așteptăm alegerea clientului",
    chosen: "Ai fost ales! Contactează clientul",
    notChosen: "Clientul a ales alt meșter",
    closed: "Cerere închisă",
    clientContact: "Client",
    call: "Sună",
    mail: "Scrie",
    phrases: { visit: "Pot veni să văd", this_week: "Pot începe săptămâna aceasta", next_week: "Pot începe săptămâna viitoare", quote: "Trimit o ofertă cu preț", experience: "Multă experiență cu această lucrare", materials: "Pot procura și materialele" },
    errors: { request_closed: "Cererea e deja închisă.", request_full: "Cererea are deja 5 răspunsuri.", card_locked: "Deschide întâi cardul.", free_limit: "Limita de răspunsuri gratuite pe azi s-a terminat.", failed: "Nu s-a putut trimite. Încearcă din nou." },
    myTitle: "Cereri de la clienți",
  },
  tr: {
    badge: "Haaks müşterisi · cevap bekliyor",
    replied: "{max} kişiden {n} kişi cevap verdi",
    full: "Zaten 5 cevap var — yeni cevaplara kapalı",
    reply: "Cevap ver",
    replyHint: "Müşteri profilini, yıldızlarını ve işlerini görür. Telefonlar müşteri seni seçince açılır.",
    phrasesTitle: "Hazır cümleler (müşteri Felemenkçe okur)",
    message: "Kendi mesajın (tercihen Felemenkçe veya İngilizce)",
    messageHint: "Örn.: Goedendag, ik kan woensdag komen kijken.",
    send: "Cevabı gönder",
    sent: "Cevap gönderildi · müşterinin seçimi bekleniyor",
    chosen: "Seçildin! Müşteriyle iletişime geç",
    notChosen: "Müşteri başka bir usta seçti",
    closed: "Talep kapandı",
    clientContact: "Müşteri",
    call: "Ara",
    mail: "Yaz",
    phrases: { visit: "Gelip bakabilirim", this_week: "Bu hafta başlayabilirim", next_week: "Gelecek hafta başlayabilirim", quote: "Fiyatlı teklif gönderirim", experience: "Bu işte çok deneyimliyim", materials: "Malzemeleri de ayarlayabilirim" },
    errors: { request_closed: "Talep zaten kapandı.", request_full: "Talebe zaten 5 cevap var.", card_locked: "Önce kartı aç.", free_limit: "Bugünkü ücretsiz cevap hakkın bitti.", failed: "Gönderilemedi. Tekrar dene." },
    myTitle: "Müşteri talepleri",
  },
  en: {
    badge: "Haaks client · waiting for replies",
    replied: "{n} of {max} replied",
    full: "Already 5 replies — closed for new ones",
    reply: "Reply",
    replyHint: "The client sees your profile, stars and work. Phone numbers open when the client chooses you.",
    phrasesTitle: "Ready phrases (the client reads them in Dutch)",
    message: "Your own message (best in Dutch or English)",
    messageHint: "E.g.: Goedendag, ik kan woensdag komen kijken.",
    send: "Send reply",
    sent: "Reply sent · waiting for the client to choose",
    chosen: "You were chosen! Contact the client",
    notChosen: "The client chose someone else",
    closed: "Request closed",
    clientContact: "Client",
    call: "Call",
    mail: "E-mail",
    phrases: { visit: "I can come and have a look", this_week: "I can start this week", next_week: "I can start next week", quote: "I'll send a quote with a price", experience: "Lots of experience with this work", materials: "I can arrange the materials too" },
    errors: { request_closed: "The request is already closed.", request_full: "The request already has 5 replies.", card_locked: "Open the card first.", free_limit: "Today's free replies are used up.", failed: "Could not send. Please try again." },
    myTitle: "Client requests",
  },
  nl: {
    badge: "Haaks-klant · wacht op reacties",
    replied: "{n} van {max} gereageerd",
    full: "Al 5 reacties — gesloten voor nieuwe",
    reply: "Reageren",
    replyHint: "De klant ziet je profiel, sterren en werk. Telefoonnummers gaan open als de klant jou kiest.",
    phrasesTitle: "Kant-en-klare zinnen",
    message: "Eigen bericht",
    messageHint: "Bijv.: Goedendag, ik kan woensdag komen kijken.",
    send: "Reactie versturen",
    sent: "Reactie verstuurd · wacht op de keuze van de klant",
    chosen: "Je bent gekozen! Neem contact op met de klant",
    notChosen: "De klant koos een andere vakman",
    closed: "Aanvraag gesloten",
    clientContact: "Klant",
    call: "Bellen",
    mail: "Mailen",
    phrases: NL.phrases,
    errors: { request_closed: "De aanvraag is al gesloten.", request_full: "De aanvraag heeft al 5 reacties.", card_locked: "Open eerst de kaart.", free_limit: "Je gratis reacties voor vandaag zijn op.", failed: "Versturen lukte niet. Probeer het nog eens." },
    myTitle: "Aanvragen van klanten",
  },
};

export function getClientCardDict(lang: Lang): ClientCardDict {
  return CARD[lang] ?? CARD.en;
}
