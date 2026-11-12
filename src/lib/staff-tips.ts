import type { SupabaseClient } from "@supabase/supabase-js";
import { DOC_TYPES, docStatus, type DocType } from "@/lib/documents";
import { getDict, isLang, type Lang } from "@/lib/i18n";
import { planOf } from "@/lib/plans";
import { pushEnabled, sendPush, type PushSubscriptionRow } from "@/lib/push";
import { addDays, dutchToday } from "@/lib/quotes";
import { getStaffProfileDict } from "@/lib/staff-profile-i18n";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

// Step 5 of «Сотрудник сам заполняет данные»: once a day the employee suggests what to do,
// only from facts in Haaks, each with a button that asks the employee to do it. No AI call.
export type StaffTip = { text: string; button: string; ask: string };
export type StaffTips = { type: "tips"; items: StaffTip[] };

type T = { hello: string; push: string; doc: string; docBtn: string; docAsk: string; hours: string; hoursBtn: string; hoursAsk: string; overdue: string; overdueBtn: string; overdueAsk: string; profile: string; profileBtn: string; profileAsk: string; off: string };

const TEXTS: Record<Lang, T> = {
  ru: {
    hello: "Доброе утро! Что можно сделать сегодня:", push: "Сотрудник: дела на сегодня",
    doc: "В ZZP-паспорте нет: {doc}. Пришлите фото, я сам всё заполню.", docBtn: "📎 Добавить в паспорт", docAsk: "Хочу добавить в паспорт: {doc}.",
    hours: "По заказу «{title}» {h} ч ещё не в счёте. Сделать черновик счёта?", hoursBtn: "💶 Сделать счёт", hoursAsk: "Сделай счёт по заказу «{title}».",
    overdue: "Счёт {num} ({client}) просрочен на {days} дн. Подготовить вежливое напоминание клиенту?", overdueBtn: "✉️ Подготовить напоминание", overdueAsk: "Подготовь вежливое напоминание на нидерландском клиенту {client} по счёту {num}.",
    profile: "Для счетов в профиле не хватает: {fields}. Скажите их, я заполню.", profileBtn: "✍️ Заполнить", profileAsk: "Хочу заполнить в профиле: {fields}.",
    off: "Выключить эти подсказки можно в настройках сотрудника.",
  },
  uk: {
    hello: "Доброго ранку! Що можна зробити сьогодні:", push: "Співробітник: справи на сьогодні",
    doc: "У ZZP-паспорті немає: {doc}. Надішліть фото, я сам усе заповню.", docBtn: "📎 Додати в паспорт", docAsk: "Хочу додати в паспорт: {doc}.",
    hours: "За замовленням «{title}» {h} год ще не в рахунку. Зробити чернетку рахунку?", hoursBtn: "💶 Зробити рахунок", hoursAsk: "Зроби рахунок за замовленням «{title}».",
    overdue: "Рахунок {num} ({client}) прострочено на {days} дн. Підготувати ввічливе нагадування клієнту?", overdueBtn: "✉️ Підготувати нагадування", overdueAsk: "Підготуй ввічливе нагадування нідерландською клієнту {client} за рахунком {num}.",
    profile: "Для рахунків у профілі бракує: {fields}. Скажіть їх, я заповню.", profileBtn: "✍️ Заповнити", profileAsk: "Хочу заповнити в профілі: {fields}.",
    off: "Вимкнути ці підказки можна в налаштуваннях співробітника.",
  },
  pl: {
    hello: "Dzień dobry! Co można dziś zrobić:", push: "Asystent: sprawy na dziś",
    doc: "W paszporcie ZZP brakuje: {doc}. Wyślij zdjęcie, wszystko uzupełnię.", docBtn: "📎 Dodaj do paszportu", docAsk: "Chcę dodać do paszportu: {doc}.",
    hours: "Przy zleceniu «{title}» {h} godz. nie jest jeszcze na fakturze. Zrobić szkic faktury?", hoursBtn: "💶 Zrób fakturę", hoursAsk: "Zrób fakturę za zlecenie «{title}».",
    overdue: "Faktura {num} ({client}) jest {days} dni po terminie. Przygotować uprzejme przypomnienie dla klienta?", overdueBtn: "✉️ Przygotuj przypomnienie", overdueAsk: "Przygotuj uprzejme przypomnienie po niderlandzku dla klienta {client} w sprawie faktury {num}.",
    profile: "Do faktur w profilu brakuje: {fields}. Podaj je, uzupełnię.", profileBtn: "✍️ Uzupełnij", profileAsk: "Chcę uzupełnić w profilu: {fields}.",
    off: "Te podpowiedzi można wyłączyć w ustawieniach asystenta.",
  },
  ro: {
    hello: "Bună dimineața! Ce se poate face azi:", push: "Asistentul: treburi pentru azi",
    doc: "În pașaportul ZZP lipsește: {doc}. Trimite o poză, completez eu totul.", docBtn: "📎 Adaugă în pașaport", docAsk: "Vreau să adaug în pașaport: {doc}.",
    hours: "La comanda «{title}» {h} ore nu sunt încă facturate. Fac o ciornă de factură?", hoursBtn: "💶 Fă factura", hoursAsk: "Fă factura pentru comanda «{title}».",
    overdue: "Factura {num} ({client}) este întârziată cu {days} zile. Pregătesc o amintire politicoasă pentru client?", overdueBtn: "✉️ Pregătește amintirea", overdueAsk: "Pregătește o amintire politicoasă în neerlandeză pentru clientul {client} despre factura {num}.",
    profile: "Pentru facturi, în profil lipsește: {fields}. Spune-mi-le și completez.", profileBtn: "✍️ Completează", profileAsk: "Vreau să completez în profil: {fields}.",
    off: "Poți opri aceste sugestii în setările asistentului.",
  },
  tr: {
    hello: "Günaydın! Bugün yapılabilecekler:", push: "Asistan: bugünün işleri",
    doc: "ZZP pasaportunda eksik: {doc}. Fotoğrafını gönderin, gerisini ben doldururum.", docBtn: "📎 Pasaporta ekle", docAsk: "Pasaporta eklemek istiyorum: {doc}.",
    hours: "«{title}» işinde {h} saat henüz faturada değil. Fatura taslağı hazırlayayım mı?", hoursBtn: "💶 Fatura yap", hoursAsk: "«{title}» işi için fatura yap.",
    overdue: "{num} numaralı fatura ({client}) {days} gün gecikti. Müşteriye kibar bir hatırlatma hazırlayayım mı?", overdueBtn: "✉️ Hatırlatma hazırla", overdueAsk: "{client} müşterisine {num} numaralı fatura için Hollandaca kibar bir hatırlatma hazırla.",
    profile: "Faturalar için profilde eksik: {fields}. Söyleyin, dolduruyum.", profileBtn: "✍️ Doldur", profileAsk: "Profilde doldurmak istiyorum: {fields}.",
    off: "Bu önerileri asistan ayarlarından kapatabilirsiniz.",
  },
  en: {
    hello: "Good morning! What you can do today:", push: "Assistant: today's to-dos",
    doc: "Your ZZP passport is missing: {doc}. Send a photo and I'll fill it in.", docBtn: "📎 Add to passport", docAsk: "I want to add to my passport: {doc}.",
    hours: "Order «{title}» has {h} h not invoiced yet. Make a draft invoice?", hoursBtn: "💶 Make invoice", hoursAsk: "Make an invoice for order «{title}».",
    overdue: "Invoice {num} ({client}) is {days} days overdue. Prepare a polite reminder for the client?", overdueBtn: "✉️ Prepare reminder", overdueAsk: "Prepare a polite reminder in Dutch for client {client} about invoice {num}.",
    profile: "For invoices your profile is missing: {fields}. Tell me and I'll fill them in.", profileBtn: "✍️ Fill in", profileAsk: "I want to fill in my profile: {fields}.",
    off: "You can turn these tips off in the assistant settings.",
  },
  nl: {
    hello: "Goedemorgen! Wat je vandaag kunt doen:", push: "Assistent: taken voor vandaag",
    doc: "In je ZZP-paspoort ontbreekt: {doc}. Stuur een foto, dan vul ik het in.", docBtn: "📎 Toevoegen aan paspoort", docAsk: "Ik wil aan mijn paspoort toevoegen: {doc}.",
    hours: "Bij klus «{title}» staan {h} uur nog niet op een factuur. Conceptfactuur maken?", hoursBtn: "💶 Factuur maken", hoursAsk: "Maak een factuur voor klus «{title}».",
    overdue: "Factuur {num} ({client}) is {days} dagen te laat. Een vriendelijke herinnering voor de klant klaarzetten?", overdueBtn: "✉️ Herinnering klaarzetten", overdueAsk: "Zet een vriendelijke herinnering in het Nederlands klaar voor klant {client} over factuur {num}.",
    profile: "Voor facturen ontbreekt in je profiel: {fields}. Noem ze, dan vul ik ze in.", profileBtn: "✍️ Invullen", profileAsk: "Ik wil in mijn profiel invullen: {fields}.",
    off: "Je kunt deze tips uitzetten in de instellingen van je assistent.",
  },
};

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const MAX_TIPS = 3;
const REPEAT_DAYS = 7;

type Person = { id: string; plan: string | null; plan_until: string | null; language: string | null; staff_lang: string | null; telegram_chat_id: number | string | null; iban: string | null; kvk_number: string | null; business_address: string | null };

// The suggestions for one worker, most useful first, with a key each (to not repeat them).
export function buildTips(
  lang: Lang,
  p: Pick<Person, "iban" | "kvk_number" | "business_address">,
  docs: { doc_type: string; issued_on: string | null; expires_on: string | null }[],
  orders: { id: string; title: string; hours: number; last: string }[],
  overdue: { id: string; number: string; client_name: string | null; due_date: string }[],
  today: string,
): (StaffTip & { key: string })[] {
  const t = TEXTS[lang] ?? TEXTS.en;
  const dict = getDict(lang);
  const fields = getStaffProfileDict(lang).fields;
  const tips: (StaffTip & { key: string })[] = [];
  const daysSince = (d: string) => Math.round((Date.parse(today) - Date.parse(d)) / 86400000);
  for (const inv of overdue) {
    const v = { num: inv.number, client: inv.client_name ?? "?", days: daysSince(inv.due_date) };
    tips.push({ key: `overdue:${inv.id}`, text: fill(t.overdue, v), button: t.overdueBtn, ask: fill(t.overdueAsk, v) });
  }
  for (const o of orders) {
    const v = { title: o.title, h: o.hours };
    tips.push({ key: `hours:${o.id}`, text: fill(t.hours, v), button: t.hoursBtn, ask: fill(t.hoursAsk, v) });
  }
  const missingFields = (["iban", "kvk_number", "business_address"] as const).filter((f) => !p[f]);
  if (missingFields.length) {
    const v = { fields: missingFields.map((f) => fields[f as keyof typeof fields] ?? f).join(", ") };
    tips.push({ key: `profile:${missingFields.join(",")}`, text: fill(t.profile, v), button: t.profileBtn, ask: fill(t.profileAsk, v) });
  }
  for (const type of ["kvk_extract", "vca", "avb"] as const) {
    const ok = docs.some((d) => d.doc_type === type && docStatus(d as { doc_type: DocType; issued_on: string | null; expires_on: string | null }) !== "expired");
    if (ok || !(DOC_TYPES as readonly string[]).includes(type)) continue;
    const v = { doc: dict[`docType_${type}`] };
    tips.push({ key: `doc:${type}`, text: fill(t.doc, v), button: fill(t.docBtn, v), ask: fill(t.docAsk, v) });
  }
  return tips;
}

// Daily run (cron): one chat message with up to 3 fresh suggestions per Ultra worker, plus a push
// and a Telegram line. A suggestion is not repeated within a week.
export async function runStaffTips(server: SupabaseClient, site: string) {
  const { data: people, error } = await server
    .from("profiles")
    .select("id, plan, plan_until, language, staff_lang, telegram_chat_id, iban, kvk_number, business_address")
    .eq("plan", "ultra")
    .eq("staff_tips", true)
    .limit(1000)
    .returns<Person[]>();
  if (error) throw new Error(error.message);
  const workers = (people ?? []).filter((p) => planOf(p) === "ultra");
  if (!workers.length) return { tips: 0 };
  const ids = workers.map((p) => p.id);
  const today = dutchToday();
  const quiet = addDays(-5);
  const [{ data: docs }, { data: orders }, { data: hours }, { data: invoices }, { data: sent }, { data: subs }] = await Promise.all([
    server.from("documents").select("user_id, doc_type, issued_on, expires_on").in("user_id", ids),
    server.from("orders").select("id, user_id, title").in("user_id", ids).eq("status", "open"),
    server.from("order_hours").select("order_id, hours, work_date").in("user_id", ids).is("invoice_id", null),
    server.from("invoices").select("id, user_id, number, client_name, due_date").in("user_id", ids).eq("status", "sent").lt("due_date", addDays(-3)),
    server.from("staff_tips_sent").select("user_id, key, sent_at").in("user_id", ids).gte("sent_at", new Date(Date.now() - REPEAT_DAYS * 86400000).toISOString()),
    pushEnabled() ? server.from("push_subscriptions").select("endpoint, user_id, p256dh, auth").in("user_id", ids).returns<PushSubscriptionRow[]>() : Promise.resolve({ data: [] as PushSubscriptionRow[] }),
  ]);
  const recent = new Set((sent ?? []).map((s) => `${s.user_id}|${s.key}`));
  let total = 0;
  for (const p of workers) {
    const lang: Lang = isLang(p.staff_lang) ? p.staff_lang : isLang(p.language) ? p.language : "en";
    // Open orders whose unbilled hours have not grown for 5 days: the job is probably done.
    const myOrders = (orders ?? []).filter((o) => o.user_id === p.id).flatMap((o) => {
      const rows = (hours ?? []).filter((h) => h.order_id === o.id);
      const sum = rows.reduce((s, h) => s + Number(h.hours), 0);
      const last = rows.map((h) => h.work_date as string).sort().pop();
      return sum >= 1 && last && last <= quiet ? [{ id: o.id as string, title: o.title as string, hours: sum, last }] : [];
    });
    const tips = buildTips(
      lang,
      p,
      (docs ?? []).filter((d) => d.user_id === p.id),
      myOrders,
      (invoices ?? []).filter((i) => i.user_id === p.id && i.due_date),
      today,
    )
      .filter((tip) => !recent.has(`${p.id}|${tip.key}`))
      .slice(0, MAX_TIPS);
    if (!tips.length) continue;
    const t = TEXTS[lang] ?? TEXTS.en;
    const body = [t.hello, ...tips.map((tip) => `• ${tip.text}`), "", `${t.off} /dashboard/staff/settings#tips`].join("\n");
    const { error: insertError } = await server
      .from("staff_messages")
      .insert({ user_id: p.id, role: "staff", body, action: { type: "tips", items: tips.map(({ text, button, ask }) => ({ text, button, ask })) } satisfies StaffTips });
    if (insertError) {
      console.error("staff tips: insert failed", insertError.message);
      continue;
    }
    await server.from("staff_tips_sent").upsert(tips.map((tip) => ({ user_id: p.id, key: tip.key, sent_at: new Date().toISOString() })));
    const preview = tips.map((tip) => tip.text).join("\n");
    for (const sub of (subs ?? []).filter((s) => s.user_id === p.id)) {
      await sendPush(sub, { title: t.push, body: preview.slice(0, 180), url: "/dashboard/staff", tag: `staff-tips-${today}` }).catch(() => null);
    }
    if (telegramEnabled() && p.telegram_chat_id) {
      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      await sendTelegram(Number(p.telegram_chat_id), `<b>${t.push}</b>\n${esc(preview)}`, { text: "Haaks", url: `${site}/dashboard/staff` }).catch(() => null);
    }
    total++;
  }
  return { tips: total };
}

// The switch in the employee settings.
export const TIPS_LABEL: Record<Lang, { title: string; on: string }> = {
  ru: { title: "Подсказки каждый день", on: "Утром предлагать дела: счета, паспорт, профиль" },
  uk: { title: "Підказки щодня", on: "Зранку пропонувати справи: рахунки, паспорт, профіль" },
  pl: { title: "Podpowiedzi codziennie", on: "Rano proponuj sprawy: faktury, paszport, profil" },
  ro: { title: "Sugestii zilnice", on: "Dimineața propune treburi: facturi, pașaport, profil" },
  tr: { title: "Günlük öneriler", on: "Sabahları işler öner: faturalar, pasaport, profil" },
  en: { title: "Daily tips", on: "Suggest to-dos every morning: invoices, passport, profile" },
  nl: { title: "Dagelijkse tips", on: "Elke ochtend taken voorstellen: facturen, paspoort, profiel" },
};
