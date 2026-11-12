import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// Long memory of «Цифровой сотрудник»: a few lasting facts about the worker, kept between talks.
const MODEL = "claude-haiku-5-5";
export const MEMORY_MAX = 50;
let client: Anthropic | null = null;

const Facts = z.object({ facts: z.array(z.string()) });

// Never keep secrets: passwords and PINs, card numbers, BSN and other long number runs.
const SECRET_WORDS = /(password|wachtwoord|парол|hasł|parol|şifre|\bpin\b|pincode|cvc|cvv|inlog|login)/i;
export function safeFact(raw: string): string | null {
  const fact = raw.replace(/\s+/g, " ").trim().slice(0, 300);
  if (fact.length < 3) return null;
  if (SECRET_WORDS.test(fact)) return null;
  if (/\d{9,}/.test(fact.replace(/[\s.\-]/g, ""))) return null;
  return fact;
}

export async function loadMemory(supabase: SupabaseClient, userId: string): Promise<{ id: string; fact: string; created_at: string }[]> {
  const { data } = await supabase
    .from("staff_memory")
    .select("id, fact, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MEMORY_MAX)
    .returns<{ id: string; fact: string; created_at: string }[]>();
  return data ?? [];
}

// After a talk: the small model picks 0-3 new lasting facts and they are saved.
// Runs in the background with the server account, so the worker never waits for it.
export async function rememberFromTalk(server: SupabaseClient, input: { userId: string; question: string; answer: string }) {
  if (!input.question.trim()) return;
  const known = await loadMemory(server, input.userId);
  client ??= new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 600,
    system: [
      "You keep the long memory of a digital office assistant for a self-employed construction worker in the Netherlands.",
      "From the worker's message (and the assistant's answer for context) pick 0 to 3 NEW facts worth remembering for months: the worker's own rates, prices and terms, regular clients and what to know about them (pays late, prefers e-mail), where and how they like to work, their business set-up (btw, KOR, bookkeeper), plans and agreements with dates.",
      "If the worker explicitly asks to remember something («запомни», «remember», «onthoud», «zapamiętaj»), always keep it.",
      "Do NOT keep: passwords, PIN codes, card or bank numbers, BSN or ID numbers, health details, one-off questions, general Dutch rules, anything the assistant said that the worker did not confirm, or facts already in the known list.",
      "Write each fact as one short sentence in the worker's own language, about the worker (e.g. «Клиент Jansen всегда платит с опозданием»). Return an empty list when nothing new is worth keeping.",
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: `Known facts:\n${known.map((k) => `- ${k.fact}`).join("\n") || "(none)"}\n\nWorker's message:\n${input.question.slice(0, 4000)}\n\nAssistant's answer:\n${input.answer.slice(0, 3000)}`,
      },
    ],
    output_config: { format: zodOutputFormat(Facts) },
  });
  const seen = new Set(known.map((k) => k.fact.toLowerCase()));
  const fresh = (response.parsed_output?.facts ?? [])
    .slice(0, 3)
    .flatMap((f) => {
      const fact = safeFact(f);
      return fact && !seen.has(fact.toLowerCase()) ? [fact] : [];
    });
  if (!fresh.length) return;
  await server.from("staff_memory").insert(fresh.map((fact) => ({ user_id: input.userId, fact })));
  // Keep only the newest facts.
  const { data: old } = await server
    .from("staff_memory")
    .select("id")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .range(MEMORY_MAX, MEMORY_MAX + 50);
  if (old?.length) await server.from("staff_memory").delete().in("id", old.map((r) => r.id as string));
}
