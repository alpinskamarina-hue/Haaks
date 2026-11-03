// "Letter to the owner": a printed Dutch letter a builder drops in the mailbox at an address
// with a building permit. The letter is Dutch; the page around it is in the builder's language.
import type { Lang } from "@/lib/i18n";

export type LetterDict = {
  button: string;
  title: string;
  intro: string;
  street: string;
  number: string;
  postcode: string;
  place: string;
  update: string;
  print: string;
  openPublication: string;
  back: string;
  missing: string;
  locked: string;
};

const DICTS: Record<Lang, LetterDict> = {
  ru: {
    button: "Письмо владельцу",
    title: "Письмо владельцу",
    intro: "Готовое письмо на нидерландском. Впишите номер дома и индекс (они есть в публикации), распечатайте и опустите в почтовый ящик по этому адресу.",
    street: "Улица",
    number: "Номер дома",
    postcode: "Индекс",
    place: "Город",
    update: "Обновить письмо",
    print: "Распечатать",
    openPublication: "Открыть публикацию с адресом ↗",
    back: "← Назад в ленту",
    missing: "В письме будут ваше имя, телефон и профессия. Заполните их в профиле.",
    locked: "Это разрешение пока закрыто. Откройте карточку в ленте, чтобы написать письмо.",
  },
  uk: {
    button: "Лист власнику",
    title: "Лист власнику",
    intro: "Готовий лист нідерландською. Впишіть номер будинку та індекс (вони є в публікації), роздрукуйте і вкиньте в поштову скриньку за цією адресою.",
    street: "Вулиця",
    number: "Номер будинку",
    postcode: "Індекс",
    place: "Місто",
    update: "Оновити лист",
    print: "Роздрукувати",
    openPublication: "Відкрити публікацію з адресою ↗",
    back: "← Назад до стрічки",
    missing: "У листі будуть ваше ім'я, телефон і професія. Заповніть їх у профілі.",
    locked: "Цей дозвіл поки закритий. Відкрийте картку в стрічці, щоб написати лист.",
  },
  pl: {
    button: "List do właściciela",
    title: "List do właściciela",
    intro: "Gotowy list po niderlandzku. Wpisz numer domu i kod pocztowy (są w publikacji), wydrukuj i wrzuć do skrzynki pod tym adresem.",
    street: "Ulica",
    number: "Numer domu",
    postcode: "Kod pocztowy",
    place: "Miejscowość",
    update: "Odśwież list",
    print: "Drukuj",
    openPublication: "Otwórz publikację z adresem ↗",
    back: "← Wróć do feedu",
    missing: "W liście będą Twoje imię, telefon i zawód. Uzupełnij je w profilu.",
    locked: "To pozwolenie jest jeszcze zamknięte. Otwórz kartę w feedzie, aby napisać list.",
  },
  ro: {
    button: "Scrisoare către proprietar",
    title: "Scrisoare către proprietar",
    intro: "Scrisoare gata în neerlandeză. Scrie numărul casei și codul poștal (sunt în publicație), tipărește și pune-o în cutia poștală de la această adresă.",
    street: "Strada",
    number: "Număr",
    postcode: "Cod poștal",
    place: "Localitate",
    update: "Actualizează scrisoarea",
    print: "Tipărește",
    openPublication: "Deschide publicația cu adresa ↗",
    back: "← Înapoi la flux",
    missing: "Scrisoarea conține numele, telefonul și meseria ta. Completează-le în profil.",
    locked: "Această autorizație este încă închisă. Deschide fișa în flux ca să scrii scrisoarea.",
  },
  en: {
    button: "Letter to the owner",
    title: "Letter to the owner",
    intro: "A ready letter in Dutch. Add the house number and postcode (they are in the publication), print it and drop it in the mailbox at this address.",
    street: "Street",
    number: "House number",
    postcode: "Postcode",
    place: "Town",
    update: "Update letter",
    print: "Print",
    openPublication: "Open the publication with the address ↗",
    back: "← Back to the feed",
    missing: "The letter shows your name, phone and trade. Fill them in your profile.",
    locked: "This permit is still locked. Open the card in the feed to write the letter.",
  },
  nl: {
    button: "Brief aan de eigenaar",
    title: "Brief aan de eigenaar",
    intro: "Een kant-en-klare brief. Vul huisnummer en postcode in (die staan in de publicatie), print hem en doe hem in de brievenbus op dit adres.",
    street: "Straat",
    number: "Huisnummer",
    postcode: "Postcode",
    place: "Plaats",
    update: "Brief bijwerken",
    print: "Afdrukken",
    openPublication: "Publicatie met adres openen ↗",
    back: "← Terug naar de feed",
    missing: "In de brief staan je naam, telefoon en vak. Vul ze in je profiel in.",
    locked: "Deze vergunning is nog op slot. Open de kaart in de feed om de brief te schrijven.",
  },
};

export const getLetterDict = (lang: Lang) => DICTS[lang];
