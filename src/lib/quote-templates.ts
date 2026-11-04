import type { Lang } from "@/lib/i18n";
import type { QuoteLine } from "@/lib/quotes";

// Ready work lines for a quote, per trade. The Dutch text goes on the quote; the worker
// sees the name in their own language. Prices are only a starting point: the worker's
// own last price for the same line replaces them (see templatePrices).
type Row = [nl: string, unit: string, kind: QuoteLine["kind"], price: number, names: Record<Exclude<Lang, "nl">, string>];

const r = (nl: string, unit: string, kind: QuoteLine["kind"], price: number, en: string, ru: string, uk: string, pl: string, ro: string, tr: string): Row => [
  nl,
  unit,
  kind,
  price,
  { en, ru, uk, pl, ro, tr },
];

export const TEMPLATE_GROUPS: { id: string; rows: Row[] }[] = [
  {
    id: "tiler",
    rows: [
      r("Tegels leggen vloer", "m²", "labour", 45, "Floor tiling", "Укладка плитки на пол", "Укладання плитки на підлогу", "Układanie płytek na podłodze", "Montaj gresie", "Zemin fayansı döşeme"),
      r("Wandtegels zetten", "m²", "labour", 50, "Wall tiling", "Укладка плитки на стены", "Укладання плитки на стіни", "Układanie płytek na ścianach", "Montaj faianță", "Duvar fayansı döşeme"),
      r("Oude tegels verwijderen", "m²", "labour", 15, "Removing old tiles", "Демонтаж старой плитки", "Демонтаж старої плитки", "Skuwanie starych płytek", "Demontare gresie/faianță veche", "Eski fayansları sökme"),
      r("Voegen", "m²", "labour", 10, "Grouting", "Затирка швов", "Затирка швів", "Fugowanie", "Rostuire", "Derz dolgusu"),
      r("Waterdicht maken (kitten en coaten)", "m²", "labour", 20, "Waterproofing", "Гидроизоляция", "Гідроізоляція", "Hydroizolacja", "Hidroizolație", "Su yalıtımı"),
      r("Tegellijm en voegmiddel", "m²", "material", 8, "Tile adhesive and grout", "Клей и затирка", "Клей і затирка", "Klej i fuga", "Adeziv și chit de rosturi", "Fayans yapıştırıcısı ve derz"),
    ],
  },
  {
    id: "painter",
    rows: [
      r("Muren schilderen (2 lagen)", "m²", "labour", 12, "Painting walls (2 coats)", "Покраска стен (2 слоя)", "Фарбування стін (2 шари)", "Malowanie ścian (2 warstwy)", "Vopsit pereți (2 straturi)", "Duvar boyama (2 kat)"),
      r("Plafond schilderen", "m²", "labour", 14, "Painting ceiling", "Покраска потолка", "Фарбування стелі", "Malowanie sufitu", "Vopsit tavan", "Tavan boyama"),
      r("Kozijnen lakken", "m", "labour", 18, "Painting window frames", "Покраска рам", "Фарбування рам", "Lakierowanie ram okiennych", "Vopsit tocuri", "Pencere çerçevesi boyama"),
      r("Afplakken en voorbereiden", "uur", "labour", 45, "Masking and preparation", "Подготовка и укрывка", "Підготовка і укривання", "Oklejanie i przygotowanie", "Pregătire și protejare", "Bantlama ve hazırlık"),
      r("Verf en materialen", "stuk", "material", 60, "Paint and materials", "Краска и материалы", "Фарба і матеріали", "Farba i materiały", "Vopsea și materiale", "Boya ve malzemeler"),
    ],
  },
  {
    id: "plasterer",
    rows: [
      r("Wanden stucen", "m²", "labour", 22, "Plastering walls", "Штукатурка стен", "Штукатурка стін", "Tynkowanie ścian", "Tencuire pereți", "Duvar sıvası"),
      r("Plafond stucen", "m²", "labour", 25, "Plastering ceiling", "Штукатурка потолка", "Штукатурка стелі", "Tynkowanie sufitu", "Tencuire tavan", "Tavan sıvası"),
      r("Sauswerk", "m²", "labour", 8, "Spray finish (sauswerk)", "Покраска по штукатурке", "Фарбування по штукатурці", "Malowanie natryskowe", "Vopsire finală", "Sıva üstü boya"),
      r("Hoekprofielen plaatsen", "m", "labour", 6, "Corner beads", "Угловые профили", "Кутові профілі", "Narożniki", "Profile de colț", "Köşe profili"),
    ],
  },
  {
    id: "drywall",
    rows: [
      r("Metal stud wand plaatsen", "m²", "labour", 35, "Metal stud wall", "Перегородка из гипсокартона", "Перегородка з гіпсокартону", "Ścianka z płyt g-k", "Perete din gips-carton", "Alçıpan bölme duvar"),
      r("Plafond van gipsplaten", "m²", "labour", 38, "Plasterboard ceiling", "Потолок из гипсокартона", "Стеля з гіпсокартону", "Sufit z płyt g-k", "Tavan din gips-carton", "Alçıpan tavan"),
      r("Naden afwerken (Q3)", "m²", "labour", 12, "Finishing joints (Q3)", "Шпаклёвка швов (Q3)", "Шпаклювання швів (Q3)", "Szpachlowanie spoin (Q3)", "Finisare rosturi (Q3)", "Derz macunu (Q3)"),
      r("Isolatie in wand", "m²", "material", 9, "Wall insulation", "Утеплитель в стене", "Утеплювач у стіні", "Izolacja w ścianie", "Izolație în perete", "Duvar yalıtımı"),
    ],
  },
  {
    id: "carpenter",
    rows: [
      r("Binnendeur afhangen", "stuk", "labour", 95, "Hanging an interior door", "Установка межкомнатной двери", "Встановлення міжкімнатних дверей", "Montaż drzwi wewnętrznych", "Montaj ușă interioară", "İç kapı takma"),
      r("Plinten plaatsen", "m", "labour", 9, "Fitting skirting boards", "Установка плинтусов", "Встановлення плінтусів", "Montaż listew przypodłogowych", "Montaj plintă", "Süpürgelik takma"),
      r("Houten vloer of trap repareren", "uur", "labour", 48, "Repairing wooden floor or stairs", "Ремонт деревянного пола или лестницы", "Ремонт дерев'яної підлоги або сходів", "Naprawa drewnianej podłogi lub schodów", "Reparație pardoseală sau scară de lemn", "Ahşap zemin veya merdiven tamiri"),
      r("Kast op maat maken", "stuk", "labour", 450, "Custom cupboard", "Шкаф на заказ", "Шафа на замовлення", "Szafa na wymiar", "Dulap la comandă", "Özel ölçü dolap"),
    ],
  },
  {
    id: "flooring",
    rows: [
      r("Laminaat leggen", "m²", "labour", 15, "Laying laminate", "Укладка ламината", "Укладання ламінату", "Układanie paneli", "Montaj parchet laminat", "Laminat döşeme"),
      r("PVC-vloer leggen", "m²", "labour", 18, "Laying vinyl floor", "Укладка ПВХ-пола", "Укладання ПВХ-підлоги", "Układanie podłogi PVC", "Montaj pardoseală PVC", "PVC zemin döşeme"),
      r("Ondervloer leggen", "m²", "labour", 4, "Laying underlay", "Укладка подложки", "Укладання підкладки", "Układanie podkładu", "Montaj folie/izolație sub parchet", "Altlık serme"),
      r("Egaliseren", "m²", "labour", 14, "Levelling the floor", "Выравнивание пола", "Вирівнювання підлоги", "Wylewka samopoziomująca", "Șapă autonivelantă", "Zemin tesviyesi"),
      r("Oude vloer verwijderen", "m²", "labour", 6, "Removing the old floor", "Демонтаж старого пола", "Демонтаж старої підлоги", "Demontaż starej podłogi", "Demontare pardoseală veche", "Eski zemini sökme"),
    ],
  },
  {
    id: "bricklayer",
    rows: [
      r("Metselwerk", "m²", "labour", 65, "Bricklaying", "Кладка кирпича", "Цегляна кладка", "Murowanie", "Zidărie", "Tuğla örme"),
      r("Voegwerk vernieuwen", "m²", "labour", 35, "Repointing", "Обновление швов кладки", "Оновлення швів кладки", "Odnowienie fug", "Refacere rosturi", "Derz yenileme"),
      r("Muur uitbreken", "m²", "labour", 40, "Breaking out a wall", "Снос стены", "Знесення стіни", "Wyburzenie ściany", "Demolare perete", "Duvar yıkma"),
      r("Stenen en specie", "m²", "material", 30, "Bricks and mortar", "Кирпич и раствор", "Цегла і розчин", "Cegły i zaprawa", "Cărămizi și mortar", "Tuğla ve harç"),
    ],
  },
  {
    id: "roofer",
    rows: [
      r("Dakpannen vervangen", "m²", "labour", 55, "Replacing roof tiles", "Замена черепицы", "Заміна черепиці", "Wymiana dachówek", "Înlocuire țiglă", "Kiremit değiştirme"),
      r("Bitumen dakbedekking", "m²", "labour", 45, "Bitumen roofing", "Битумная кровля", "Бітумна покрівля", "Pokrycie papą", "Învelitoare bitum", "Bitüm çatı kaplama"),
      r("Dakgoot vervangen", "m", "labour", 40, "Replacing the gutter", "Замена водостока", "Заміна водостоку", "Wymiana rynny", "Înlocuire jgheab", "Oluk değiştirme"),
      r("Lekkage repareren", "uur", "labour", 55, "Fixing a leak", "Ремонт протечки", "Ремонт протікання", "Naprawa przecieku", "Reparație infiltrație", "Sızıntı tamiri"),
    ],
  },
  {
    id: "plumber",
    rows: [
      r("Toilet plaatsen", "stuk", "labour", 180, "Installing a toilet", "Установка унитаза", "Встановлення унітазу", "Montaż WC", "Montaj vas WC", "Klozet montajı"),
      r("Wastafel aansluiten", "stuk", "labour", 120, "Connecting a washbasin", "Подключение раковины", "Підключення раковини", "Podłączenie umywalki", "Montaj lavoar", "Lavabo bağlantısı"),
      r("Douche installeren", "stuk", "labour", 350, "Installing a shower", "Установка душа", "Встановлення душу", "Montaż prysznica", "Montaj duș", "Duş montajı"),
      r("Leidingwerk", "m", "labour", 30, "Pipework", "Прокладка труб", "Прокладання труб", "Instalacja rur", "Instalație țevi", "Boru tesisatı"),
    ],
  },
  {
    id: "electrician",
    rows: [
      r("Wandcontactdoos plaatsen", "stuk", "labour", 55, "Installing a socket", "Установка розетки", "Встановлення розетки", "Montaż gniazdka", "Montaj priză", "Priz takma"),
      r("Lichtpunt aanleggen", "stuk", "labour", 65, "Installing a light point", "Точка освещения", "Точка освітлення", "Punkt oświetleniowy", "Punct de iluminat", "Aydınlatma noktası"),
      r("Groepenkast vervangen", "stuk", "labour", 650, "Replacing the fuse box", "Замена электрощита", "Заміна електрощита", "Wymiana rozdzielnicy", "Înlocuire tablou electric", "Sigorta kutusu değiştirme"),
      r("Bekabeling trekken", "m", "labour", 8, "Pulling cables", "Прокладка кабеля", "Прокладання кабелю", "Układanie przewodów", "Tragere cabluri", "Kablo çekme"),
    ],
  },
  {
    id: "windows_doors",
    rows: [
      r("Kozijn plaatsen", "stuk", "labour", 250, "Installing a window frame", "Установка оконной рамы", "Встановлення віконної рами", "Montaż ościeżnicy okiennej", "Montaj toc fereastră", "Pencere kasası montajı"),
      r("Buitendeur plaatsen", "stuk", "labour", 220, "Installing an outside door", "Установка входной двери", "Встановлення вхідних дверей", "Montaż drzwi zewnętrznych", "Montaj ușă exterioară", "Dış kapı montajı"),
      r("HR++ glas plaatsen", "m²", "labour", 60, "Fitting HR++ glass", "Установка стеклопакета HR++", "Встановлення склопакета HR++", "Montaż szyby HR++", "Montaj geam HR++", "HR++ cam takma"),
      r("Afkitten", "m", "labour", 6, "Sealing joints", "Герметизация швов", "Герметизація швів", "Uszczelnianie", "Etanșare cu silicon", "Silikon çekme"),
    ],
  },
  {
    id: "welder",
    rows: [
      r("Laswerk", "uur", "labour", 55, "Welding", "Сварочные работы", "Зварювальні роботи", "Spawanie", "Sudură", "Kaynak işi"),
      r("Stalen hekwerk maken", "m", "labour", 120, "Steel railing", "Стальное ограждение", "Сталеве огородження", "Balustrada stalowa", "Balustradă din oțel", "Çelik korkuluk"),
      r("Staal en materialen", "stuk", "material", 100, "Steel and materials", "Металл и материалы", "Метал і матеріали", "Stal i materiały", "Oțel și materiale", "Çelik ve malzemeler"),
    ],
  },
  {
    id: "labourer",
    rows: [
      r("Sloopwerk", "uur", "labour", 38, "Demolition work", "Демонтажные работы", "Демонтажні роботи", "Prace rozbiórkowe", "Lucrări de demolare", "Yıkım işleri"),
      r("Opruimen en schoonmaken", "uur", "labour", 35, "Clearing and cleaning", "Уборка и вывоз", "Прибирання і вивезення", "Sprzątanie", "Curățenie", "Toplama ve temizlik"),
      r("Hulp op de bouw", "uur", "labour", 35, "Site assistance", "Подсобные работы", "Підсобні роботи", "Pomoc na budowie", "Ajutor pe șantier", "Şantiye yardımı"),
    ],
  },
  {
    id: "general",
    rows: [
      r("Arbeid", "uur", "labour", 45, "Labour (hourly)", "Работа (почасово)", "Робота (погодинно)", "Robocizna (godzinowo)", "Manoperă (pe oră)", "İşçilik (saatlik)"),
      r("Voorrijkosten", "stuk", "other", 35, "Call-out charge", "Выезд", "Виїзд", "Dojazd", "Cost deplasare", "Yol ücreti"),
      r("Afvoer bouwafval (container)", "stuk", "other", 250, "Waste removal (skip)", "Вывоз мусора (контейнер)", "Вивезення сміття (контейнер)", "Wywóz gruzu (kontener)", "Evacuare moloz (container)", "Moloz atımı (konteyner)"),
      r("Materialen", "stuk", "material", 0, "Materials", "Материалы", "Матеріали", "Materiały", "Materiale", "Malzemeler"),
    ],
  },
];

export type TemplateItem = { label: string; line: QuoteLine };
export type TemplateGroup = { id: string; items: TemplateItem[] };

// Groups for the worker: their own trades first, then the rest, "general" always last.
// prices: the worker's last price per Dutch line text; hourly: their hourly rate.
export function templateGroups(lang: Lang, trades: string[], prices: Record<string, number>, hourly: number | null): TemplateGroup[] {
  const ordered = [
    ...TEMPLATE_GROUPS.filter((g) => trades.includes(g.id)),
    ...TEMPLATE_GROUPS.filter((g) => !trades.includes(g.id) && g.id !== "general"),
    ...TEMPLATE_GROUPS.filter((g) => g.id === "general"),
  ];
  return ordered.map((g) => ({
    id: g.id,
    items: g.rows.map(([nl, unit, kind, price, names]) => ({
      label: lang === "nl" ? nl : names[lang],
      line: {
        kind,
        description: nl,
        quantity: 1,
        unit,
        unit_price: prices[nl] ?? (unit === "uur" && kind === "labour" && hourly ? hourly : price),
        vat_rate: 21,
      },
    })),
  }));
}

// The worker's own last price for each line text, from their recent quotes (newest first).
export function templatePrices(quotes: { lines: QuoteLine[] }[]): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const q of quotes)
    for (const l of q.lines ?? []) {
      const key = l.description?.trim();
      if (key && !(key in prices) && Number(l.unit_price) > 0) prices[key] = Number(l.unit_price);
    }
  return prices;
}
