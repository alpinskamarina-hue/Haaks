"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { claudeEnabled } from "@/lib/env";
import { aiAllowed } from "@/lib/free-limits";
import { isLang } from "@/lib/i18n";
import { planOf } from "@/lib/plans";
import { STAFF_FACES, STAFF_STYLES, staffOf, type StaffMessage } from "@/lib/staff";
import { siteUrl } from "@/lib/lang";
import { askStaff, staffFacts, staffLang } from "@/lib/staff-ai";
import { runStaffFeed, type StaffJob } from "@/lib/staff-feed";
import { createServerAccountClient } from "@/lib/supabase/server";
import { loadMemory, rememberFromTalk } from "@/lib/staff-memory";
import { replyToClientRequest } from "./feed-actions";
import { STAFF_RATE_REASONS, type StaffRateReason } from "@/lib/staff-rate-i18n";

export type StaffReply = { ok: true } | { error: "plan" | "off" | "limit" | "failed" | "photo" };

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];

// One message from the worker to their digital employee, and the employee's answer.
export async function sendStaffMessage(input: { text: string; imagePath: string | null; mimeType: string | null }): Promise<StaffReply> {
  const { supabase, user } = await requireUser();
  const text = input.text.trim().slice(0, 4000);
  if (!text && !input.imagePath) return { error: "failed" };
  if (input.imagePath && (!input.imagePath.startsWith(`${user.id}/staff/`) || !IMAGE_MIME.includes(input.mimeType ?? ""))) return { error: "photo" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_until, language, full_name, company_name, trades, city, staff_face, staff_name, staff_formal, staff_style, staff_lang")
    .eq("id", user.id)
    .single();
  if (!profile || planOf(profile) !== "ultra") return { error: "plan" };
  if (!claudeEnabled()) return { error: "off" };

  if (!(await aiAllowed(supabase))) return { error: "limit" };
  const { error: insertError } = await supabase.from("staff_messages").insert({ user_id: user.id, role: "user", body: text, image_path: input.imagePath });
  if (insertError) return { error: "failed" };

  try {
    const settings = staffOf(profile);
    const appLang = isLang(profile.language) ? profile.language : "en";
    const [{ data: history }, facts, memory, image] = await Promise.all([
      supabase.from("staff_messages").select("id, role, body, image_path, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20).returns<StaffMessage[]>(),
      staffFacts(supabase, user.id, profile),
      loadMemory(supabase, user.id),
      input.imagePath
        ? supabase.storage
            .from("documents")
            .download(input.imagePath)
            .then(async ({ data }) => (data ? { base64: Buffer.from(await data.arrayBuffer()).toString("base64"), mimeType: input.mimeType ?? "image/jpeg" } : null))
        : Promise.resolve(null),
    ]);
    const answer = await askStaff({ settings, lang: staffLang(settings, appLang), facts, memory: memory.map((m) => m.fact), history: (history ?? []).reverse(), image });
    if (!answer) return { error: "failed" };
    await supabase.from("staff_messages").insert({ user_id: user.id, role: "staff", body: answer.slice(0, 8000) });
    // Long memory: pick lasting facts from this talk after the answer is shown.
    after(async () => {
      try {
        await rememberFromTalk(await createServerAccountClient(), { userId: user.id, question: text, answer });
      } catch (err) {
        console.error("staff: memory failed", err instanceof Error ? err.message : err);
      }
    });
    revalidatePath("/dashboard/staff");
    return { ok: true };
  } catch (e) {
    console.error("staff: answer failed", e instanceof Error ? e.message : e);
    return { error: "failed" };
  }
}

export async function saveStaffSettings(formData: FormData) {
  const { supabase, user } = await requireUser();
  const face = Number(formData.get("face"));
  const style = String(formData.get("style") ?? "");
  const lang = String(formData.get("lang") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 30);
  await supabase
    .from("profiles")
    .update({
      staff_face: (STAFF_FACES as readonly number[]).includes(face) ? face : 1,
      staff_name: name || null,
      staff_formal: formData.get("formal") === "1",
      staff_style: (STAFF_STYLES as readonly string[]).includes(style) ? style : "short",
      staff_lang: isLang(lang) ? lang : null,
    })
    .eq("id", user.id);
  revalidatePath("/dashboard", "layout");
}

export async function clearStaffChat() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("staff_messages").select("image_path").eq("user_id", user.id).not("image_path", "is", null);
  const paths = (data ?? []).flatMap((r) => (r.image_path ? [r.image_path as string] : []));
  if (paths.length) await supabase.storage.from("documents").remove(paths);
  await supabase.from("staff_messages").delete().eq("user_id", user.id);
  revalidatePath("/dashboard/staff");
}

// Step 1 of «Сотрудник работает с лентой»: the worker taps «Отправить» on a job card the
// employee brought. Client requests get the Dutch draft as the reply text; company jobs get the
// usual reply (the company sees the profile). Other jobs are opened in the feed instead.
export type StaffJobResult = { ok: true } | { error: "request_closed" | "request_full" | "card_locked" | "free_limit" | "failed" };
export async function staffSendJob(messageId: string, draft: string): Promise<StaffJobResult> {
  const { supabase, user } = await requireUser();
  const { data: m } = await supabase
    .from("staff_messages")
    .select("id, feed_item_id, job, job_status")
    .eq("id", messageId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; feed_item_id: string | null; job: StaffJob | null; job_status: string | null }>();
  if (!m?.feed_item_id || !m.job) return { error: "failed" };
  if (m.job_status === "sent") return { ok: true };
  const text = draft.trim().slice(0, 1000);
  if (m.job.source === "client") {
    const form = new FormData();
    form.set("message", text);
    const res = await replyToClientRequest(m.feed_item_id, {}, form);
    if (res.error) return { error: res.error };
  } else if (m.job.source === "haaks" && m.job.kind === "business") {
    const { error } = await supabase.rpc("reply_to_job", { p_item: m.feed_item_id });
    if (error) {
      if (error.message.includes("job_closed")) return { error: "request_closed" };
      const known = (["free_limit", "card_locked"] as const).find((k) => error.message.includes(k));
      if (!known) console.error("staff: reply to job failed", error.message);
      return { error: known ?? "failed" };
    }
  } else {
    return { error: "failed" };
  }
  await supabase.from("staff_messages").update({ job_status: "sent", draft: text }).eq("id", m.id).eq("user_id", user.id);
  revalidatePath("/dashboard/staff");
  return { ok: true };
}

export async function staffSkipJob(messageId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("staff_messages").update({ job_status: "skipped" }).eq("id", messageId).eq("user_id", user.id);
  revalidatePath("/dashboard/staff");
}

// «Проверить ленту сейчас»: the employee looks at the feed right away (up to 3 new jobs).
export async function staffCheckFeed(): Promise<{ cards: number } | { error: "plan" | "failed" }> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("plan, plan_until").eq("id", user.id).single();
  if (!profile || planOf(profile) !== "ultra") return { error: "plan" };
  try {
    const server = await createServerAccountClient();
    const { cards } = await runStaffFeed(server, await siteUrl(), { userId: user.id, limit: 3 });
    revalidatePath("/dashboard/staff");
    return { cards };
  } catch (e) {
    console.error("staff: check feed failed", e instanceof Error ? e.message : e);
    return { error: "failed" };
  }
}

export async function saveStaffFeedRules(formData: FormData) {
  const { supabase, user } = await requireUser();
  const max = Math.min(20, Math.max(1, Number(formData.get("feed_max")) || 5));
  const kinds = formData.getAll("feed_kind").map(String).filter((k) => ["private", "business", "permit", "tender"].includes(k));
  await supabase
    .from("profiles")
    .update({ staff_feed: formData.get("feed_on") === "1", staff_feed_max: max, staff_feed_kinds: kinds.length ? kinds : ["private", "business"] })
    .eq("id", user.id);
}

// The worker rates one answer of the employee. A copy of the answer and the question
// before it goes with the rating, so the moderation page can show it.
export async function rateStaffAnswer(input: { messageId: string; rating: 1 | -1; reason?: StaffRateReason | null; comment?: string | null }) {
  const { supabase, user } = await requireUser();
  if (input.rating !== 1 && input.rating !== -1) return { error: "failed" as const };
  const reason = input.rating === -1 && input.reason && STAFF_RATE_REASONS.includes(input.reason) ? input.reason : null;
  const comment = input.rating === -1 ? input.comment?.trim().slice(0, 500) || null : null;
  const { data: answer } = await supabase
    .from("staff_messages")
    .select("id, role, body, created_at, job")
    .eq("id", input.messageId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; role: string; body: string; created_at: string; job: unknown }>();
  if (!answer || answer.role !== "staff" || answer.job) return { error: "failed" as const };
  const { data: question } = await supabase
    .from("staff_messages")
    .select("body")
    .eq("user_id", user.id)
    .eq("role", "user")
    .lt("created_at", answer.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ body: string }>();
  const { error } = await supabase.from("staff_feedback").upsert({
    message_id: answer.id,
    user_id: user.id,
    rating: input.rating,
    reason,
    comment,
    question: question?.body.slice(0, 4000) ?? null,
    answer: answer.body.slice(0, 8000),
    updated_at: new Date().toISOString(),
  });
  return error ? { error: "failed" as const } : { ok: true as const };
}

// «Что помнит сотрудник»: the worker deletes one fact or the whole memory.
export async function forgetStaffFact(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await supabase.from("staff_memory").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/staff/settings");
}

export async function forgetStaffMemory() {
  const { supabase, user } = await requireUser();
  await supabase.from("staff_memory").delete().eq("user_id", user.id);
  revalidatePath("/dashboard/staff/settings");
}
