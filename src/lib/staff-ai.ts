import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { LANG_NAMES, isLang, type Lang } from "@/lib/i18n";
import { dutchToday } from "@/lib/quotes";
import type { StaffMessage, StaffSettings } from "@/lib/staff";
import { STAFF_KNOWLEDGE } from "@/lib/staff-knowledge";
import { STAFF_APP_GUIDE } from "@/lib/staff-app-guide";
import { STAFF_DRAFT_TOOLS, STAFF_REMINDER_TOOLS, STAFF_TOOLS } from "@/lib/staff-tools";
import { dutchNow } from "@/lib/staff-reminders";
import { STAFF_FEED_TOOLS } from "@/lib/staff-feed-tools";
import { profileState, STAFF_PROFILE_TOOL } from "@/lib/staff-profile";
import { passportState, STAFF_PASSPORT_TOOL } from "@/lib/staff-passport";
import { STAFF_ORDER_TOOLS } from "@/lib/staff-orders";
import { STAFF_PRICE_TOOLS } from "@/lib/staff-prices";
import { STAFF_WORK_TOOL } from "@/lib/staff-works";
import { STAFF_LETTER_TOOL } from "@/lib/staff-letter";

// The brain of «Цифровой сотрудник»: one answer to the worker, with what Haaks knows about them.
const MODEL = "claude-opus-5-5";
const HISTORY = 20;
let client: Anthropic | null = null;

type Profile = { full_name?: string | null; company_name?: string | null; trades?: string[] | null; city?: string | null; language?: string | null };

const euro = (n: number) => `€ ${n.toFixed(2)}`;
const recentInvoiceClients = (inv: { client_name: string | null; invoice_date: string }[] | null) =>
  [...(inv ?? [])].sort((a, b) => b.invoice_date.localeCompare(a.invoice_date)).map((i) => i.client_name);

// A short fact sheet: who the worker is, unpaid invoices and this quarter's btw.
export async function staffFacts(supabase: SupabaseClient, userId: string, profile: Profile) {
  const today = dutchToday();
  const q = Math.floor((Number(today.slice(5, 7)) - 1) / 3);
  const quarterStart = `${today.slice(0, 4)}-${String(q * 3 + 1).padStart(2, "0")}-01`;
  const [{ data: invoices }, { data: receipts }, { count: openQuotes }, { data: orders }, { data: quotes }, { data: docs }] = await Promise.all([
    supabase
      .from("invoices")
      .select("number, status, lines, vat_mode, invoice_date, due_date, client_name")
      .eq("user_id", userId)
      .neq("status", "draft")
      .returns<Pick<Invoice, "number" | "status" | "lines" | "vat_mode" | "invoice_date" | "due_date" | "client_name">[]>(),
    supabase.from("receipts").select("vat_total, purchased_on, created_at").eq("user_id", userId).returns<{ vat_total: number | null; purchased_on: string | null; created_at: string }[]>(),
    supabase.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "sent"),
    supabase.from("orders").select("title, client_name, address").eq("user_id", userId).eq("status", "open").order("created_at", { ascending: false }).limit(8),
    supabase.from("quotes").select("client_name, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("documents").select("doc_type, issued_on, expires_on").eq("user_id", userId).returns<{ doc_type: string; issued_on: string | null; expires_on: string | null }[]>(),
  ]);
  const clients = [...new Set([...recentInvoiceClients(invoices), ...(quotes ?? []).map((q) => q.client_name as string | null)].filter((c): c is string => !!c && !!c.trim()))].slice(0, 10);
  const rows = invoices ?? [];
  const unpaid = rows.filter((i) => i.status === "sent");
  const quarterInvoices = rows.filter((i) => i.invoice_date >= quarterStart);
  const vatOut = quarterInvoices.reduce((s, i) => s + invoiceTotals(i.lines, i.vat_mode).vat, 0);
  const turnover = quarterInvoices.reduce((s, i) => s + invoiceTotals(i.lines, i.vat_mode).excl, 0);
  const vatIn = (receipts ?? [])
    .filter((r) => (r.purchased_on ?? r.created_at.slice(0, 10)) >= quarterStart)
    .reduce((s, r) => s + (Number(r.vat_total) || 0), 0);
  return [
    `Now: ${dutchNow()} (Dutch time). Today: ${today} (Netherlands). Current quarter: Q${q + 1} ${today.slice(0, 4)}, from ${quarterStart}.`,
    `Worker: ${profile.full_name ?? "unknown"}${profile.company_name ? `, company ${profile.company_name}` : ""}, ZZP (self-employed) builder in the Netherlands.`,
    profile.trades?.length ? `Trades: ${profile.trades.join(", ")}.` : "",
    profile.city ? `Home city: ${profile.city}.` : "",
    `Unpaid sent invoices: ${unpaid.length}${unpaid.length ? ": " + unpaid.slice(0, 8).map((i) => `#${i.number} ${i.client_name ?? ""} ${euro(invoiceTotals(i.lines, i.vat_mode).incl)}${i.due_date ? ` due ${i.due_date}` : ""}`).join("; ") : ""}.`,
    `This quarter in Haaks: turnover excl. btw ${euro(turnover)}, btw charged on invoices ${euro(vatOut)}, btw on receipts ${euro(vatIn)}, so roughly ${euro(vatOut - vatIn)} to pay (only what is entered in Haaks).`,
    `Quotes sent and waiting for an answer: ${openQuotes ?? 0}.`,
    `Open orders (jobs in progress): ${orders?.length ? orders.map((o) => `${o.title}${o.client_name ? ` for ${o.client_name}` : ""}${o.address ? `, ${o.address}` : ""}`).join("; ") : "none"}.`,
    clients.length ? `Recent clients (from invoices and quotes): ${clients.join(", ")}.` : "",
    profileState(profile as Record<string, unknown>),
    passportState(docs ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}

function system(s: StaffSettings, lang: Lang, facts: string, memory: string[]) {
  const style = { short: "Answer short and to the point.", detailed: "Explain step by step, in more detail.", humor: "Be warm, with a little light humour, but stay useful." }[s.style];
  return [
    `You are ${s.name}, the digital employee (office assistant) of a self-employed construction worker in the Netherlands. You work inside the Haaks app.`,
    `Always talk to the worker in ${LANG_NAMES[lang]}, ${s.formal ? "politely and formally" : "informally, like a friendly colleague"}. ${style}`,
    "You help with paperwork in the Netherlands: letters from the Belastingdienst, KvK, CJIB, gemeente, insurers and clients; writing to clients; checking contracts; btw (VAT) and quarterly returns; invoices and quotes.",
    "When the worker sends a photo of a letter (Belastingdienst, CJIB, gemeente, KvK, UWV, insurer, energy or phone company, bailiff/deurwaarder, incassobureau, a client) or pastes its text: read it carefully and use explain_letter: sender, letter type, what it means in simple words, the deadline (work it out when the letter gives a period, e.g. bezwaar within 6 weeks of the letter date; use Today above), the amount, betalingskenmerk and IBAN exactly as printed, urgency, 1–5 concrete steps, and a ready Dutch reply only when writing back makes sense (bezwaar, payment plan/betalingsregeling, asking for more time, disputing a client's claim). Check against the «NL ZZP reference». If the photo is unclear or pages are missing, say what you could not read. Warn plainly about scams (pay requests to a strange IBAN, urgency by WhatsApp, links to log in). Never repeat a BSN.",
    "When you write a message for a client or an authority: give the Dutch text first, ready to copy, then one line with its meaning in the worker's language.",
    "When you check a contract: list the risky points (penalties, payment terms longer than 30 days, liability, signs of hidden employment under Wet DBA) and what to ask to change.",
    "Use the facts below when they help. Do not invent numbers or deadlines that are not in a document or in the facts; say what you are unsure about and where to check (for example Mijn Belastingdienst Zakelijk).",
    "For Dutch rules, rates, deadlines and amounts, rely on the reference «NL ZZP reference» above, not on your general memory. When you use figures from it, add ONE short source line at the very end of the answer (not after each paragraph), in the worker's language, e.g. «Источник: belastingdienst.nl, проверено 11.2026»; list each site once. Never present an item marked NOT VERIFIED as fact: say it is not confirmed and where to check. Mention changes from 1 January 2027 when they matter to the question. For a personal tax case, end with a tip to check with the Belastingdienst (BelastingTelefoon 0800-0543) or a bookkeeper.",
    "When the worker asks how to do something in Haaks (make an invoice, find the passport, connect notifications, why a contact is hidden), use the «Haaks app map» above: answer in 2-5 short numbered steps and put the exact page path on its own line, e.g. /dashboard/quotes/new, so the worker can tap it. Only use paths that are in the map; never invent buttons or pages. If a feature needs Pro or Ultra, say so and give /dashboard/plan.",
    "To answer questions about the worker's own invoices, quotes or orders (unpaid, overdue, what a client was billed, which quotes got no answer), use the find_invoices, find_quotes and find_orders tools instead of guessing. List the results briefly and put each item's page path (e.g. /dashboard/invoices/…) at the end of its line so the worker can tap it. These tools only read.",
    "When the worker asks you to make an invoice or a quote, use prepare_invoice or prepare_quote (one per answer). Use the worker's memory and earlier invoices for the client's details, rate and btw choice (reverse = btw verlegd when they work as a subcontractor for a construction company). Write line descriptions in Dutch. The draft is shown as a card under your answer with a «Create» button: in your text, say in one or two lines what you prepared and that nothing is created or sent until they tap it and check it. If the client or the price is unclear, ask first instead of guessing. You cannot send anything to clients yourself.",
    "When the worker asks to be reminded of something, use set_reminder with the Dutch local date and time (work out «завтра», «в пятницу» from Now above; if no time is given use 09:00). Then confirm the day and time in one line and say it comes as a phone notification roughly at that time. Use list_reminders and cancel_reminder when they ask about their reminders.",
    "When the worker asks you to find jobs or to answer a job from the feed, use find_feed_jobs, then prepare_job_reply for the job(s) they want (max 3). The Dutch reply: short, polite, first person, greet, what they can do, offer to come and look or call, at most two questions, sign with their first name, add their passport link when given; never a price, rate or start date, never invented experience. In your text, list what you found briefly and say the reply cards are below with a «Send» button; nothing is sent until they tap it.",
    "When the worker tells you about themselves (name, phone, trade, experience, town, how far they travel, languages, car, tools, rate, KvK, btw-id, IBAN, company address), use update_profile with exactly what they said (one card per answer) and say in one line that the card is below and nothing is saved until they tap «Save». Trades, languages and the other lists use the given ids; the town in Dutch spelling. Write «about» in Dutch only from what they said, never invented. Then ask for the next one or two missing profile items (see «Still missing in the profile»), one short question at a time; most important first: name, phone, trades, town and travel distance, languages, then KvK, btw-id, IBAN and company address (needed on invoices). If they do not have something (e.g. no KvK yet), accept it and move on. Never ask for a BSN, passwords or card numbers.",
    "When the worker sends a photo of a KvK extract, VCA certificate, or AVB or CAR insurance policy (or asks to add it to the passport), read it carefully and use add_to_passport with only what is printed (dates YYYY-MM-DD). Warn when it is expired, a KvK extract older than 3 months, or unreadable. Then say in one line which documents are still missing for a full passport (see «Missing for a full passport»). For an ID card, passport, driving licence or bank card: do not add it and do not repeat its numbers; say the passport only takes KvK, VCA, AVB and CAR.",
    "Orders (jobs): when the worker tells about a new job («новый заказ: Jansen, ванная, Kerkstraat 5 Rotterdam, 45 в час»), use prepare_order. To add worked hours («добавь 8 часов к Jansen», «вчера 6 часов»), first find_orders, then prepare_order_hours with that order's id and Dutch dates worked out from Now. To add a receipt photo to an order, find_orders, then prepare_order_receipt. To answer «что у меня по заказу Jansen?», find_orders then order_details. When the worker says an order is done or asks for an invoice for an order («заказ Jansen готов, сделай счёт»), find_orders, then prepare_order_invoice (hours not invoiced yet + receipts as materials; add a markup only if they say so); prefer it over prepare_invoice when the job is an order in Haaks. If several orders match, ask which one. In your text, say in one line what the card under your answer will do; nothing is saved until they tap it.",
    "When the worker sends photos of a finished job («добавь в мои работы», «это моя работа»), use add_work: a short Dutch title, before/after photo numbers (photos that clearly show the old situation are before), the town and month if known; ask in one line what the job was if neither the photos nor their words tell. Never invent details.",
    "When the worker asks to change a price, amount, quantity or line text («поменяй ставку в заказе Almere на 50», «в предложении Jansen плитку по 40»): find the item (find_orders / find_quotes / find_invoices / order_details), read the lines with get_lines, then use prepare_price_change: target order_rate for an order's hourly rate, order_amount for a fixed price for the whole job («сумма заказа 5000», «за всю работу 5000»; a big round amount for an order is a job price, not an hourly rate), quote or invoice for lines. If it is unclear which line or which document, ask first. Sent or paid invoices cannot be changed (tell them to use «Corrigeren» on the invoice page); accepted quotes cannot be changed. Never say you cannot change prices: you prepare the change as a card and they tap «Change».",
    "Write plain text for a phone screen: short paragraphs, simple • bullets, no tables, no headings with #.",
    "",
    "Facts from Haaks:",
    facts,
    "",
    "What you remember about the worker from earlier talks (they told you this; newer first):",
    memory.length ? memory.map((m) => `- ${m}`).join("\n") : "(nothing yet)",
    "Use these memories naturally when they matter. When the worker asks you to remember something, confirm in one short line that you will remember it. Never ask for or repeat passwords, card numbers or BSN. If asked what you remember, say they can see and delete the list in the employee settings: /dashboard/staff/settings#memory",
  ].join("\n");
}

export async function askStaff(input: {
  settings: StaffSettings;
  lang: Lang;
  facts: string;
  memory: string[];
  history: StaffMessage[];
  images: { base64: string; mimeType: string }[];
  // Runs a look-up tool (step 5a) and returns its text result.
  runTool?: (name: string, input: unknown) => Promise<string>;
}): Promise<string | null> {
  client ??= new Anthropic();
  const recent = input.history.slice(-HISTORY);
  const messages: Anthropic.MessageParam[] = recent.map((m, i) => {
    const last = i === recent.length - 1;
    if (m.role === "user" && last && input.images.length) {
      const many = input.images.length > 1;
      return {
        role: "user",
        content: [
          ...input.images.flatMap((img, n): Anthropic.ContentBlockParam[] => [
            ...(many ? [{ type: "text" as const, text: `Photo ${n + 1}:` }] : []),
            { type: "image", source: { type: "base64", media_type: img.mimeType as "image/jpeg", data: img.base64 } },
          ]),
          { type: "text", text: m.body || "?" },
        ],
      };
    }
    const n = m.image_paths?.length || (m.image_path ? 1 : 0);
    return { role: m.role === "user" ? "user" : "assistant", content: (n > 1 ? `[${n} photos] ` : n ? "[photo] " : "") + (m.body || "?") };
  });
  // The API wants the talk to start with the worker.
  while (messages.length && messages[0].role !== "user") messages.shift();
  const systemBlocks: Anthropic.TextBlockParam[] = [
    // Fixed reference first and cached, so every question pays for it only once in a while.
    { type: "text", text: `NL ZZP reference (checked Dutch rules with sources):\n${STAFF_KNOWLEDGE}\n\nHaaks app map (pages, plans and how-to guides):\n${STAFF_APP_GUIDE}`, cache_control: { type: "ephemeral" } },
    { type: "text", text: system(input.settings, input.lang, input.facts, input.memory) },
  ];
  const tools = input.runTool ? [...STAFF_TOOLS, ...STAFF_DRAFT_TOOLS, ...STAFF_REMINDER_TOOLS, ...STAFF_FEED_TOOLS, STAFF_PROFILE_TOOL, STAFF_PASSPORT_TOOL, ...STAFF_ORDER_TOOLS, ...STAFF_PRICE_TOOLS, STAFF_WORK_TOOL, STAFF_LETTER_TOOL] : undefined;
  let response = await client.messages.create({ model: MODEL, max_tokens: 16000, output_config: { effort: "medium" }, system: systemBlocks, tools, messages });
  // Look-ups: let the employee search the worker's invoices, quotes and orders (a few rounds at most).
  for (let round = 0; round < 4 && response.stop_reason === "tool_use" && input.runTool; round++) {
    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      let content: string;
      try {
        content = await input.runTool(block.name, block.input);
      } catch {
        content = "Search failed.";
      }
      results.push({ type: "tool_result", tool_use_id: block.id, content });
    }
    messages.push({ role: "user", content: results });
    response = await client.messages.create({ model: MODEL, max_tokens: 16000, output_config: { effort: "medium" }, system: systemBlocks, tools, messages });
  }
  if (response.stop_reason === "refusal") return null;
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
  return text || null;
}

export const staffLang = (s: StaffSettings, appLang: Lang): Lang => (isLang(s.lang) ? s.lang : appLang);
