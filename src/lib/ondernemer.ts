// «Я настоящий предприниматель» (research item 3, Wet DBA): signs of real self-employment, counted from the
// builder's own administration in Haaks. The builder sees all of them with how to improve; clients see only
// the ones that are true, as plain facts. Never a verdict: the Belastingdienst judges the actual work.
import { docStatus, type DocumentRow, type Profile } from "@/lib/documents";
import type { Lang } from "@/lib/i18n";

export type OndernemerFacts = {
  invoices: number;
  clients: number;
  revenue: number;
  top_share: number | null;
  quotes: number;
  quotes_accepted: number;
  receipts: number;
  first_invoice: string | null;
};

export const SIGNS = ["kvk", "btw", "avb", "clients", "spread", "quotes", "invoices", "means", "visible"] as const;
export type Sign = (typeof SIGNS)[number];
export type SignResult = { id: Sign; ok: boolean; vars: Record<string, number> };

// The biggest client may bring at most this share of the turnover before it looks like dependence.
export const MAX_TOP_SHARE = 70;
// Shown to clients only when this many signs are true.
export const PUBLIC_MIN = 3;

export function ondernemerSigns(input: {
  profile: Pick<Profile, "kvk_number" | "btw_number">;
  docs: Pick<DocumentRow, "doc_type" | "issued_on" | "expires_on">[];
  facts: OndernemerFacts | null;
  means: boolean;
  works: number;
  reviews: number;
}): SignResult[] {
  const f = input.facts ?? { invoices: 0, clients: 0, revenue: 0, top_share: null, quotes: 0, quotes_accepted: 0, receipts: 0, first_invoice: null };
  const valid = (type: DocumentRow["doc_type"]) => input.docs.some((d) => d.doc_type === type && docStatus(d) !== "expired");
  return [
    { id: "kvk", ok: Boolean(input.profile.kvk_number) && valid("kvk_extract"), vars: {} },
    { id: "btw", ok: Boolean(input.profile.btw_number), vars: {} },
    { id: "avb", ok: valid("avb"), vars: {} },
    { id: "clients", ok: f.clients >= 2, vars: { n: f.clients } },
    { id: "spread", ok: f.clients >= 2 && f.top_share !== null && f.top_share <= MAX_TOP_SHARE, vars: { p: f.top_share ?? 0, max: MAX_TOP_SHARE } },
    { id: "quotes", ok: f.quotes >= 1, vars: { n: f.quotes, a: f.quotes_accepted } },
    { id: "invoices", ok: f.invoices >= 1, vars: { n: f.invoices } },
    { id: "means", ok: input.means || f.receipts >= 1, vars: { n: f.receipts } },
    { id: "visible", ok: input.works + input.reviews >= 1, vars: { w: input.works, r: input.reviews } },
  ];
}

export const SIGN_HREF: Record<Sign, string> = {
  kvk: "/dashboard/passport",
  btw: "/dashboard/passport",
  avb: "/dashboard/passport",
  clients: "/dashboard/leads/feed",
  spread: "/dashboard/leads/feed",
  quotes: "/dashboard/quotes/new",
  invoices: "/dashboard/invoices",
  means: "/dashboard/onboarding?step=4&edit=1",
  visible: "/dashboard/works",
};

export const fillO = (s: string, vars: Record<string, number | string>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

type SignText = { name: string; ok: string; todo: string };
type Dict = {
  tab: string;
  title: string;
  intro: string;
  score: string;
  strong: string;
  weak: string;
  fix: string;
  shown: string;
  hidden: string;
  why: string;
  whyText: string;
  signs: Record<Sign, SignText>;
};

const ru: Dict = {
  tab: "Бизнес",
  title: "Я настоящий предприниматель",
  intro:
    "С 2025 года налоговая (Belastingdienst) строже проверяет «фиктивных ZZP». Компании боятся нанимать самозанятых и просят доказательства, что вы работаете как настоящий предприниматель. Haaks считает эти признаки по вашим заказам, предложениям и счетам.",
  score: "{n} из {total} признаков",
  strong: "Хорошо: заказчик видит это в вашем паспорте.",
  weak: "Пока мало признаков. Блок в паспорте появится, когда их будет {min} или больше.",
  fix: "Исправить",
  shown: "👁 Заказчик видит только выполненные признаки, без имён клиентов и сумм.",
  hidden: "Блок пока не показывается заказчикам.",
  why: "Почему это важно",
  whyText:
    "Налоговая смотрит на реальную работу: кто решает, как и когда вы работаете, есть ли у вас разные заказчики, свои цены, свои инструменты и свой риск. Haaks не даёт юридической гарантии, но помогает показать факты.",
  signs: {
    kvk: { name: "Регистрация в KvK", ok: "Номер KvK и свежая выписка есть", todo: "Добавьте номер KvK и выписку (не старше 3 месяцев)" },
    btw: { name: "Свой номер btw", ok: "Номер btw-id указан", todo: "Укажите свой номер btw-id (NL…B01)" },
    avb: { name: "Страховка ответственности (AVB)", ok: "Действующая страховка загружена", todo: "Загрузите полис AVB" },
    clients: { name: "Разные заказчики", ok: "{n} разных заказчиков за 12 месяцев", todo: "Нужно минимум 2 заказчика со счетами за год (сейчас {n})" },
    spread: { name: "Нет зависимости от одного заказчика", ok: "Крупнейший заказчик: {p}% оборота", todo: "Один заказчик не должен давать больше {max}% оборота" },
    quotes: { name: "Свои предложения и цены", ok: "{n} предложений за 12 месяцев, принято {a}", todo: "Отправьте хотя бы одно своё предложение (offerte)" },
    invoices: { name: "Сам выставляю счета", ok: "{n} счетов за 12 месяцев", todo: "Выставляйте счета через Haaks" },
    means: { name: "Свои инструменты и материал", ok: "Свои инструменты, транспорт или покупки материала", todo: "Укажите в профиле транспорт и инструменты или добавьте чеки за материал" },
    visible: { name: "Своё портфолио и отзывы", ok: "Работ: {w}, отзывов: {r}", todo: "Добавьте выполненные работы или попросите отзыв" },
  },
};

const DICTS: Record<Lang, Dict> = {
  ru,
  uk: {
    tab: "Бізнес",
    title: "Я справжній підприємець",
    intro:
      "З 2025 року податкова (Belastingdienst) суворіше перевіряє «фіктивних ZZP». Компанії бояться наймати самозайнятих і просять доказів, що ви працюєте як справжній підприємець. Haaks рахує ці ознаки за вашими замовленнями, пропозиціями й рахунками.",
    score: "{n} з {total} ознак",
    strong: "Добре: замовник бачить це у вашому паспорті.",
    weak: "Поки замало ознак. Блок у паспорті з'явиться, коли їх буде {min} або більше.",
    fix: "Виправити",
    shown: "👁 Замовник бачить лише виконані ознаки, без імен клієнтів і сум.",
    hidden: "Блок поки не показується замовникам.",
    why: "Чому це важливо",
    whyText:
      "Податкова дивиться на реальну роботу: хто вирішує, як і коли ви працюєте, чи є у вас різні замовники, свої ціни, свої інструменти й свій ризик. Haaks не дає юридичної гарантії, але допомагає показати факти.",
    signs: {
      kvk: { name: "Реєстрація в KvK", ok: "Номер KvK і свіжий витяг є", todo: "Додайте номер KvK і витяг (не старше 3 місяців)" },
      btw: { name: "Свій номер btw", ok: "Номер btw-id вказано", todo: "Вкажіть свій номер btw-id (NL…B01)" },
      avb: { name: "Страховка відповідальності (AVB)", ok: "Чинну страховку завантажено", todo: "Завантажте поліс AVB" },
      clients: { name: "Різні замовники", ok: "{n} різних замовників за 12 місяців", todo: "Потрібно щонайменше 2 замовники з рахунками за рік (зараз {n})" },
      spread: { name: "Немає залежності від одного замовника", ok: "Найбільший замовник: {p}% обороту", todo: "Один замовник не має давати більше {max}% обороту" },
      quotes: { name: "Свої пропозиції й ціни", ok: "{n} пропозицій за 12 місяців, прийнято {a}", todo: "Надішліть хоча б одну свою пропозицію (offerte)" },
      invoices: { name: "Сам виставляю рахунки", ok: "{n} рахунків за 12 місяців", todo: "Виставляйте рахунки через Haaks" },
      means: { name: "Свої інструменти й матеріал", ok: "Свої інструменти, транспорт або покупки матеріалу", todo: "Вкажіть у профілі транспорт та інструменти або додайте чеки за матеріал" },
      visible: { name: "Своє портфоліо й відгуки", ok: "Робіт: {w}, відгуків: {r}", todo: "Додайте виконані роботи або попросіть відгук" },
    },
  },
  pl: {
    tab: "Firma",
    title: "Jestem prawdziwym przedsiębiorcą",
    intro:
      "Od 2025 roku urząd skarbowy (Belastingdienst) ostrzej sprawdza «fikcyjnych ZZP». Firmy boją się zatrudniać samozatrudnionych i proszą o dowody, że działasz jak prawdziwy przedsiębiorca. Haaks liczy te oznaki z twoich zleceń, ofert i faktur.",
    score: "{n} z {total} oznak",
    strong: "Dobrze: klient widzi to w twoim paszporcie.",
    weak: "Na razie za mało oznak. Blok w paszporcie pojawi się przy {min} lub więcej.",
    fix: "Popraw",
    shown: "👁 Klient widzi tylko spełnione oznaki, bez nazw klientów i kwot.",
    hidden: "Blok nie jest jeszcze pokazywany klientom.",
    why: "Dlaczego to ważne",
    whyText:
      "Urząd patrzy na faktyczną pracę: kto decyduje, jak i kiedy pracujesz, czy masz różnych klientów, własne ceny, narzędzia i ryzyko. Haaks nie daje gwarancji prawnej, ale pomaga pokazać fakty.",
    signs: {
      kvk: { name: "Wpis do KvK", ok: "Numer KvK i aktualny wyciąg są", todo: "Dodaj numer KvK i wyciąg (nie starszy niż 3 miesiące)" },
      btw: { name: "Własny numer btw", ok: "Numer btw-id podany", todo: "Podaj swój numer btw-id (NL…B01)" },
      avb: { name: "Ubezpieczenie OC (AVB)", ok: "Ważne ubezpieczenie wgrane", todo: "Wgraj polisę AVB" },
      clients: { name: "Różni klienci", ok: "{n} różnych klientów w 12 miesięcy", todo: "Potrzeba co najmniej 2 klientów z fakturami w roku (teraz {n})" },
      spread: { name: "Brak zależności od jednego klienta", ok: "Największy klient: {p}% obrotu", todo: "Jeden klient nie powinien dawać więcej niż {max}% obrotu" },
      quotes: { name: "Własne oferty i ceny", ok: "{n} ofert w 12 miesięcy, przyjęte {a}", todo: "Wyślij choć jedną własną ofertę (offerte)" },
      invoices: { name: "Sam wystawiam faktury", ok: "{n} faktur w 12 miesięcy", todo: "Wystawiaj faktury przez Haaks" },
      means: { name: "Własne narzędzia i materiał", ok: "Własne narzędzia, transport lub zakupy materiału", todo: "Podaj w profilu transport i narzędzia albo dodaj paragony za materiał" },
      visible: { name: "Własne portfolio i opinie", ok: "Realizacje: {w}, opinie: {r}", todo: "Dodaj wykonane prace albo poproś o opinię" },
    },
  },
  ro: {
    tab: "Firmă",
    title: "Sunt antreprenor adevărat",
    intro:
      "Din 2025 fiscul (Belastingdienst) verifică mai strict «ZZP fictivi». Firmele se tem să angajeze independenți și cer dovezi că lucrezi ca un antreprenor adevărat. Haaks numără aceste semne din comenzile, ofertele și facturile tale.",
    score: "{n} din {total} semne",
    strong: "Bine: clientul vede asta în pașaportul tău.",
    weak: "Încă prea puține semne. Blocul apare în pașaport de la {min} în sus.",
    fix: "Repară",
    shown: "👁 Clientul vede doar semnele îndeplinite, fără nume de clienți și sume.",
    hidden: "Blocul nu este încă arătat clienților.",
    why: "De ce contează",
    whyText:
      "Fiscul se uită la munca reală: cine decide cum și când lucrezi, dacă ai clienți diferiți, prețuri proprii, unelte proprii și risc propriu. Haaks nu oferă garanție juridică, dar te ajută să arăți faptele.",
    signs: {
      kvk: { name: "Înregistrare la KvK", ok: "Număr KvK și extras recent", todo: "Adaugă numărul KvK și extrasul (max. 3 luni)" },
      btw: { name: "Număr btw propriu", ok: "Numărul btw-id este completat", todo: "Completează numărul btw-id (NL…B01)" },
      avb: { name: "Asigurare de răspundere (AVB)", ok: "Asigurare valabilă încărcată", todo: "Încarcă polița AVB" },
      clients: { name: "Clienți diferiți", ok: "{n} clienți diferiți în 12 luni", todo: "Ai nevoie de cel puțin 2 clienți facturați pe an (acum {n})" },
      spread: { name: "Fără dependență de un singur client", ok: "Cel mai mare client: {p}% din cifra de afaceri", todo: "Un client nu ar trebui să aducă peste {max}% din cifra de afaceri" },
      quotes: { name: "Oferte și prețuri proprii", ok: "{n} oferte în 12 luni, acceptate {a}", todo: "Trimite cel puțin o ofertă proprie (offerte)" },
      invoices: { name: "Îmi fac singur facturile", ok: "{n} facturi în 12 luni", todo: "Emite facturile prin Haaks" },
      means: { name: "Unelte și material proprii", ok: "Unelte, transport sau material cumpărat de tine", todo: "Completează în profil transportul și uneltele sau adaugă bonuri de material" },
      visible: { name: "Portofoliu și recenzii proprii", ok: "Lucrări: {w}, recenzii: {r}", todo: "Adaugă lucrări făcute sau cere o recenzie" },
    },
  },
  tr: {
    tab: "İşletme",
    title: "Gerçek bir girişimciyim",
    intro:
      "2025'ten beri vergi dairesi (Belastingdienst) «sahte ZZP»leri daha sıkı denetliyor. Şirketler serbest çalışan tutmaktan çekiniyor ve gerçek bir girişimci gibi çalıştığınızın kanıtını istiyor. Haaks bu işaretleri işlerinizden, tekliflerinizden ve faturalarınızdan sayar.",
    score: "{total} işaretten {n}",
    strong: "Güzel: müşteri bunu pasaportunuzda görüyor.",
    weak: "Henüz az işaret var. Pasaporttaki blok {min} veya daha fazla olunca görünür.",
    fix: "Düzelt",
    shown: "👁 Müşteri yalnızca tamamlanan işaretleri görür, müşteri adı ve tutar olmadan.",
    hidden: "Blok henüz müşterilere gösterilmiyor.",
    why: "Neden önemli",
    whyText:
      "Vergi dairesi gerçek çalışmaya bakar: nasıl ve ne zaman çalışacağınıza kim karar veriyor, farklı müşterileriniz, kendi fiyatlarınız, aletleriniz ve riskiniz var mı. Haaks hukuki garanti vermez ama gerçekleri göstermenize yardım eder.",
    signs: {
      kvk: { name: "KvK kaydı", ok: "KvK numarası ve güncel belge var", todo: "KvK numarası ve belgesini ekleyin (en fazla 3 aylık)" },
      btw: { name: "Kendi btw numarası", ok: "btw-id numarası girildi", todo: "btw-id numaranızı girin (NL…B01)" },
      avb: { name: "Sorumluluk sigortası (AVB)", ok: "Geçerli sigorta yüklendi", todo: "AVB poliçesini yükleyin" },
      clients: { name: "Farklı müşteriler", ok: "12 ayda {n} farklı müşteri", todo: "Yılda en az 2 faturalı müşteri gerekir (şu an {n})" },
      spread: { name: "Tek müşteriye bağımlı değil", ok: "En büyük müşteri: cironun %{p}'i", todo: "Tek müşteri cironun %{max}'inden fazlasını getirmemeli" },
      quotes: { name: "Kendi teklif ve fiyatlarım", ok: "12 ayda {n} teklif, {a} kabul", todo: "En az bir kendi teklifinizi (offerte) gönderin" },
      invoices: { name: "Faturalarımı kendim keserim", ok: "12 ayda {n} fatura", todo: "Faturaları Haaks ile kesin" },
      means: { name: "Kendi alet ve malzemem", ok: "Kendi aletleri, aracı veya malzeme alımı", todo: "Profilde araç ve aletleri girin veya malzeme fişi ekleyin" },
      visible: { name: "Kendi portföy ve yorumlarım", ok: "İş: {w}, yorum: {r}", todo: "Yaptığınız işleri ekleyin veya yorum isteyin" },
    },
  },
  en: {
    tab: "Business",
    title: "I'm a real entrepreneur",
    intro:
      "Since 2025 the tax office (Belastingdienst) checks «false self-employment» more strictly. Companies are wary of hiring freelancers and ask for proof that you work as a real business. Haaks counts these signs from your jobs, quotes and invoices.",
    score: "{n} of {total} signs",
    strong: "Good: clients see this in your passport.",
    weak: "Not enough signs yet. The passport block appears at {min} or more.",
    fix: "Fix",
    shown: "👁 Clients only see the signs you meet, without client names or amounts.",
    hidden: "The block is not shown to clients yet.",
    why: "Why it matters",
    whyText:
      "The tax office looks at the real work: who decides how and when you work, whether you have different clients, your own prices, tools and risk. Haaks gives no legal guarantee, but helps you show the facts.",
    signs: {
      kvk: { name: "KvK registration", ok: "KvK number and a recent extract", todo: "Add your KvK number and extract (max. 3 months old)" },
      btw: { name: "Own VAT number", ok: "VAT id filled in", todo: "Fill in your VAT id (NL…B01)" },
      avb: { name: "Liability insurance (AVB)", ok: "Valid policy uploaded", todo: "Upload your AVB policy" },
      clients: { name: "Different clients", ok: "{n} different clients in 12 months", todo: "You need at least 2 invoiced clients a year (now {n})" },
      spread: { name: "Not dependent on one client", ok: "Largest client: {p}% of turnover", todo: "One client should bring no more than {max}% of turnover" },
      quotes: { name: "Own quotes and prices", ok: "{n} quotes in 12 months, {a} accepted", todo: "Send at least one quote of your own" },
      invoices: { name: "I invoice myself", ok: "{n} invoices in 12 months", todo: "Send your invoices through Haaks" },
      means: { name: "Own tools and materials", ok: "Own tools, transport or material purchases", todo: "Add transport and tools to your profile, or add material receipts" },
      visible: { name: "Own portfolio and reviews", ok: "Work: {w}, reviews: {r}", todo: "Add finished work or ask for a review" },
    },
  },
  nl: {
    tab: "Ondernemer",
    title: "Ik ben echt ondernemer",
    intro:
      "Sinds 2025 controleert de Belastingdienst strenger op schijnzelfstandigheid. Bedrijven zijn voorzichtig met zzp'ers en vragen om bewijs dat je echt als ondernemer werkt. Haaks telt die kenmerken uit je klussen, offertes en facturen.",
    score: "{n} van {total} kenmerken",
    strong: "Goed: opdrachtgevers zien dit in je paspoort.",
    weak: "Nog te weinig kenmerken. Het blok verschijnt in je paspoort vanaf {min}.",
    fix: "Verbeteren",
    shown: "👁 Opdrachtgevers zien alleen de kenmerken die kloppen, zonder klantnamen of bedragen.",
    hidden: "Het blok wordt nog niet aan opdrachtgevers getoond.",
    why: "Waarom dit telt",
    whyText:
      "De Belastingdienst kijkt naar het echte werk: wie bepaalt hoe en wanneer je werkt, heb je verschillende opdrachtgevers, eigen prijzen, eigen gereedschap en eigen risico. Haaks geeft geen juridische garantie, maar helpt je de feiten te laten zien.",
    signs: {
      kvk: { name: "Inschrijving KvK", ok: "KvK-nummer en recent uittreksel", todo: "Voeg je KvK-nummer en uittreksel toe (max. 3 maanden oud)" },
      btw: { name: "Eigen btw-nummer", ok: "Btw-id ingevuld", todo: "Vul je btw-id in (NL…B01)" },
      avb: { name: "Aansprakelijkheidsverzekering (AVB)", ok: "Geldige polis geüpload", todo: "Upload je AVB-polis" },
      clients: { name: "Verschillende opdrachtgevers", ok: "{n} verschillende opdrachtgevers in 12 maanden", todo: "Minstens 2 gefactureerde opdrachtgevers per jaar nodig (nu {n})" },
      spread: { name: "Niet afhankelijk van één opdrachtgever", ok: "Grootste opdrachtgever: {p}% van de omzet", todo: "Eén opdrachtgever hoort niet meer dan {max}% van de omzet te zijn" },
      quotes: { name: "Eigen offertes en prijzen", ok: "{n} offertes in 12 maanden, {a} akkoord", todo: "Stuur minstens één eigen offerte" },
      invoices: { name: "Ik factureer zelf", ok: "{n} facturen in 12 maanden", todo: "Verstuur je facturen via Haaks" },
      means: { name: "Eigen gereedschap en materiaal", ok: "Eigen gereedschap, vervoer of materiaalinkoop", todo: "Vul vervoer en gereedschap in je profiel in, of voeg bonnen voor materiaal toe" },
      visible: { name: "Eigen portfolio en beoordelingen", ok: "Werk: {w}, beoordelingen: {r}", todo: "Voeg uitgevoerd werk toe of vraag om een beoordeling" },
    },
  },
};

export const getOndernemerDict = (lang: Lang) => DICTS[lang];

// For the client's passport page (Dutch or English): only the signs that are true, as facts.
export const PUBLIC_ONDERNEMER: Record<"nl" | "en", { title: string; note: string; signs: Record<Sign, string> }> = {
  nl: {
    title: "Zelfstandig ondernemer",
    note: "Berekend uit de eigen administratie in Haaks op {date}. Dit is geen oordeel van de Belastingdienst; die kijkt naar de feitelijke werkrelatie.",
    signs: {
      kvk: "Ingeschreven bij de KvK (recent uittreksel aanwezig)",
      btw: "Eigen btw-identificatienummer",
      avb: "Eigen bedrijfsaansprakelijkheidsverzekering (AVB)",
      clients: "Werkte voor {n} verschillende opdrachtgevers in de laatste 12 maanden",
      spread: "Grootste opdrachtgever: {p}% van de omzet",
      quotes: "Maakt eigen offertes en bepaalt eigen prijzen ({n} offertes in 12 maanden)",
      invoices: "Factureert zelf ({n} facturen in 12 maanden)",
      means: "Werkt met eigen gereedschap, vervoer en materiaal",
      visible: "Eigen portfolio en klantbeoordelingen",
    },
  },
  en: {
    title: "Independent entrepreneur",
    note: "Calculated from the builder's own administration in Haaks on {date}. This is not a ruling by the Dutch tax office, which looks at the actual working relationship.",
    signs: {
      kvk: "Registered with the Chamber of Commerce (recent extract on file)",
      btw: "Own VAT identification number",
      avb: "Own business liability insurance (AVB)",
      clients: "Worked for {n} different clients in the last 12 months",
      spread: "Largest client: {p}% of turnover",
      quotes: "Makes own quotes and sets own prices ({n} quotes in 12 months)",
      invoices: "Invoices own work ({n} invoices in 12 months)",
      means: "Works with own tools, transport and materials",
      visible: "Own portfolio and client reviews",
    },
  },
};

// Own van or car, own tools beyond nothing, or own machines.
export const hasOwnMeans = (w: { vehicle: string | null; tools: string | null; equipment: string[] }) =>
  (!!w.vehicle && w.vehicle !== "none") || (!!w.tools && w.tools !== "none") || w.equipment.length > 0;

// Everything the sign list needs, for the builder's page and the client's passport.
// `client` is the Supabase client allowed to call ondernemer_facts (the builder or the server account).
export async function loadOndernemer(
  client: import("@supabase/supabase-js").SupabaseClient,
  profile: Profile,
  worker: { vehicle: string | null; tools: string | null; equipment: string[] },
) {
  const [{ data: facts }, { data: docs }, { count: works }, { count: reviews }] = await Promise.all([
    client.rpc("ondernemer_facts", { p_user: profile.id }),
    client.from("documents").select("doc_type, issued_on, expires_on").eq("user_id", profile.id),
    client.from("works").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    client.from("reviews").select("id", { count: "exact", head: true }).eq("worker_id", profile.id).eq("status", "submitted"),
  ]);
  return ondernemerSigns({
    profile,
    docs: (docs ?? []) as Pick<DocumentRow, "doc_type" | "issued_on" | "expires_on">[],
    facts: (facts as OndernemerFacts | null) ?? null,
    means: hasOwnMeans(worker),
    works: works ?? 0,
    reviews: reviews ?? 0,
  });
}
