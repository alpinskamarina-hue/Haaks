// Texts for "Completed work": the builder's cabinet in 6 languages, the public passport in nl/en.
import type { Lang } from "@/lib/i18n";

export type WorksDict = {
  nav: string;
  title: string;
  intro: string;
  add: string;
  empty: string;
  count: string;
  formNew: string;
  formEdit: string;
  name: string;
  nameHint: string;
  trade: string;
  noTrade: string;
  city: string;
  month: string;
  description: string;
  descriptionHint: string;
  before: string;
  beforeHint: string;
  after: string;
  afterHint: string;
  addPhoto: string;
  save: string;
  saved: string;
  saveFailed: string;
  needTitle: string;
  needPhoto: string;
  remove: string;
  removeConfirm: string;
  removePhotoConfirm: string;
  fromOrder: string;
  fromOrderHint: string;
  openWork: string;
  profileHint: string;
  publicNote: string;
};

const ru: WorksDict = {
  nav: "Мои работы",
  title: "Выполненные работы",
  intro: "Покажите заказчикам и компаниям, что вы уже сделали: фото до и после, где и когда. Работы видны в вашем ZZP-паспорте и в каталоге для компаний.",
  add: "+ Добавить работу",
  empty: "Работ пока нет. Добавьте первую: хватит 1–3 хороших фото «после».",
  count: "Работ: {n}",
  formNew: "Новая работа",
  formEdit: "Изменить работу",
  name: "Что сделали",
  nameHint: "Например: Ванная под ключ, плитка 25 м²",
  trade: "Профессия",
  noTrade: "— не выбрано —",
  city: "Город",
  month: "Когда (месяц)",
  description: "Описание (необязательно)",
  descriptionHint: "Пару предложений: объём, материалы, сроки. Лучше на нидерландском или английском, это читают заказчики.",
  before: "Фото «до» (необязательно)",
  beforeHint: "До 3 фото, как было до работы",
  after: "Фото «после»",
  afterHint: "До 6 фото готовой работы",
  addPhoto: "Добавить фото",
  save: "Сохранить",
  saved: "Работа сохранена.",
  saveFailed: "Не получилось сохранить. Проверьте интернет и попробуйте ещё раз.",
  needTitle: "Напишите, что сделали.",
  needPhoto: "Добавьте хотя бы одно фото «после».",
  remove: "Удалить работу",
  removeConfirm: "Удалить эту работу вместе с фото?",
  removePhotoConfirm: "Убрать это фото?",
  fromOrder: "Добавить в мои работы",
  fromOrderHint: "Заказ закрыт. Добавьте его в «Выполненные работы», чтобы заказчики видели его в вашем паспорте.",
  openWork: "Открыть в «Моих работах»",
  profileHint: "Работы с фото до и после. Их видят заказчики в паспорте и компании в каталоге.",
  publicNote: "Видно в паспорте и в каталоге для компаний",
};

const DICTS: Record<Lang, WorksDict> = {
  ru,
  uk: {
    nav: "Мої роботи",
    title: "Виконані роботи",
    intro: "Покажіть замовникам і компаніям, що ви вже зробили: фото до і після, де і коли. Роботи видно у вашому ZZP-паспорті та в каталозі для компаній.",
    add: "+ Додати роботу",
    empty: "Робіт поки немає. Додайте першу: вистачить 1–3 гарних фото «після».",
    count: "Робіт: {n}",
    formNew: "Нова робота",
    formEdit: "Змінити роботу",
    name: "Що зробили",
    nameHint: "Наприклад: Ванна під ключ, плитка 25 м²",
    trade: "Професія",
    noTrade: "— не вибрано —",
    city: "Місто",
    month: "Коли (місяць)",
    description: "Опис (необов'язково)",
    descriptionHint: "Кілька речень: обсяг, матеріали, строки. Краще нідерландською або англійською, це читають замовники.",
    before: "Фото «до» (необов'язково)",
    beforeHint: "До 3 фото, як було до роботи",
    after: "Фото «після»",
    afterHint: "До 6 фото готової роботи",
    addPhoto: "Додати фото",
    save: "Зберегти",
    saved: "Роботу збережено.",
    saveFailed: "Не вдалося зберегти. Перевірте інтернет і спробуйте ще раз.",
    needTitle: "Напишіть, що зробили.",
    needPhoto: "Додайте хоча б одне фото «після».",
    remove: "Видалити роботу",
    removeConfirm: "Видалити цю роботу разом із фото?",
    removePhotoConfirm: "Прибрати це фото?",
    fromOrder: "Додати до моїх робіт",
    fromOrderHint: "Замовлення закрите. Додайте його до «Виконаних робіт», щоб замовники бачили його у вашому паспорті.",
    openWork: "Відкрити в «Моїх роботах»",
    profileHint: "Роботи з фото до і після. Їх бачать замовники в паспорті та компанії в каталозі.",
    publicNote: "Видно в паспорті та в каталозі для компаній",
  },
  pl: {
    nav: "Moje realizacje",
    title: "Wykonane prace",
    intro: "Pokaż klientom i firmom, co już zrobiłeś: zdjęcia przed i po, gdzie i kiedy. Prace widać w Twoim paszporcie ZZP i w katalogu dla firm.",
    add: "+ Dodaj pracę",
    empty: "Nie ma jeszcze prac. Dodaj pierwszą: wystarczą 1–3 dobre zdjęcia „po”.",
    count: "Prace: {n}",
    formNew: "Nowa praca",
    formEdit: "Edytuj pracę",
    name: "Co zostało zrobione",
    nameHint: "Np. Łazienka pod klucz, płytki 25 m²",
    trade: "Zawód",
    noTrade: "— nie wybrano —",
    city: "Miejscowość",
    month: "Kiedy (miesiąc)",
    description: "Opis (opcjonalnie)",
    descriptionHint: "Kilka zdań: zakres, materiały, czas. Najlepiej po niderlandzku lub angielsku, to czytają klienci.",
    before: "Zdjęcia „przed” (opcjonalnie)",
    beforeHint: "Do 3 zdjęć stanu przed pracą",
    after: "Zdjęcia „po”",
    afterHint: "Do 6 zdjęć gotowej pracy",
    addPhoto: "Dodaj zdjęcie",
    save: "Zapisz",
    saved: "Praca zapisana.",
    saveFailed: "Nie udało się zapisać. Sprawdź internet i spróbuj ponownie.",
    needTitle: "Napisz, co zostało zrobione.",
    needPhoto: "Dodaj co najmniej jedno zdjęcie „po”.",
    remove: "Usuń pracę",
    removeConfirm: "Usunąć tę pracę razem ze zdjęciami?",
    removePhotoConfirm: "Usunąć to zdjęcie?",
    fromOrder: "Dodaj do moich realizacji",
    fromOrderHint: "Zlecenie zamknięte. Dodaj je do „Wykonanych prac”, aby klienci widzieli je w Twoim paszporcie.",
    openWork: "Otwórz w „Moich realizacjach”",
    profileHint: "Prace ze zdjęciami przed i po. Widzą je klienci w paszporcie i firmy w katalogu.",
    publicNote: "Widoczne w paszporcie i w katalogu dla firm",
  },
  ro: {
    nav: "Lucrările mele",
    title: "Lucrări realizate",
    intro: "Arată clienților și firmelor ce ai făcut deja: poze înainte și după, unde și când. Lucrările apar în pașaportul tău ZZP și în catalogul pentru firme.",
    add: "+ Adaugă lucrare",
    empty: "Încă nu ai lucrări. Adaug-o pe prima: ajung 1–3 poze bune „după”.",
    count: "Lucrări: {n}",
    formNew: "Lucrare nouă",
    formEdit: "Modifică lucrarea",
    name: "Ce ai făcut",
    nameHint: "De ex.: Baie la cheie, faianță 25 m²",
    trade: "Meserie",
    noTrade: "— nealeasă —",
    city: "Localitate",
    month: "Când (luna)",
    description: "Descriere (opțional)",
    descriptionHint: "Câteva propoziții: volum, materiale, durată. Mai bine în neerlandeză sau engleză, o citesc clienții.",
    before: "Poze „înainte” (opțional)",
    beforeHint: "Până la 3 poze cu starea dinainte",
    after: "Poze „după”",
    afterHint: "Până la 6 poze cu lucrarea gata",
    addPhoto: "Adaugă poză",
    save: "Salvează",
    saved: "Lucrarea a fost salvată.",
    saveFailed: "Nu s-a putut salva. Verifică internetul și încearcă din nou.",
    needTitle: "Scrie ce ai făcut.",
    needPhoto: "Adaugă cel puțin o poză „după”.",
    remove: "Șterge lucrarea",
    removeConfirm: "Ștergi această lucrare împreună cu pozele?",
    removePhotoConfirm: "Elimini această poză?",
    fromOrder: "Adaugă la lucrările mele",
    fromOrderHint: "Comanda e închisă. Adaug-o la „Lucrări realizate” ca s-o vadă clienții în pașaportul tău.",
    openWork: "Deschide în „Lucrările mele”",
    profileHint: "Lucrări cu poze înainte și după. Le văd clienții în pașaport și firmele în catalog.",
    publicNote: "Vizibil în pașaport și în catalogul pentru firme",
  },
  en: {
    nav: "My work",
    title: "Completed work",
    intro: "Show clients and companies what you have done: before and after photos, where and when. Your work shows in your ZZP passport and in the catalog for companies.",
    add: "+ Add work",
    empty: "No work yet. Add your first: 1–3 good “after” photos are enough.",
    count: "Works: {n}",
    formNew: "New work",
    formEdit: "Edit work",
    name: "What you did",
    nameHint: "E.g. Complete bathroom, 25 m² tiling",
    trade: "Trade",
    noTrade: "— not chosen —",
    city: "Town",
    month: "When (month)",
    description: "Description (optional)",
    descriptionHint: "A few sentences: scope, materials, time. Dutch or English is best, clients read it.",
    before: "“Before” photos (optional)",
    beforeHint: "Up to 3 photos of how it was",
    after: "“After” photos",
    afterHint: "Up to 6 photos of the finished work",
    addPhoto: "Add photo",
    save: "Save",
    saved: "Work saved.",
    saveFailed: "Could not save. Check your internet and try again.",
    needTitle: "Write what you did.",
    needPhoto: "Add at least one “after” photo.",
    remove: "Delete work",
    removeConfirm: "Delete this work and its photos?",
    removePhotoConfirm: "Remove this photo?",
    fromOrder: "Add to my work",
    fromOrderHint: "This order is closed. Add it to “Completed work” so clients see it in your passport.",
    openWork: "Open in “My work”",
    profileHint: "Work with before and after photos. Clients see it in your passport, companies in the catalog.",
    publicNote: "Shown in your passport and in the catalog for companies",
  },
  nl: {
    nav: "Mijn werk",
    title: "Uitgevoerd werk",
    intro: "Laat opdrachtgevers en bedrijven zien wat je al gedaan hebt: foto's voor en na, waar en wanneer. Je werk staat in je ZZP-paspoort en in de catalogus voor bedrijven.",
    add: "+ Werk toevoegen",
    empty: "Nog geen werk. Voeg het eerste toe: 1–3 goede foto's “na” zijn genoeg.",
    count: "Werken: {n}",
    formNew: "Nieuw werk",
    formEdit: "Werk bewerken",
    name: "Wat heb je gedaan",
    nameHint: "Bijv. Badkamer compleet, 25 m² tegelwerk",
    trade: "Vak",
    noTrade: "— niet gekozen —",
    city: "Plaats",
    month: "Wanneer (maand)",
    description: "Omschrijving (optioneel)",
    descriptionHint: "Een paar zinnen: omvang, materialen, duur.",
    before: "Foto's “voor” (optioneel)",
    beforeHint: "Tot 3 foto's van hoe het was",
    after: "Foto's “na”",
    afterHint: "Tot 6 foto's van het resultaat",
    addPhoto: "Foto toevoegen",
    save: "Opslaan",
    saved: "Werk opgeslagen.",
    saveFailed: "Opslaan lukte niet. Controleer je internet en probeer opnieuw.",
    needTitle: "Schrijf wat je gedaan hebt.",
    needPhoto: "Voeg minstens één foto “na” toe.",
    remove: "Werk verwijderen",
    removeConfirm: "Dit werk met de foto's verwijderen?",
    removePhotoConfirm: "Deze foto verwijderen?",
    fromOrder: "Toevoegen aan mijn werk",
    fromOrderHint: "Deze klus is afgesloten. Voeg hem toe aan “Uitgevoerd werk” zodat opdrachtgevers hem in je paspoort zien.",
    openWork: "Openen in “Mijn werk”",
    profileHint: "Werk met foto's voor en na. Opdrachtgevers zien het in je paspoort, bedrijven in de catalogus.",
    publicNote: "Zichtbaar in je paspoort en in de catalogus voor bedrijven",
  },
};

export const getWorksDict = (lang: Lang) => DICTS[lang];

// Public passport (nl/en) and company catalog.
export const PUBLIC_WORKS = {
  nl: { title: "Uitgevoerd werk", before: "Voor", after: "Na", count: "{n} uitgevoerde werken", one: "1 uitgevoerd werk" },
  en: { title: "Completed work", before: "Before", after: "After", count: "{n} completed jobs", one: "1 completed job" },
} as const;
