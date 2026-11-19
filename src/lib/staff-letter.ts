import type Anthropic from "@anthropic-ai/sdk";
import { cleanDate } from "@/lib/extract";

// «Разбор письма»: the worker sends a photo of a letter (Belastingdienst, CJIB, gemeente, KvK,
// insurer, client, bailiff); the employee reads it and shows a card: who, what it means, deadline,
// amount, what to do, a ready Dutch reply, and a button to be reminded before the deadline.
export const STAFF_LETTER_TOOL: Anthropic.Tool = {
  name: "explain_letter",
  description:
    "Show a structured card for an official or business letter the worker sent a photo of (or pasted): sender, what it is, deadline, amount, urgency, the steps to take and, when a reply is needed, a ready Dutch reply. The card has a button to set a reminder before the deadline and a copy button for the reply. Use only what the letter says; null when missing. Not for KvK extracts, VCA or insurance policies meant for the passport (use add_to_passport).",
  input_schema: {
    type: "object",
    properties: {
      sender: { type: "string", description: "Who sent it, e.g. Belastingdienst, CJIB, Gemeente Rotterdam, KvK, a client's name" },
      kind: { type: "string", description: "Dutch name of the letter type as printed, e.g. «Naheffingsaanslag omzetbelasting», «Aanmaning», «Beschikking», «Herinnering»" },
      summary: { type: "string", description: "In the worker's language: 1–3 plain sentences on what the letter means for them" },
      deadline: { type: ["string", "null"], description: "YYYY-MM-DD: the date by which they must pay, reply or object (bezwaar), as printed or worked out from the letter date (e.g. 6 weeks for bezwaar); null if none" },
      deadline_what: { type: ["string", "null"], description: "In the worker's language: what must be done by the deadline (pay, object, send documents…)" },
      amount: { type: ["number", "null"], description: "Amount to pay in euros, if any" },
      payment_reference: { type: ["string", "null"], description: "Betalingskenmerk / reference to use when paying, exactly as printed" },
      pay_to: { type: ["string", "null"], description: "IBAN to pay to, exactly as printed" },
      urgency: { type: "string", enum: ["low", "medium", "high"], description: "high = fine, bailiff, short deadline or rising costs; low = information only" },
      steps: { type: "array", items: { type: "string" }, description: "In the worker's language: 1–5 short concrete steps, in order" },
      reply_nl: { type: ["string", "null"], description: "Only when a written reply, objection (bezwaar) or payment-plan request makes sense: a ready Dutch letter/e-mail text, polite and short, with placeholders like [uw naam] only where the facts are unknown" },
      reply_meaning: { type: ["string", "null"], description: "In the worker's language: one line on what the Dutch reply says" },
    },
    required: ["sender", "kind", "summary", "urgency", "steps"],
  },
};

export type StaffLetterChange = {
  type: "letter";
  sender: string;
  kind: string;
  summary: string;
  deadline: string | null;
  deadline_what: string | null;
  amount: number | null;
  payment_reference: string | null;
  pay_to: string | null;
  urgency: "low" | "medium" | "high";
  steps: string[];
  reply_nl: string | null;
  reply_meaning: string | null;
};

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const line = (v: unknown, max: number) => str(v, max)?.replace(/\s+/g, " ") ?? null;

export function toLetterChange(raw: unknown): StaffLetterChange | null {
  const a = (raw ?? {}) as Record<string, unknown>;
  const sender = line(a.sender, 120);
  const summary = str(a.summary, 800);
  if (!sender || !summary) return null;
  const amount = typeof a.amount === "number" && Number.isFinite(a.amount) && a.amount > 0 && a.amount < 10_000_000 ? Math.round(a.amount * 100) / 100 : null;
  const iban = line(a.pay_to, 40)?.replace(/\s/g, "").toUpperCase() ?? null;
  return {
    type: "letter",
    sender,
    kind: line(a.kind, 160) ?? "",
    summary,
    deadline: cleanDate(line(a.deadline, 10)),
    deadline_what: line(a.deadline_what, 200),
    amount,
    payment_reference: line(a.payment_reference, 60),
    pay_to: iban && /^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(iban) ? iban : null,
    urgency: a.urgency === "high" || a.urgency === "low" ? a.urgency : "medium",
    steps: (Array.isArray(a.steps) ? a.steps : []).flatMap((s) => (line(s, 300) ? [line(s, 300)!] : [])).slice(0, 5),
    reply_nl: str(a.reply_nl, 4000),
    reply_meaning: line(a.reply_meaning, 300),
  };
}

// When to remind: 3 days before the deadline at 09:00 Dutch time, or tomorrow 09:00 if that has passed.
export function letterReminderDay(deadline: string, today: string): string | null {
  const day = (iso: string, plus: number) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + plus);
    return d.toISOString().slice(0, 10);
  };
  const tomorrow = day(today, 1);
  if (deadline < tomorrow) return null;
  const early = day(deadline, -3);
  return early > today ? early : tomorrow;
}
