// Texts for «Предложить себя» in «Фирмы рядом». Machine-assisted translations.
import type { GistValues } from "@/lib/firm-offer";
import type { Lang } from "@/lib/i18n";

export type FirmOfferDict = {
  offer: string;
  title: string;
  ready: string;
  missing: string;
  fixPassport: string;
  noPassport: string;
  meaning: string;
  gist: (v: GistValues) => string;
  edit: string;
  whatsapp: string;
  email: string;
  copy: string;
  copied: string;
  noEmail: string;
  mobile: string;
  emailFound: string;
  sent: string;
  via: Record<"whatsapp" | "email" | "copy", string>;
  noAnswer: string;
  answered: string;
  work: string;
  no: string;
  resend: string;
  reminderTitle: string;
  reminderBody: string;
  error: string;
};

const join = (parts: (string | false)[]) => parts.filter(Boolean).join("");

const DICTS: Record<Lang, FirmOfferDict> = {
  ru: {
    offer: "🤝 Предложить себя",
    title: "Предложить себя: {firm}",
    ready: "✓ Паспорт готов: KvK, VCA",
    missing: "В паспорте не хватает: {list}. Фирмы чаще отвечают, когда документы на месте.",
    fixPassport: "Добавить в паспорт",
    noPassport: "Паспорт закрыт для заказчиков, поэтому ссылки на документы в письме нет. Откройте его в настройках.",
    meaning: "Смысл письма",
    gist: (v) =>
      join([
        "«Здравствуйте, я ",
        v.trade || "строитель",
        " ZZP",
        !!v.city && ` из ${v.city}`,
        ". Ищу работу субподрядчиком",
        !!v.from && `, свободен с ${v.from}`,
        !!v.rate && `, ставка €${v.rate} в час`,
        ". Ссылки на мои документы и работы. Есть ли у вас работа для меня?»",
      ]),
    edit: "Текст на голландском (можно поправить)",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copy: "⧉ Скопировать текст",
    copied: "Текст скопирован",
    noEmail: "Почту на сайте фирмы найти не удалось. Скопируйте текст и отправьте через форму на сайте или позвоните.",
    mobile: "📱 мобильный",
    emailFound: "✉️ почта есть",
    sent: "✓ Отправлено {date}",
    via: { whatsapp: "WhatsApp", email: "e-mail", copy: "текст скопирован" },
    noAnswer: "Нет ответа 5 дней. Лучше позвонить: фирмы часто не читают почту.",
    answered: "Ответили?",
    work: "👍 Есть работа",
    no: "👎 Нет",
    resend: "Написать ещё раз",
    reminderTitle: "{firm} не ответила",
    reminderBody: "Прошло 5 дней после вашего предложения. Позвоните или напишите ещё раз.",
    error: "Не получилось сохранить. Попробуйте ещё раз.",
  },
  uk: {
    offer: "🤝 Запропонувати себе",
    title: "Запропонувати себе: {firm}",
    ready: "✓ Паспорт готовий: KvK, VCA",
    missing: "У паспорті бракує: {list}. Фірми частіше відповідають, коли документи на місці.",
    fixPassport: "Додати в паспорт",
    noPassport: "Паспорт закритий для замовників, тому посилання на документи в листі немає. Відкрийте його в налаштуваннях.",
    meaning: "Зміст листа",
    gist: (v) =>
      join([
        "«Добрий день, я ",
        v.trade || "будівельник",
        " ZZP",
        !!v.city && ` з ${v.city}`,
        ". Шукаю роботу субпідрядником",
        !!v.from && `, вільний з ${v.from}`,
        !!v.rate && `, ставка €${v.rate} за годину`,
        ". Посилання на мої документи і роботи. Чи є у вас робота для мене?»",
      ]),
    edit: "Текст нідерландською (можна виправити)",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copy: "⧉ Скопіювати текст",
    copied: "Текст скопійовано",
    noEmail: "Пошту на сайті фірми знайти не вдалося. Скопіюйте текст і надішліть через форму на сайті або зателефонуйте.",
    mobile: "📱 мобільний",
    emailFound: "✉️ пошта є",
    sent: "✓ Надіслано {date}",
    via: { whatsapp: "WhatsApp", email: "e-mail", copy: "текст скопійовано" },
    noAnswer: "Немає відповіді 5 днів. Краще зателефонувати: фірми часто не читають пошту.",
    answered: "Відповіли?",
    work: "👍 Є робота",
    no: "👎 Ні",
    resend: "Написати ще раз",
    reminderTitle: "{firm} не відповіла",
    reminderBody: "Минуло 5 днів після вашої пропозиції. Зателефонуйте або напишіть ще раз.",
    error: "Не вдалося зберегти. Спробуйте ще раз.",
  },
  pl: {
    offer: "🤝 Zaproponuj siebie",
    title: "Zaproponuj siebie: {firm}",
    ready: "✓ Paszport gotowy: KvK, VCA",
    missing: "W paszporcie brakuje: {list}. Firmy częściej odpowiadają, gdy dokumenty są na miejscu.",
    fixPassport: "Dodaj do paszportu",
    noPassport: "Paszport jest zamknięty dla klientów, więc w wiadomości nie ma linku do dokumentów. Otwórz go w ustawieniach.",
    meaning: "Treść wiadomości",
    gist: (v) =>
      join([
        "„Dzień dobry, jestem ",
        v.trade || "budowlańcem",
        " ZZP",
        !!v.city && ` z ${v.city}`,
        ". Szukam pracy jako podwykonawca",
        !!v.from && `, wolny od ${v.from}`,
        !!v.rate && `, stawka €${v.rate} za godzinę`,
        ". Linki do moich dokumentów i prac. Czy macie dla mnie pracę?”",
      ]),
    edit: "Tekst po niderlandzku (można poprawić)",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copy: "⧉ Skopiuj tekst",
    copied: "Tekst skopiowany",
    noEmail: "Nie udało się znaleźć e-maila na stronie firmy. Skopiuj tekst i wyślij przez formularz na stronie albo zadzwoń.",
    mobile: "📱 komórka",
    emailFound: "✉️ jest e-mail",
    sent: "✓ Wysłano {date}",
    via: { whatsapp: "WhatsApp", email: "e-mail", copy: "tekst skopiowany" },
    noAnswer: "Brak odpowiedzi od 5 dni. Lepiej zadzwonić: firmy często nie czytają poczty.",
    answered: "Odpowiedzieli?",
    work: "👍 Jest praca",
    no: "👎 Nie",
    resend: "Napisz jeszcze raz",
    reminderTitle: "{firm} nie odpowiedziała",
    reminderBody: "Minęło 5 dni od Twojej propozycji. Zadzwoń albo napisz jeszcze raz.",
    error: "Nie udało się zapisać. Spróbuj jeszcze raz.",
  },
  ro: {
    offer: "🤝 Propune-te",
    title: "Propune-te: {firm}",
    ready: "✓ Pașaport gata: KvK, VCA",
    missing: "În pașaport lipsește: {list}. Firmele răspund mai des când documentele sunt complete.",
    fixPassport: "Adaugă în pașaport",
    noPassport: "Pașaportul e închis pentru clienți, deci mesajul nu are link la documente. Deschide-l din setări.",
    meaning: "Sensul mesajului",
    gist: (v) =>
      join([
        "„Bună ziua, sunt ",
        v.trade || "constructor",
        " ZZP",
        !!v.city && ` din ${v.city}`,
        ". Caut lucru ca subcontractor",
        !!v.from && `, liber de la ${v.from}`,
        !!v.rate && `, tarif €${v.rate} pe oră`,
        ". Linkuri la documentele și lucrările mele. Aveți de lucru pentru mine?”",
      ]),
    edit: "Text în neerlandeză (se poate modifica)",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copy: "⧉ Copiază textul",
    copied: "Text copiat",
    noEmail: "Nu am găsit e-mailul pe site-ul firmei. Copiază textul și trimite-l prin formularul de pe site sau sună.",
    mobile: "📱 mobil",
    emailFound: "✉️ are e-mail",
    sent: "✓ Trimis {date}",
    via: { whatsapp: "WhatsApp", email: "e-mail", copy: "text copiat" },
    noAnswer: "Niciun răspuns de 5 zile. Mai bine sună: firmele des nu citesc e-mailul.",
    answered: "Au răspuns?",
    work: "👍 Am de lucru",
    no: "👎 Nu",
    resend: "Scrie din nou",
    reminderTitle: "{firm} nu a răspuns",
    reminderBody: "Au trecut 5 zile de la propunerea ta. Sună sau scrie din nou.",
    error: "Nu s-a putut salva. Încearcă din nou.",
  },
  tr: {
    offer: "🤝 Kendini öner",
    title: "Kendini öner: {firm}",
    ready: "✓ Pasaport hazır: KvK, VCA",
    missing: "Pasaportta eksik: {list}. Belgeler tamamken firmalar daha sık cevap verir.",
    fixPassport: "Pasaporta ekle",
    noPassport: "Pasaport müşterilere kapalı, bu yüzden mesajda belge linki yok. Ayarlardan açın.",
    meaning: "Mesajın anlamı",
    gist: (v) =>
      join([
        "“Merhaba, ben ",
        !!v.city && `${v.city}'dan `,
        v.trade || "inşaat ustası",
        " ZZP'yim. Taşeron olarak iş arıyorum",
        !!v.from && `, ${v.from} tarihinden itibaren müsaitim`,
        !!v.rate && `, saatlik ücret €${v.rate}`,
        ". Belgelerim ve işlerim linkte. Benim için işiniz var mı?”",
      ]),
    edit: "Felemenkçe metin (düzeltilebilir)",
    whatsapp: "WhatsApp",
    email: "E-posta",
    copy: "⧉ Metni kopyala",
    copied: "Metin kopyalandı",
    noEmail: "Firmanın sitesinde e-posta bulunamadı. Metni kopyalayıp sitedeki formdan gönderin ya da arayın.",
    mobile: "📱 cep",
    emailFound: "✉️ e-posta var",
    sent: "✓ Gönderildi {date}",
    via: { whatsapp: "WhatsApp", email: "e-posta", copy: "metin kopyalandı" },
    noAnswer: "5 gündür cevap yok. Aramak daha iyi: firmalar e-postayı çoğu zaman okumaz.",
    answered: "Cevap verdiler mi?",
    work: "👍 İş var",
    no: "👎 Yok",
    resend: "Tekrar yaz",
    reminderTitle: "{firm} cevap vermedi",
    reminderBody: "Teklifinden bu yana 5 gün geçti. Ara ya da tekrar yaz.",
    error: "Kaydedilemedi. Tekrar dene.",
  },
  en: {
    offer: "🤝 Offer yourself",
    title: "Offer yourself: {firm}",
    ready: "✓ Passport ready: KvK, VCA",
    missing: "Your passport is missing: {list}. Firms answer more often when the documents are there.",
    fixPassport: "Add to passport",
    noPassport: "Your passport is closed for clients, so the message has no link to your documents. Open it in settings.",
    meaning: "What the message says",
    gist: (v) =>
      join([
        "“Hello, I am a ",
        v.trade || "builder",
        " (ZZP)",
        !!v.city && ` from ${v.city}`,
        ". I am looking for work as a subcontractor",
        !!v.from && `, free from ${v.from}`,
        !!v.rate && `, rate €${v.rate} per hour`,
        ". Links to my documents and work. Do you have work for me?”",
      ]),
    edit: "Dutch text (you can change it)",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copy: "⧉ Copy text",
    copied: "Text copied",
    noEmail: "No e-mail found on the firm's website. Copy the text and use the form on their site, or call.",
    mobile: "📱 mobile",
    emailFound: "✉️ has e-mail",
    sent: "✓ Sent {date}",
    via: { whatsapp: "WhatsApp", email: "e-mail", copy: "text copied" },
    noAnswer: "No answer for 5 days. Better call: firms often do not read e-mail.",
    answered: "Did they answer?",
    work: "👍 There is work",
    no: "👎 No",
    resend: "Write again",
    reminderTitle: "{firm} did not answer",
    reminderBody: "5 days since your offer. Call or write again.",
    error: "Could not save. Try again.",
  },
  nl: {
    offer: "🤝 Stel jezelf voor",
    title: "Stel jezelf voor: {firm}",
    ready: "✓ Paspoort klaar: KvK, VCA",
    missing: "In je paspoort ontbreekt: {list}. Bedrijven reageren vaker als de documenten er zijn.",
    fixPassport: "Toevoegen aan paspoort",
    noPassport: "Je paspoort is gesloten voor klanten, dus het bericht heeft geen link naar je documenten. Open het in de instellingen.",
    meaning: "Wat er in het bericht staat",
    gist: (v) =>
      join([
        "„Goedendag, ik ben ",
        v.trade || "vakman",
        " (ZZP)",
        !!v.city && ` uit ${v.city}`,
        ". Ik zoek werk als onderaannemer",
        !!v.from && `, beschikbaar vanaf ${v.from}`,
        !!v.rate && `, tarief €${v.rate} per uur`,
        ". Links naar mijn documenten en werk. Heeft u werk voor mij?”",
      ]),
    edit: "Tekst (je kunt hem aanpassen)",
    whatsapp: "WhatsApp",
    email: "E-mail",
    copy: "⧉ Tekst kopiëren",
    copied: "Tekst gekopieerd",
    noEmail: "Geen e-mail gevonden op de website. Kopieer de tekst en gebruik het formulier op hun site, of bel.",
    mobile: "📱 mobiel",
    emailFound: "✉️ e-mail bekend",
    sent: "✓ Verstuurd {date}",
    via: { whatsapp: "WhatsApp", email: "e-mail", copy: "tekst gekopieerd" },
    noAnswer: "5 dagen geen antwoord. Beter bellen: bedrijven lezen hun mail vaak niet.",
    answered: "Antwoord gekregen?",
    work: "👍 Er is werk",
    no: "👎 Nee",
    resend: "Nog eens schrijven",
    reminderTitle: "{firm} heeft niet geantwoord",
    reminderBody: "5 dagen na je voorstel. Bel of schrijf nog eens.",
    error: "Opslaan lukte niet. Probeer het opnieuw.",
  },
};

export function getFirmOfferDict(lang: Lang): FirmOfferDict {
  return DICTS[lang] ?? DICTS.en;
}
