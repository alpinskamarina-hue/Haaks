"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { quarterFromKey } from "@/lib/accountant";
import { isAnswerKind, isQuestionKind } from "@/lib/accountant-questions";
import { notifyAccountantQuestion } from "@/lib/accountant-notify";
import { requireUser } from "@/lib/auth";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

// A link for the accountant for one quarter. Making it again turns a switched-off link back on for 60 days.
export async function createAccountantShare(quarterKey: string) {
  const { supabase, user } = await requireUser();
  const q = quarterFromKey(quarterKey);
  await supabase
    .from("accountant_shares")
    .upsert(
      { user_id: user.id, quarter: q.key, revoked_at: null, expires_at: new Date(Date.now() + 60 * 864e5).toISOString() },
      { onConflict: "user_id,quarter" },
    );
  revalidatePath("/dashboard/accountant");
}

export async function revokeAccountantShare(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("accountant_shares").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/accountant");
}

// The builder answers with a ready answer (shown to the accountant in Dutch) or own words.
export async function answerAccountantQuestion(id: string, kind: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!isAnswerKind(kind)) return;
  const text = String(formData.get("answer") ?? "").trim().slice(0, 500);
  if (kind === "other" && !text) return;
  await supabase
    .from("accountant_questions")
    .update({ answer_kind: kind, answer: text || null, answered_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/dashboard", "layout");
}

// The accountant (no account) asks about a receipt or an invoice from the shared page.
export async function askAccountantQuestion(token: string, receiptId: string | null, invoiceId: string | null, formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const body = String(formData.get("body") ?? "").slice(0, 500);
  if (!isQuestionKind(kind) || (kind === "other" && !body.trim())) redirect(`/a/${token}?vraag=leeg`);
  const server = await createServerAccountClient();
  const { data: id, error } = await server.rpc("ask_accountant_question", {
    p_token: token,
    p_receipt: receiptId,
    p_invoice: invoiceId,
    p_kind: kind,
    p_body: body,
  });
  if (error || !id) redirect(`/a/${token}?vraag=fout`);
  await notifyAccountantQuestion(server, String(id), await siteUrl()).catch((e) => console.error(e));
  revalidatePath(`/a/${token}`);
  redirect(`/a/${token}?vraag=ok#vragen`);
}
