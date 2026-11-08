"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { spendFree } from "@/lib/free-limits";

const CHANNELS = ["whatsapp", "email", "copy"] as const;
type Channel = (typeof CHANNELS)[number];

// Marks «Предложить себя» as sent. A first offer to a firm uses one of the free replies (shared with
// job replies, 3 per 24 hours on Free); writing again to the same firm is free.
export async function recordFirmOffer(firmId: string, channel: Channel): Promise<{ ok: true } | { error: "limit" | "save" }> {
  const { supabase, user } = await requireUser();
  if (!CHANNELS.includes(channel) || !/^[0-9a-f-]{36}$/.test(firmId)) return { error: "save" };
  const { data: before } = await supabase.from("firm_offers").select("id").eq("firm_id", firmId).maybeSingle();
  if (!before && !(await spendFree(supabase, "job_reply", `firm:${firmId}`))) return { error: "limit" };
  const { error } = await supabase.from("firm_offers").upsert(
    {
      user_id: user.id,
      firm_id: firmId,
      channel,
      sent_at: new Date().toISOString(),
      outcome: null,
      outcome_at: null,
      reminded_at: null,
    },
    { onConflict: "user_id,firm_id" },
  );
  if (error) return { error: "save" };
  revalidatePath("/dashboard/leads/firms");
  return { ok: true };
}

// «👍 Есть работа» / «👎 Нет» on a firm the builder wrote to.
export async function setFirmOutcome(formData: FormData) {
  const { supabase } = await requireUser();
  const firmId = String(formData.get("firm") ?? "");
  const outcome = formData.get("outcome") === "work" ? "work" : "no";
  await supabase
    .from("firm_offers")
    .update({ outcome, outcome_at: new Date().toISOString() })
    .eq("firm_id", firmId);
  revalidatePath("/dashboard/leads/firms");
}
