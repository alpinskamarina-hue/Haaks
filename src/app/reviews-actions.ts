"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { siteUrl } from "@/lib/lang";
import { notifyReview } from "@/lib/reviews-notify";
import { createClient, createServerAccountClient } from "@/lib/supabase/server";

// "Ask for a review" on an order or an invoice: makes (or finds) the one-time review link.
export async function requestReview(formData: FormData) {
  const { supabase } = await requireUser();
  const order = String(formData.get("order") ?? "") || null;
  const invoice = String(formData.get("invoice") ?? "") || null;
  const back = invoice ? `/dashboard/invoices/${invoice}` : order ? `/dashboard/orders/${order}` : "/dashboard/reviews";
  const { data, error } = await supabase.rpc("request_review", { p_order: order, p_invoice: invoice });
  if (error || !data) {
    console.error(error);
    redirect(`${back}?review=not_allowed`);
  }
  redirect(`/dashboard/reviews/${data}`);
}

const num = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};
const text = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// The client's form on /r/<token>. A builder cannot review themselves.
export async function submitReview(token: string, lang: "nl" | "en", formData: FormData) {
  const stars = num(formData.get("stars"));
  const name = text(formData.get("name"), 60);
  const back = `/r/${token}?lang=${lang}`;
  if (!stars || !name) redirect(`${back}&error=1`);

  const admin = await createServerAccountClient();
  const { data: review } = await admin.from("reviews").select("worker_id, status").eq("token", token).maybeSingle();
  if (!review) redirect(back);
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (user?.id === review.worker_id) redirect(back);

  const { data: id, error } = await admin.rpc("submit_review", {
    p_token: token,
    p_stars: stars,
    p_quality: num(formData.get("quality")),
    p_timing: num(formData.get("timing")),
    p_communication: num(formData.get("communication")),
    p_cleanliness: num(formData.get("cleanliness")),
    p_body: text(formData.get("body"), 1000),
    p_name: name,
    p_city: text(formData.get("city"), 60),
  });
  if (error || !id) {
    console.error(error);
    redirect(back);
  }
  await notifyReview(admin, String(id), await siteUrl()).catch((e) => console.error(e));
  redirect(`${back}&done=1`);
}

// The builder's one public answer under a review.
export async function replyReview(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const reply = text(formData.get("reply"), 600);
  if (reply) {
    const { error } = await supabase.rpc("reply_to_review", { p_id: id, p_text: reply });
    if (error) console.error(error);
  }
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/reviews#review-${id}`);
}

// The builder reports a review to Haaks moderation.
export async function reportReview(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.rpc("report_review", {
    p_id: id,
    p_reason: String(formData.get("reason") ?? "other"),
    p_note: text(formData.get("note"), 500),
  });
  if (error) console.error(error);
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/reviews#review-${id}`);
}

// Haaks moderation: remove a reported review, or keep it and release it. A kept review keeps
// reported_at, so the same review cannot be reported (and held back) again.
export async function resolveReviewReport(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/dashboard");
  const server = await createServerAccountClient();
  const id = String(formData.get("id") ?? "");
  const remove = formData.get("remove") === "1";
  await server
    .from("reviews")
    .update(remove ? { status: "hidden", held: false } : { held: false, report_reason: null })
    .eq("id", id);
  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/moderation?ok=${remove ? "review_removed" : "review_kept"}`);
}
