import type { SupabaseClient } from "@supabase/supabase-js";
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

const TEXT = {
  ru: {
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
  en: {
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
  const { data: company } = await server.from("profiles").select("company_name").eq("id", job.company_id).single();
  const t = getReplyDict((worker.language as Lang) ?? "en");
  const body = put(t.pushBody, { company: company?.company_name ?? "Bedrijf", job: job.title });
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
