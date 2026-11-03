"use server";

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
