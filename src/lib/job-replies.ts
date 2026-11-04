import type { SupabaseClient } from "@supabase/supabase-js";
import { shortName } from "@/lib/company-jobs";
import type { Lang } from "@/lib/i18n";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

// A builder's reply to a company job. Contacts open on both sides once the company accepts.
export type ReplyStatus = "sent" | "accepted" | "declined";

export type MyReply = {
  id: string;
  status: ReplyStatus;
  created_at: string;
  decided_at: string | null;
  feed_item_id: string | null;
  job_title: string;
  job_city: string;
  job_open: boolean;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
};

export type MyInvite = {
  id: string;
  status: ReplyStatus;
  created_at: string;
  company_name: string | null;
  kvk_number: string | null;
  job_title: string | null;
  job_city: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
};

export type CompanyReply = {
  id: string;
  status: ReplyStatus;
  created_at: string;
  full_name: string | null;
  city: string | null;
  trades: string[];
  languages: string[];
  hourly_rate: number | null;
  vehicle: string | null;
  tools: string | null;
  licences: string[];
  kvk_number: string | null;
  passport_token: string | null;
  phone: string | null;
  email: string | null;
};

// How long "looking for work" stays on before it switches itself off.
export const CATALOG_DAYS = 30;

// The builder's card is in the catalog: switched on and not run out.
export function catalogActive(p: { in_catalog?: boolean | null; catalog_until?: string | null }) {
  return Boolean(p.in_catalog) && (!p.catalog_until || Date.parse(p.catalog_until) > Date.now());
}

const TEXT = {
  ru: {
    pageTitle: "Отклики и приглашения",
    invitesTitle: "Приглашения от компаний",
    invite: "{company} приглашает вас на работу",
    inviteJob: "Заказ: {job}",
    acceptInvite: "Принять",
    declineInvite: "Отклонить",
    inviteAccepted: "Вы приняли приглашение",
    inviteDeclined: "Вы отклонили приглашение",
    catalogTitle: "Ищу работу",
    catalogText: "Покажите свой профиль компаниям (BV) в каталоге Haaks. Компании увидят имя, профессию, город, ставку, языки и ZZP-паспорт. Телефон и почту они увидят, только если вы примете приглашение.",
    catalogOn: "Показывать меня компаниям",
    catalogOff: "Скрыть меня из каталога",
    catalogIsOn: "✓ Вы в каталоге: компании могут вас пригласить",
    catalogBanner: "Пусть компании находят вас сами: включите «Ищу работу»",
    catalogUntil: "Компании видят вас до {d}. Потом карточка сама выключится.",
    catalogExtend: "Продлить на 30 дней",
    pushInviteTitle: "Вас приглашает компания",
    pushInviteBody: "{company} приглашает вас на работу. Откройте Haaks, чтобы принять или отклонить.",
    reply: "Откликнуться",
    hint: "Компания увидит ваш профиль и ZZP-паспорт. Телефон и почта откроются обеим сторонам, когда компания примет отклик.",
    sent: "Вы откликнулись · ждём ответа компании",
    accepted: "Компания приняла ваш отклик",
    declined: "Компания выбрала другого исполнителя",
    closed: "Заказ закрыт",
    myTitle: "Мои отклики",
    myEmpty: "Вы ещё не откликались. Отклики есть на заказах из раздела «🏢 Компании ищут».",
    myLink: "Мои отклики",
    contacts: "Контакты компании",
    call: "Позвонить",
    write: "Написать",
    pushTitle: "Вас приняли на заказ!",
    pushBody: "{company} приняла ваш отклик: {job}. Откройте контакты в Haaks.",
    open: "Открыть",
    errClosed: "Этот заказ уже закрыт.",
    errLocked: "Сначала откройте карточку.",
  },
  uk: {
    pageTitle: "Відгуки та запрошення",
    invitesTitle: "Запрошення від компаній",
    invite: "{company} запрошує вас на роботу",
    inviteJob: "Замовлення: {job}",
    acceptInvite: "Прийняти",
    declineInvite: "Відхилити",
    inviteAccepted: "Ви прийняли запрошення",
    inviteDeclined: "Ви відхилили запрошення",
    catalogTitle: "Шукаю роботу",
    catalogText: "Покажіть свій профіль компаніям (BV) у каталозі Haaks. Компанії побачать ім'я, професію, місто, ставку, мови та ZZP-паспорт. Телефон і пошту — лише якщо ви приймете запрошення.",
    catalogOn: "Показувати мене компаніям",
    catalogOff: "Сховати мене з каталогу",
    catalogIsOn: "✓ Ви в каталозі: компанії можуть вас запросити",
    catalogBanner: "Нехай компанії знаходять вас самі: увімкніть «Шукаю роботу»",
    catalogUntil: "Компанії бачать вас до {d}. Потім картка сама вимкнеться.",
    catalogExtend: "Продовжити на 30 днів",
    pushInviteTitle: "Вас запрошує компанія",
    pushInviteBody: "{company} запрошує вас на роботу. Відкрийте Haaks, щоб прийняти або відхилити.",
    reply: "Відгукнутися",
    hint: "Компанія побачить ваш профіль і ZZP-паспорт. Телефон і пошта відкриються обом сторонам, коли компанія прийме відгук.",
    sent: "Ви відгукнулися · чекаємо відповіді компанії",
    accepted: "Компанія прийняла ваш відгук",
    declined: "Компанія обрала іншого виконавця",
    closed: "Замовлення закрите",
    myTitle: "Мої відгуки",
    myEmpty: "Ви ще не відгукувалися. Відгуки є на замовленнях із розділу «🏢 Компанії шукають».",
    myLink: "Мої відгуки",
    contacts: "Контакти компанії",
    call: "Зателефонувати",
    write: "Написати",
    pushTitle: "Вас прийняли на замовлення!",
    pushBody: "{company} прийняла ваш відгук: {job}. Відкрийте контакти в Haaks.",
    open: "Відкрити",
    errClosed: "Це замовлення вже закрите.",
    errLocked: "Спочатку відкрийте картку.",
  },
  pl: {
    pageTitle: "Zgłoszenia i zaproszenia",
    invitesTitle: "Zaproszenia od firm",
    invite: "{company} zaprasza Cię do pracy",
    inviteJob: "Zlecenie: {job}",
    acceptInvite: "Przyjmij",
    declineInvite: "Odrzuć",
    inviteAccepted: "Przyjęto zaproszenie",
    inviteDeclined: "Odrzucono zaproszenie",
    catalogTitle: "Szukam pracy",
    catalogText: "Pokaż swój profil firmom (BV) w katalogu Haaks. Firmy zobaczą imię, zawód, miasto, stawkę, języki i paszport ZZP. Telefon i e-mail tylko wtedy, gdy przyjmiesz zaproszenie.",
    catalogOn: "Pokazuj mnie firmom",
    catalogOff: "Ukryj mnie w katalogu",
    catalogIsOn: "✓ Jesteś w katalogu: firmy mogą Cię zaprosić",
    catalogBanner: "Niech firmy znajdują Cię same: włącz «Szukam pracy»",
    catalogUntil: "Firmy widzą Cię do {d}. Potem karta sama się wyłączy.",
    catalogExtend: "Przedłuż o 30 dni",
    pushInviteTitle: "Firma Cię zaprasza",
    pushInviteBody: "{company} zaprasza Cię do pracy. Otwórz Haaks, aby przyjąć lub odrzucić.",
    reply: "Zgłoś się",
    hint: "Firma zobaczy Twój profil i paszport ZZP. Telefon i e-mail otworzą się obu stronom, gdy firma przyjmie zgłoszenie.",
    sent: "Zgłoszono · czekamy na odpowiedź firmy",
    accepted: "Firma przyjęła Twoje zgłoszenie",
    declined: "Firma wybrała kogoś innego",
    closed: "Zlecenie zamknięte",
    myTitle: "Moje zgłoszenia",
    myEmpty: "Nie masz jeszcze zgłoszeń. Można się zgłaszać do zleceń z sekcji «🏢 Firmy szukają».",
    myLink: "Moje zgłoszenia",
    contacts: "Kontakt do firmy",
    call: "Zadzwoń",
    write: "Napisz",
    pushTitle: "Przyjęto Cię do zlecenia!",
    pushBody: "{company} przyjęła Twoje zgłoszenie: {job}. Kontakt znajdziesz w Haaks.",
    open: "Otwórz",
    errClosed: "To zlecenie jest już zamknięte.",
    errLocked: "Najpierw otwórz kartę.",
  },
  ro: {
    pageTitle: "Aplicări și invitații",
    invitesTitle: "Invitații de la firme",
    invite: "{company} te invită la lucru",
    inviteJob: "Lucrare: {job}",
    acceptInvite: "Acceptă",
    declineInvite: "Refuză",
    inviteAccepted: "Ai acceptat invitația",
    inviteDeclined: "Ai refuzat invitația",
    catalogTitle: "Caut de lucru",
    catalogText: "Arată-ți profilul firmelor (BV) în catalogul Haaks. Firmele văd numele, meseria, orașul, tariful, limbile și pașaportul ZZP. Telefonul și e-mailul doar dacă accepți invitația.",
    catalogOn: "Arată-mă firmelor",
    catalogOff: "Ascunde-mă din catalog",
    catalogIsOn: "✓ Ești în catalog: firmele te pot invita",
    catalogBanner: "Lasă firmele să te găsească: activează «Caut de lucru»",
    catalogUntil: "Firmele te văd până la {d}. Apoi fișa se oprește singură.",
    catalogExtend: "Prelungește cu 30 de zile",
    pushInviteTitle: "O firmă te invită",
    pushInviteBody: "{company} te invită la lucru. Deschide Haaks pentru a accepta sau refuza.",
    reply: "Aplică",
    hint: "Firma vede profilul tău și pașaportul ZZP. Telefonul și e-mailul se deschid ambelor părți când firma acceptă aplicarea.",
    sent: "Ai aplicat · așteptăm răspunsul firmei",
    accepted: "Firma ți-a acceptat aplicarea",
    declined: "Firma a ales pe altcineva",
    closed: "Lucrare închisă",
    myTitle: "Aplicările mele",
    myEmpty: "Nu ai aplicat încă. Poți aplica la lucrările din secțiunea «🏢 Firmele caută».",
    myLink: "Aplicările mele",
    contacts: "Contactul firmei",
    call: "Sună",
    write: "Scrie",
    pushTitle: "Ai fost acceptat la o lucrare!",
    pushBody: "{company} ți-a acceptat aplicarea: {job}. Vezi contactul în Haaks.",
    open: "Deschide",
    errClosed: "Această lucrare este deja închisă.",
    errLocked: "Deschide mai întâi cardul.",
  },
  tr: {
    pageTitle: "Başvurular ve davetler",
    invitesTitle: "Firmalardan davetler",
    invite: "{company} sizi işe davet ediyor",
    inviteJob: "İş: {job}",
    acceptInvite: "Kabul et",
    declineInvite: "Reddet",
    inviteAccepted: "Daveti kabul ettiniz",
    inviteDeclined: "Daveti reddettiniz",
    catalogTitle: "İş arıyorum",
    catalogText: "Profilinizi Haaks kataloğunda firmalara (BV) gösterin. Firmalar adınızı, mesleğinizi, şehrinizi, ücretinizi, dillerinizi ve ZZP pasaportunuzu görür. Telefon ve e-posta yalnızca bir daveti kabul ederseniz açılır.",
    catalogOn: "Beni firmalara göster",
    catalogOff: "Beni katalogdan gizle",
    catalogIsOn: "✓ Katalogdasınız: firmalar sizi davet edebilir",
    catalogBanner: "Firmalar sizi bulsun: «İş arıyorum» seçeneğini açın",
    catalogUntil: "Firmalar sizi {d} tarihine kadar görür. Sonra kartınız kendiliğinden kapanır.",
    catalogExtend: "30 gün uzat",
    pushInviteTitle: "Bir firma sizi davet ediyor",
    pushInviteBody: "{company} sizi işe davet ediyor. Kabul etmek veya reddetmek için Haaks'ı açın.",
    reply: "Başvur",
    hint: "Firma profilinizi ve ZZP pasaportunuzu görür. Firma başvurunuzu kabul edince telefon ve e-posta iki taraf için de açılır.",
    sent: "Başvurdunuz · firmanın cevabı bekleniyor",
    accepted: "Firma başvurunuzu kabul etti",
    declined: "Firma başka birini seçti",
    closed: "İş kapandı",
    myTitle: "Başvurularım",
    myEmpty: "Henüz başvuru yok. «🏢 Firmalar arıyor» bölümündeki işlere başvurabilirsiniz.",
    myLink: "Başvurularım",
    contacts: "Firma iletişim bilgileri",
    call: "Ara",
    write: "Yaz",
    pushTitle: "İşi aldınız!",
    pushBody: "{company} başvurunuzu kabul etti: {job}. İletişim bilgilerini Haaks'ta açın.",
    open: "Aç",
    errClosed: "Bu iş zaten kapandı.",
    errLocked: "Önce kartı açın.",
  },
  en: {
    pageTitle: "Replies and invitations",
    invitesTitle: "Invitations from companies",
    invite: "{company} invites you to work",
    inviteJob: "Job: {job}",
    acceptInvite: "Accept",
    declineInvite: "Decline",
    inviteAccepted: "You accepted the invitation",
    inviteDeclined: "You declined the invitation",
    catalogTitle: "Looking for work",
    catalogText: "Show your profile to companies (BV) in the Haaks catalog. Companies see your name, trade, town, rate, languages and ZZP passport. Phone and e-mail only if you accept an invitation.",
    catalogOn: "Show me to companies",
    catalogOff: "Hide me from the catalog",
    catalogIsOn: "✓ You are in the catalog: companies can invite you",
    catalogBanner: "Let companies find you: turn on «Looking for work»",
    catalogUntil: "Companies see you until {d}. Then your card switches off by itself.",
    catalogExtend: "Extend by 30 days",
    pushInviteTitle: "A company invites you",
    pushInviteBody: "{company} invites you to work. Open Haaks to accept or decline.",
    reply: "Reply",
    hint: "The company sees your profile and ZZP passport. Phone and e-mail open for both sides when the company accepts your reply.",
    sent: "You replied · waiting for the company",
    accepted: "The company accepted your reply",
    declined: "The company chose someone else",
    closed: "Job closed",
    myTitle: "My replies",
    myEmpty: "No replies yet. You can reply to jobs in «🏢 Companies looking».",
    myLink: "My replies",
    contacts: "Company contacts",
    call: "Call",
    write: "Write",
    pushTitle: "You got the job!",
    pushBody: "{company} accepted your reply: {job}. Open the contacts in Haaks.",
    open: "Open",
    errClosed: "This job is already closed.",
    errLocked: "Open the card first.",
  },
  nl: {
    pageTitle: "Reacties en uitnodigingen",
    invitesTitle: "Uitnodigingen van bedrijven",
    invite: "{company} nodigt je uit voor werk",
    inviteJob: "Opdracht: {job}",
    acceptInvite: "Accepteren",
    declineInvite: "Afwijzen",
    inviteAccepted: "Je hebt de uitnodiging geaccepteerd",
    inviteDeclined: "Je hebt de uitnodiging afgewezen",
    catalogTitle: "Ik zoek werk",
    catalogText: "Laat je profiel zien aan bedrijven (BV) in de Haaks-catalogus. Bedrijven zien je naam, vak, plaats, tarief, talen en ZZP-paspoort. Telefoon en e-mail alleen als je een uitnodiging accepteert.",
    catalogOn: "Laat mij zien aan bedrijven",
    catalogOff: "Verberg mij uit de catalogus",
    catalogIsOn: "✓ Je staat in de catalogus: bedrijven kunnen je uitnodigen",
    catalogBanner: "Laat bedrijven jou vinden: zet «Ik zoek werk» aan",
    catalogUntil: "Bedrijven zien je tot {d}. Daarna gaat je kaart vanzelf uit.",
    catalogExtend: "Verlengen met 30 dagen",
    pushInviteTitle: "Een bedrijf nodigt je uit",
    pushInviteBody: "{company} nodigt je uit voor werk. Open Haaks om te accepteren of af te wijzen.",
    reply: "Reageren",
    hint: "Het bedrijf ziet je profiel en ZZP-paspoort. Telefoon en e-mail gaan voor beide kanten open als het bedrijf je reactie accepteert.",
    sent: "Je hebt gereageerd · wacht op het bedrijf",
    accepted: "Het bedrijf heeft je reactie geaccepteerd",
    declined: "Het bedrijf heeft iemand anders gekozen",
    closed: "Opdracht gesloten",
    myTitle: "Mijn reacties",
    myEmpty: "Nog geen reacties. Je kunt reageren op opdrachten in «🏢 Bedrijven zoeken».",
    myLink: "Mijn reacties",
    contacts: "Contact van het bedrijf",
    call: "Bellen",
    write: "Mailen",
    pushTitle: "Je bent aangenomen voor een opdracht!",
    pushBody: "{company} heeft je reactie geaccepteerd: {job}. Bekijk het contact in Haaks.",
    open: "Openen",
    errClosed: "Deze opdracht is al gesloten.",
    errLocked: "Open eerst de kaart.",
  },
} satisfies Record<Lang, Record<string, string>>;

export type ReplyDict = (typeof TEXT)["ru"];
export const getReplyDict = (lang: Lang): ReplyDict => TEXT[lang] ?? TEXT.en;

const put = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// Tells the builder their reply was accepted: push to the phone and Telegram, where set up.
export async function notifyReplyAccepted(server: SupabaseClient, replyId: string, siteUrl: string) {
  const { data: reply } = await server.from("job_replies").select("worker_id, job_id").eq("id", replyId).single();
  if (!reply) return;
  const [{ data: worker }, { data: job }] = await Promise.all([
    server.from("profiles").select("language, telegram_chat_id").eq("id", reply.worker_id).single(),
    server.from("company_jobs").select("title, company_id").eq("id", reply.job_id).single(),
  ]);
  if (!worker || !job) return;
  const { data: company } = await server.from("profiles").select("company_name, full_name, account_type").eq("id", job.company_id).single();
  const t = getReplyDict((worker.language as Lang) ?? "en");
  // A builder who needs a helper is named "ZZP · Ivan P.".
  const poster = company?.account_type === "worker" ? `ZZP · ${shortName(company.full_name)}` : (company?.company_name ?? "Bedrijf");
  const body = put(t.pushBody, { company: poster, job: job.title });
  const url = `${siteUrl}/dashboard/replies`;

  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", reply.worker_id)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title: t.pushTitle, body, url: "/dashboard/replies", tag: `reply-${replyId}` });
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && worker.telegram_chat_id) {
    await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(t.pushTitle)}</b>\n${esc(body)}`, { text: t.open, url });
  }
}

// Tells the builder a company invited them: push to the phone and Telegram, where set up.
export async function notifyInvite(server: SupabaseClient, inviteId: string, siteUrl: string) {
  const { data: invite } = await server.from("company_invites").select("worker_id, company_id").eq("id", inviteId).single();
  if (!invite) return;
  const [{ data: worker }, { data: company }] = await Promise.all([
    server.from("profiles").select("language, telegram_chat_id").eq("id", invite.worker_id).single(),
    server.from("profiles").select("company_name").eq("id", invite.company_id).single(),
  ]);
  if (!worker) return;
  const t = getReplyDict((worker.language as Lang) ?? "en");
  const body = put(t.pushInviteBody, { company: company?.company_name ?? "Bedrijf" });
  if (pushEnabled()) {
    const { data: subs } = await server
      .from("push_subscriptions")
      .select("endpoint, user_id, p256dh, auth")
      .eq("user_id", invite.worker_id)
      .returns<PushSubscriptionRow[]>();
    for (const sub of subs ?? []) {
      const result = await sendPush(sub, { title: t.pushInviteTitle, body, url: "/dashboard/replies", tag: `invite-${inviteId}` });
      if (result.gone) await server.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
  if (telegramEnabled() && worker.telegram_chat_id) {
    await sendTelegram(Number(worker.telegram_chat_id), `<b>${esc(t.pushInviteTitle)}</b>\n${esc(body)}`, {
      text: t.open,
      url: `${siteUrl}/dashboard/replies`,
    });
  }
}
