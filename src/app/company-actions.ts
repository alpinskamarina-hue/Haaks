"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  hasContactInText,
  JOB_REQUIREMENTS,
  JOB_TRADES,
  publishCompanyJob,
  takeJobOffline,
  type CompanyJob,
} from "@/lib/company-jobs";
import { notifyInvite, notifyReplyAccepted } from "@/lib/job-replies";
import { siteUrl } from "@/lib/lang";
import { createServerAccountClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string, max = 200) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

const back = (path: string, key: "ok" | "error", value: string): never => redirect(`${path}?${key}=${value}`);

async function requireCompany() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, company_verified, company_name, kvk_number, full_name, phone, business_email")
    .eq("id", user.id)
    .single();
  if (profile?.account_type !== "company") redirect("/dashboard");
  return { supabase, user, profile };
}

export async function saveCompanyDetails(formData: FormData) {
  const { supabase, user } = await requireCompany();
  const kvk = text(formData, "kvk_number")?.replace(/\s/g, "") ?? "";
  if (!/^\d{8}$/.test(kvk)) back("/company", "error", "kvk");
  const { error } = await supabase
    .from("profiles")
    .update({
      company_name: text(formData, "company_name", 120),
      kvk_number: kvk,
      full_name: text(formData, "full_name", 120),
      phone: text(formData, "phone", 40),
      business_email: text(formData, "business_email", 120) ?? user.email,
      // The company cabinet does not use the builder's onboarding.
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) back("/company", "error", "failed");
  revalidatePath("/company");
  back("/company", "ok", "saved");
}

export async function createCompanyJob(formData: FormData) {
  const { supabase, user, profile } = await requireCompany();
  if (!profile.company_name || !profile.kvk_number || !profile.phone) back("/company", "error", "details");

  const title = text(formData, "title", 120) ?? "";
  const description = text(formData, "description", 2000) ?? "";
  const trades = formData.getAll("trades").map(String).filter((t) => JOB_TRADES.includes(t));
  const requirements = formData
    .getAll("requirements")
    .map(String)
    .filter((r) => (JOB_REQUIREMENTS as readonly string[]).includes(r));
  const city = text(formData, "city", 80);
  const rateType = (["hour", "fixed", "ask"] as const).find((r) => r === formData.get("rate_type")) ?? "ask";
  const rate = Number(String(formData.get("rate") ?? "").replace(",", "."));
  const whole = (key: string, min: number, max: number) => {
    const n = Math.round(Number(formData.get(key)));
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };
  const startDate = text(formData, "start_date", 10);

  if (title.length < 3) back("/company/new", "error", "title");
  if (trades.length < 1 || trades.length > 5) back("/company/new", "error", "trades");
  if (!city) back("/company/new", "error", "city");
  if (rateType !== "ask" && !(rate > 0)) back("/company/new", "error", "rate");
  if (hasContactInText(`${title}\n${description}`)) back("/company/new", "error", "contact");
  if (formData.get("opdracht") !== "on") back("/company/new", "error", "opdracht");

  const { data: job, error } = await supabase
    .from("company_jobs")
    .insert({
      company_id: user.id,
      title,
      description,
      trades,
      city,
      postcode: text(formData, "postcode", 10)?.toUpperCase() ?? null,
      start_date: startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : null,
      weeks: whole("weeks", 1, 104),
      people: whole("people", 1, 50) ?? 1,
      rate_type: rateType,
      rate: rateType === "ask" ? null : Math.round(rate * 100) / 100,
      requirements,
      opdracht_confirmed: true,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !job) back("/company/new", "error", error?.message.includes("company_jobs_limit") ? "limit" : "failed");

  // A company Haaks has approved before goes online at once.
  if (profile.company_verified) {
    try {
      await publishCompanyJob(await createServerAccountClient(), job!.id, await siteUrl());
    } catch (e) {
      console.error("Publishing a company job failed", e);
      revalidatePath("/company");
      back("/company", "ok", "sent");
    }
    revalidatePath("/company");
    back("/company", "ok", "published");
  }
  revalidatePath("/company");
  back("/company", "ok", "sent");
}

export async function closeCompanyJob(formData: FormData) {
  const { supabase } = await requireCompany();
  // Read through the company's own rights: only its own jobs are found.
  const { data: job } = await supabase
    .from("company_jobs")
    .select("id, feed_item_id, status")
    .eq("id", String(formData.get("id")))
    .maybeSingle<Pick<CompanyJob, "id" | "feed_item_id" | "status">>();
  if (!job || job.status === "closed" || job.status === "rejected") back("/company", "error", "failed");
  await takeJobOffline(await createServerAccountClient(), job!, "closed");
  revalidatePath("/company");
  back("/company", "ok", "closed");
}

// The company accepts or declines a builder's reply; accepting opens contacts on both sides.
export async function decideJobReply(formData: FormData) {
  const { supabase } = await requireCompany();
  const replyId = String(formData.get("reply"));
  const jobId = String(formData.get("job"));
  const accept = formData.get("accept") === "1";
  const { error } = await supabase.rpc("decide_job_reply", { p_reply: replyId, p_accept: accept });
  if (error) back(`/company/jobs/${jobId}`, "error", "failed");
  if (accept) {
    try {
      await notifyReplyAccepted(await createServerAccountClient(), replyId, await siteUrl());
    } catch (e) {
      console.error("Reply accepted alert failed", e);
    }
  }
  revalidatePath("/company", "layout");
  back(`/company/jobs/${jobId}`, "ok", accept ? "accepted" : "declined");
}

// The company invites a builder from the catalog; the builder gets an alert.
export async function inviteWorker(formData: FormData) {
  const { supabase } = await requireCompany();
  const job = String(formData.get("job") ?? "");
  const { data: id, error } = await supabase.rpc("invite_worker", {
    p_worker: String(formData.get("worker")),
    p_job: /^[0-9a-f-]{36}$/.test(job) ? job : null,
  });
  const back_to = `/company/builders${formData.get("trade") ? `?trade=${encodeURIComponent(String(formData.get("trade")))}` : ""}`;
  const sep = back_to.includes("?") ? "&" : "?";
  if (error || !id) redirect(`${back_to}${sep}error=${error?.message.includes("invite_limit") ? "invite_limit" : "failed"}`);
  try {
    await notifyInvite(await createServerAccountClient(), String(id), await siteUrl());
  } catch (e) {
    console.error("Invite alert failed", e);
  }
  revalidatePath("/company", "layout");
  redirect(`${back_to}${sep}ok=invited`);
}

// Moderation (Haaks admin only).
async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!data?.is_admin) redirect("/dashboard");
  return createServerAccountClient();
}

export async function approveCompanyJob(formData: FormData) {
  const server = await requireAdmin();
  await publishCompanyJob(server, String(formData.get("id")), await siteUrl());
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/moderation?ok=published");
}

export async function rejectCompanyJob(formData: FormData) {
  const server = await requireAdmin();
  const { data: job } = await server
    .from("company_jobs")
    .select("id, feed_item_id")
    .eq("id", String(formData.get("id")))
    .single<Pick<CompanyJob, "id" | "feed_item_id">>();
  if (job) await takeJobOffline(server, job, "rejected", text(formData, "reason", 300) ?? undefined);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/moderation?ok=rejected");
}
