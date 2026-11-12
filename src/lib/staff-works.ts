import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRADES } from "@/lib/worker-profile";
import { MAX_AFTER, MAX_BEFORE } from "@/lib/works";

// The worker sends photos of a finished job; the employee prepares a «Мои работы» card
// (Dutch title, before/after photos, optionally the order). Only their tap adds it.
export const STAFF_WORK_TOOL: Anthropic.Tool = {
  name: "add_work",
  description:
    "Prepare a completed work for the worker's portfolio «Мои работы» (shown to clients on the passport and public profile) from the photos the worker sent in this talk (numbered 1..n in the order sent, from their latest photo message). Ask what the job was if it is not clear from the photos and their words. Shown as a card with the photos and an «Add» button; nothing is saved until they tap it.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Short title in Dutch, e.g. «Badkamer betegeld, Almere»" },
      description: { type: ["string", "null"], description: "1–3 sentences in Dutch for clients, only from what the worker said or what the photos clearly show" },
      trade: { type: ["string", "null"], enum: [...TRADES, null] },
      city: { type: ["string", "null"], description: "Town in Dutch spelling, if known" },
      month: { type: ["string", "null"], description: "yyyy-mm when the job was done, if known" },
      order_id: { type: ["string", "null"], description: "Only if the worker links it to an order (find_orders)" },
      before: { type: "array", items: { type: "number" }, description: `Photo numbers showing the situation BEFORE the work (max ${MAX_BEFORE}); empty if none` },
      after: { type: "array", items: { type: "number" }, description: `Photo numbers of the finished result (1..${MAX_AFTER}); at least one` },
    },
    required: ["title", "after"],
  },
};

export type StaffWorkChange = {
  type: "work";
  title: string;
  description: string | null;
  trade: string | null;
  city: string | null;
  month: string | null;
  order_id: string | null;
  order_title: string | null;
  before: string[];
  after: string[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function runWorkTool(supabase: SupabaseClient, userId: string, raw: unknown, photos: string[]): Promise<{ text: string; card?: StaffWorkChange }> {
  if (!photos.length) return { text: "There are no photos in this talk. Ask the worker to send photos of the finished job here (📷, up to 6 at once)." };
  const a = (raw ?? {}) as Record<string, unknown>;
  const title = str(a.title, 100);
  if (!title) return { text: "Give the work a short Dutch title." };
  const pick = (v: unknown, max: number) =>
    [...new Set((Array.isArray(v) ? v : []).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= photos.length))].slice(0, max).map((n) => photos[n - 1]);
  const after = pick(a.after, MAX_AFTER);
  const before = pick(a.before, MAX_BEFORE).filter((p) => !after.includes(p));
  if (!after.length) return { text: `Say which photo(s) show the finished result (numbers 1..${photos.length}).` };
  let order: { id: string; title: string } | null = null;
  if (typeof a.order_id === "string" && UUID.test(a.order_id)) {
    const { data } = await supabase.from("orders").select("id, title").eq("id", a.order_id).eq("user_id", userId).maybeSingle<{ id: string; title: string }>();
    order = data;
  }
  const month = typeof a.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(a.month) ? a.month : null;
  const trade = (TRADES as readonly string[]).includes(String(a.trade)) ? String(a.trade) : null;
  const card: StaffWorkChange = { type: "work", title, description: str(a.description, 600), trade, city: str(a.city, 80), month, order_id: order?.id ?? null, order_title: order?.title ?? null, before, after };
  return {
    text: `Work card prepared: «${title}», ${before.length} before / ${after.length} after photo(s)${order ? `, order «${order.title}»` : ""}. It is shown under your answer with an «Add» button; nothing is saved until they tap it. Clients see it on the passport and public profile.`,
    card,
  };
}
