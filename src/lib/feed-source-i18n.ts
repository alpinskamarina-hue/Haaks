import type { Lang } from "@/lib/i18n";

// One short explanation per feed source: a bold line "where the job comes from" and a plain line "what to do".
// Machine-assisted translations: review before launch.
export type FeedSource = "all" | "jobs" | "soon" | "tender" | "business" | "received" | "firms" | "helper";
type Info = { title: string; text: string };
export type FeedSourceDict = Record<FeedSource, Info>;

const ru: FeedSourceDict = {
  all: { title: "Все — заказы из всех источников сразу.", text: "Сверху те, что лучше всего подходят вам по профессии и району." },
  jobs: { title: "Заказы — частные клиенты сами ищут мастера.", text: "Им нужен ремонт или стройка. Откликнитесь: клиент выберет мастера, и откроются контакты." },
  soon: { title: "Скоро стройка — gemeente выдала разрешение на стройку или ремонт.", text: "Работы ещё не начались. Напишите владельцу первым, пока он не нашёл мастера." },
  tender: { title: "Тендеры — государственные и городские заказы с сайта TenderNed.", text: "Обычно это крупные работы. Заявку нужно подать до указанного срока." },
  business: { title: "Компании ищут — фирмы и другие ZZP разместили в Haaks объявление.", text: "Им нужны люди на объект. Откликнитесь: если вас выберут, откроются контакты." },
  received: { title: "Мне прислали — заказы, которыми с вами поделились коллеги.", text: "Посмотрите, подходит ли вам работа." },
  firms: { title: "Фирмы — строительные компании (BV) рядом с вами.", text: "Сами они объявление не давали. Вы можете предложить им свои услуги." },
  helper: { title: "Нужен помощник — здесь вы сами ищете помощника на свой объект.", text: "Другие ZZP увидят ваше объявление в ленте на своём языке и откликнутся." },
};

const en: FeedSourceDict = {
  all: { title: "All — jobs from every source at once.", text: "The ones that best fit your trade and area come first." },
  jobs: { title: "Jobs — private clients are looking for a builder.", text: "They need a renovation or build. Reply: when the client picks you, contacts open." },
  soon: { title: "Building soon — the gemeente issued a permit for building or renovation.", text: "Work hasn't started yet. Write to the owner first, before they find a builder." },
  tender: { title: "Tenders — public and municipal jobs from TenderNed.", text: "Usually larger works. Apply before the deadline shown." },
  business: { title: "Companies looking — firms and other ZZP posted a job on Haaks.", text: "They need people on site. Reply: if they pick you, contacts open." },
  received: { title: "Sent to me — jobs colleagues shared with you.", text: "Check whether the work suits you." },
  firms: { title: "Firms — construction companies (BV) near you.", text: "They didn't post a job themselves. You can offer them your services." },
  helper: { title: "Need a helper — here you look for a helper for your own job.", text: "Other ZZP see your post in the feed in their language and reply." },
};

const nl: FeedSourceDict = {
  all: { title: "Alles — klussen uit alle bronnen tegelijk.", text: "Bovenaan staan de klussen die het best bij uw vak en regio passen." },
  jobs: { title: "Klussen — particulieren zoeken zelf een vakman.", text: "Ze willen verbouwen of bouwen. Reageer: kiest de klant u, dan gaan de contactgegevens open." },
  soon: { title: "Binnenkort bouw — de gemeente gaf een vergunning voor bouw of verbouwing.", text: "Het werk is nog niet begonnen. Schrijf de eigenaar als eerste, voordat die een vakman vindt." },
  tender: { title: "Aanbestedingen — opdrachten van overheid en gemeenten via TenderNed.", text: "Meestal grotere werken. Schrijf in vóór de genoemde datum." },
  business: { title: "Bedrijven zoeken — bedrijven en andere zzp'ers plaatsten een klus op Haaks.", text: "Ze zoeken mensen op de bouw. Reageer: kiezen ze u, dan gaan de contactgegevens open." },
  received: { title: "Naar mij gestuurd — klussen die collega's met u deelden.", text: "Kijk of het werk bij u past." },
  firms: { title: "Bedrijven — bouwbedrijven (bv) bij u in de buurt.", text: "Ze plaatsten zelf geen klus. U kunt hun uw diensten aanbieden." },
  helper: { title: "Hulp nodig — hier zoekt u zelf een helper voor uw klus.", text: "Andere zzp'ers zien uw oproep in de feed in hun eigen taal en reageren." },
};

const uk: FeedSourceDict = {
  all: { title: "Усі — замовлення з усіх джерел одразу.", text: "Вгорі ті, що найкраще підходять вам за професією та районом." },
  jobs: { title: "Замовлення — приватні клієнти самі шукають майстра.", text: "Їм потрібен ремонт чи будівництво. Відгукніться: клієнт обере майстра, і відкриються контакти." },
  soon: { title: "Скоро будівництво — gemeente видала дозвіл на будівництво чи ремонт.", text: "Роботи ще не почалися. Напишіть власнику першим, поки він не знайшов майстра." },
  tender: { title: "Тендери — державні та міські замовлення з сайту TenderNed.", text: "Зазвичай це великі роботи. Заявку треба подати до вказаного терміну." },
  business: { title: "Компанії шукають — фірми та інші ZZP розмістили в Haaks оголошення.", text: "Їм потрібні люди на об'єкт. Відгукніться: якщо вас оберуть, відкриються контакти." },
  received: { title: "Мені надіслали — замовлення, якими з вами поділилися колеги.", text: "Подивіться, чи підходить вам робота." },
  firms: { title: "Фірми — будівельні компанії (BV) поруч із вами.", text: "Самі вони оголошення не давали. Ви можете запропонувати їм свої послуги." },
  helper: { title: "Потрібен помічник — тут ви самі шукаєте помічника на свій об'єкт.", text: "Інші ZZP побачать ваше оголошення у стрічці своєю мовою і відгукнуться." },
};

const pl: FeedSourceDict = {
  all: { title: "Wszystkie — zlecenia ze wszystkich źródeł naraz.", text: "Na górze te, które najlepiej pasują do Twojego zawodu i regionu." },
  jobs: { title: "Zlecenia — klienci prywatni sami szukają fachowca.", text: "Potrzebują remontu lub budowy. Odpowiedz: gdy klient Cię wybierze, kontakty się otworzą." },
  soon: { title: "Wkrótce budowa — gemeente wydała pozwolenie na budowę lub remont.", text: "Prace jeszcze się nie zaczęły. Napisz do właściciela pierwszy, zanim znajdzie fachowca." },
  tender: { title: "Przetargi — zlecenia państwowe i miejskie z serwisu TenderNed.", text: "Zwykle większe prace. Zgłoszenie trzeba złożyć przed podanym terminem." },
  business: { title: "Firmy szukają — firmy i inni ZZP dodali ogłoszenie w Haaks.", text: "Potrzebują ludzi na budowę. Odpowiedz: jeśli Cię wybiorą, kontakty się otworzą." },
  received: { title: "Przysłane mi — zlecenia, którymi podzielili się z Tobą koledzy.", text: "Sprawdź, czy praca Ci pasuje." },
  firms: { title: "Firmy — firmy budowlane (BV) w Twojej okolicy.", text: "Same nie dodały ogłoszenia. Możesz zaproponować im swoje usługi." },
  helper: { title: "Potrzebny pomocnik — tu sam szukasz pomocnika na swoją budowę.", text: "Inni ZZP zobaczą Twoje ogłoszenie w swoim języku i odpowiedzą." },
};

const ro: FeedSourceDict = {
  all: { title: "Toate — lucrări din toate sursele deodată.", text: "Sus sunt cele care se potrivesc cel mai bine meseriei și zonei tale." },
  jobs: { title: "Comenzi — clienți privați caută singuri un meseriaș.", text: "Au nevoie de renovare sau construcție. Răspunde: când clientul te alege, se deschid contactele." },
  soon: { title: "Construcție în curând — gemeente a dat autorizație de construcție sau renovare.", text: "Lucrările nu au început. Scrie-i primul proprietarului, înainte să găsească un meseriaș." },
  tender: { title: "Licitații — lucrări de stat și ale primăriilor de pe TenderNed.", text: "De obicei lucrări mari. Oferta se depune până la termenul indicat." },
  business: { title: "Firme caută — firme și alți ZZP au publicat un anunț în Haaks.", text: "Au nevoie de oameni pe șantier. Răspunde: dacă te aleg, se deschid contactele." },
  received: { title: "Primite — lucrări trimise de colegi.", text: "Vezi dacă lucrarea ți se potrivește." },
  firms: { title: "Firme — firme de construcții (BV) din apropiere.", text: "Nu au publicat ele un anunț. Le poți oferi serviciile tale." },
  helper: { title: "Am nevoie de ajutor — aici cauți tu un ajutor pentru șantierul tău.", text: "Alți ZZP îți văd anunțul în limba lor și răspund." },
};

const tr: FeedSourceDict = {
  all: { title: "Tümü — tüm kaynaklardan işler bir arada.", text: "Mesleğinize ve bölgenize en uygun olanlar en üstte." },
  jobs: { title: "İşler — özel müşteriler kendileri usta arıyor.", text: "Tadilat veya inşaat gerekiyor. Yanıt verin: müşteri sizi seçince iletişim bilgileri açılır." },
  soon: { title: "Yakında inşaat — gemeente inşaat veya tadilat izni verdi.", text: "İş henüz başlamadı. Ev sahibine ilk siz yazın, o usta bulmadan önce." },
  tender: { title: "İhaleler — TenderNed'den devlet ve belediye işleri.", text: "Genelde büyük işler. Başvuru belirtilen tarihe kadar yapılmalı." },
  business: { title: "Firmalar arıyor — firmalar ve diğer ZZP'ler Haaks'ta ilan verdi.", text: "Şantiyeye eleman lazım. Yanıt verin: sizi seçerlerse iletişim bilgileri açılır." },
  received: { title: "Bana gönderilen — meslektaşların sizinle paylaştığı işler.", text: "İşin size uyup uymadığına bakın." },
  firms: { title: "Firmalar — yakınınızdaki inşaat şirketleri (BV).", text: "Kendileri ilan vermedi. Onlara hizmetlerinizi önerebilirsiniz." },
  helper: { title: "Yardımcı lazım — burada kendi işiniz için yardımcı ararsınız.", text: "Diğer ZZP'ler ilanınızı kendi dillerinde görür ve yanıt verir." },
};

const dicts: Record<Lang, FeedSourceDict> = { ru, en, nl, uk, pl, ro, tr };

export function getFeedSourceDict(lang: Lang): FeedSourceDict {
  return dicts[lang] ?? dicts.en;
}
