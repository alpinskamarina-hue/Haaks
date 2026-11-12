import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { invoiceTotals, type Invoice } from "@/lib/invoices";
import { LANG_NAMES, isLang, type Lang } from "@/lib/i18n";
import { dutchToday } from "@/lib/quotes";
import type { StaffMessage, StaffSettings } from "@/lib/staff";
import { STAFF_KNOWLEDGE } from "@/lib/staff-knowledge";
import { STAFF_APP_GUIDE } from "@/lib/staff-app-guide";
import { STAFF_TOOLS } from "@/lib/staff-tools";

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
  const [{ data: invoices }, { data: receipts }, { count: openQuotes }, { data: orders }, { data: quotes }] = await Promise.all([
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
    `Today: ${today} (Netherlands). Current quarter: Q${q + 1} ${today.slice(0, 4)}, from ${quarterStart}.`,
    `Worker: ${profile.full_name ?? "unknown"}${profile.company_name ? `, company ${profile.company_name}` : ""}, ZZP (self-employed) builder in the Netherlands.`,
    profile.trades?.length ? `Trades: ${profile.trades.join(", ")}.` : "",
    profile.city ? `Home city: ${profile.city}.` : "",
    `Unpaid sent invoices: ${unpaid.length}${unpaid.length ? ": " + unpaid.slice(0, 8).map((i) => `#${i.number} ${i.client_name ?? ""} ${euro(invoiceTotals(i.lines, i.vat_mode).incl)}${i.due_date ? ` due ${i.due_date}` : ""}`).join("; ") : ""}.`,
    `This quarter in Haaks: turnover excl. btw ${euro(turnover)}, btw charged on invoices ${euro(vatOut)}, btw on receipts ${euro(vatIn)}, so roughly ${euro(vatOut - vatIn)} to pay (only what is entered in Haaks).`,
    `Quotes sent and waiting for an answer: ${openQuotes ?? 0}.`,
    `Open orders (jobs in progress): ${orders?.length ? orders.map((o) => `${o.title}${o.client_name ? ` for ${o.client_name}` : ""}${o.address ? `, ${o.address}` : ""}`).join("; ") : "none"}.`,
    clients.length ? `Recent clients (from invoices and quotes): ${clients.join(", ")}.` : "",
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
    "When the worker sends a letter: say who sent it, what it means in simple words, the deadline and the amount if any, and exactly what to do. Offer a ready reply in Dutch when one is needed.",
    "When you write a message for a client or an authority: give the Dutch text first, ready to copy, then one line with its meaning in the worker's language.",
    "When you check a contract: list the risky points (penalties, payment terms longer than 30 days, liability, signs of hidden employment under Wet DBA) and what to ask to change.",
    "Use the facts below when they help. Do not invent numbers or deadlines that are not in a document or in the facts; say what you are unsure about and where to check (for example Mijn Belastingdienst Zakelijk).",
    "For Dutch rules, rates, deadlines and amounts, rely on the reference «NL ZZP reference» above, not on your general memory. When you use figures from it, add ONE short source line at the very end of the answer (not after each paragraph), in the worker's language, e.g. «Источник: belastingdienst.nl, проверено 11.2026»; list each site once. Never present an item marked NOT VERIFIED as fact: say it is not confirmed and where to check. Mention changes from 1 January 2027 when they matter to the question. For a personal tax case, end with a tip to check with the Belastingdienst (BelastingTelefoon 0800-0543) or a bookkeeper.",
    "When the worker asks how to do something in Haaks (make an invoice, find the passport, connect notifications, why a contact is hidden), use the «Haaks app map» above: answer in 2-5 short numbered steps and put the exact page path on its own line, e.g. /dashboard/quotes/new, so the worker can tap it. Only use paths that are in the map; never invent buttons or pages. If a feature needs Pro or Ultra, say so and give /dashboard/plan.",
    "To answer questions about the worker's own invoices, quotes or orders (unpaid, overdue, what a client was billed, which quotes got no answer), use the find_invoices, find_quotes and find_orders tools instead of guessing. List the results briefly and put each item's page path (e.g. /dashboard/invoices/…) at the end of its line so the worker can tap it. These tools only read; you cannot change or send anything yet.",
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
  image: { base64: string; mimeType: string } | null;
  // Runs a look-up tool (step 5a) and returns its text result.
  runTool?: (name: string, input: unknown) => Promise<string>;
}): Promise<string | null> {
  client ??= new Anthropic();
  const recent = input.history.slice(-HISTORY);
  const messages: Anthropic.MessageParam[] = recent.map((m, i) => {
    const last = i === recent.length - 1;
    if (m.role === "user" && last && input.image) {
      return {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: input.image.mimeType as "image/jpeg", data: input.image.base64 } },
          { type: "text", text: m.body || "?" },
        ],
      };
    }
    return { role: m.role === "user" ? "user" : "assistant", content: (m.image_path ? "[photo] " : "") + (m.body || "?") };
  });
  // The API wants the talk to start with the worker.
  while (messages.length && messages[0].role !== "user") messages.shift();
  const systemBlocks: Anthropic.TextBlockParam[] = [
    // Fixed reference first and cached, so every question pays for it only once in a while.
    { type: "text", text: `NL ZZP reference (checked Dutch rules with sources):\n${STAFF_KNOWLEDGE}\n\nHaaks app map (pages, plans and how-to guides):\n${STAFF_APP_GUIDE}`, cache_control: { type: "ephemeral" } },
    { type: "text", text: system(input.settings, input.lang, input.facts, input.memory) },
  ];
  const tools = input.runTool ? STAFF_TOOLS : undefined;
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
